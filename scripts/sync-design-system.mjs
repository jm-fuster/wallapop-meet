import { readFileSync, writeFileSync, existsSync, mkdirSync, statSync, readdirSync } from "node:fs"
import path from "node:path"

const rootDir = process.cwd()
const entryFile = "src/App.tsx"
const generatedCatalogPath = "src/design-system/generated/design-system-catalog.json"
const isCheckMode = process.argv.includes("--check")

const importRegex = /from\s+["']([^"']+)["']/g
const globImportRegex = /import\.meta\.glob\(\s*["']([^"']+)["']/g

/**
 * Vite resolves `import.meta.glob(...)` at build time, so files only reachable through
 * it (e.g. design-system-page.tsx globbing every *.stories.tsx) are genuinely bundled
 * even though they never appear as a literal `from "..."` import. Without expanding the
 * pattern here, any component wired into the live catalog only via its own story file
 * looks unreachable and silently drops out of the generated catalog.
 */
function expandGlobPattern(pattern, fromAbsoluteDir) {
    const segments = pattern.split("/")
    const wildcardIndex = segments.findIndex((segment) => segment.includes("*"))
    const baseSegments = wildcardIndex === -1 ? segments : segments.slice(0, wildcardIndex)
    const patternSegments = wildcardIndex === -1 ? [] : segments.slice(wildcardIndex)
    const baseDir = path.resolve(fromAbsoluteDir, baseSegments.join("/"))

    if (patternSegments.length === 0) {
        return existsSync(baseDir) && statSync(baseDir).isFile() ? [baseDir] : []
    }
    if (!existsSync(baseDir)) {
        return []
    }

    const regexSource = patternSegments
        .join("/")
        .replace(/[.+^${}()|[\]\\]/g, "\\$&")
        .replace(/\*\*/g, "@@GLOBSTAR@@")
        .replace(/\*/g, "[^/]*")
        .replace(/@@GLOBSTAR@@/g, ".*")
    const matcher = new RegExp(`^${regexSource}$`)

    const matches = []
    const walk = (dir) => {
        for (const entry of readdirSync(dir, { withFileTypes: true })) {
            const absolute = path.join(dir, entry.name)
            if (entry.isDirectory()) {
                walk(absolute)
            } else if (entry.isFile() && matcher.test(toPosix(path.relative(baseDir, absolute)))) {
                matches.push(absolute)
            }
        }
    }
    walk(baseDir)
    return matches
}

function toPosix(projectPath) {
    return projectPath.replaceAll("\\", "/")
}

function projectPathFromAbsolute(absPath) {
    return toPosix(path.relative(rootDir, absPath))
}

function absolutePathFromProject(projectPath) {
    return path.join(rootDir, projectPath)
}

function resolveImport(specifier, fromAbsolutePath) {
    if (!specifier.startsWith(".") && !specifier.startsWith("@/")) {
        return null
    }

    const candidateBase = specifier.startsWith("@/")
        ? path.join(rootDir, "src", specifier.slice(2))
        : path.resolve(path.dirname(fromAbsolutePath), specifier)

    const candidates = [
        candidateBase,
        `${candidateBase}.ts`,
        `${candidateBase}.tsx`,
        `${candidateBase}.js`,
        `${candidateBase}.jsx`,
        path.join(candidateBase, "index.ts"),
        path.join(candidateBase, "index.tsx"),
    ]

    for (const candidate of candidates) {
        if (existsSync(candidate) && statSync(candidate).isFile()) {
            return candidate
        }
    }

    return null
}

function collectReachableFiles(entryProjectPath) {
    const entryAbsolute = absolutePathFromProject(entryProjectPath)
    const queue = [entryAbsolute]
    const visited = new Set()

    while (queue.length > 0) {
        const current = queue.pop()
        if (!current || visited.has(current)) {
            continue
        }
        visited.add(current)

        const content = readFileSync(current, "utf8")
        importRegex.lastIndex = 0

        let match
        while ((match = importRegex.exec(content))) {
            const resolved = resolveImport(match[1], current)
            if (resolved && !visited.has(resolved)) {
                queue.push(resolved)
            }
        }

        globImportRegex.lastIndex = 0
        let globMatch
        while ((globMatch = globImportRegex.exec(content))) {
            for (const resolved of expandGlobPattern(globMatch[1], path.dirname(current))) {
                if (!visited.has(resolved)) {
                    queue.push(resolved)
                }
            }
        }
    }

    return [...visited].map(projectPathFromAbsolute)
}

function extractObjectLiteral(text, startToken) {
    const tokenIndex = text.indexOf(startToken)
    if (tokenIndex < 0) {
        return null
    }

    const objectStart = text.indexOf("{", tokenIndex)
    if (objectStart < 0) {
        return null
    }

    let depth = 0
    for (let i = objectStart; i < text.length; i += 1) {
        const ch = text[i]
        if (ch === "{") {
            depth += 1
        } else if (ch === "}") {
            depth -= 1
            if (depth === 0) {
                return text.slice(objectStart, i + 1)
            }
        }
    }

    return null
}

function parseDesignSystemMeta(componentPath) {
    const absolutePath = absolutePathFromProject(componentPath)
    const content = readFileSync(absolutePath, "utf8")

    if (!content.includes("designSystemMeta")) {
        return {
            ok: false,
            skip: true,
        }
    }

    const objectLiteral = extractObjectLiteral(content, "const designSystemMeta")
    if (!objectLiteral) {
        return {
            ok: false,
            error: "No se pudo parsear el objeto designSystemMeta.",
        }
    }

    try {
        const meta = Function(`"use strict"; return (${objectLiteral});`)()
        return { ok: true, meta }
    } catch (error) {
        return {
            ok: false,
            error: `designSystemMeta invalido: ${String(error)}`,
        }
    }
}

function findStoryFileForComponent(componentPath) {
    const storyPath = componentPath.replace(/\.tsx$/, ".stories.tsx")
    return existsSync(absolutePathFromProject(storyPath)) ? storyPath : null
}

function extractStoryTitle(storyPath) {
    if (!storyPath) {
        return null
    }
    const content = readFileSync(absolutePathFromProject(storyPath), "utf8")
    const titleMatch = content.match(/title:\s*["'`]([^"'`]+)["'`]/)
    return titleMatch?.[1] ?? null
}

function hasStateCoverage(storyPath, stateName) {
    if (!storyPath) {
        return false
    }
    const content = readFileSync(absolutePathFromProject(storyPath), "utf8").toLowerCase()
    return content.includes(stateName.toLowerCase())
}

function tokenPathExists(tokenPath, stylesRoot) {
    const segments = tokenPath.split(".")
    let cursor = stylesRoot
    for (const segment of segments) {
        if (!cursor || typeof cursor !== "object" || !(segment in cursor)) {
            return false
        }
        cursor = cursor[segment]
    }
    return true
}

function readJson(projectPath) {
    const absolutePath = absolutePathFromProject(projectPath)
    const raw = readFileSync(absolutePath, "utf8").replace(/^\uFEFF/, "")
    return JSON.parse(raw)
}

function run() {
    const reachableFiles = collectReachableFiles(entryFile)
    const componentFiles = reachableFiles.filter(
        (projectPath) =>
            projectPath.endsWith(".tsx") &&
            !projectPath.endsWith(".stories.tsx") &&
            (projectPath.startsWith("src/components/ui/") || projectPath.startsWith("src/components/meetup/"))
    )

    const stylesJson = readJson("styles.json")
    const entities = []
    const errors = []

    for (const componentPath of componentFiles) {
        const parsed = parseDesignSystemMeta(componentPath)
        if (!parsed.ok) {
            if (!parsed.skip) {
                errors.push(`[${componentPath}] ${parsed.error}`)
            }
            continue
        }

        const meta = parsed.meta
        const storyPath = findStoryFileForComponent(componentPath)
        const storyTitle = extractStoryTitle(storyPath)
        const stateCoverage = (meta.states ?? []).map((state) => ({
            state,
            covered: hasStateCoverage(storyPath, state),
        }))

        if (!Array.isArray(meta.states) || meta.states.length === 0) {
            errors.push(`[${componentPath}] designSystemMeta.states debe tener al menos un estado.`)
        }

        if (!Array.isArray(meta.tokensUsed) || meta.tokensUsed.length === 0) {
            errors.push(`[${componentPath}] designSystemMeta.tokensUsed debe tener al menos un token.`)
        }

        if (!storyPath) {
            errors.push(`[${componentPath}] Falta story obligatoria (${componentPath.replace(/\.tsx$/, ".stories.tsx")}).`)
        }

        if (storyPath && storyTitle !== meta.storybookTitle) {
            errors.push(
                `[${componentPath}] Story title no coincide. Esperado="${meta.storybookTitle}", actual="${storyTitle ?? "N/A"}".`
            )
        }

        if (Array.isArray(meta.tokensUsed)) {
            for (const tokenPath of meta.tokensUsed) {
                if (!tokenPathExists(tokenPath, stylesJson)) {
                    errors.push(`[${componentPath}] Token inexistente en styles.json: ${tokenPath}.`)
                }
            }
        }

        if (Array.isArray(meta.states) && meta.states.length > 0 && storyPath) {
            const uncoveredStates = stateCoverage.filter((item) => !item.covered).map((item) => item.state)
            if (uncoveredStates.length === meta.states.length) {
                errors.push(
                    `[${componentPath}] Ningun estado declarado se encontro en la story. Estados declarados: ${meta.states.join(", ")}.`
                )
            }
        }

        entities.push({
            file: componentPath,
            storyFile: storyPath,
            storyTitle,
            ...meta,
            stateCoverage,
        })
    }

    const catalog = {
        generatedAt: new Date().toISOString(),
        entryFile,
        entities: entities.sort((a, b) => a.title.localeCompare(b.title)),
        sync: {
            ok: errors.length === 0,
            errorCount: errors.length,
            errors,
        },
    }

    const nextContent = `${JSON.stringify(catalog, null, 4)}\n`
    const generatedAbsolutePath = absolutePathFromProject(generatedCatalogPath)

    if (isCheckMode) {
        if (!existsSync(generatedAbsolutePath)) {
            errors.push(`Falta catalogo generado en ${generatedCatalogPath}. Ejecuta npm run ds:sync.`)
        } else {
            const current = readFileSync(generatedAbsolutePath, "utf8")
            const currentParsed = JSON.parse(current.replace(/^\uFEFF/, ""))
            const currentStable = { ...currentParsed, generatedAt: "IGNORED" }
            const nextStable = { ...catalog, generatedAt: "IGNORED" }
            if (JSON.stringify(currentStable) !== JSON.stringify(nextStable)) {
                errors.push(`Catalogo desactualizado en ${generatedCatalogPath}. Ejecuta npm run ds:sync.`)
            }
        }
    } else {
        mkdirSync(path.dirname(generatedAbsolutePath), { recursive: true })
        writeFileSync(generatedAbsolutePath, nextContent)
    }

    if (errors.length > 0) {
        console.error("Design System sync/check failed:")
        for (const error of errors) {
            console.error(`- ${error}`)
        }
        process.exit(1)
    }

    console.log(`Design System ${isCheckMode ? "check" : "sync"} OK. Entidades=${entities.length}.`)
}

run()
