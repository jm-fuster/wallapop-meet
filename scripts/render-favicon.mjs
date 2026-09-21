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

const svg = readFileSync(sourcePath, "utf8")
const browser = await chromium.launch()

try {
    for (const { file, size } of OUTPUTS) {
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
        writeFileSync(path.join(rootDir, file), buffer)
        console.log(`${file.padEnd(28)} ${size}x${size}  ${buffer.length} bytes`)
        await page.close()
    }
} finally {
    await browser.close()
}
