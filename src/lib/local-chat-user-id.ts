import { randomUuid } from "@/lib/secure-random"

const CHAT_USER_ID_STORAGE_KEY = "wm_chat_user_id"

export function getOrCreateLocalChatUserId(): string {
    if (typeof window === "undefined") {
        return randomUuid()
    }

    const current = window.localStorage.getItem(CHAT_USER_ID_STORAGE_KEY)
    if (current && current.trim().length > 0) {
        return current
    }

    const generated = randomUuid()
    window.localStorage.setItem(CHAT_USER_ID_STORAGE_KEY, generated)
    return generated
}
