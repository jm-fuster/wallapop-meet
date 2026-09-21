/**
 * Identificadores aleatorios para el chat. `Math.random()` no sirve aqui: de el sale el
 * identificador local de usuario, y ese identificador decide que mensajes se pintan como
 * propios. Un generador predecible permitiria adivinarlo. `crypto.getRandomValues` si esta
 * disponible fuera de contexto seguro, al contrario que `crypto.randomUUID`, asi que hace
 * de respaldo cuando la app se sirve por HTTP plano.
 */

const HEX_ALPHABET = "0123456789abcdef"

function randomHex(byteLength: number): string {
    const bytes = new Uint8Array(byteLength)
    crypto.getRandomValues(bytes)

    let hex = ""
    for (const byte of bytes) {
        hex += HEX_ALPHABET[byte >> 4] + HEX_ALPHABET[byte & 0x0f]
    }
    return hex
}

/** UUID v4 con `crypto.randomUUID` cuando existe; si no, uno equivalente byte a byte. */
export function randomUuid(): string {
    if (typeof crypto.randomUUID === "function") {
        return crypto.randomUUID()
    }

    const bytes = new Uint8Array(16)
    crypto.getRandomValues(bytes)
    // Version 4 y variante RFC 4122.
    bytes[6] = (bytes[6] & 0x0f) | 0x40
    bytes[8] = (bytes[8] & 0x3f) | 0x80

    let hex = ""
    for (const byte of bytes) {
        hex += HEX_ALPHABET[byte >> 4] + HEX_ALPHABET[byte & 0x0f]
    }

    return [
        hex.slice(0, 8),
        hex.slice(8, 12),
        hex.slice(12, 16),
        hex.slice(16, 20),
        hex.slice(20),
    ].join("-")
}

/**
 * Identificador de mensaje. Lleva prefijo legible para depurar y 16 bytes de entropia:
 * con marca de tiempo, dos mensajes del mismo milisegundo colisionaban y el servidor
 * descartaba el segundo en silencio al deduplicar.
 */
export function randomMessageId(prefix: string): string {
    return `${prefix}-${randomHex(16)}`
}
