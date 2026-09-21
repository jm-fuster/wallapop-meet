import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export default defineSchema({
    chatMessages: defineTable({
        /**
         * Clave de hilo con espacio de nombres por visitante (`<userId>/<conversationId>`).
         * La API de Convex de este demo es anonima, asi que el aislamiento entre visitantes
         * depende de que nadie comparta clave: ver `buildConvexConversationKey`.
         */
        conversationId: v.string(),
        clientMessageId: v.string(),
        senderUserId: v.optional(v.string()),
        text: v.string(),
        variant: v.optional(v.union(v.literal("sent"), v.literal("received"))),
        time: v.string(),
        deliveryState: v.optional(v.union(v.literal("sent"), v.literal("read"))),
        /** Siempre lo sella el servidor: es la base del limite de frecuencia. */
        createdAt: v.number(),
    }).index("by_conversation", ["conversationId"]),
})
