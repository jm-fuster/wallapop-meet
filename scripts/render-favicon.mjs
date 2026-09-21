import { chromium } from "playwright"
import { readFileSync, writeFileSync } from "node:fs"
import path from "node:path"

/**
 * Regenera los PNG del favicon a partir de `public/favicon.svg`, que es la fuente unica.
 *
 * El favicon anterior era el de Wallapop copiado tal cual (mismo sha256 que
 * es.wallapop.com/favicon.ico), lo que contradecia el NOTICE del repositorio. Este se
 * dibuja aqui con el color de marca del propio proyecto.
 *
 * Los navegadores modernos usan el SVG; los PNG son el respaldo y el icono de iOS.
 */
const rootDir = process.cwd()
const sourcePath = path.join(rootDir, "public/favicon.svg")

const OUTPUTS = [
    { file: "public/favicon-32.png", size: 32 },
    { file: "public/apple-touch-icon.png", size: 180 },
]

/** Tamanos que van dentro del .ico clasico. */
const ICO_SIZES = [16, 32, 48]

/**
 * Empaqueta varios PNG en un .ico. Desde Windows Vista el formato admite PNG dentro del
 * contenedor, asi que basta con la cabecera ICONDIR y una entrada por tamano.
 *
 * Hace falta un .ico real porque los navegadores antiguos y algunos rastreadores piden
 * `/favicon.ico` a ciegas, sin leer el <head>. Sin fichero, el rewrite de vercel.json les
 * devolvia el index.html con 200 y tipo text/html.
 */
function buildIco(images) {
    const header = Buffer.alloc(6)
    header.writeUInt16LE(0, 0) // reservado
    header.writeUInt16LE(1, 2) // tipo: icono
    header.writeUInt16LE(images.length, 4)

    const entries = []
    let offset = 6 + images.length * 16

    for (const { size, data } of images) {
        const entry = Buffer.alloc(16)
        entry.writeUInt8(size >= 256 ? 0 : size, 0) // 0 significa 256
        entry.writeUInt8(size >= 256 ? 0 : size, 1)
        entry.writeUInt8(0, 2) // paleta
        entry.writeUInt8(0, 3) // reservado
        entry.writeUInt16LE(1, 4) // planos
        entry.writeUInt16LE(32, 6) // bits por pixel
        entry.writeUInt32LE(data.length, 8)
        entry.writeUInt32LE(offset, 12)
        entries.push(entry)
        offset += data.length
    }

    return Buffer.concat([header, ...entries, ...images.map((i) => i.data)])
}

const svg = readFileSync(sourcePath, "utf8")
const browser = await chromium.launch()

async function renderPng(size) {
    const page = await browser.newPage({
        viewport: { width: size, height: size },
        deviceScaleFactor: 1,
    })
    // `omitBackground` conserva la transparencia fuera del cuadrado redondeado.
    await page.setContent(
        `<!doctype html><meta charset="utf-8">` +
            `<style>html,body{margin:0;padding:0;background:transparent}` +
            `svg{display:block;width:${size}px;height:${size}px}</style>` +
            svg,
        { waitUntil: "load" }
    )
    const buffer = await page.screenshot({ omitBackground: true })
    await page.close()
    return buffer
}

try {
    for (const { file, size } of OUTPUTS) {
        const buffer = await renderPng(size)
        writeFileSync(path.join(rootDir, file), buffer)
        console.log(`${file.padEnd(28)} ${size}x${size}  ${buffer.length} bytes`)
    }

    const icoImages = []
    for (const size of ICO_SIZES) {
        icoImages.push({ size, data: await renderPng(size) })
    }
    const ico = buildIco(icoImages)
    writeFileSync(path.join(rootDir, "public/favicon.ico"), ico)
    console.log(`${"public/favicon.ico".padEnd(28)} ${ICO_SIZES.join("+")}  ${ico.length} bytes`)
} finally {
    await browser.close()
}
