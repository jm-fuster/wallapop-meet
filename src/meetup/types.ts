export const MEETUP_STATUSES = [
    "PROPOSED",
    "COUNTER_PROPOSED",
    "CONFIRMED",
    "ARRIVED",
    "COMPLETED",
    "CANCELLED",
] as const

export type MeetupStatus = (typeof MEETUP_STATUSES)[number]

export type ActorRole = "SELLER" | "BUYER"
export type MeetupPaymentMethod = "CASH" | "WALLET"
export type MeetupLateNoticeEtaMinutes = 10 | 20
export type MeetupCancelReason =
    | "MANUAL_CANCEL"
    | "COUNTER_REPLACED"
    | "NO_SHOW_BUYER"
    | "NO_SHOW_FINAL_CONTRADICTION"
    /** La hora propuesta paso sin que la otra parte aceptase ni contraofertase. */
    | "PROPOSAL_EXPIRED"
    /** La ventana de llegada se cerro sin que el vendedor confirmase la venta. */
    | "MEETUP_EXPIRED"

export type MeetupArrivalCheckin = {
    occurredAt: Date
    distanceMeters?: number
    withinSafeRadius?: boolean
}

export type MeetupNoShowResolution = {
    reportedBy: ActorRole
    missingActor?: ActorRole
    evidenceSource: "CHECKIN_EVIDENCE" | "MANUAL_REVIEW"
    resolvedAt: Date
}

export type MeetupNoShowReport = {
    reportedBy: "SELLER"
    reportedAt: Date
    graceEndsAt: Date
    contradictionDetected: boolean
    buyerWasMarkedArrived: boolean
}

export type MeetupReliabilityImpactType =
    /** Cancelacion dentro de la ultima media hora antes de la quedada. */
    | "RED_ZONE_CANCELLATION"
    /** Cancelacion despues de la hora acordada, con la otra parte ya en camino o en el punto. */
    | "POST_TIME_CANCELLATION"

export type MeetupReliabilityImpact = {
    type: MeetupReliabilityImpactType
    actorRole: ActorRole
    /** Negativo cuando la cancelacion ocurre despues de la hora acordada. */
    minutesBeforeScheduled: number
    occurredAt: Date
}

export type MeetupLateNotice = {
    actorRole: ActorRole
    etaMinutes: MeetupLateNoticeEtaMinutes
    occurredAt: Date
}

export type MeetupChatContext = {
    conversationId: string
    listingId: string
    sellerUserId: string
    buyerUserId: string
}

export type CreateMeetupMachineInput = {
    scheduledAt: Date
    chatContext: MeetupChatContext
}

export type MeetupMachine = {
    id: string
    status: MeetupStatus | null
    scheduledAt: Date
    proposedLocation?: string
    proposedLocationLat?: number
    proposedLocationLng?: number
    finalPrice?: number
    proposedPaymentMethod?: MeetupPaymentMethod
    /** Importe reservado en Wallapop Wallet al confirmar la quedada con pago Wallet (hasta completar, cancelar o no-show). */
    walletHoldAmountEur?: number
    chatContext: MeetupChatContext
    proposedAt?: Date
    confirmedAt?: Date
    arrivedAt?: Date
    completedAt?: Date
    cancelledAt?: Date
    cancelReason?: MeetupCancelReason
    supersedesMeetupId?: string
    arrivalCheckins?: Partial<Record<ActorRole, MeetupArrivalCheckin>>
    noShowResolution?: MeetupNoShowResolution
    noShowReport?: MeetupNoShowReport
    reliabilityImpacts?: MeetupReliabilityImpact[]
    lateNotices?: MeetupLateNotice[]
}

export type MeetupEvent =
    | { type: "PROPOSE"; actorRole: ActorRole; occurredAt?: Date }
    | { type: "COUNTER_PROPOSE"; actorRole: ActorRole; occurredAt?: Date }
    | {
          type: "ACCEPT"
          actorRole: ActorRole
          occurredAt?: Date
          /** Saldo disponible en Wallet del comprador; obligatorio en transiciones ACCEPT con pago WALLET. */
          buyerWalletAvailableEur?: number
      }
    | {
          type: "MARK_ARRIVED"
          actorRole: ActorRole
          occurredAt: Date
          distanceMeters?: number
          withinSafeRadius?: boolean
      }
    | {
          type: "LATE_NOTICE"
          actorRole: ActorRole
          etaMinutes: MeetupLateNoticeEtaMinutes
          occurredAt?: Date
      }
    | { type: "COMPLETE"; actorRole: ActorRole; occurredAt?: Date }
    | {
          type: "CANCEL"
          actorRole: ActorRole
          occurredAt?: Date
          reason?: MeetupCancelReason
      }
    | { type: "REPORT_NO_SHOW"; actorRole: ActorRole; occurredAt: Date }
    | { type: "CONFIRM_NO_SHOW_FINAL"; actorRole: ActorRole; occurredAt: Date }
    /**
     * Cierre por tiempo. No lo dispara ninguna de las dos partes: lo dispara el sistema
     * cuando la quedada ya no puede avanzar, para que ningun hilo se quede en un estado
     * que dejo de ser verdad.
     */
    | { type: "EXPIRE"; occurredAt: Date }

export type TransitionSuccess = {
    ok: true
    meetup: MeetupMachine
}

export type TransitionFailure = {
    ok: false
    reason: string
}

export type TransitionResult = TransitionSuccess | TransitionFailure
