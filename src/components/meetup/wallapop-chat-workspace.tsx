import type { DesignSystemEntityMeta } from "@/design-system/catalog/types"
import * as React from "react"
import L from "leaflet"
import { Banknote, MapPin, QrCode } from "lucide-react"
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet"

import {
    ChatMeetRatingPromptBubble,
    MEET_RATING_PROMPT_COPY,
} from "@/components/meetup/chat-meet-rating-prompt-bubble"
import { MeetTransactionRatingModal } from "@/components/meetup/meet-transaction-rating-modal"
import { MeetupCard } from "@/components/meetup/meetup-card"
import { MeetupProposalFooter } from "@/components/meetup/meetup-proposal-footer"
import { MeetupProposalHeader } from "@/components/meetup/meetup-proposal-header"
import { MeetupPendingSaleBanner } from "@/components/meetup/meetup-pending-sale-banner"
import {
    buildConvexConversationKey,
    buildMeetupExpiryKey,
    buildReverseGeocodeUrl,
    collectExpiredMeetups,
    resolveInitialProposalDateTimeValue,
    shouldApplyReverseGeocodeResult,
    sumReleasedWalletHoldEur,
} from "@/components/meetup/wallapop-chat-workspace-utils"
import { MeetupWizardStepHeading } from "@/components/meetup/meetup-wizard-step-heading"
import { ChatComposer } from "@/components/ui/chat-composer"
import { ChatConversationHeader } from "@/components/ui/chat-conversation-header"
import { ChatCounterpartCard } from "@/components/ui/chat-counterpart-card"
import { ChatListItem } from "@/components/ui/chat-list-item"
import { ChatMessageBubble } from "@/components/ui/chat-message-bubble"
import { ChatProductCard, type ChatProductCardViewerRole } from "@/components/ui/chat-product-card"
import { ChatSecurityBanner } from "@/components/ui/chat-security-banner"
import { Button } from "@/components/ui/button"
import { CalendarPicker } from "@/components/ui/calendar-picker"
import { toLocalDateValue } from "@/components/ui/calendar-picker.utils"
import { IconButton } from "@/components/ui/icon-button"
import { InboxBottomNav } from "@/components/ui/inbox-bottom-nav"
import { Input } from "@/components/ui/input"
import { LocationSearchInput } from "@/components/ui/location-search-input"
import { NoticeBanner } from "@/components/ui/notice-banner"
import { SelectableOption } from "@/components/ui/selectable-option"
import { getOrCreateLocalChatUserId } from "@/lib/local-chat-user-id"
import { Select } from "@/components/ui/select"
import { WallapopIcon } from "@/components/ui/wallapop-icon"
import { getConvexHttpClient } from "@/lib/convex-client"
import { randomMessageId } from "@/lib/secure-random"
import { createMeetupMachine } from "@/meetup"
import { transitionMeetup } from "@/meetup/state-machine"
import type {
    ActorRole,
    MeetupChatContext,
    MeetupMachine,
    MeetupPaymentMethod,
} from "@/meetup/types"
import { api } from "../../../convex/_generated/api"

type Message = {
    id: string
    senderUserId?: string
    text: string
    variant: "sent" | "received"
    time: string
    createdAt: number
    deliveryState?: "sent" | "read"
    messageKind?: "rating_prompt"
    ratingPromptCompleted?: boolean
}

type ConvexChatMessage = {
    conversationId: string
    clientMessageId: string
    senderUserId?: string
    text: string
    variant?: "sent" | "received"
    time: string
    createdAt?: number
    deliveryState?: "sent" | "read"
}

type ConversationTimelineEntry =
    | {
        id: string
        type: "message"
        createdAt: number
        message: Message
    }
    | {
        id: string
        type: "meetup"
        createdAt: number
        meetup: MeetupMachine
    }

type Conversation = {
    id: string
    userName: string
    itemPrice: string
    messageDate: string
    itemTitle: string
    messagePreview: string
    listingImageSrc?: string
    profileImageSrc?: string
    leadingIndicator?: "bookmark" | "deal"
    unreadCount?: number
    lastMessageDeliveryState?: "sent" | "read"
    meetupContext?: MeetupChatContext
    counterpartRating: number
    counterpartRatingCount: number
    counterpartDistanceLabel: string
    counterpartAttendanceRate: number
    counterpartAttendanceMeetups: number
    listingViewerRole: ChatProductCardViewerRole
    listingViews?: number
    listingLikes?: number
    listingStatusLabel?: string
    pendingSaleAlert?: boolean
}

type SafeMeetingPoint = {
    id: string
    name: string
    hint: string
    address: string
    distanceMeters: number
    completedSales: number
    lat: number
    lng: number
}

type ProposalStep = 1 | 2 | 3

type MapPoint = {
    lat: number
    lng: number
}

type ProposalSelectableOption = {
    id: string
    kind: "safe" | "custom"
    label: string
    address: string
    lat: number
    lng: number
    distanceMeters: number
    completedSales?: number
    safePointId?: string
}

type ProposalDraftState = {
    step: ProposalStep
    mapPickerOpen: boolean
    mapPickerPointId: string
    mapSearchValue: string
    mapCenter: MapPoint
    options: ProposalSelectableOption[]
    selectedOptionId: string
    customPoint: MapPoint | null
    customLocationLabel: string
    scheduledAt: string
    finalPrice: string
    paymentMethod: MeetupPaymentMethod | ""
    error: string
}

type ProposalEntryActionState = {
    visible: boolean
    enabled: boolean
    message: string
}

const DAC7_ALERT_THRESHOLD_EUR = 2000
const MAX_FINAL_PRICE_EUR = 99999
const DAY_MS = 24 * 60 * 60 * 1000
const PENDING_SALE_ALERT_WINDOW_MS = 30 * 60 * 1000

function resolveProposalEntryActionState(
    meetup: MeetupMachine,
    actorRole: ActorRole
): ProposalEntryActionState {
    if (actorRole !== "SELLER") {
        return {
            visible: false,
            enabled: false,
            message: "Solo el vendedor puede iniciar una propuesta de meetup.",
        }
    }

    if (meetup.status === null || meetup.status === "CANCELLED") {
        return {
            visible: true,
            enabled: true,
            message: "Inicia la propuesta desde esta conversación con el comprador.",
        }
    }

    return {
        visible: false,
        enabled: false,
        message: "Ya existe una propuesta activa en este chat.",
    }
}

function parseFinalPrice(rawValue: string): number | null {
    const normalizedValue = rawValue.trim().replace(",", ".")
    if (!normalizedValue) {
        return null
    }

    const parsedValue = Number.parseFloat(normalizedValue)
    if (!Number.isFinite(parsedValue)) {
        return null
    }

    return parsedValue
}

const seedNow = Date.now()

function tsMinutesAgo(minutes: number): number {
    return seedNow - minutes * 60 * 1000
}

function roundToQuarterHour(value: Date): Date {
    const rounded = new Date(value)
    rounded.setSeconds(0, 0)
    const minutes = rounded.getMinutes()
    const roundedMinutes = Math.round(minutes / 15) * 15
    if (roundedMinutes === 60) {
        rounded.setHours(rounded.getHours() + 1, 0, 0, 0)
        return rounded
    }
    rounded.setMinutes(roundedMinutes, 0, 0)
    return rounded
}

function createQuarterHourDateWithOffset(base: Date, offsetMinutes: number): Date {
    return roundToQuarterHour(new Date(base.getTime() + offsetMinutes * 60 * 1000))
}

function isQuarterHourTimeValue(value: string): boolean {
    return /^([01]\d|2[0-3]):(00|15|30|45)$/.test(value)
}

const initialConversations: Conversation[] = [
    {
        id: "conv-a-arrival",
        userName: "Laura M.",
        itemPrice: "240 €",
        messageDate: "Hoy",
        itemTitle: "Nintendo Switch OLED + dock",
        messagePreview: "Perfecto, alli nos vemos. Gracias!",
        listingImageSrc:
            "https://images.pexels.com/photos/6993182/pexels-photo-6993182.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=400&h=400",
        profileImageSrc:
            "https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=320&h=320",
        meetupContext: {
            conversationId: "conv-a-arrival",
            listingId: "listing-switch-001",
            sellerUserId: "user-seller-001",
            buyerUserId: "user-buyer-laura-001",
        },
        counterpartRating: 4.5,
        counterpartRatingCount: 110,
        counterpartDistanceLabel: "3,4km de ti",
        counterpartAttendanceRate: 96,
        counterpartAttendanceMeetups: 28,
        listingViewerRole: "seller",
        listingViews: 23,
        listingLikes: 4,
    },
    {
        id: "conv-b-seller-propose",
        userName: "Javi R.",
        unreadCount: 2,
        itemPrice: "520 €",
        messageDate: "Hoy",
        itemTitle: "Bicicleta fixie Fuji",
        messagePreview: "Si te encaja, te envio propuesta de quedada ahora.",
        listingImageSrc:
            "https://images.pexels.com/photos/100582/pexels-photo-100582.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=400&h=400",
        profileImageSrc:
            "https://images.pexels.com/photos/1758144/pexels-photo-1758144.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=320&h=320",
        meetupContext: {
            conversationId: "conv-b-seller-propose",
            listingId: "listing-bike-002",
            sellerUserId: "user-seller-javi-002",
            buyerUserId: "user-buyer-javi-001",
        },
        counterpartRating: 5,
        counterpartRatingCount: 84,
        counterpartDistanceLabel: "8,2km de ti",
        counterpartAttendanceRate: 92,
        counterpartAttendanceMeetups: 41,
        listingViewerRole: "seller",
    },
    {
        id: "conv-c-buyer-incoming",
        userName: "Marta P.",
        itemPrice: "640 €",
        messageDate: "Hoy",
        itemTitle: "Camara Fujifilm X-T20",
        messagePreview: "Te acabo de enviar la propuesta con sitio y hora.",
        listingImageSrc:
            "https://images.pexels.com/photos/51383/photo-camera-subject-photographer-51383.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=400&h=400",
        profileImageSrc:
            "https://images.pexels.com/photos/370799/pexels-photo-370799.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=320&h=320",
        unreadCount: 2,
        meetupContext: {
            conversationId: "conv-c-buyer-incoming",
            listingId: "listing-camera-003",
            sellerUserId: "user-seller-marta-003",
            buyerUserId: "user-buyer-me-001",
        },
        counterpartRating: 4,
        counterpartRatingCount: 57,
        counterpartDistanceLabel: "1,9km de ti",
        counterpartAttendanceRate: 88,
        counterpartAttendanceMeetups: 17,
        listingViewerRole: "buyer",
        listingViews: 56,
        listingLikes: 8,
    },
    {
        id: "conv-d-sold-closed",
        userName: "Carlos G.",
        itemPrice: "310 €",
        messageDate: "Ayer",
        itemTitle: "Silla gamer Secretlab",
        messagePreview: "Perfecto, gracias por todo. Venta cerrada.",
        leadingIndicator: "deal",
        listingImageSrc:
            "https://images.pexels.com/photos/13871156/pexels-photo-13871156.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=400&h=400",
        profileImageSrc:
            "https://images.pexels.com/photos/1382731/pexels-photo-1382731.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=320&h=320",
        meetupContext: {
            conversationId: "conv-d-sold-closed",
            listingId: "listing-chair-004",
            sellerUserId: "user-seller-me-001",
            buyerUserId: "user-buyer-carlos-004",
        },
        counterpartRating: 4.5,
        counterpartRatingCount: 132,
        counterpartDistanceLabel: "2,7km de ti",
        counterpartAttendanceRate: 99,
        counterpartAttendanceMeetups: 52,
        listingViewerRole: "seller",
        listingViews: 41,
        listingLikes: 3,
        listingStatusLabel: "Vendido",
    },
    {
        id: "conv-e-low-attendance",
        userName: "Iker S.",
        itemPrice: "210 €",
        messageDate: "12 feb",
        itemTitle: "Monitor LG 27 pulgadas 144Hz",
        messagePreview: "Prefiero venderselo a otra persona por tranquilidad.",
        listingImageSrc:
            "https://images.pexels.com/photos/1038916/pexels-photo-1038916.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=400&h=400",
        profileImageSrc:
            "https://images.pexels.com/photos/301599/pexels-photo-301599.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=320&h=320",
        unreadCount: 0,
        meetupContext: {
            conversationId: "conv-e-low-attendance",
            listingId: "listing-monitor-005",
            sellerUserId: "user-seller-me-001",
            buyerUserId: "user-buyer-iker-005",
        },
        counterpartRating: 4,
        counterpartRatingCount: 21,
        counterpartDistanceLabel: "6,5km de ti",
        counterpartAttendanceRate: 41,
        counterpartAttendanceMeetups: 11,
        listingViewerRole: "seller",
        listingViews: 19,
        listingLikes: 2,
    },
]

const initialMessagesByConversation: Record<string, Message[]> = {
    "conv-a-arrival": [
        {
            id: "m-a-1",
            text: "Hola, te la compro hoy si te viene bien.",
            variant: "received",
            time: formatTime(new Date(tsMinutesAgo(60))),
            createdAt: tsMinutesAgo(60),
        },
        {
            id: "m-a-2",
            text: "Perfecto, te acabo de enviar propuesta de quedada por Wallapop Meet.",
            variant: "sent",
            time: formatTime(new Date(tsMinutesAgo(32))),
            createdAt: tsMinutesAgo(32),
            deliveryState: "read",
        },
        {
            id: "m-a-3",
            text: "Una duda: por esa zona es facil aparcar o el parking es de pago?",
            variant: "received",
            time: formatTime(new Date(tsMinutesAgo(28))),
            createdAt: tsMinutesAgo(28),
        },
        {
            id: "m-a-4",
            text: "No suele ser facil aparcar en la calle por ahi.",
            variant: "sent",
            time: formatTime(new Date(tsMinutesAgo(24))),
            createdAt: tsMinutesAgo(24),
            deliveryState: "read",
        },
        {
            id: "m-a-5",
            text: "Mejor entrar al parking o venir en transporte publico.",
            variant: "sent",
            time: formatTime(new Date(tsMinutesAgo(22))),
            createdAt: tsMinutesAgo(22),
            deliveryState: "read",
        },
        {
            id: "m-a-6",
            text: "Si metes el coche en el parking menos de 30 minutos no te cobran.",
            variant: "sent",
            time: formatTime(new Date(tsMinutesAgo(21))),
            createdAt: tsMinutesAgo(21),
            deliveryState: "read",
        },
        {
            id: "m-a-7",
            text: "Perfecto, alli nos vemos. Gracias!",
            variant: "received",
            time: formatTime(new Date(tsMinutesAgo(18))),
            createdAt: tsMinutesAgo(18),
        },
    ],
    "conv-b-seller-propose": [
        {
            id: "m-b-1",
            text: "Sigue disponible la bici? Podria verla esta tarde.",
            variant: "received",
            time: formatTime(new Date(tsMinutesAgo(90))),
            createdAt: tsMinutesAgo(90),
        },
        {
            id: "m-b-2",
            text: "Si, la bici esta revisada, frenos y ruedas al dia.",
            variant: "sent",
            time: formatTime(new Date(tsMinutesAgo(72))),
            createdAt: tsMinutesAgo(72),
            deliveryState: "read",
        },
        {
            id: "m-b-3",
            text: "Perfecto, me cuadra. Cuando puedas mándame propuesta de quedada.",
            variant: "received",
            time: formatTime(new Date(tsMinutesAgo(14))),
            createdAt: tsMinutesAgo(14),
        },
        {
            id: "m-b-4",
            text: "Alerta: salgo tarde del trabajo, revisa mi ultimo mensaje antes de proponer quedada.",
            variant: "received",
            time: formatTime(new Date(tsMinutesAgo(2))),
            createdAt: tsMinutesAgo(2),
        },
    ],
    "conv-c-buyer-incoming": [
        {
            id: "m-c-1",
            text: "Hola, me interesa la camara. Te viene bien quedar hoy?",
            variant: "sent",
            time: formatTime(new Date(tsMinutesAgo(26))),
            createdAt: tsMinutesAgo(26),
            deliveryState: "read",
        },
        {
            id: "m-c-2",
            text: "Te acabo de enviar la solicitud de quedada con todos los datos.",
            variant: "received",
            time: formatTime(new Date(tsMinutesAgo(3))),
            createdAt: tsMinutesAgo(3),
        },
        {
            id: "m-c-3",
            text: "Cuando puedas revisala y me dices si te cuadra.",
            variant: "received",
            time: formatTime(new Date(tsMinutesAgo(2))),
            createdAt: tsMinutesAgo(2),
        },
    ],
    "conv-d-sold-closed": [
        {
            id: "m-d-1",
            text: "Todo correcto, gracias por la silla.",
            variant: "received",
            time: formatTime(new Date(tsMinutesAgo(9 * 60))),
            createdAt: tsMinutesAgo(9 * 60),
        },
        {
            id: "m-d-2",
            text: "Silla entregada, todo perfecto. Gracias!",
            variant: "received",
            time: formatTime(new Date(tsMinutesAgo(8 * 60 + 40))),
            createdAt: tsMinutesAgo(8 * 60 + 40),
        },
    ],
    "conv-e-low-attendance": [
        {
            id: "m-e-0",
            text: "Me interesa el monitor, podemos cerrar hoy?",
            variant: "received",
            time: formatTime(new Date(tsMinutesAgo(2 * 24 * 60 + 20))),
            createdAt: tsMinutesAgo(2 * 24 * 60 + 20),
        },
        {
            id: "m-e-1",
            text: "Veo que tu tasa de asistencia es baja y prefiero venderselo a otra persona, lo siento.",
            variant: "sent",
            time: formatTime(new Date(tsMinutesAgo(2 * 24 * 60))),
            createdAt: tsMinutesAgo(2 * 24 * 60),
            deliveryState: "sent",
        },
    ],
}
const safeMeetingPoints: SafeMeetingPoint[] = [
    {
        id: "station",
        name: "Estación de Sants",
        hint: "Zona principal con transito y camaras.",
        address: "Placa dels Paisos Catalans, Barcelona",
        distanceMeters: 320,
        completedSales: 241,
        lat: 41.37906,
        lng: 2.14006,
    },
    {
        id: "mall",
        name: "Centro comercial Arenas",
        hint: "Entrada principal, punto de informacion.",
        address: "Gran Via de les Corts Catalanes, 373, Barcelona",
        distanceMeters: 640,
        completedSales: 198,
        lat: 41.37617,
        lng: 2.14918,
    },
    {
        id: "police",
        name: "Comisaria Mossos - Les Corts",
        hint: "Punto seguro recomendado por proximidad.",
        address: "Travessera de les Corts, 319, Barcelona",
        distanceMeters: 1180,
        completedSales: 173,
        lat: 41.38762,
        lng: 2.13441,
    },
    {
        id: "library",
        name: "Biblioteca Joan Miro",
        hint: "Acceso principal bien iluminado.",
        address: "Carrer de Vilamari, 61, Barcelona",
        distanceMeters: 1450,
        completedSales: 109,
        lat: 41.37682,
        lng: 2.15281,
    },
    {
        id: "market",
        name: "Mercat de Sants",
        hint: "Entrada lateral con presencia continua.",
        address: "Carrer de Sant Jordi, 6, Barcelona",
        distanceMeters: 1720,
        completedSales: 147,
        lat: 41.37559,
        lng: 2.13363,
    },
    {
        id: "civic-center",
        name: "Centre Civic Cotxeres de Sants",
        hint: "Vestibulo vigilado en horario comercial.",
        address: "Carrer de Sants, 79, Barcelona",
        distanceMeters: 2040,
        completedSales: 126,
        lat: 41.37507,
        lng: 2.13699,
    },
]

const mapUserPosition: MapPoint = {
    lat: 41.3782,
    lng: 2.1459,
}

function toSafeOption(point: SafeMeetingPoint): ProposalSelectableOption {
    return {
        id: `safe:${point.id}`,
        kind: "safe",
        label: point.name,
        address: point.address,
        lat: point.lat,
        lng: point.lng,
        distanceMeters: point.distanceMeters,
        completedSales: point.completedSales,
        safePointId: point.id,
    }
}

function toCustomOption(lat: number, lng: number, address: string): ProposalSelectableOption {
    const normalizedLabel = formatStreetAndNumberLabel(address)
    return {
        id: `custom:${lat.toFixed(5)}:${lng.toFixed(5)}:${Date.now()}`,
        kind: "custom",
        label: normalizedLabel,
        address,
        lat,
        lng,
        distanceMeters: distanceBetweenPointsMeters(mapUserPosition, { lat, lng }),
    }
}

function buildProposalDraftState(meetup: MeetupMachine | undefined): ProposalDraftState {
    const firstSafeOption = toSafeOption(safeMeetingPoints[0])
    const secondSafeOption = toSafeOption(safeMeetingPoints[1])

    if (!meetup) {
        return {
            step: 1,
            mapPickerOpen: false,
            mapPickerPointId: "",
            mapSearchValue: "",
            mapCenter: { lat: safeMeetingPoints[0].lat, lng: safeMeetingPoints[0].lng },
            options: [firstSafeOption, secondSafeOption],
            selectedOptionId: firstSafeOption.id,
            customPoint: null,
            customLocationLabel: "",
            scheduledAt: "",
            finalPrice: "",
            paymentMethod: "",
            error: "",
        }
    }

    const matchingPoint = safeMeetingPoints.find((point) => point.name === meetup.proposedLocation)
    const hasCustomLocation = Boolean(meetup.proposedLocation && !matchingPoint)

    if (matchingPoint) {
        const selectedOption = toSafeOption(matchingPoint)
        const fallbackPoint =
            safeMeetingPoints.find((point) => point.id !== matchingPoint.id) ?? safeMeetingPoints[0]
        const fallbackOption = toSafeOption(fallbackPoint)

        return {
            step: 1,
            mapPickerOpen: false,
            mapPickerPointId: matchingPoint.id,
            mapSearchValue: "",
            mapCenter: { lat: matchingPoint.lat, lng: matchingPoint.lng },
            options: [selectedOption, fallbackOption],
            selectedOptionId: selectedOption.id,
            customPoint: null,
            customLocationLabel: "",
            scheduledAt: resolveInitialProposalDateTimeValue(meetup),
            finalPrice: meetup.finalPrice !== undefined ? String(meetup.finalPrice) : "",
            paymentMethod: meetup.proposedPaymentMethod ?? "",
            error: "",
        }
    }

    if (hasCustomLocation) {
        const customLat = meetup.proposedLocationLat ?? mapUserPosition.lat
        const customLng = meetup.proposedLocationLng ?? mapUserPosition.lng
        const customAddress =
            meetup.proposedLocation ??
            customLocationLabelFromPoint(customLat, customLng)
        const customOption = toCustomOption(customLat, customLng, customAddress)

        return {
            step: 1,
            mapPickerOpen: false,
            mapPickerPointId: "custom",
            mapSearchValue: "",
            mapCenter: { lat: customLat, lng: customLng },
            options: [customOption, firstSafeOption],
            selectedOptionId: customOption.id,
            customPoint: { lat: customLat, lng: customLng },
            customLocationLabel: customAddress,
            scheduledAt: resolveInitialProposalDateTimeValue(meetup),
            finalPrice: meetup.finalPrice !== undefined ? String(meetup.finalPrice) : "",
            paymentMethod: meetup.proposedPaymentMethod ?? "",
            error: "",
        }
    }

    return {
        step: 1,
        mapPickerOpen: false,
        mapPickerPointId: "",
        mapSearchValue: "",
        mapCenter: { lat: safeMeetingPoints[0].lat, lng: safeMeetingPoints[0].lng },
        options: [firstSafeOption, secondSafeOption],
        selectedOptionId: firstSafeOption.id,
        customPoint: null,
        customLocationLabel: "",
        scheduledAt: resolveInitialProposalDateTimeValue(meetup),
        finalPrice: meetup.finalPrice !== undefined ? String(meetup.finalPrice) : "",
        paymentMethod: meetup.proposedPaymentMethod ?? "",
        error: "",
    }
}

function formatTime(date: Date): string {
    return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
    })
}

function formatConversationDate(createdAt: number): string {
    const date = new Date(createdAt)
    const now = new Date()
    const delta = now.getTime() - createdAt
    if (delta < DAY_MS && now.getDate() === date.getDate()) {
        return formatTime(date)
    }
    if (delta < 2 * DAY_MS) {
        return "Ayer"
    }
    return date.toLocaleDateString("es-ES", { day: "2-digit", month: "short" })
}

function isReservedStatusLabel(statusLabel?: string): boolean {
    return statusLabel?.trim().toLowerCase().includes("reservad") ?? false
}

function isSoldStatusLabel(statusLabel?: string): boolean {
    return statusLabel?.trim().toLowerCase().includes("vendid") ?? false
}

function isSameCalendarDay(leftTimestamp: number, rightTimestamp: number): boolean {
    const left = new Date(leftTimestamp)
    const right = new Date(rightTimestamp)
    return (
        left.getFullYear() === right.getFullYear() &&
        left.getMonth() === right.getMonth() &&
        left.getDate() === right.getDate()
    )
}

function formatTimelineDayLabel(createdAt: number): string {
    const date = new Date(createdAt)
    const now = new Date()
    const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
    const startOfNow = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    const dayDelta = Math.floor((startOfNow - startOfDate) / DAY_MS)

    if (dayDelta === 0) {
        return "Hoy"
    }
    if (dayDelta === 1) {
        return "Ayer"
    }

    return date.toLocaleDateString("es-ES", {
        weekday: "long",
        day: "numeric",
        month: "short",
    })
}

function resolveMeetupTimelineTimestamp(meetup: MeetupMachine): number | null {
    if (meetup.status === null) {
        return null
    }
    const timestamp =
        meetup.proposedAt ??
        meetup.confirmedAt ??
        meetup.arrivedAt ??
        meetup.completedAt ??
        meetup.cancelledAt ??
        meetup.scheduledAt
    return timestamp.getTime()
}

function resolveMeetupTimelinePreview(meetup: MeetupMachine): string {
    switch (meetup.status) {
        case "PROPOSED":
            return "Propuesta de quedada enviada."
        case "COUNTER_PROPOSED":
            return "Se enviaron cambios en la propuesta de quedada."
        case "CONFIRMED":
            return "Quedada confirmada."
        case "ARRIVED":
            return "Una de las partes ya ha marcado llegada."
        case "COMPLETED":
            return "Quedada cerrada. Venta completada."
        case "CANCELLED":
            if (meetup.cancelReason === "COUNTER_REPLACED") {
                return "Propuesta anterior cancelada por contraoferta."
            }
            if (meetup.cancelReason === "NO_SHOW_BUYER") {
                return "Quedada cancelada por no-show del comprador."
            }
            if (meetup.cancelReason === "NO_SHOW_FINAL_CONTRADICTION") {
                return "Quedada cancelada tras contradiccion de presencia."
            }
            if (meetup.cancelReason === "PROPOSAL_EXPIRED") {
                return "La propuesta caduco sin respuesta."
            }
            if (meetup.cancelReason === "MEETUP_EXPIRED") {
                return "La quedada caduco al cerrarse la ventana de llegada."
            }
            return "La quedada fue cancelada."
        default:
            return "Sin propuesta de quedada."
    }
}

function resolveCurrentMeetup(meetupHistory: MeetupMachine[] | undefined): MeetupMachine | undefined {
    if (!meetupHistory || meetupHistory.length === 0) {
        return undefined
    }
    return meetupHistory[meetupHistory.length - 1]
}

function buildConversationTimelineEntries(
    messages: Message[],
    meetupHistory: MeetupMachine[] | undefined
): ConversationTimelineEntry[] {
    const entries: ConversationTimelineEntry[] = messages.map((message) => ({
        id: `message:${message.id}`,
        type: "message",
        createdAt: message.createdAt,
        message,
    }))

    for (const meetup of meetupHistory ?? []) {
        const meetupTimestamp = resolveMeetupTimelineTimestamp(meetup)
        if (meetupTimestamp !== null) {
            entries.push({
                id: `meetup:${meetup.id}`,
                type: "meetup",
                createdAt: meetupTimestamp,
                meetup,
            })
        }
    }

    return entries.sort((a, b) => a.createdAt - b.createdAt)
}

function resolveConversationSummary(
    messages: Message[],
    meetupHistory: MeetupMachine[] | undefined
): Pick<Conversation, "messageDate" | "messagePreview" | "lastMessageDeliveryState"> {
    const timeline = buildConversationTimelineEntries(messages, meetupHistory)
    const latestEntry = timeline[timeline.length - 1]

    if (!latestEntry) {
        return {
            messageDate: "",
            messagePreview: "",
            lastMessageDeliveryState: undefined,
        }
    }

    if (latestEntry.type === "meetup") {
        return {
            messageDate: formatConversationDate(latestEntry.createdAt),
            messagePreview: resolveMeetupTimelinePreview(latestEntry.meetup),
            lastMessageDeliveryState: undefined,
        }
    }

    return {
        messageDate: formatConversationDate(latestEntry.createdAt),
        messagePreview: latestEntry.message.text,
        lastMessageDeliveryState:
            latestEntry.message.variant === "sent"
                ? (latestEntry.message.deliveryState ?? "sent")
                : undefined,
    }
}

function resolveConversationUnreadCount(
    unreadCount: number | undefined,
    messages: Message[],
    meetupHistory: MeetupMachine[] | undefined
): number {
    const timeline = buildConversationTimelineEntries(messages, meetupHistory)
    const latestEntry = timeline[timeline.length - 1]
    if (!latestEntry || latestEntry.type !== "message" || latestEntry.message.variant !== "received") {
        return 0
    }
    return unreadCount ?? 0
}

function resolveConversationCommercialStatus(
    conversation: Conversation,
    meetup: MeetupMachine | undefined
): Pick<Conversation, "leadingIndicator" | "listingStatusLabel"> {
    const isSold =
        conversation.leadingIndicator === "deal" ||
        isSoldStatusLabel(conversation.listingStatusLabel)
    if (isSold) {
        return {
            leadingIndicator: "deal",
            listingStatusLabel: "Vendido",
        }
    }

    const hasReservedState =
        conversation.leadingIndicator === "bookmark" ||
        isReservedStatusLabel(conversation.listingStatusLabel)
    const shouldForceReserved = meetup?.status === "CONFIRMED" || meetup?.status === "ARRIVED"
    const shouldForceSold = meetup?.status === "COMPLETED"
    const shouldClearReserved = meetup?.status === "CANCELLED"

    if (shouldForceSold) {
        return {
            leadingIndicator: "deal",
            listingStatusLabel: "Vendido",
        }
    }

    if (shouldForceReserved) {
        return {
            leadingIndicator: "bookmark",
            listingStatusLabel: "Reservado",
        }
    }

    if (shouldClearReserved && hasReservedState) {
        return {
            leadingIndicator: undefined,
            listingStatusLabel: undefined,
        }
    }

    return {
        leadingIndicator: conversation.leadingIndicator,
        listingStatusLabel: conversation.listingStatusLabel,
    }
}

function shouldShowPendingSaleInboxAlert(meetup: MeetupMachine | undefined, now: Date): boolean {
    if (!meetup) {
        return false
    }
    if (meetup.status !== "CONFIRMED" && meetup.status !== "ARRIVED") {
        return false
    }
    const remainingMs = meetup.scheduledAt.getTime() - now.getTime()
    return remainingMs >= 0 && remainingMs <= PENDING_SALE_ALERT_WINDOW_MS
}

function buildInitialMeetupState(): Record<string, MeetupMachine[]> {
    const state: Record<string, MeetupMachine[]> = {}
    const now = new Date()

    for (const conversation of initialConversations) {
        if (!conversation.meetupContext) {
            continue
        }

        const baseMeetup = createMeetupMachine({
            scheduledAt: createQuarterHourDateWithOffset(now, 30),
            chatContext: conversation.meetupContext,
        })

        if (conversation.id === "conv-a-arrival") {
            const proposedDraft: MeetupMachine = {
                ...baseMeetup,
                scheduledAt: createQuarterHourDateWithOffset(now, 20),
                proposedLocation: "Estación de Sants - Acceso principal",
                proposedLocationLat: 41.37906,
                proposedLocationLng: 2.14006,
                finalPrice: 240,
                proposedPaymentMethod: "WALLET",
            }
            const proposed = transitionMeetup(proposedDraft, {
                type: "PROPOSE",
                actorRole: "SELLER",
                occurredAt: new Date(now.getTime() - 50 * 60 * 1000),
            })
            if (!proposed.ok) {
                state[conversation.id] = [proposedDraft]
                continue
            }
            const confirmed = transitionMeetup(proposed.meetup, {
                type: "ACCEPT",
                actorRole: "BUYER",
                occurredAt: new Date(now.getTime() - 45 * 60 * 1000),
                buyerWalletAvailableEur: 10_000,
            })
            state[conversation.id] = [confirmed.ok ? confirmed.meetup : proposed.meetup]
            continue
        }

        if (conversation.id === "conv-c-buyer-incoming") {
            const incomingProposal: MeetupMachine = {
                ...baseMeetup,
                scheduledAt: createQuarterHourDateWithOffset(now, 90),
                proposedLocation: "Estación de Sants - Acceso principal",
                proposedLocationLat: 41.37906,
                proposedLocationLng: 2.14006,
                finalPrice: 640,
                proposedPaymentMethod: "WALLET",
            }
            const proposedResult = transitionMeetup(incomingProposal, {
                type: "PROPOSE",
                actorRole: "SELLER",
                occurredAt: new Date(now.getTime() - 4 * 60 * 1000),
            })
            state[conversation.id] = [proposedResult.ok ? proposedResult.meetup : incomingProposal]
            continue
        }

        if (conversation.id === "conv-d-sold-closed") {
            const closedDraft: MeetupMachine = {
                ...baseMeetup,
                scheduledAt: createQuarterHourDateWithOffset(now, -9 * 60),
                proposedLocation: "Centro comercial Arenas",
                proposedLocationLat: 41.37617,
                proposedLocationLng: 2.14918,
                finalPrice: 310,
                proposedPaymentMethod: "CASH",
            }
            const proposed = transitionMeetup(closedDraft, {
                type: "PROPOSE",
                actorRole: "SELLER",
                occurredAt: new Date(now.getTime() - 11 * 60 * 60 * 1000),
            })
            if (!proposed.ok) {
                state[conversation.id] = [closedDraft]
                continue
            }
            const confirmed = transitionMeetup(proposed.meetup, {
                type: "ACCEPT",
                actorRole: "BUYER",
                occurredAt: new Date(now.getTime() - 10 * 60 * 60 * 1000),
            })
            if (!confirmed.ok) {
                state[conversation.id] = [proposed.meetup]
                continue
            }
            const arrived = transitionMeetup(confirmed.meetup, {
                type: "MARK_ARRIVED",
                actorRole: "SELLER",
                occurredAt: new Date(now.getTime() - 9 * 60 * 60 * 1000 - 10 * 60 * 1000),
                distanceMeters: 25,
                withinSafeRadius: true,
            })
            if (!arrived.ok) {
                state[conversation.id] = [confirmed.meetup]
                continue
            }
            const completed = transitionMeetup(arrived.meetup, {
                type: "COMPLETE",
                actorRole: "SELLER",
                occurredAt: new Date(now.getTime() - 9 * 60 * 60 * 1000 + 5 * 60 * 1000),
            })
            state[conversation.id] = [completed.ok ? completed.meetup : arrived.meetup]
            continue
        }

        state[conversation.id] = [baseMeetup]
    }

    return state
}

function toLocalTimeValue(date: Date): string {
    const hours = String(date.getHours()).padStart(2, "0")
    const minutes = String(date.getMinutes()).padStart(2, "0")

    return `${hours}:${minutes}`
}

function parseLocalDateTimeValue(value: string): Date | null {
    if (value.trim().length === 0) {
        return null
    }

    const parsedDate = new Date(value)
    if (Number.isNaN(parsedDate.getTime())) {
        return null
    }

    return parsedDate
}

function formatDistance(distanceMeters: number): string {
    if (distanceMeters < 1000) {
        return `${distanceMeters} m`
    }

    return `${(distanceMeters / 1000).toFixed(1).replace(".", ",")} km`
}

function toRadians(value: number): number {
    return (value * Math.PI) / 180
}

function distanceBetweenPointsMeters(from: MapPoint, to: MapPoint): number {
    const earthRadius = 6371000
    const deltaLat = toRadians(to.lat - from.lat)
    const deltaLng = toRadians(to.lng - from.lng)
    const fromLat = toRadians(from.lat)
    const toLat = toRadians(to.lat)

    const a =
        Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
        Math.cos(fromLat) * Math.cos(toLat) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2)

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return Math.round(earthRadius * c)
}

function customLocationLabelFromPoint(lat: number, lng: number): string {
    void lat
    void lng
    return "Calle seleccionada"
}

function formatStreetAndNumberLabel(label: string): string {
    const trimmed = label.trim()
    if (!trimmed) {
        return "Calle seleccionada"
    }

    const segments = trimmed
        .split(",")
        .map((segment) => segment.trim())
        .filter((segment) => segment.length > 0)

    if (segments.length === 0) {
        return "Calle seleccionada"
    }

    const hasLetters = (value: string) => /[A-Za-zÀ-ÿ]/.test(value)
    const hasDigits = (value: string) => /\d/.test(value)
    const isOnlyDigits = (value: string) => /^\d+$/.test(value)

    const first = segments[0]
    const second = segments[1]

    if (isOnlyDigits(first) && second && hasLetters(second)) {
        return `${second} ${first}`
    }

    if (hasLetters(first) && second && isOnlyDigits(second)) {
        return `${first} ${second}`
    }

    const streetSegment = segments.find((segment) => hasLetters(segment) && hasDigits(segment))
    if (streetSegment) {
        return streetSegment
    }

    const firstTextSegment = segments.find((segment) => hasLetters(segment))
    if (firstTextSegment) {
        return firstTextSegment
    }

    return "Calle seleccionada"
}

function shortenLocationLabel(label: string): string {
    const trimmed = formatStreetAndNumberLabel(label)
    if (!trimmed) {
        return "Calle seleccionada"
    }
    const [firstSegment = trimmed] = trimmed.split(",")
    const candidate = firstSegment.trim() || trimmed
    if (candidate.length <= 42) {
        return candidate
    }
    return `${candidate.slice(0, 39).trimEnd()}...`
}

function paymentMethodLabel(method: MeetupPaymentMethod): string {
    switch (method) {
        case "CASH":
            return "Efectivo"
        case "WALLET":
            return "Wallapop Wallet"
        default:
            return method
    }
}

function ProposalSelectionIndicator({ selected }: { selected: boolean }) {
    return (
        <span
            className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-[background-color,border-color,transform] duration-150 ease-out motion-reduce:transition-none ${selected
                ? "border-[color:var(--text-primary)] bg-[color:var(--text-primary)]"
                : "border-[color:var(--text-secondary)] bg-[color:var(--bg-base)]"
                }`}
            aria-hidden
        >
            <span
                className={`h-2.5 w-2.5 rounded-full bg-[color:var(--bg-base)] transition-transform duration-150 ease-out motion-reduce:transition-none ${selected ? "scale-100" : "scale-0"
                    }`}
            />
        </span>
    )
}

const safePointMarkerIcon = L.divIcon({
    className: "wm-map-marker-icon",
    html: `
        <span class="wm-map-marker-shell">
            <span class="wm-map-marker-bubble wm-map-marker-bubble-md wm-map-marker-primary">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"></path>
                </svg>
            </span>
            <svg viewBox="0 0 14 8" width="14" height="8" class="wm-map-marker-tail" aria-hidden="true">
                <path d="M1 0H13L7 7Z" class="wm-map-marker-tail-fill"></path>
                <path d="M1 0L7 7L13 0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
            </svg>
        </span>
    `,
    iconSize: [40, 37],
    iconAnchor: [20, 36],
})

const selectedSafePointMarkerIcon = L.divIcon({
    className: "wm-map-marker-icon",
    html: `
        <span class="wm-map-marker-shell">
            <span class="wm-map-marker-bubble wm-map-marker-bubble-md wm-map-marker-pressed">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"></path>
                </svg>
            </span>
            <svg viewBox="0 0 14 8" width="14" height="8" class="wm-map-marker-tail" aria-hidden="true">
                <path d="M1 0H13L7 7Z" class="wm-map-marker-tail-fill"></path>
                <path d="M1 0L7 7L13 0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
            </svg>
        </span>
    `,
    iconSize: [40, 37],
    iconAnchor: [20, 36],
})

const userPositionIcon = L.divIcon({
    className: "wm-map-marker-icon",
    html: `
        <span class="wm-map-marker-user-position"></span>
    `,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
})

const customPointIcon = L.divIcon({
    className: "wm-map-marker-icon",
    html: `
        <span class="wm-map-marker-shell">
            <span class="wm-map-marker-bubble wm-map-marker-bubble-md wm-map-marker-pressed">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="m11 17 2 2a1 1 0 1 0 3-3"></path>
                    <path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4"></path>
                    <path d="m21 3 1 11h-2"></path>
                    <path d="M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3"></path>
                    <path d="M3 4h8"></path>
                </svg>
            </span>
            <svg viewBox="0 0 14 8" width="14" height="8" class="wm-map-marker-tail" aria-hidden="true">
                <path d="M1 0H13L7 7Z" class="wm-map-marker-tail-fill"></path>
                <path d="M1 0L7 7L13 0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
            </svg>
        </span>
    `,
    iconSize: [40, 37],
    iconAnchor: [20, 36],
})

function ProposalMapCenterController({ center }: { center: MapPoint }) {
    const map = useMap()

    React.useEffect(() => {
        map.flyTo([center.lat, center.lng], map.getZoom(), { duration: 0.45 })
    }, [center, map])

    return null
}

function ProposalMapClickHandler({
    onMapClick,
}: {
    onMapClick: (lat: number, lng: number) => void
}) {
    useMapEvents({
        click: (event) => {
            onMapClick(event.latlng.lat, event.latlng.lng)
        },
    })

    return null
}

function MeetupMapPreviewModal({
    center,
    onClose,
}: {
    center: MapPoint
    onClose: () => void
}) {
    return (
        <div className="fixed inset-0 z-[60] bg-[color:var(--text-primary)]/55 p-0 md:p-6">
            <section className="flex h-full w-full flex-col bg-[color:var(--bg-base)] md:mx-auto md:h-[88vh] md:max-w-[var(--wm-size-760)] md:rounded-[var(--wm-size-20)]">
                <header className="flex items-center justify-between border-b border-[color:var(--border-divider)] px-4 py-3">
                    <p className="font-brand-strong text-[length:var(--wm-size-18)] text-[color:var(--text-primary)]">Mapa de la quedada</p>
                    <IconButton
                        label="Cerrar mapa"
                        icon={<WallapopIcon name="cross" size="small" />}
                        variant="menu_close"
                        onClick={onClose}
                        className="h-9 w-9 rounded-full bg-[color:var(--bg-surface)] p-0 text-[color:var(--text-primary)]"
                    />
                </header>
                <div className="min-h-0 flex-1">
                    <MapContainer
                        center={[center.lat, center.lng]}
                        zoom={15}
                        className="h-full w-full"
                        attributionControl={false}
                        zoomControl={false}
                        scrollWheelZoom={false}
                        dragging={true}
                        doubleClickZoom={false}
                        touchZoom={true}
                        keyboard={false}
                    >
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        <Marker position={[center.lat, center.lng]} icon={customPointIcon} />
                    </MapContainer>
                </div>
            </section>
        </div>
    )
}

function SafeShieldGlyph({ className = "" }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            aria-hidden
        >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
        </svg>
    )
}

type MeetupProposalOverlayProps = {
    conversation: Conversation
    step: ProposalStep
    errorMessage: string
    canAccessStepTwo: boolean
    canAccessStepThree: boolean
    mapPickerOpen: boolean
    mapCenter: MapPoint
    mapPickerPointId: string
    allSafePoints: SafeMeetingPoint[]
    selectableOptions: ProposalSelectableOption[]
    selectedOptionId: string
    customPoint: MapPoint | null
    customLocationLabel: string
    customDistanceMeters: number | null
    mapSearchValue: string
    dateTimeValue: string
    finalPriceValue: string
    paymentMethod: MeetupPaymentMethod | ""
    onDateTimeChange: (nextValue: string) => void
    onSelectPoint: (optionId: string) => void
    onFinalPriceChange: (nextValue: string) => void
    onPaymentMethodChange: (nextValue: MeetupPaymentMethod) => void
    onOpenMapPicker: () => void
    onCloseMapPicker: () => void
    onMapSearchChange: (nextValue: string) => void
    onMapClick: (lat: number, lng: number) => void
    onSelectMapPickerPoint: (pointId: string) => void
    onConfirmMapPickerPoint: () => void
    onStepChange: (nextStep: ProposalStep) => void
    onCancel: () => void
    onBack: () => void
    onNext: () => void
    onSubmit: () => void
}

function MeetupProposalOverlay({
    conversation,
    step,
    errorMessage,
    canAccessStepTwo,
    canAccessStepThree,
    mapPickerOpen,
    mapCenter,
    mapPickerPointId,
    allSafePoints,
    selectableOptions,
    selectedOptionId,
    customPoint,
    customLocationLabel,
    customDistanceMeters,
    mapSearchValue,
    dateTimeValue,
    finalPriceValue,
    paymentMethod,
    onDateTimeChange,
    onSelectPoint,
    onFinalPriceChange,
    onPaymentMethodChange,
    onOpenMapPicker,
    onCloseMapPicker,
    onMapSearchChange,
    onMapClick,
    onSelectMapPickerPoint,
    onConfirmMapPickerPoint,
    onStepChange,
    onCancel,
    onBack,
    onNext,
    onSubmit,
}: MeetupProposalOverlayProps) {
    const stepLabels: Array<{ id: ProposalStep; label: string }> = [
        { id: 1, label: "Dia y hora" },
        { id: 2, label: "Punto de encuentro" },
        { id: 3, label: "Preferencia de pago" },
    ]
    const mapSelectedPoint = allSafePoints.find((point) => point.id === mapPickerPointId)
    const isCustomPointSelected = mapPickerPointId === "custom" && customPoint
    const visibleOptions = selectableOptions.slice(0, 2)
    const initialNow = React.useMemo(() => new Date(), [])
    const minDateValue = toLocalDateValue(initialNow)
    const minTimeValue = toLocalTimeValue(initialNow)
    const [selectedDateValue, setSelectedDateValue] = React.useState(() => {
        const [dateValue] = dateTimeValue.split("T")
        return dateValue ?? ""
    })
    const [selectedTimeValue, setSelectedTimeValue] = React.useState(() => {
        const [, timeValue = ""] = dateTimeValue.split("T")
        return timeValue.slice(0, 5)
    })
    const [visibleCalendarMonth, setVisibleCalendarMonth] = React.useState(() => {
        if (selectedDateValue) {
            const [year, month] = selectedDateValue.split("-")
            return new Date(Number(year), Number(month) - 1, 1)
        }
        return new Date(initialNow.getFullYear(), initialNow.getMonth(), 1)
    })

    React.useEffect(() => {
        const [dateValue = ""] = dateTimeValue.split("T")
        const [, timeValue = ""] = dateTimeValue.split("T")
        setSelectedDateValue(dateValue)
        setSelectedTimeValue(timeValue.slice(0, 5))
        if (dateValue) {
            const [year, month] = dateValue.split("-")
            setVisibleCalendarMonth(new Date(Number(year), Number(month) - 1, 1))
        } else {
            setVisibleCalendarMonth(new Date(initialNow.getFullYear(), initialNow.getMonth(), 1))
        }
    }, [dateTimeValue, initialNow])

    const timeOptions = React.useMemo(() => {
        const options: string[] = []
        for (let hour = 0; hour <= 23; hour += 1) {
            for (let minute = 0; minute < 60; minute += 15) {
                options.push(`${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`)
            }
        }
        return options
    }, [])
    const updateDateTimeValue = (nextDateValue: string, nextTimeValue: string) => {
        if (!nextDateValue || !nextTimeValue) {
            onDateTimeChange("")
            return
        }
        onDateTimeChange(`${nextDateValue}T${nextTimeValue}`)
    }

    const handleDateSelection = (nextDateValue: string) => {
        let nextTimeValue = selectedTimeValue
        if (nextDateValue === minDateValue && selectedTimeValue && selectedTimeValue < minTimeValue) {
            nextTimeValue = ""
            setSelectedTimeValue("")
        }
        setSelectedDateValue(nextDateValue)
        updateDateTimeValue(nextDateValue, nextTimeValue)
    }

    const handleTimeSelection = (nextTimeValue: string) => {
        setSelectedTimeValue(nextTimeValue)
        updateDateTimeValue(selectedDateValue, nextTimeValue)
    }
    const hasMissingFieldsError = errorMessage === "Faltan campos por rellenar"
    const isStepOneDateMissing = step === 1 && hasMissingFieldsError && !selectedDateValue
    const isStepOneTimeMissing = step === 1 && hasMissingFieldsError && !selectedTimeValue
    const hasFinalPriceValue = finalPriceValue.trim().length > 0
    const parsedFinalPriceValue = parseFinalPrice(finalPriceValue)
    const isFinalPriceAboveMaximum =
        parsedFinalPriceValue !== null && parsedFinalPriceValue > MAX_FINAL_PRICE_EUR
    const isFinalPriceValueInvalid =
        hasFinalPriceValue &&
        (parsedFinalPriceValue === null || parsedFinalPriceValue < 0 || isFinalPriceAboveMaximum)
    const isStepThreePriceMissing =
        step === 3 && hasMissingFieldsError && (!hasFinalPriceValue || isFinalPriceValueInvalid)
    const isStepThreePaymentMissing =
        step === 3 && hasMissingFieldsError && !paymentMethod
    const shouldShowDac7Alert =
        parsedFinalPriceValue !== null && parsedFinalPriceValue > DAC7_ALERT_THRESHOLD_EUR
    const priceInputError =
        isStepThreePriceMissing
            ? "Introduce un importe de 0 € o superior."
            : isFinalPriceAboveMaximum
                ? `El importe maximo permitido es ${MAX_FINAL_PRICE_EUR} €.`
                : undefined
    const priceInputAlertText =
        "Has excedido el importe maximo anual y Wallapop debera informar a Hacienda bajo la normativa DAC7."

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-[color:var(--text-primary)]/50 p-0 md:items-center md:p-6">
            <section className="flex h-[94vh] w-full max-h-[94vh] flex-col rounded-t-[var(--wm-size-22)] bg-[color:var(--bg-base)] shadow-[0_16px_48px_var(--wm-shadow-marker)] md:h-[88vh] md:max-h-[88vh] md:max-w-[var(--wm-size-760)] md:rounded-[var(--wm-size-20)]">
                {mapPickerOpen ? (
                    <div className="flex min-h-0 flex-1 flex-col">
                        <div className="border-b border-[color:var(--border-divider)] px-4 py-3">
                            <div className="flex items-center justify-between">
                                <IconButton
                                    label="Volver al paso anterior"
                                    icon={<WallapopIcon name="arrow_left" size={20} />}
                                    variant="menu_close"
                                    onClick={onCloseMapPicker}
                                    className="h-10 w-10 rounded-full bg-transparent p-0 text-[color:var(--text-primary)]"
                                />
                                <h2 className="font-brand-strong text-[length:var(--wm-size-22)] text-[color:var(--text-primary)] md:text-[length:var(--wm-size-24)]">Elige un punto</h2>
                                <span className="h-10 w-10" aria-hidden />
                            </div>
                            <LocationSearchInput
                                className="mt-3"
                                value={mapSearchValue}
                                onValueChange={onMapSearchChange}
                                placeholder="¿Donde?"
                            />
                        </div>

                        <div className="relative min-h-0 flex-1 overflow-hidden">
                            <MapContainer
                                center={[mapCenter.lat, mapCenter.lng]}
                                zoom={14}
                                scrollWheelZoom
                                zoomControl={false}
                                className="z-0 h-full w-full"
                            >
                                <TileLayer
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                />
                                <ProposalMapCenterController center={mapCenter} />
                                <ProposalMapClickHandler onMapClick={onMapClick} />
                                <Marker position={[mapUserPosition.lat, mapUserPosition.lng]} icon={userPositionIcon} />
                                {allSafePoints.map((point) => (
                                    <Marker
                                        key={point.id}
                                        position={[point.lat, point.lng]}
                                        icon={mapPickerPointId === point.id ? selectedSafePointMarkerIcon : safePointMarkerIcon}
                                        eventHandlers={{
                                            click: (event) => {
                                                event.originalEvent.stopPropagation()
                                                onSelectMapPickerPoint(point.id)
                                            },
                                        }}
                                    />
                                ))}
                                {customPoint ? (
                                    <Marker
                                        position={[customPoint.lat, customPoint.lng]}
                                        icon={customPointIcon}
                                        eventHandlers={{
                                            click: (event) => {
                                                event.originalEvent.stopPropagation()
                                                onSelectMapPickerPoint("custom")
                                            },
                                        }}
                                    />
                                ) : null}
                            </MapContainer>

                            {mapSelectedPoint || isCustomPointSelected ? (
                                <div className="absolute inset-x-3 bottom-3 z-1200 rounded-[var(--wm-size-16)] bg-[color:var(--bg-base)] p-4 shadow-[var(--wm-shadow-modal)]">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                {mapSelectedPoint ? (
                                                    <span className="inline-flex text-[color:var(--text-primary)]">
                                                        <SafeShieldGlyph className="h-4 w-4" />
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex text-[color:var(--text-primary)]">
                                                        <MapPin size={14} />
                                                    </span>
                                                )}
                                                <p className="font-brand-strong text-[length:var(--wm-size-20)] text-[color:var(--text-primary)] md:text-[length:var(--wm-size-22)]">
                                                    {mapSelectedPoint
                                                        ? mapSelectedPoint.name
                                                        : shortenLocationLabel(customLocationLabel || "Calle seleccionada")}
                                                </p>
                                            </div>
                                            <p className="mt-1 font-brand-text text-[length:var(--wm-size-14)] text-[color:var(--text-tertiary)]">
                                                {mapSelectedPoint ? mapSelectedPoint.address : (customLocationLabel || "Calle seleccionada")}
                                            </p>
                                        </div>
                                        <div className="shrink-0">
                                            <p className="whitespace-nowrap font-brand-strong text-[length:var(--wm-size-15)] text-[color:var(--action-primary-pressed)]">
                                                <span className="inline-flex w-fit rounded-full bg-[color:var(--bg-accent-subtle)] px-3 py-1">
                                                    {mapSelectedPoint
                                                        ? formatDistance(mapSelectedPoint.distanceMeters)
                                                        : formatDistance(customDistanceMeters ?? 0)}
                                                </span>
                                            </p>
                                        </div>
                                    </div>
                                    {mapSelectedPoint ? (
                                        <NoticeBanner tone="success" className="mt-2 inline-flex w-fit">
                                            <span className="font-brand-strong">
                                                {mapSelectedPoint.completedSales} ventas completadas
                                            </span>
                                            <span className="ml-1">en este punto seguro.</span>
                                        </NoticeBanner>
                                    ) : null}
                                    <Button
                                        type="button"
                                        variant="primary"
                                        className="mt-4 h-auto w-full rounded-full py-3 text-[length:var(--wm-size-18)] text-[color:var(--text-primary)]"
                                        onClick={onConfirmMapPickerPoint}
                                    >
                                        Seleccionar
                                    </Button>
                                </div>
                            ) : null}
                        </div>
                    </div>
                ) : (
                    <>
                        <MeetupProposalHeader
                            currentStep={step}
                            totalSteps={3}
                            steps={stepLabels.map((stepItem) => ({
                                id: stepItem.id,
                                label: stepItem.label,
                                disabled:
                                    (stepItem.id === 2 && !canAccessStepTwo) ||
                                    (stepItem.id === 3 && !canAccessStepThree),
                            }))}
                            onStepChange={(stepId) => onStepChange(stepId as ProposalStep)}
                            onClose={onCancel}
                        />
                        {errorMessage ? (
                            <p className="mx-4 mt-3 rounded-[var(--wm-size-8)] bg-[color:var(--bg-error-subtle)] px-3 py-2 font-brand-text text-[length:var(--wm-size-13)] text-[color:var(--feedback-error)]">
                                {errorMessage}
                            </p>
                        ) : null}

                        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
                            {step === 1 ? (
                                <div className="mt-4 space-y-4">
                                    <h3 className="font-brand-strong text-[length:var(--wm-size-20)] leading-[1.12] text-[color:var(--text-primary)] md:text-[length:var(--wm-size-22)]">
                                        Seleccionar dia y hora
                                    </h3>
                                    <CalendarPicker
                                        label="Dia"
                                        monthDate={visibleCalendarMonth}
                                        selectedDateValue={selectedDateValue}
                                        minDateValue={minDateValue}
                                        onMonthChange={setVisibleCalendarMonth}
                                        onSelectDate={handleDateSelection}
                                        state={isStepOneDateMissing ? "error" : "default"}
                                        error={
                                            isStepOneDateMissing
                                                ? "Selecciona un dia para continuar."
                                                : undefined
                                        }
                                    />
                                    <Select
                                        label="Hora"
                                        value={selectedTimeValue}
                                        placeholder="Selecciona hora"
                                        onValueChange={handleTimeSelection}
                                        error={
                                            isStepOneTimeMissing
                                                ? "Selecciona una hora para continuar."
                                                : undefined
                                        }
                                        state={isStepOneTimeMissing ? "error" : "default"}
                                        maxVisibleOptions={6}
                                        dropdownDirection="up"
                                        options={[
                                            { value: "", label: "Selecciona hora", disabled: true },
                                            ...timeOptions.map((timeOption) => ({
                                                value: timeOption,
                                                label: timeOption,
                                                disabled:
                                                    selectedDateValue === minDateValue &&
                                                    timeOption < minTimeValue,
                                            })),
                                        ]}
                                        className="rounded-[var(--wm-size-12)] bg-[color:var(--bg-base)] px-3 py-2 font-brand-text text-[length:var(--wm-size-14)] text-[color:var(--text-primary)] focus:border-[color:var(--action-primary)]"
                                    />
                                </div>
                            ) : null}

                            {step === 2 ? (
                                <div className="mt-4 space-y-4">
                                    <MeetupWizardStepHeading
                                        caption="Paso anterior"
                                        title="Seleccionar punto de encuentro"
                                        onBack={onBack}
                                    />
                                    {visibleOptions.map((option) => {
                                        const isSelected = selectedOptionId === option.id
                                        return (
                                            <SelectableOption
                                                key={option.id}
                                                onClick={() => onSelectPoint(option.id)}
                                                selected={isSelected}
                                            >
                                                <div className="flex items-start gap-3">
                                                    {option.kind === "safe" ? (
                                                        <span className="mt-0.5 inline-flex text-[color:var(--text-primary)]">
                                                            <SafeShieldGlyph />
                                                        </span>
                                                    ) : (
                                                        <span className="mt-0.5 inline-flex text-[color:var(--text-primary)]">
                                                            <MapPin size={16} />
                                                        </span>
                                                    )}
                                                    <div className="min-w-0 flex-1">
                                                        <p className="font-brand-strong text-[length:var(--wm-size-18)] leading-tight text-[color:var(--text-primary)] md:text-[length:var(--wm-size-19)]">
                                                            {option.label}
                                                        </p>
                                                        <p className="mt-1 font-brand-text text-[length:var(--wm-size-13)] text-[color:var(--text-tertiary)]">
                                                            {option.address}
                                                        </p>
                                                        <div className="mt-1 flex items-center gap-2">
                                                            {option.kind === "safe" ? (
                                                                <span className="rounded-full bg-[color:var(--bg-accent-subtle)] px-2 py-0.5 font-brand-text text-[length:var(--wm-size-12)] text-[color:var(--action-primary-pressed)]">
                                                                    Punto seguro · {option.completedSales ?? 0} ventas completadas
                                                                </span>
                                                            ) : null}
                                                        </div>
                                                    </div>
                                                    <span className="mt-0.5">
                                                        <ProposalSelectionIndicator selected={isSelected} />
                                                    </span>
                                                </div>
                                            </SelectableOption>
                                        )
                                    })}

                                    <SelectableOption
                                        onClick={onOpenMapPicker}
                                        selected={false}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[color:var(--bg-surface)] text-[color:var(--text-primary)]">
                                                <WallapopIcon name="plus" size={16} />
                                            </span>
                                            <div className="min-w-0 flex-1">
                                                <p className="font-brand-strong text-[length:var(--wm-size-18)] text-[color:var(--text-primary)] md:text-[length:var(--wm-size-19)]">
                                                    Elige un punto
                                                </p>
                                                <p className="font-brand-text text-[length:var(--wm-size-13)] text-[color:var(--text-tertiary)]">
                                                    Puede ser un punto personalizado u otro punto seguro.
                                                </p>
                                            </div>
                                        </div>
                                    </SelectableOption>
                                </div>
                            ) : null}

                            {step === 3 ? (
                                <div className="mt-4 space-y-4">
                                    <MeetupWizardStepHeading
                                        caption="Paso anterior"
                                        title="Selecciona la preferencia de pago"
                                        onBack={onBack}
                                    />
                                    <Input
                                        label="Importe final acordado (€)"
                                        type="text"
                                        inputMode="decimal"
                                        min="0"
                                        max={`${MAX_FINAL_PRICE_EUR}`}
                                        maxLength={8}
                                        value={finalPriceValue}
                                        onChange={(event) => onFinalPriceChange(event.target.value)}
                                        placeholder="Ej: 220"
                                        error={priceInputError}
                                        state={priceInputError ? "error" : "default"}
                                        showCharCounter={false}
                                    />
                                    {shouldShowDac7Alert ? (
                                        <NoticeBanner className="py-2">
                                            {priceInputAlertText}{" "}
                                            <a
                                                href="https://ayuda.wallapop.com/hc/es-es/articles/19093732048785--Qu%C3%A9-es-DAC7-y-a-que-vendedores-de-Wallapop-les-afecta"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="font-brand-strong underline"
                                            >
                                                Más información
                                            </a>
                                        </NoticeBanner>
                                    ) : null}

                                    <fieldset>
                                        <legend className="mb-2 font-brand-text text-[length:var(--wm-size-13)] text-[color:var(--text-primary)]">
                                            Preferencia de pago
                                        </legend>
                                        <div className="grid gap-3 sm:grid-cols-2">
                                            {(
                                                [
                                                    { method: "CASH", icon: () => <Banknote size={16} /> },
                                                    { method: "WALLET", icon: () => <QrCode size={16} /> },
                                                ] as Array<{
                                                    method: MeetupPaymentMethod
                                                    icon: () => React.ReactNode
                                                }>
                                            ).map(({ method, icon }) => {
                                                const isSelected = paymentMethod === method
                                                return (
                                                    <SelectableOption
                                                        key={method}
                                                        onClick={() => onPaymentMethodChange(method)}
                                                        selected={isSelected}
                                                        className={isStepThreePaymentMissing
                                                            ? "border-2 !border-[color:var(--wm-color-input-ring-error)] shadow-none"
                                                            : !isSelected
                                                                ? "border-[color:var(--wm-color-input-ring-default)]"
                                                                : undefined}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <span className="inline-flex text-[color:var(--text-primary)]">
                                                                {icon()}
                                                            </span>
                                                            <div className="min-w-0 flex-1">
                                                                <p className="font-brand-text text-[length:var(--wm-size-14)] leading-[1.2] text-[color:var(--text-primary)] md:text-[length:var(--wm-size-15)]">
                                                                    {paymentMethodLabel(method)}
                                                                </p>
                                                            </div>
                                                            <ProposalSelectionIndicator selected={isSelected} />
                                                        </div>
                                                    </SelectableOption>
                                                )
                                            })}
                                        </div>
                                        {isStepThreePaymentMissing ? (
                                            <p className="mt-2 text-[length:var(--wm-size-12)] leading-[1.4] text-[color:var(--wm-color-input-ring-error)]">
                                                Selecciona un metodo de pago para continuar.
                                            </p>
                                        ) : null}
                                    </fieldset>
                                </div>
                            ) : null}
                        </div>

                        <MeetupProposalFooter
                            listingImageSrc={conversation.listingImageSrc}
                            itemTitle={conversation.itemTitle}
                            userName={conversation.userName}
                            attendanceRate={conversation.counterpartAttendanceRate}
                            attendanceMeetups={conversation.counterpartAttendanceMeetups}
                            actionLabel={step < 3 ? "Siguiente" : "Enviar propuesta"}
                            actionDisabled={false}
                            onAction={step < 3 ? onNext : onSubmit}
                        />
                    </>
                )}
            </section>
        </div>
    )
}

type InboxPaneProps = {
    conversations: Conversation[]
    selectedConversationId: string
    onSelectConversation: (conversationId: string) => void
    showBottomNav: boolean
    highlightSelectedConversation?: boolean
}

function InboxPane({
    conversations,
    selectedConversationId,
    onSelectConversation,
    showBottomNav,
    highlightSelectedConversation = true,
}: InboxPaneProps) {
    return (
        <section className="flex h-full min-h-0 flex-col bg-[color:var(--bg-base)]">
            <div className="border-b border-[color:var(--border-divider)] px-4 py-4">
                <div className="flex items-center">
                    <h1 className="font-brand-strong text-[length:var(--wm-size-22)] text-[color:var(--text-primary)]">Buzon</h1>
                </div>
                <div
                    role="tablist"
                    aria-label="Secciones de inbox"
                    className="mt-4 flex items-center gap-2"
                >
                    <Button
                        type="button"
                        variant="tab"
                        size="tab"
                        data-selected="true"
                        aria-selected="true"
                    >
                        Mensajes
                    </Button>
                    <Button
                        type="button"
                        variant="tab"
                        size="tab"
                        data-selected="false"
                        aria-selected="false"
                    >
                        Notificaciones
                    </Button>
                </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
                {conversations.map((conversation) => (
                    <ChatListItem
                        key={conversation.id}
                        userName={conversation.userName}
                        messageDate={conversation.messageDate}
                        itemTitle={conversation.itemTitle}
                        messagePreview={conversation.messagePreview}
                        avatarSrc={conversation.listingImageSrc}
                        avatarAlt={conversation.itemTitle}
                        leadingIndicator={
                            conversation.pendingSaleAlert ? "pending_sale" : conversation.leadingIndicator
                        }
                        unreadCount={conversation.unreadCount}
                        selected={
                            highlightSelectedConversation &&
                            conversation.id === selectedConversationId
                        }
                        lastMessageDeliveryState={conversation.lastMessageDeliveryState}
                        onClick={() => onSelectConversation(conversation.id)}
                    />
                ))}
            </div>

            {showBottomNav ? (
                <div className="border-t border-[color:var(--border-divider)]">
                    <InboxBottomNav activeItemId="inbox" />
                </div>
            ) : null}
        </section>
    )
}

type ConversationPaneProps = {
    actorRole: ActorRole
    conversation: Conversation
    timelineEntries: ConversationTimelineEntry[]
    meetup: MeetupMachine | undefined
    onBackToInbox?: () => void
    onSubmitMessage: (value: string) => void
    onMeetupChange: (next: MeetupMachine) => void
    onMeetupRedZoneCancel: () => void
    onOpenMeetupProposal: () => void
    onOpenMeetupMapPreview: (meetup: MeetupMachine) => void
    onJumpToActiveMeetup: () => void
    onError: (message: string) => void
    errorMessage: string
    onRatingPublished?: (ratingPromptMessageId: string) => void
    buyerWalletAvailableEur: number
    onWalletTopUp: (amountEur: number) => void
}

function ConversationPane({
    actorRole,
    conversation,
    timelineEntries,
    meetup,
    onBackToInbox,
    onSubmitMessage,
    onMeetupChange,
    onMeetupRedZoneCancel,
    onOpenMeetupProposal,
    onOpenMeetupMapPreview,
    onJumpToActiveMeetup,
    onError,
    errorMessage,
    onRatingPublished,
    buyerWalletAvailableEur,
    onWalletTopUp,
}: ConversationPaneProps) {
    const [isTransactionRatingOpen, setIsTransactionRatingOpen] = React.useState(false)
    const [ratingPromptMessageId, setRatingPromptMessageId] = React.useState<string | null>(null)
    const currentTime = new Date()
    const proposalActionState = meetup
        ? resolveProposalEntryActionState(meetup, actorRole)
        : null
    const canShowProposalAction = proposalActionState?.visible === true
    const listingStatusLabelNormalized = conversation.listingStatusLabel?.trim().toLowerCase() ?? ""
    const headerProductStatusIcon =
        listingStatusLabelNormalized.includes("vendid")
            ? "deal"
            : conversation.pendingSaleAlert
                ? "pending_sale"
                : listingStatusLabelNormalized.includes("reservad")
                    ? "bookmark"
                    : conversation.leadingIndicator
    const timelineContainerRef = React.useRef<HTMLDivElement | null>(null)
    const shouldShowPendingSaleBanner =
        meetup?.status === "CONFIRMED" || meetup?.status === "ARRIVED"
    const jumpToMeetupInActiveTimeline = React.useCallback(() => {
        if (!meetup) {
            return
        }
        const meetupCardId = `meetup-card-${meetup.id}`
        const targetInCurrentPane = timelineContainerRef.current?.querySelector<HTMLElement>(
            `#${meetupCardId}`
        )
        const fallbackTarget = document.getElementById(meetupCardId)
        const target = targetInCurrentPane ?? fallbackTarget
        if (!target) {
            onJumpToActiveMeetup()
            return
        }
        target.scrollIntoView({ behavior: "smooth", block: "center" })
    }, [meetup, onJumpToActiveMeetup])
    const resolveMeetupRowAlignment = (meetupEntry: MeetupMachine): string => {
        if (meetupEntry.status === "COUNTER_PROPOSED") {
            return actorRole === "SELLER"
                ? "flex justify-start [contain:paint]"
                : "flex justify-end [contain:paint]"
        }
        if (meetupEntry.status === "PROPOSED") {
            return actorRole === "SELLER"
                ? "flex justify-end [contain:paint]"
                : "flex justify-start [contain:paint]"
        }
        return actorRole === "SELLER"
            ? "flex justify-end [contain:paint]"
            : "flex justify-start [contain:paint]"
    }

    React.useEffect(() => {
        if (!timelineContainerRef.current) {
            return
        }
        timelineContainerRef.current.scrollTop = timelineContainerRef.current.scrollHeight
    }, [conversation.id, timelineEntries.length])

    return (
        <section className="flex h-full min-h-0 flex-col bg-[color:var(--bg-base)]">
            {onBackToInbox ? (
                <ChatConversationHeader
                    onBack={onBackToInbox}
                    itemImageSrc={conversation.listingImageSrc}
                    itemImageAlt={conversation.itemTitle}
                    itemPrice={conversation.itemPrice}
                    itemTitle={conversation.itemTitle}
                    profileImageSrc={conversation.profileImageSrc}
                    profileImageAlt={`Foto de perfil de ${conversation.userName}`}
                    userName={conversation.userName}
                    rating={conversation.counterpartRating}
                    distanceLabel={conversation.counterpartDistanceLabel}
                    attendanceRate={conversation.counterpartAttendanceRate}
                    attendanceMeetups={conversation.counterpartAttendanceMeetups}
                    productStatusIcon={headerProductStatusIcon}
                    defaultExpanded={false}
                />
            ) : (
                <header className="flex items-center gap-3 border-b border-[color:var(--border-divider)] bg-[color:var(--bg-base)] px-4 py-3">
                    <img
                        src={conversation.listingImageSrc}
                        alt={conversation.itemTitle}
                        className="h-11 w-11 rounded-[var(--wm-size-12)] object-cover"
                    />
                    <div className="min-w-0">
                        <p className="truncate font-brand-strong text-[length:var(--wm-size-16)] text-[color:var(--text-primary)]">
                            {conversation.itemPrice}
                        </p>
                        <p className="truncate font-brand-text text-[length:var(--wm-size-13)] text-[color:var(--text-tertiary)]">
                            {conversation.itemTitle}
                        </p>
                    </div>
                    <img
                        src={conversation.profileImageSrc}
                        alt={`Foto de perfil de ${conversation.userName}`}
                        className="ml-auto h-9 w-9 rounded-full border border-[color:var(--border-strong)] object-cover"
                    />
                    <IconButton
                        label={`Mas opciones de la conversación con ${conversation.userName}`}
                        icon={<WallapopIcon name="ellipsis_horizontal" size={20} strokeWidth={1.8} />}
                        variant="menu_close"
                        className="h-10 w-10 rounded-full bg-transparent p-0 text-[color:var(--text-tertiary)] hover:bg-[color:var(--bg-surface)]"
                    />
                </header>
            )}
            {shouldShowPendingSaleBanner && meetup ? (
                <MeetupPendingSaleBanner
                    scheduledAt={meetup.scheduledAt}
                    onJumpToMeetup={jumpToMeetupInActiveTimeline}
                />
            ) : null}

            <div ref={timelineContainerRef} className="min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-5">
                <div className="space-y-3">
                    {timelineEntries.map((entry, entryIndex) => {
                        const previousEntry = entryIndex > 0 ? timelineEntries[entryIndex - 1] : null
                        const showDateSeparator =
                            previousEntry === null ||
                            !isSameCalendarDay(previousEntry.createdAt, entry.createdAt)

                        if (entry.type === "message") {
                            const message = entry.message
                            return (
                                <div key={entry.id} className="space-y-2">
                                    {showDateSeparator ? (
                                        <div className="flex justify-center">
                                            <span className="inline-flex rounded-full bg-[color:var(--bg-date-chip)] px-4 py-1 font-brand-text text-[length:var(--wm-size-13)] text-[color:var(--text-tertiary)]">
                                                {formatTimelineDayLabel(entry.createdAt)}
                                            </span>
                                        </div>
                                    ) : null}
                                    <div
                                        className={
                                            message.variant === "sent"
                                                ? "flex justify-end [contain:paint]"
                                                : "flex justify-start [contain:paint]"
                                        }
                                    >
                                        {message.messageKind === "rating_prompt" ? (
                                            <ChatMeetRatingPromptBubble
                                                time={message.time}
                                                completed={message.ratingPromptCompleted === true}
                                                onValorar={() => {
                                                    setRatingPromptMessageId(message.id)
                                                    setIsTransactionRatingOpen(true)
                                                }}
                                            />
                                        ) : (
                                            <ChatMessageBubble
                                                variant={message.variant}
                                                time={message.time}
                                                deliveryState={message.deliveryState}
                                            >
                                                {message.text}
                                            </ChatMessageBubble>
                                        )}
                                    </div>
                                </div>
                            )
                        }

                        return (
                            <div key={entry.id} className="space-y-2 pt-2">
                                {showDateSeparator ? (
                                    <div className="flex justify-center">
                                        <span className="inline-flex rounded-full bg-[color:var(--bg-date-chip)] px-4 py-1 font-brand-text text-[length:var(--wm-size-13)] text-[color:var(--text-tertiary)]">
                                            {formatTimelineDayLabel(entry.createdAt)}
                                        </span>
                                    </div>
                                ) : null}
                                <div
                                    id={`meetup-card-${entry.meetup.id}`}
                                    className={resolveMeetupRowAlignment(entry.meetup)}
                                >
                                    <MeetupCard
                                        meetup={entry.meetup}
                                        actorRole={actorRole}
                                        currentTime={currentTime}
                                        onMeetupChange={onMeetupChange}
                                        counterpartName={conversation.userName}
                                        onRedZoneCancelConfirmed={onMeetupRedZoneCancel}
                                        onError={onError}
                                        onEditProposal={onOpenMeetupProposal}
                                        onOpenMapPreview={() => onOpenMeetupMapPreview(entry.meetup)}
                                        buyerWalletAvailableEur={buyerWalletAvailableEur}
                                        onWalletTopUp={onWalletTopUp}
                                    />
                                </div>
                            </div>
                        )
                    })}
                </div>
                {timelineEntries.length === 0 && meetup && meetup.status !== null ? (
                    <div className="mt-5 space-y-4">
                        <div className={resolveMeetupRowAlignment(meetup)}>
                            <MeetupCard
                                meetup={meetup}
                                actorRole={actorRole}
                                currentTime={currentTime}
                                onMeetupChange={onMeetupChange}
                                counterpartName={conversation.userName}
                                onRedZoneCancelConfirmed={onMeetupRedZoneCancel}
                                onError={onError}
                                onEditProposal={onOpenMeetupProposal}
                                onOpenMapPreview={() => onOpenMeetupMapPreview(meetup)}
                                buyerWalletAvailableEur={buyerWalletAvailableEur}
                                onWalletTopUp={onWalletTopUp}
                            />
                        </div>
                    </div>
                ) : null}

                {errorMessage ? (
                    <p className="mt-4 rounded-[var(--wm-size-8)] bg-[color:var(--bg-error-subtle)] px-3 py-2 font-brand-text text-[length:var(--wm-size-13)] text-[color:var(--feedback-error)]">
                        {errorMessage}
                    </p>
                ) : null}
            </div>

            <div className="shrink-0 border-t border-[color:var(--border-divider)] bg-[color:var(--bg-base)]">
                <div className="px-3 pt-1 sm:px-4">
                    <ChatSecurityBanner
                        message="Quedate en Wallapop. Mas facil, mas seguro."
                        linkText="Mas informacion"
                        className="px-0 pt-1 pb-1"
                    />
                </div>
                <ChatComposer
                    onSubmit={onSubmitMessage}
                    secondaryActionLabel={canShowProposalAction ? "Proponer quedar" : undefined}
                    secondaryActionAriaLabel="Proponer quedar"
                    secondaryActionIconName="calendar"
                    secondaryActionDisabled={
                        canShowProposalAction ? !proposalActionState?.enabled : undefined
                    }
                    onSecondaryAction={
                        canShowProposalAction
                            ? () => {
                                if (!proposalActionState) {
                                    return
                                }

                                if (!proposalActionState.enabled) {
                                    onError(proposalActionState.message)
                                    return
                                }

                                onError("")
                                onOpenMeetupProposal()
                            }
                            : undefined
                    }
                />
            </div>

            <MeetTransactionRatingModal
                open={isTransactionRatingOpen}
                counterpartName={conversation.userName}
                defaultSalePrice={conversation.itemPrice}
                onClose={() => {
                    setIsTransactionRatingOpen(false)
                    setRatingPromptMessageId(null)
                }}
                onPublish={() => {
                    if (ratingPromptMessageId) {
                        onRatingPublished?.(ratingPromptMessageId)
                    }
                }}
            />
        </section>
    )
}

function DesktopConversationSidebar({
    conversation,
    onToggleReserve,
}: {
    conversation: Conversation
    onToggleReserve: () => void
}) {
    const sidebarStatusLabel =
        conversation.listingStatusLabel ??
        (conversation.leadingIndicator === "bookmark"
            ? "Reservado"
            : conversation.leadingIndicator === "deal"
                ? "Vendido"
                : undefined)

    return (
        <aside className="hidden h-full min-h-0 flex-col gap-4 overflow-y-auto bg-[color:var(--bg-surface)] p-4 lg:flex">
            <ChatCounterpartCard
                name={conversation.userName}
                rating={conversation.counterpartRating}
                ratingCount={conversation.counterpartRatingCount}
                distanceLabel={conversation.counterpartDistanceLabel}
                attendanceRate={conversation.counterpartAttendanceRate}
                attendanceMeetups={conversation.counterpartAttendanceMeetups}
                profileImageSrc={conversation.profileImageSrc}
            />
            <ChatProductCard
                imageSrc={conversation.listingImageSrc ?? conversation.profileImageSrc ?? ""}
                imageAlt={conversation.itemTitle}
                title={conversation.itemTitle}
                price={conversation.itemPrice}
                viewerRole={conversation.listingViewerRole}
                statusLabel={sidebarStatusLabel}
                viewsCount={conversation.listingViews}
                likesCount={conversation.listingLikes}
                onEdit={
                    conversation.listingViewerRole === "seller"
                        ? () => undefined
                        : undefined
                }
                onReserve={
                    conversation.listingViewerRole === "seller"
                        ? onToggleReserve
                        : undefined
                }
                onSold={
                    conversation.listingViewerRole === "seller"
                        ? () => undefined
                        : undefined
                }
            />
        </aside>
    )
}

function WallapopChatWorkspace() {
    const localChatUserId = React.useMemo(() => getOrCreateLocalChatUserId(), [])
    const [conversationsState, setConversationsState] = React.useState<Conversation[]>(
        initialConversations
    )
    const [selectedConversationId, setSelectedConversationId] = React.useState<string>(
        "conv-c-buyer-incoming"
    )
    const [mobileView, setMobileView] = React.useState<"inbox" | "conversation">("conversation")
    const [messagesByConversation, setMessagesByConversation] = React.useState<
        Record<string, Message[]>
    >(() =>
        Object.fromEntries(
            Object.entries(initialMessagesByConversation).map(([conversationId, messages]) => [
                conversationId,
                messages.map((message) => ({
                    ...message,
                    senderUserId:
                        message.variant === "sent" ? localChatUserId : `counterpart:${conversationId}`,
                })),
            ])
        )
    )
    const initialMeetupState = React.useMemo(() => buildInitialMeetupState(), [])
    const [meetupByConversation, setMeetupByConversation] =
        React.useState<Record<string, MeetupMachine[]>>(initialMeetupState)
    const [buyerWalletAvailableEur, setBuyerWalletAvailableEur] = React.useState(() => {
        let heldEur = 0
        for (const history of Object.values(initialMeetupState)) {
            const meetup = resolveCurrentMeetup(history)
            if (
                meetup &&
                (meetup.status === "CONFIRMED" || meetup.status === "ARRIVED") &&
                meetup.proposedPaymentMethod === "WALLET" &&
                typeof meetup.walletHoldAmountEur === "number"
            ) {
                heldEur += meetup.walletHoldAmountEur
            }
        }
        return 5000 - heldEur
    })
    const [lastError, setLastError] = React.useState("")
    const [isProposalOverlayOpen, setIsProposalOverlayOpen] = React.useState(false)
    const [proposalStep, setProposalStep] = React.useState<ProposalStep>(1)
    const [proposalMapPickerOpen, setProposalMapPickerOpen] = React.useState(false)
    const [proposalMapPickerPointId, setProposalMapPickerPointId] = React.useState("")
    const [proposalMapSearchValue, setProposalMapSearchValue] = React.useState("")
    const [proposalMapCenter, setProposalMapCenter] = React.useState<MapPoint>({
        lat: safeMeetingPoints[0].lat,
        lng: safeMeetingPoints[0].lng,
    })
    const [proposalOptions, setProposalOptions] = React.useState<ProposalSelectableOption[]>([
        toSafeOption(safeMeetingPoints[0]),
        toSafeOption(safeMeetingPoints[1]),
    ])
    const [proposalSelectedOptionId, setProposalSelectedOptionId] = React.useState<string>(
        `safe:${safeMeetingPoints[0].id}`
    )
    const [proposalCustomPoint, setProposalCustomPoint] = React.useState<MapPoint | null>(null)
    const [proposalCustomLocationLabel, setProposalCustomLocationLabel] = React.useState("")
    const [proposalScheduledAt, setProposalScheduledAt] = React.useState("")
    const [proposalFinalPrice, setProposalFinalPrice] = React.useState("")
    const [proposalPaymentMethod, setProposalPaymentMethod] = React.useState<
        MeetupPaymentMethod | ""
    >("")
    const [proposalError, setProposalError] = React.useState("")
    const [mapPreviewOpen, setMapPreviewOpen] = React.useState(false)
    const [mapPreviewCenter, setMapPreviewCenter] = React.useState<MapPoint>({
        lat: safeMeetingPoints[0].lat,
        lng: safeMeetingPoints[0].lng,
    })
    const proposalCustomPointRef = React.useRef<MapPoint | null>(null)
    const reverseGeocodeRequestIdRef = React.useRef(0)
    const convexHydrationRequestIdRef = React.useRef(0)
    const [clockNowMs, setClockNowMs] = React.useState(() => Date.now())
    const meetupByConversationRef = React.useRef(meetupByConversation)
    React.useEffect(() => {
        meetupByConversationRef.current = meetupByConversation
    }, [meetupByConversation])
    const appliedExpiryKeysRef = React.useRef(new Set<string>())

    const selectedConversation = React.useMemo(
        () =>
            conversationsState.find((conversation) => conversation.id === selectedConversationId),
        [conversationsState, selectedConversationId]
    )

    const selectedMessages = React.useMemo<Message[]>(() => {
        if (!selectedConversation) {
            return []
        }
        return messagesByConversation[selectedConversation.id] ?? []
    }, [messagesByConversation, selectedConversation])
    const selectedMeetupHistory = selectedConversation
        ? meetupByConversation[selectedConversation.id]
        : undefined
    const selectedMeetup = resolveCurrentMeetup(selectedMeetupHistory)
    const selectedTimelineEntries = React.useMemo<ConversationTimelineEntry[]>(
        () => buildConversationTimelineEntries(selectedMessages, selectedMeetupHistory),
        [selectedMeetupHistory, selectedMessages]
    )
    const selectedActorRole: ActorRole =
        selectedConversation?.listingViewerRole === "buyer" ? "BUYER" : "SELLER"

    React.useEffect(() => {
        const intervalId = window.setInterval(() => {
            setClockNowMs(Date.now())
        }, 30 * 1000)
        return () => window.clearInterval(intervalId)
    }, [])

    /*
     * Cierre por tiempo. La maquina implementaba `EXPIRE` desde el principio, pero nadie lo
     * disparaba: una propuesta sin responder seguia aceptable horas despues de su hora, y los
     * dos motivos de cancelacion por caducidad no llegaban a pintarse nunca. Lo dispara el
     * reloj, no las partes, que es justo lo que dice la regla.
     */
    React.useEffect(() => {
        const now = new Date(clockNowMs)
        const expired = collectExpiredMeetups(meetupByConversationRef.current, now).filter(
            ({ conversationId, previous }) =>
                !appliedExpiryKeysRef.current.has(buildMeetupExpiryKey(conversationId, previous))
        )

        if (expired.length === 0) {
            return
        }

        for (const { conversationId, previous } of expired) {
            appliedExpiryKeysRef.current.add(buildMeetupExpiryKey(conversationId, previous))
        }

        setMeetupByConversation((current) => {
            const next = { ...current }
            for (const transition of expired) {
                const history = current[transition.conversationId] ?? []
                next[transition.conversationId] = history.map((item) =>
                    item.id === transition.previous.id ? transition.next : item
                )
            }
            return next
        })

        // Fuera del updater a proposito: llamarlo dentro lo haria impuro y en StrictMode
        // devolveria el saldo dos veces.
        const releasedEur = sumReleasedWalletHoldEur(expired)
        if (releasedEur > 0) {
            setBuyerWalletAvailableEur((balance) => balance + releasedEur)
        }
    }, [clockNowMs])

    React.useEffect(() => {
        const now = new Date(clockNowMs)
        setConversationsState((previous) =>
            previous.map((conversation) => {
                const conversationMessages = messagesByConversation[conversation.id] ?? []
                const conversationMeetupHistory = meetupByConversation[conversation.id]
                const conversationMeetup = resolveCurrentMeetup(conversationMeetupHistory)
                const summary = resolveConversationSummary(
                    conversationMessages,
                    conversationMeetupHistory
                )
                const unreadCount = resolveConversationUnreadCount(
                    conversation.unreadCount,
                    conversationMessages,
                    conversationMeetupHistory
                )
                const commercialStatus = resolveConversationCommercialStatus(
                    conversation,
                    conversationMeetup
                )
                return {
                    ...conversation,
                    ...summary,
                    unreadCount,
                    ...commercialStatus,
                    pendingSaleAlert: shouldShowPendingSaleInboxAlert(conversationMeetup, now),
                }
            })
        )
    }, [clockNowMs, messagesByConversation, meetupByConversation])

    const applyProposalDraftState = React.useCallback((draft: ProposalDraftState) => {
        setProposalStep(draft.step)
        setProposalMapPickerOpen(draft.mapPickerOpen)
        setProposalMapPickerPointId(draft.mapPickerPointId)
        setProposalMapSearchValue(draft.mapSearchValue)
        setProposalMapCenter(draft.mapCenter)
        setProposalOptions(draft.options)
        setProposalSelectedOptionId(draft.selectedOptionId)
        setProposalCustomPoint(draft.customPoint)
        setProposalCustomLocationLabel(draft.customLocationLabel)
        setProposalScheduledAt(draft.scheduledAt)
        setProposalFinalPrice(draft.finalPrice)
        setProposalPaymentMethod(draft.paymentMethod)
        setProposalError(draft.error)
    }, [])

    React.useEffect(() => {
        if (!selectedMeetup) {
            applyProposalDraftState(buildProposalDraftState(undefined))
            setIsProposalOverlayOpen(false)
            return
        }

        applyProposalDraftState(buildProposalDraftState(selectedMeetup))
    }, [selectedConversationId, selectedMeetup, applyProposalDraftState])

    React.useEffect(() => {
        proposalCustomPointRef.current = proposalCustomPoint
    }, [proposalCustomPoint])

    const hydrateConversationMessagesFromConvex = React.useCallback(async (conversationId: string) => {
        const convexClient = getConvexHttpClient()
        if (!convexClient) {
            return
        }

        const requestId = convexHydrationRequestIdRef.current + 1
        convexHydrationRequestIdRef.current = requestId

        try {
            const persistedMessages = (await convexClient.query(
                api.messages.listByConversation,
                { conversationId: buildConvexConversationKey(localChatUserId, conversationId) }
            )) as ConvexChatMessage[]

            if (convexHydrationRequestIdRef.current !== requestId) {
                return
            }

            setMessagesByConversation((previous) => {
                const existingMessages = previous[conversationId] ?? []
                const existingIds = new Set(existingMessages.map((message) => message.id))

                const nextMessages = [...existingMessages]
                for (const persistedMessage of persistedMessages) {
                    if (existingIds.has(persistedMessage.clientMessageId)) {
                        continue
                    }
                    const createdAt = persistedMessage.createdAt ?? Date.now()
                    nextMessages.push({
                        id: persistedMessage.clientMessageId,
                        senderUserId: persistedMessage.senderUserId,
                        text: persistedMessage.text,
                        variant:
                            persistedMessage.senderUserId === localChatUserId
                                ? "sent"
                                : persistedMessage.variant ?? "received",
                        time: persistedMessage.time,
                        createdAt,
                        deliveryState: persistedMessage.deliveryState,
                    })
                    existingIds.add(persistedMessage.clientMessageId)
                }

                return {
                    ...previous,
                    [conversationId]: nextMessages,
                }
            })
        } catch {
            setLastError("No se pudieron recuperar los mensajes guardados en Convex.")
        }
    }, [localChatUserId])

    React.useEffect(() => {
        if (!selectedConversation) {
            return
        }
        void hydrateConversationMessagesFromConvex(selectedConversation.id)
    }, [hydrateConversationMessagesFromConvex, selectedConversation])

    const resolveCustomPointAddress = React.useCallback(async (lat: number, lng: number) => {
        const requestId = reverseGeocodeRequestIdRef.current + 1
        reverseGeocodeRequestIdRef.current = requestId
        const requestedPoint: MapPoint = { lat, lng }

        try {
            const response = await fetch(buildReverseGeocodeUrl(requestedPoint))
            if (!response.ok) {
                return
            }
            const data = (await response.json()) as { display_name?: string }
            if (
                shouldApplyReverseGeocodeResult({
                    requestId,
                    latestRequestId: reverseGeocodeRequestIdRef.current,
                    requestedPoint,
                    currentPoint: proposalCustomPointRef.current,
                    responseAddress: data.display_name,
                })
            ) {
                setProposalCustomLocationLabel(data.display_name ?? "")
            }
        } catch {
            // Fallback silencioso: se mantienen coordenadas.
        }
    }, [])

    const proposalCustomDistanceMeters = React.useMemo(() => {
        if (!proposalCustomPoint) {
            return null
        }
        return distanceBetweenPointsMeters(mapUserPosition, proposalCustomPoint)
    }, [proposalCustomPoint])

    const markConversationAsRead = React.useCallback((conversationId: string) => {
        setConversationsState((previous) =>
            previous.map((conversation) =>
                conversation.id === conversationId ? { ...conversation, unreadCount: 0 } : conversation
            )
        )
        setMessagesByConversation((previous) => {
            const nextMessages = [...(previous[conversationId] ?? [])]
            for (let index = nextMessages.length - 1; index >= 0; index -= 1) {
                if (nextMessages[index].variant === "received") {
                    nextMessages[index] = {
                        ...nextMessages[index],
                        deliveryState: "read",
                    }
                    break
                }
            }
            return {
                ...previous,
                [conversationId]: nextMessages,
            }
        })
    }, [])

    React.useEffect(() => {
        markConversationAsRead(selectedConversationId)
    }, [markConversationAsRead, selectedConversationId])

    const jumpToActiveMeetup = React.useCallback(() => {
        if (!selectedMeetup) {
            return
        }
        const target = document.getElementById(`meetup-card-${selectedMeetup.id}`)
        if (!target) {
            return
        }
        target.scrollIntoView({ behavior: "smooth", block: "center" })
    }, [selectedMeetup])

    const markRatingPromptCompleted = React.useCallback(
        (messageId: string) => {
            setMessagesByConversation((previous) => {
                const messages = previous[selectedConversationId] ?? []
                return {
                    ...previous,
                    [selectedConversationId]: messages.map((m) =>
                        m.id === messageId && m.messageKind === "rating_prompt"
                            ? { ...m, ratingPromptCompleted: true }
                            : m
                    ),
                }
            })
        },
        [selectedConversationId]
    )

    if (!selectedConversation) {
        return null
    }

    const openConversation = (conversationId: string) => {
        setSelectedConversationId(conversationId)
        setLastError("")
        setMobileView("conversation")
        markConversationAsRead(conversationId)
    }

    const appendOutgoingMessage = (text: string) => {
        const trimmedText = text.trim()
        if (!trimmedText) {
            return
        }
        const nowMs = Date.now()
        const nextMessage: Message = {
            id: randomMessageId("m"),
            senderUserId: localChatUserId,
            text: trimmedText,
            variant: "sent",
            time: formatTime(new Date(nowMs)),
            createdAt: nowMs,
            deliveryState: "sent",
        }

        setMessagesByConversation((previous) => ({
            ...previous,
            [selectedConversation.id]: [...(previous[selectedConversation.id] ?? []), nextMessage],
        }))

        const convexClient = getConvexHttpClient()
        if (!convexClient) {
            return
        }

        /*
         * Un solo intento. El reintento anterior repetia la llamada sin `senderUserId`, asi
         * que el mensaje se guardaba a nombre de nadie y al recargar volvia pintado como si
         * lo hubiese escrito la otra parte.
         */
        void convexClient
            .mutation(api.messages.saveUserTextMessage, {
                conversationId: buildConvexConversationKey(
                    localChatUserId,
                    selectedConversation.id
                ),
                clientMessageId: nextMessage.id,
                senderUserId: localChatUserId,
                text: nextMessage.text,
                variant: nextMessage.variant,
                time: nextMessage.time,
                deliveryState: nextMessage.deliveryState,
            })
            .catch(() => {
                setLastError("No se pudo guardar el mensaje en Convex.")
            })
    }

    const appendSystemMessage = (text: string) => {
        const nowMs = Date.now()
        const nextMessage: Message = {
            id: randomMessageId("sys"),
            senderUserId: localChatUserId,
            text,
            variant: "sent",
            time: formatTime(new Date(nowMs)),
            createdAt: nowMs,
            deliveryState: "sent",
        }

        setMessagesByConversation((previous) => ({
            ...previous,
            [selectedConversation.id]: [...(previous[selectedConversation.id] ?? []), nextMessage],
        }))
    }

    const appendRatingPromptMessage = () => {
        const nowMs = Date.now()
        const nextMessage: Message = {
            id: randomMessageId("rating"),
            senderUserId: "wally",
            text: MEET_RATING_PROMPT_COPY,
            messageKind: "rating_prompt",
            variant: "received",
            time: formatTime(new Date(nowMs)),
            createdAt: nowMs,
        }

        setMessagesByConversation((previous) => ({
            ...previous,
            [selectedConversation.id]: [...(previous[selectedConversation.id] ?? []), nextMessage],
        }))
    }

    const appendCounterpartMessage = (text: string) => {
        const nowMs = Date.now()
        const nextMessage: Message = {
            id: randomMessageId("cp"),
            senderUserId: `counterpart:${selectedConversation.id}`,
            text,
            variant: "received",
            time: formatTime(new Date(nowMs)),
            createdAt: nowMs,
        }

        setMessagesByConversation((previous) => ({
            ...previous,
            [selectedConversation.id]: [...(previous[selectedConversation.id] ?? []), nextMessage],
        }))
    }

    const handleMeetupRedZoneCancel = () => {
        appendSystemMessage(
            "Cancelaste en los ultimos 30 min. Se notifico de forma prioritaria a la otra persona."
        )
        appendCounterpartMessage(
            "He recibido la cancelacion de la quedada. Busquemos otra hora si te encaja."
        )
    }

    const updateSelectedMeetup = (next: MeetupMachine) => {
        const prevMeetup = resolveCurrentMeetup(
            meetupByConversationRef.current[selectedConversation.id] ?? []
        )

        setMeetupByConversation((previous) => {
            const currentHistory = previous[selectedConversation.id] ?? []
            let nextHistory = currentHistory
            const existingIndex = currentHistory.findIndex((item) => item.id === next.id)

            if (existingIndex >= 0) {
                nextHistory = currentHistory.map((item, index) => (index === existingIndex ? next : item))
            } else if (next.supersedesMeetupId) {
                nextHistory = [
                    ...currentHistory.map((item) =>
                        item.id === next.supersedesMeetupId
                            ? {
                                  ...item,
                                  status: "CANCELLED" as const,
                                  cancelledAt: next.proposedAt ?? new Date(),
                                  cancelReason: "COUNTER_REPLACED" as const,
                              }
                            : item
                    ),
                    next,
                ]
            } else {
                nextHistory = [...currentHistory, next]
            }

            return {
                ...previous,
                [selectedConversation.id]: nextHistory,
            }
        })

        if (
            prevMeetup &&
            prevMeetup.status !== "CONFIRMED" &&
            next.status === "CONFIRMED" &&
            next.proposedPaymentMethod === "WALLET" &&
            typeof next.finalPrice === "number"
        ) {
            setBuyerWalletAvailableEur((balance) => Math.max(0, balance - next.finalPrice!))
        }

        if (
            prevMeetup &&
            prevMeetup.status !== "CANCELLED" &&
            next.status === "CANCELLED" &&
            typeof prevMeetup.walletHoldAmountEur === "number"
        ) {
            setBuyerWalletAvailableEur((balance) => balance + prevMeetup.walletHoldAmountEur!)
        }

        if (next.status === "COMPLETED") {
            appendRatingPromptMessage()
            setConversationsState((previous) =>
                previous.map((conversation) =>
                    conversation.id === selectedConversation.id
                        ? {
                            ...conversation,
                            leadingIndicator: "deal",
                            listingStatusLabel: "Vendido",
                        }
                        : conversation
                )
            )
        }

        if (next.status === "CANCELLED" && next.cancelReason === "NO_SHOW_BUYER") {
            appendSystemMessage(
                `Quedada cancelada. Hemos penalizado a ${selectedConversation.userName} por no asistir. Tu articulo vuelve a estar disponible.`
            )
        }

        if (next.status === "CANCELLED" && next.cancelReason === "NO_SHOW_FINAL_CONTRADICTION") {
            appendSystemMessage(
                "Confirmaste no-show final tras contradiccion de presencia. La reserva se canceló y el articulo vuelve a disponible."
            )
        }
    }

    const toggleSelectedConversationReserve = () => {
        setConversationsState((previous) =>
            previous.map((conversation) => {
                if (conversation.id !== selectedConversation.id) {
                    return conversation
                }

                const isSold =
                    conversation.leadingIndicator === "deal" ||
                    isSoldStatusLabel(conversation.listingStatusLabel)
                if (isSold) {
                    return conversation
                }

                const isReserved =
                    conversation.leadingIndicator === "bookmark" ||
                    isReservedStatusLabel(conversation.listingStatusLabel)

                if (isReserved) {
                    return {
                        ...conversation,
                        leadingIndicator: undefined,
                        listingStatusLabel: undefined,
                    }
                }

                return {
                    ...conversation,
                }
            })
        )
    }

    const openMeetupProposal = () => {
        if (!selectedMeetup) {
            return
        }

        applyProposalDraftState(buildProposalDraftState(selectedMeetup))
        setIsProposalOverlayOpen(true)
    }

    const openMeetupMapPreview = (meetup: MeetupMachine) => {
        const hasPoint =
            typeof meetup.proposedLocationLat === "number" &&
            typeof meetup.proposedLocationLng === "number"

        if (hasPoint) {
            setMapPreviewCenter({
                lat: meetup.proposedLocationLat as number,
                lng: meetup.proposedLocationLng as number,
            })
            setMapPreviewOpen(true)
            return
        }

        const matchingPoint = safeMeetingPoints.find(
            (point) =>
                point.name === meetup.proposedLocation || point.address === meetup.proposedLocation
        )
        if (matchingPoint) {
            setMapPreviewCenter({ lat: matchingPoint.lat, lng: matchingPoint.lng })
            setMapPreviewOpen(true)
            return
        }

        setLastError("No hay un punto de mapa disponible para esta propuesta.")
    }

    const closeMeetupProposal = () => {
        setProposalError("")
        setProposalMapPickerOpen(false)
        setIsProposalOverlayOpen(false)
    }

    const pushProposalOption = (nextOption: ProposalSelectableOption) => {
        setProposalOptions((previous) => {
            const withoutSame = previous.filter((option) => option.id !== nextOption.id)
            return [nextOption, ...withoutSame].slice(0, 2)
        })
        setProposalSelectedOptionId(nextOption.id)
    }

    const selectSafePoint = (pointId: string, options?: { pushToTop?: boolean }) => {
        const selected = safeMeetingPoints.find((point) => point.id === pointId)
        if (!selected) {
            return
        }
        const safeOption = toSafeOption(selected)
        if (options?.pushToTop) {
            pushProposalOption(safeOption)
        } else {
            setProposalSelectedOptionId(safeOption.id)
        }
        setProposalMapPickerPointId(pointId)
        setProposalMapCenter({ lat: selected.lat, lng: selected.lng })
        setProposalCustomPoint(null)
        setProposalCustomLocationLabel("")
        setProposalError("")
    }

    const selectCustomPoint = (lat: number, lng: number) => {
        setProposalCustomPoint({ lat, lng })
        setProposalCustomLocationLabel(customLocationLabelFromPoint(lat, lng))
        setProposalMapPickerPointId("custom")
        setProposalMapCenter({ lat, lng })
        setProposalError("")
        void resolveCustomPointAddress(lat, lng)
    }

    const openMapPicker = () => {
        setProposalMapPickerOpen(true)
        setProposalError("")
        if (!proposalMapPickerPointId) {
            const selectedOption = proposalOptions.find((option) => option.id === proposalSelectedOptionId)
            if (selectedOption?.kind === "safe" && selectedOption.safePointId) {
                setProposalMapPickerPointId(selectedOption.safePointId)
                setProposalMapCenter({ lat: selectedOption.lat, lng: selectedOption.lng })
            } else if (selectedOption?.kind === "custom") {
                setProposalMapPickerPointId("custom")
                setProposalMapCenter({ lat: selectedOption.lat, lng: selectedOption.lng })
            } else {
                setProposalMapPickerPointId(safeMeetingPoints[0].id)
                setProposalMapCenter({ lat: safeMeetingPoints[0].lat, lng: safeMeetingPoints[0].lng })
            }
        }
    }

    const closeMapPicker = () => {
        setProposalMapPickerOpen(false)
    }

    const selectMapPickerPoint = (pointId: string) => {
        setProposalMapPickerPointId(pointId)
        if (pointId === "custom") {
            if (!proposalCustomPoint) {
                selectCustomPoint(proposalMapCenter.lat, proposalMapCenter.lng)
            }
            return
        }
        const selected = safeMeetingPoints.find((point) => point.id === pointId)
        if (!selected) {
            return
        }
        setProposalCustomPoint(null)
        setProposalCustomLocationLabel("")
        setProposalMapCenter({ lat: selected.lat, lng: selected.lng })
    }

    const confirmMapPickerPoint = () => {
        if (!proposalMapPickerPointId) {
            setProposalError("Selecciona un punto de encuentro seguro.")
            return
        }
        if (proposalMapPickerPointId === "custom") {
            if (!proposalCustomPoint) {
                setProposalError("Selecciona un punto personalizado en el mapa.")
                return
            }
            const customOption = toCustomOption(
                proposalCustomPoint.lat,
                proposalCustomPoint.lng,
                proposalCustomLocationLabel || customLocationLabelFromPoint(proposalCustomPoint.lat, proposalCustomPoint.lng)
            )
            pushProposalOption(customOption)
            setProposalMapPickerOpen(false)
            setProposalError("")
            return
        }
        selectSafePoint(proposalMapPickerPointId, { pushToTop: true })
        setProposalMapPickerOpen(false)
    }

    const validateProposalStepOne = () => {
        const [selectedDateValue = "", selectedTimeValue = ""] = proposalScheduledAt.split("T")
        if (!selectedDateValue) {
            setProposalError("Faltan campos por rellenar")
            return false
        }
        if (!selectedTimeValue) {
            setProposalError("Faltan campos por rellenar")
            return false
        }
        if (!isQuarterHourTimeValue(selectedTimeValue.slice(0, 5))) {
            setProposalError("Selecciona una hora valida en intervalos de 15 minutos.")
            return false
        }
        const scheduledAt = parseLocalDateTimeValue(proposalScheduledAt)
        if (!scheduledAt) {
            setProposalError("Faltan campos por rellenar")
            return false
        }
        setProposalError("")
        return true
    }

    const validateProposalStepTwo = () => {
        if (!validateProposalStepOne()) {
            return false
        }
        if (proposalSelectedOptionId.trim().length === 0) {
            setProposalError("Selecciona un punto de encuentro en el mapa.")
            return false
        }
        setProposalError("")
        return true
    }

    const goToNextProposalStep = () => {
        if (proposalStep === 1) {
            if (!validateProposalStepOne()) {
                return
            }
            setProposalStep(2)
            return
        }

        if (proposalStep === 2) {
            if (!validateProposalStepTwo()) {
                return
            }
            setProposalStep(3)
        }
    }

    const goToPreviousProposalStep = () => {
        setProposalError("")
        setProposalStep((previous) => (previous > 1 ? ((previous - 1) as ProposalStep) : previous))
    }

    const goToProposalStep = (nextStep: ProposalStep) => {
        if (nextStep === 2 && !validateProposalStepOne()) {
            return
        }
        if (nextStep === 3 && !validateProposalStepTwo()) {
            return
        }
        setProposalError("")
        setProposalStep(nextStep)
    }

    const canAccessProposalStepTwo = (() => {
        const [selectedDateValue = "", selectedTimeValue = ""] = proposalScheduledAt.split("T")
        if (!selectedDateValue || !selectedTimeValue) {
            return false
        }
        if (!isQuarterHourTimeValue(selectedTimeValue.slice(0, 5))) {
            return false
        }
        return parseLocalDateTimeValue(proposalScheduledAt) !== null
    })()
    const canAccessProposalStepThree =
        canAccessProposalStepTwo && proposalSelectedOptionId.trim().length > 0

    const confirmMeetupProposal = () => {
        if (!selectedMeetup) {
            setProposalError("No existe contexto de meetup en esta conversación.")
            return
        }

        const [selectedDateValue = "", selectedTimeValue = ""] = proposalScheduledAt.split("T")
        if (!selectedDateValue) {
            setProposalError("Faltan campos por rellenar")
            return
        }
        if (!selectedTimeValue) {
            setProposalError("Faltan campos por rellenar")
            return
        }
        const scheduledAt = parseLocalDateTimeValue(proposalScheduledAt)
        if (!scheduledAt) {
            setProposalError("Faltan campos por rellenar")
            return
        }

        const selectedOption = proposalOptions.find((option) => option.id === proposalSelectedOptionId)
        const resolvedLocation = selectedOption?.address ?? ""

        if (!resolvedLocation) {
            setProposalError("Selecciona un punto de encuentro seguro.")
            return
        }

        const trimmedFinalPrice = proposalFinalPrice.trim()
        if (!trimmedFinalPrice && !proposalPaymentMethod) {
            setProposalError("Faltan campos por rellenar")
            return
        }
        if (!trimmedFinalPrice) {
            setProposalError("Faltan campos por rellenar")
            return
        }
        if (!proposalPaymentMethod) {
            setProposalError("Faltan campos por rellenar")
            return
        }

        const parsedFinalPrice = parseFinalPrice(trimmedFinalPrice)
        if (parsedFinalPrice === null || parsedFinalPrice < 0) {
            setProposalError("Faltan campos por rellenar")
            return
        }
        if (parsedFinalPrice > MAX_FINAL_PRICE_EUR) {
            setProposalError(`El importe maximo permitido es ${MAX_FINAL_PRICE_EUR} €.`)
            return
        }

        const draftMeetup: MeetupMachine = {
            ...selectedMeetup,
            scheduledAt,
            proposedLocation: resolvedLocation,
            proposedLocationLat: selectedOption?.lat,
            proposedLocationLng: selectedOption?.lng,
            finalPrice: Number(parsedFinalPrice.toFixed(2)),
            proposedPaymentMethod: proposalPaymentMethod,
        }

        if (selectedMeetup.status === "PROPOSED" && selectedActorRole === "SELLER") {
            updateSelectedMeetup(draftMeetup)
            setProposalError("")
            setProposalStep(1)
            setIsProposalOverlayOpen(false)
            return
        }

        if (selectedMeetup.status === "PROPOSED" && selectedActorRole === "BUYER") {
            const counterResult = transitionMeetup(draftMeetup, {
                type: "COUNTER_PROPOSE",
                actorRole: selectedActorRole,
                occurredAt: new Date(),
            })

            if (!counterResult.ok) {
                setProposalError(counterResult.reason)
                return
            }

            updateSelectedMeetup(counterResult.meetup)
            setProposalError("")
            setProposalStep(1)
            setIsProposalOverlayOpen(false)
            return
        }

        if (
            selectedMeetup.status !== null &&
            selectedMeetup.status !== "COUNTER_PROPOSED" &&
            selectedMeetup.status !== "CANCELLED"
        ) {
            setProposalError("Esta propuesta ya no se puede editar.")
            return
        }

        if (selectedMeetup.status === null) {
            const eligibility = resolveProposalEntryActionState(selectedMeetup, selectedActorRole)
            if (!eligibility.enabled) {
                setProposalError(eligibility.message)
                return
            }
        }

        const result = transitionMeetup(
            draftMeetup,
            {
                type: "PROPOSE",
                actorRole: selectedActorRole,
                occurredAt: new Date(),
            }
        )

        if (!result.ok) {
            setProposalError(result.reason)
            return
        }

        updateSelectedMeetup(result.meetup)
        setProposalError("")
        setProposalStep(1)
        setIsProposalOverlayOpen(false)
    }

    return (
        <main className="mt-[var(--wm-disclaimer-h)] h-[calc(100dvh-var(--wm-disclaimer-h))] w-full overflow-hidden bg-[color:var(--bg-base)]">
            <section className="hidden h-full overflow-hidden border-x border-[color:var(--border-strong)] md:grid md:grid-cols-[360px_1fr] lg:grid-cols-[360px_1fr_320px]">
                <div className="min-h-0 border-r border-[color:var(--border-divider)]">
                    <InboxPane
                        conversations={conversationsState}
                        selectedConversationId={selectedConversationId}
                        onSelectConversation={openConversation}
                        showBottomNav={false}
                        highlightSelectedConversation={true}
                    />
                </div>
                <div className="min-h-0">
                    <ConversationPane
                        actorRole={selectedActorRole}
                        conversation={selectedConversation}
                        timelineEntries={selectedTimelineEntries}
                        meetup={selectedMeetup}
                        onSubmitMessage={appendOutgoingMessage}
                        onMeetupChange={updateSelectedMeetup}
                        onMeetupRedZoneCancel={handleMeetupRedZoneCancel}
                        onOpenMeetupProposal={openMeetupProposal}
                        onOpenMeetupMapPreview={openMeetupMapPreview}
                        onJumpToActiveMeetup={jumpToActiveMeetup}
                        onError={setLastError}
                        errorMessage={lastError}
                        onRatingPublished={markRatingPromptCompleted}
                        buyerWalletAvailableEur={buyerWalletAvailableEur}
                        onWalletTopUp={(amountEur) =>
                            setBuyerWalletAvailableEur((balance) => balance + amountEur)
                        }
                    />
                </div>
                <DesktopConversationSidebar
                    conversation={selectedConversation}
                    onToggleReserve={toggleSelectedConversationReserve}
                />
            </section>

            <section className="h-full min-h-0 md:hidden">
                {mobileView === "inbox" ? (
                    <InboxPane
                        conversations={conversationsState}
                        selectedConversationId={selectedConversationId}
                        onSelectConversation={openConversation}
                        showBottomNav={true}
                        highlightSelectedConversation={false}
                    />
                ) : (
                    <ConversationPane
                        actorRole={selectedActorRole}
                        conversation={selectedConversation}
                        timelineEntries={selectedTimelineEntries}
                        meetup={selectedMeetup}
                        onBackToInbox={() => setMobileView("inbox")}
                        onSubmitMessage={appendOutgoingMessage}
                        onMeetupChange={updateSelectedMeetup}
                        onMeetupRedZoneCancel={handleMeetupRedZoneCancel}
                        onOpenMeetupProposal={openMeetupProposal}
                        onOpenMeetupMapPreview={openMeetupMapPreview}
                        onJumpToActiveMeetup={jumpToActiveMeetup}
                        onError={setLastError}
                        errorMessage={lastError}
                        onRatingPublished={markRatingPromptCompleted}
                        buyerWalletAvailableEur={buyerWalletAvailableEur}
                        onWalletTopUp={(amountEur) =>
                            setBuyerWalletAvailableEur((balance) => balance + amountEur)
                        }
                    />
                )}
            </section>

            {isProposalOverlayOpen && selectedMeetup ? (
                <MeetupProposalOverlay
                    conversation={selectedConversation}
                    step={proposalStep}
                    errorMessage={proposalError}
                    canAccessStepTwo={canAccessProposalStepTwo}
                    canAccessStepThree={canAccessProposalStepThree}
                    mapPickerOpen={proposalMapPickerOpen}
                    mapPickerPointId={proposalMapPickerPointId}
                    allSafePoints={safeMeetingPoints}
                    selectableOptions={proposalOptions}
                    selectedOptionId={proposalSelectedOptionId}
                    customPoint={proposalCustomPoint}
                    customLocationLabel={proposalCustomLocationLabel}
                    customDistanceMeters={proposalCustomDistanceMeters}
                    mapSearchValue={proposalMapSearchValue}
                    mapCenter={proposalMapCenter}
                    dateTimeValue={proposalScheduledAt}
                    finalPriceValue={proposalFinalPrice}
                    paymentMethod={proposalPaymentMethod}
                    onDateTimeChange={(nextValue) => {
                        setProposalScheduledAt(nextValue)
                        setProposalError("")
                    }}
                    onSelectPoint={(optionId) => {
                        const option = proposalOptions.find((entry) => entry.id === optionId)
                        if (!option) {
                            return
                        }
                        setProposalSelectedOptionId(option.id)
                        if (option.kind === "safe" && option.safePointId) {
                            setProposalMapPickerPointId(option.safePointId)
                        } else {
                            setProposalMapPickerPointId("custom")
                            setProposalCustomPoint({ lat: option.lat, lng: option.lng })
                            setProposalCustomLocationLabel(option.address)
                        }
                        setProposalMapCenter({ lat: option.lat, lng: option.lng })
                        setProposalError("")
                    }}
                    onOpenMapPicker={openMapPicker}
                    onCloseMapPicker={closeMapPicker}
                    onMapSearchChange={setProposalMapSearchValue}
                    onMapClick={selectCustomPoint}
                    onSelectMapPickerPoint={selectMapPickerPoint}
                    onConfirmMapPickerPoint={confirmMapPickerPoint}
                    onFinalPriceChange={(nextValue) => {
                        const normalizedValue = nextValue.replace(",", ".")
                        if (normalizedValue === "") {
                            setProposalFinalPrice("")
                            setProposalError("")
                            return
                        }
                        if (!/^\d{0,5}(\.\d{0,2})?$/.test(normalizedValue)) {
                            return
                        }

                        const parsedValue = Number.parseFloat(normalizedValue)
                        if (Number.isFinite(parsedValue) && parsedValue > MAX_FINAL_PRICE_EUR) {
                            setProposalFinalPrice(String(MAX_FINAL_PRICE_EUR))
                            setProposalError("")
                            return
                        }

                        setProposalFinalPrice(normalizedValue)
                        setProposalError("")
                    }}
                    onPaymentMethodChange={(nextValue) => {
                        setProposalPaymentMethod(nextValue)
                        setProposalError("")
                    }}
                    onStepChange={goToProposalStep}
                    onCancel={closeMeetupProposal}
                    onBack={goToPreviousProposalStep}
                    onNext={goToNextProposalStep}
                    onSubmit={confirmMeetupProposal}
                />
            ) : null}

            {mapPreviewOpen ? (
                <MeetupMapPreviewModal
                    center={mapPreviewCenter}
                    onClose={() => setMapPreviewOpen(false)}
                />
            ) : null}
        </main>
    )
}


const designSystemMeta = {
    id: "wallapop-chat-workspace",
    entityType: "pattern",
    title: "Wallapop Chat Workspace",
    description: "Wallapop Chat Workspace del design system de Wallapop Meet.",
    status: "ready",
    states: ["default","error"],
    storybookTitle: "Design System/Wallapop Chat Workspace",
    tokensUsed: ["tokens.color.semantic.action.primary","tokens.color.semantic.text.primary","tokens.color.semantic.border.divider"],
} satisfies DesignSystemEntityMeta

// eslint-disable-next-line react-refresh/only-export-components
export { WallapopChatWorkspace, designSystemMeta }

