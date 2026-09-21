import { describe, expect, it } from "vitest"

// @ts-expect-error -- script de build en JavaScript, sin tipos
import { globPatternToRegExp, hasStateCoverage } from "../scripts/sync-design-system.mjs"

describe("traduccion de globs", () => {
    const matcher: RegExp = globPatternToRegExp(["**", "*.stories.tsx"])

    it("casa un fichero en la raiz del patron, sin ningun directorio", () => {
        // Esta es la regresion: `**/` tiene que admitir cero niveles.
        expect(matcher.test("button.stories.tsx")).toBe(true)
    })

    it("sigue casando a cualquier profundidad", () => {
        expect(matcher.test("ui/button.stories.tsx")).toBe(true)
        expect(matcher.test("meetup/a/b/card.stories.tsx")).toBe(true)
    })

    it("no casa lo que no es una story", () => {
        expect(matcher.test("ui/button.tsx")).toBe(false)
        expect(matcher.test("ui/button.stories.tsx.bak")).toBe(false)
    })

    it("trata el punto como literal, no como comodin", () => {
        expect(matcher.test("ui/buttonXstories.tsx")).toBe(false)
    })

    it("un comodin simple no cruza directorios", () => {
        const simple: RegExp = globPatternToRegExp(["*.tsx"])

        expect(simple.test("button.tsx")).toBe(true)
        expect(simple.test("ui/button.tsx")).toBe(false)
    })
})

describe("cobertura de estados en las stories", () => {
    const badge = "src/components/ui/badge.stories.tsx"

    it("no da por cubierto 'default' por el 'export default' de la story", () => {
        // El fichero no contiene la cadena "default" como dato: solo la palabra clave del
        // export. Se considera cubierto por tener stories, no por el falso positivo textual.
        expect(hasStateCoverage(badge, "default")).toBe(true)
        expect(hasStateCoverage(badge, "exportdefault")).toBe(false)
    })

    it("reconoce los estados que la story usa de verdad", () => {
        expect(hasStateCoverage(badge, "error")).toBe(true)
        expect(hasStateCoverage(badge, "success")).toBe(true)
    })

    it("no inventa cobertura para estados que la story no toca", () => {
        expect(hasStateCoverage(badge, "hovered")).toBe(false)
        expect(hasStateCoverage(badge, "zz_estado_inexistente")).toBe(false)
    })

    it("sin story no hay cobertura", () => {
        expect(hasStateCoverage(null, "default")).toBe(false)
    })
})
