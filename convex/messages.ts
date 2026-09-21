import { v } from "convex/values"

import { mutation, query } from "./_generated/server"

/*
 * Este demo es publico y la API de Convex es anonima: cualquiera puede llamar a estas
 * funciones con la URL que viaja dentro del bundle. El servidor no puede confiar en el
 * cliente, asi que acota por su cuenta el tamano de cada campo, cuantos mensajes cabe
 * guardar por hilo y a que ritmo. Sin estos limites un solo script podria llenar el
 * despliegue y dejar el chat inservible para todo el mundo.
 */
const MAX_TEXT_LENGTH = 2_000
const MAX_CONVERSATION_ID_LENGTH = 200
const MAX_CLIENT_MESSAGE_ID_LENGTH = 100
const MAX_SENDER_USER_ID_LENGTH = 100
const MAX_TIME_LENGTH = 32
/** Tope duro de mensajes persistidos por hilo. Al llegar, el hilo deja de aceptar escrituras. */
const MAX_MESSAGES_PER_CONVERSATION = 200
/** Ventana y cupo del limite de frecuencia, sobre el reloj del servidor. */
const RATE_LIMIT_WINDOW_MS = 10_000
const RATE_LIMIT_MAX_MESSAGES = 10

/** Longitud minima del prefijo de visitante, para que la clave no se pueda adivinar. */
const MIN_CONVERSATION_NAMESPACE_LENGTH = 16

function assertLength(value: string, maxLength: number, fieldName: string): void {
    if (value.length > maxLength) {
        throw new Error(`${fieldName} supera el maximo de ${maxLength} caracteres.`)
    }
}

/**
 * Toda clave de hilo tiene que venir con espacio de nombres (`<userId>/<conversationId>`).
 * Comprobarlo aqui, y no solo en el cliente, es lo que deja fuera de alcance los hilos
 * antiguos guardados con identificadores compartidos (`conv-a-arrival` y companyia), que
 * cualquiera podia leer por ser constantes publicas del bundle.
 */
function assertNamespacedConversationId(conversationId: string): void {
    assertLength(conversationId, MAX_CONVERSATION_ID_LENGTH, "conversationId")

    const separatorIndex = conversationId.indexOf("/")
    if (separatorIndex < MIN_CONVERSATION_NAMESPACE_LENGTH) {
        throw new Error("conversationId debe llevar el espacio de nombres del visitante.")
    }
    if (conversationId.indexOf("/", separatorIndex + 1) !== -1) {
        throw new Error("conversationId solo admite un separador.")
    }
    if (separatorIndex === conversationId.length - 1) {
        throw new Error("conversationId no puede terminar en el separador.")
    }
}

export const saveUserTextMessage = mutation({
    args: {
        conversationId: v.string(),
        clientMessageId: v.string(),
        senderUserId: v.optional(v.string()),
        text: v.string(),
        variant: v.optional(v.union(v.literal("sent"), v.literal("received"))),
        time: v.string(),
        deliveryState: v.optional(v.union(v.literal("sent"), v.literal("read"))),
    },
    handler: async (ctx, args) => {
        const text = args.text.trim()
        if (text.length === 0) {
            throw new Error("El mensaje no puede estar vacio.")
        }

        assertLength(text, MAX_TEXT_LENGTH, "text")
        assertNamespacedConversationId(args.conversationId)
        assertLength(args.clientMessageId, MAX_CLIENT_MESSAGE_ID_LENGTH, "clientMessageId")
        assertLength(args.time, MAX_TIME_LENGTH, "time")
        if (args.senderUserId !== undefined) {
            assertLength(args.senderUserId, MAX_SENDER_USER_ID_LENGTH, "senderUserId")
        }

        /*
         * Una sola lectura acotada del hilo cubre los tres controles siguientes. Como el
         * tope por hilo es `MAX_MESSAGES_PER_CONVERSATION`, leer uno mas que el tope basta
         * para saber si esta lleno, y el historico completo cabe en esa misma pagina.
         */
        const conversationMessages = await ctx.db
            .query("chatMessages")
            .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
            .take(MAX_MESSAGES_PER_CONVERSATION + 1)

        const existing = conversationMessages.find(
            (message) => message.clientMessageId === args.clientMessageId
        )
        if (existing) {
            return existing._id
        }

        if (conversationMessages.length >= MAX_MESSAGES_PER_CONVERSATION) {
            throw new Error("Este hilo ha alcanzado el maximo de mensajes guardados.")
        }

        /*
         * El ritmo se mide contra `createdAt`, que sella el servidor unas lineas mas abajo.
         * Medirlo contra una marca de tiempo del cliente dejaria el limite sin efecto: bastaria
         * con enviar fechas antiguas.
         */
        const createdAt = Date.now()
        const recentMessages = conversationMessages.filter(
            (message) => createdAt - message.createdAt < RATE_LIMIT_WINDOW_MS
        )
        if (recentMessages.length >= RATE_LIMIT_MAX_MESSAGES) {
            throw new Error("Demasiados mensajes seguidos. Espera unos segundos.")
        }

        return await ctx.db.insert("chatMessages", {
            conversationId: args.conversationId,
            clientMessageId: args.clientMessageId,
            senderUserId: args.senderUserId ?? `legacy:${args.conversationId}`,
            text,
            variant: args.variant,
            time: args.time,
            deliveryState: args.deliveryState,
            createdAt,
        })
    },
})

export const listByConversation = query({
    args: {
        conversationId: v.string(),
    },
    handler: async (ctx, args) => {
        assertNamespacedConversationId(args.conversationId)

        return await ctx.db
            .query("chatMessages")
            .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
            .take(MAX_MESSAGES_PER_CONVERSATION)
    },
})
