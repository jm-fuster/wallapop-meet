import { describe, expect, it } from "vitest"

import { buildConvexConversationKey } from "@/components/meetup/wallapop-chat-workspace-utils"
import { randomMessageId, randomUuid } from "@/lib/secure-random"

describe("convex conversation key", () => {
    it("namespaces a shared conversation id per visitor", () => {
        const conversationId = "conv-a-arrival"

        const first = buildConvexConversationKey("11111111-1111-4111-8111-111111111111", conversationId)
        const second = buildConvexConversationKey("22222222-2222-4222-8222-222222222222", conversationId)

        expect(first).not.toBe(second)
        expect(first).toContain(conversationId)
    })

    it("is stable for the same visitor and conversation", () => {
        const userId = "11111111-1111-4111-8111-111111111111"

        expect(buildConvexConversationKey(userId, "conv-a-arrival")).toBe(
            buildConvexConversationKey(userId, "conv-a-arrival")
        )
    })

    it("keeps each conversation of a visitor separate", () => {
        const userId = "11111111-1111-4111-8111-111111111111"

        expect(buildConvexConversationKey(userId, "conv-a-arrival")).not.toBe(
            buildConvexConversationKey(userId, "conv-b-seller-propose")
        )
    })
})

describe("chat identifiers", () => {
    it("builds rfc 4122 version 4 uuids", () => {
        expect(randomUuid()).toMatch(
            /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
        )
    })

    it("does not repeat message ids generated within the same millisecond", () => {
        // El identificador anterior era `m-${Date.now()}`: en este bucle todos habrian sido iguales.
        const ids = new Set(Array.from({ length: 1_000 }, () => randomMessageId("m")))

        expect(ids.size).toBe(1_000)
    })

    it("keeps the readable prefix", () => {
        expect(randomMessageId("sys")).toMatch(/^sys-[0-9a-f]{32}$/)
    })
})
