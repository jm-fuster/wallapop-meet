import { chromium } from "playwright"
import path from "node:path"
import { pathToFileURL } from "node:url"

/**
 * Regenera la imagen de social preview del repositorio (Settings > Social preview).
 * La fuente es docs/assets/social-preview.html, que usa los tokens de styles.json.
 *
 * GitHub recomienda 1280x640; se renderiza a 2x para que se vea nitida en pantallas
 * de alta densidad, y el resultado debe quedar por debajo de 1 MB.
 */
const rootDir = process.cwd()
const sourcePath = path.join(rootDir, "docs/assets/social-preview.html")
const outputPath = path.join(rootDir, "docs/assets/social-preview.png")

const WIDTH = 1280
const HEIGHT = 640
const MIN_CONTRAST = 4.5

const browser = await chromium.launch()
const page = await browser.newPage({
    viewport: { width: WIDTH, height: HEIGHT },
    deviceScaleFactor: 2,
})

await page.goto(pathToFileURL(sourcePath).href, { waitUntil: "networkidle" })
await page.evaluate(() => document.fonts.ready)
await page.waitForTimeout(600)

/**
 * Mide el contraste real de cada texto sobre su fondo efectivo. La marca es un teal
 * claro: sobre el, el blanco se queda en 2.27:1, asi que esta comprobacion existe
 * para que un cambio de token no devuelva la tarjeta a un contraste que no pasa AA.
 */
const contrast = await page.evaluate(() => {
    const channel = (value) => {
        const c = value / 255
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    }
    const luminance = ([r, g, b]) => 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
    const parse = (value) => value.match(/\d+/g).slice(0, 3).map(Number)
    const ratio = (fg, bg) => {
        const [light, dark] = [luminance(fg), luminance(bg)].sort((a, b) => b - a)
        return Number(((light + 0.05) / (dark + 0.05)).toFixed(2))
    }

    const pageBackground = parse(getComputedStyle(document.body).backgroundColor)
    const selectors = [".eyebrow", "h1", ".sub", ".tags", ".chip", ".chip.on", ".repo"]

    return selectors.map((selector) => {
        const element = document.querySelector(selector)
        const own = getComputedStyle(element).backgroundColor
        const isTransparent = own === "transparent" || own.includes("rgba(0, 0, 0, 0)")
        const background = isTransparent ? pageBackground : parse(own)
        return { selector, ratio: ratio(parse(getComputedStyle(element).color), background) }
    })
})

await page.screenshot({ path: outputPath })
await browser.close()

const failing = contrast.filter((entry) => entry.ratio < MIN_CONTRAST)

for (const { selector, ratio } of contrast) {
    console.log(`${ratio >= MIN_CONTRAST ? "OK  " : "FAIL"} ${selector.padEnd(10)} ${ratio}:1`)
}

if (failing.length > 0) {
    console.error(
        `\nContraste insuficiente (< ${MIN_CONTRAST}:1) en: ${failing.map((f) => f.selector).join(", ")}`
    )
    process.exit(1)
}

console.log(`\nsocial preview generada en docs/assets/social-preview.png (${WIDTH}x${HEIGHT} @2x)`)
