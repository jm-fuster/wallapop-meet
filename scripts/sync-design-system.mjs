import { readFileSync, writeFileSync, existsSync, mkdirSync, statSync, readdirSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import ts from "typescript"

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
/**
 * Traduce los segmentos comodin de un glob a una expresion regular.
 *
 * `**` seguido de barra tiene que poder no casar ningun directorio: en glob,
 * `** / *.stories.tsx` incluye tambien los ficheros que cuelgan directamente de la carpeta
 * base. La version anterior lo convertia en `.*` con la barra literal detras, que exige al
 * menos un nivel, de modo que un fichero en la raiz del patron no casaba nunca.
 */
export function globPatternToRegExp(patternSegments) {
    const regexSource = patternSegments
        .join("/")
        .replace(/[.+^${}()|[\]\\]/g, "\\$&")
        .replace(/\*\*\//g, "@@GLOBSTAR_SLASH@@")
        .replace(/\*\*/g, "@@GLOBSTAR@@")
        .replace(/\*/g, "[^/]*")
        .replace(/@@GLOBSTAR_SLASH@@/g, "(?:[^/]+/)*")
        .replace(/@@GLOBSTAR@@/g, ".*")

    return new RegExp(`^${regexSource}$`)
}

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

    const matcher = globPatternToRegExp(patternSegments)

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

/**
 * Convierte un nodo del AST en el valor que representa, y solo si es un literal.
 * Cualquier otra cosa (una llamada, una referencia, una plantilla con interpolacion)
 * se rechaza con un error legible en vez de ejecutarse.
 */
function literalValueFromNode(node, describePath) {
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
        return node.text
    }
    if (ts.isNumericLiteral(node)) {
        return Number(node.text)
    }
    if (node.kind === ts.SyntaxKind.TrueKeyword) {
        return true
    }
    if (node.kind === ts.SyntaxKind.FalseKeyword) {
        return false
    }
    if (node.kind === ts.SyntaxKind.NullKeyword) {
        return null
    }
    if (ts.isPrefixUnaryExpression(node) && node.operator === ts.SyntaxKind.MinusToken) {
        return -literalValueFromNode(node.operand, describePath)
    }
    if (ts.isArrayLiteralExpression(node)) {
        return node.elements.map((element, index) =>
            literalValueFromNode(element, `${describePath}[${index}]`)
        )
    }
    if (ts.isObjectLiteralExpression(node)) {
        return objectValueFromNode(node, describePath)
    }

    throw new Error(`${describePath} no es un literal admitido.`)
}

function objectValueFromNode(node, describePath) {
    const value = {}
    for (const property of node.properties) {
        if (!ts.isPropertyAssignment(property)) {
            throw new Error(`${describePath} solo admite propiedades literales.`)
        }

        const nameNode = property.name
        const key =
            ts.isIdentifier(nameNode) || ts.isStringLiteral(nameNode)
                ? nameNode.text
                : null
        if (key === null) {
            throw new Error(`${describePath} tiene una clave que no es un nombre simple.`)
        }

        value[key] = literalValueFromNode(property.initializer, `${describePath}.${key}`)
    }
    return value
}

/** Quita los envoltorios de tipo (`satisfies X`, `as const`) que no cambian el valor. */
function unwrapTypeAssertions(node) {
    let current = node
    while (
        ts.isSatisfiesExpression(current) ||
        ts.isAsExpression(current) ||
        ts.isParenthesizedExpression(current)
    ) {
        current = current.expression
    }
    return current
}

function findDesignSystemMetaInitializer(sourceFile) {
    let initializer = null

    const visit = (node) => {
        if (initializer) {
            return
        }
        if (
            ts.isVariableDeclaration(node) &&
            ts.isIdentifier(node.name) &&
            node.name.text === "designSystemMeta" &&
            node.initializer
        ) {
            initializer = node.initializer
            return
        }
        ts.forEachChild(node, visit)
    }

    visit(sourceFile)
    return initializer
}

/*
 * El objeto se lee del AST de TypeScript, no se ejecuta. Antes se recortaba contando llaves
 * y se pasaba por `Function()`, lo que ejecutaba codigo del repositorio durante `npm run lint`
 * (tambien en CI, sobre la rama de cualquier pull request) y ademas se equivocaba de limite
 * en cuanto una cadena contenia una llave.
 */
function parseDesignSystemMeta(componentPath) {
    const absolutePath = absolutePathFromProject(componentPath)
    const content = readFileSync(absolutePath, "utf8")

    if (!content.includes("designSystemMeta")) {
        return {
            ok: false,
            skip: true,
        }
    }

    const sourceFile = ts.createSourceFile(
        absolutePath,
        content,
        ts.ScriptTarget.Latest,
        /* setParentNodes */ false,
        ts.ScriptKind.TSX
    )

    const initializer = findDesignSystemMetaInitializer(sourceFile)
    if (!initializer) {
        return {
            ok: false,
            error: "No se pudo parsear el objeto designSystemMeta.",
        }
    }

    const objectLiteral = unwrapTypeAssertions(initializer)
    if (!ts.isObjectLiteralExpression(objectLiteral)) {
        return {
            ok: false,
            error: "designSystemMeta debe ser un objeto literal.",
        }
    }

    try {
        return { ok: true, meta: objectValueFromNode(objectLiteral, "designSystemMeta") }
    } catch (error) {
        return {
            ok: false,
            error: `designSystemMeta invalido: ${error instanceof Error ? error.message : String(error)}`,
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

const storyAnalysisCache = new Map()

function normalizeStateToken(value) {
    return value.toLowerCase().replace(/[^a-z0-9]/g, "")
}

/**
 * Tokens reales de una story: literales de cadena e identificadores, leidos del AST, mas los
 * nombres de sus exports. Mirar el AST y no el texto crudo es lo que separa un dato de un
 * trozo de sintaxis.
 */
function analyzeStoryFile(storyPath) {
    const cached = storyAnalysisCache.get(storyPath)
    if (cached) {
        return cached
    }

    const absolutePath = absolutePathFromProject(storyPath)
    const sourceFile = ts.createSourceFile(
        absolutePath,
        readFileSync(absolutePath, "utf8"),
        ts.ScriptTarget.Latest,
        /* setParentNodes */ false,
        ts.ScriptKind.TSX
    )

    const tokens = new Set()
    const visit = (node) => {
        if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
            tokens.add(normalizeStateToken(node.text))
        } else if (ts.isIdentifier(node)) {
            tokens.add(normalizeStateToken(node.text))
        }
        ts.forEachChild(node, visit)
    }
    visit(sourceFile)

    const storyNames = []
    for (const statement of sourceFile.statements) {
        if (!ts.isVariableStatement(statement)) {
            continue
        }
        const exported = statement.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
        if (!exported) {
            continue
        }
        for (const declaration of statement.declarationList.declarations) {
            if (ts.isIdentifier(declaration.name)) {
                storyNames.push(declaration.name.text)
            }
        }
    }

    const analysis = { tokens, storyNames }
    storyAnalysisCache.set(storyPath, analysis)
    return analysis
}

/*
 * Antes esto era `content.toLowerCase().includes(state.toLowerCase())` sobre el fichero entero,
 * asi que el estado "default" casaba con el `export default meta` que tienen todas las stories
 * y la comprobacion no fallaba jamas. Ahora se mira el AST: `export default` es una palabra
 * clave, no un identificador ni una cadena, y deja de contar.
 */
function hasStateCoverage(storyPath, stateName) {
    if (!storyPath) {
        return false
    }

    const { tokens, storyNames } = analyzeStoryFile(storyPath)
    const token = normalizeStateToken(stateName)

    // "default" es el componente sin modificadores: cualquier story lo esta enseñando.
    if (token === "default") {
        return storyNames.length > 0
    }

    return tokens.has(token)
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

export { hasStateCoverage }

// Solo se ejecuta al invocarlo como script; importarlo desde un test no dispara la sincronizacion.
const invocadoDirectamente =
    process.argv[1] !== undefined &&
    path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)

if (invocadoDirectamente) {
    run()
}
