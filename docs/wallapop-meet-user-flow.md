# Flujo de usuario Wallapop Meet (Mermaid)

Este documento fija el user flow oficial de Wallapop Meet para consulta rápida de producto, diseño y desarrollo.

## Happy path (referencia)

Secuencia cerrada: propuesta aceptada, llegada dentro de ventana, cierre de venta por el vendedor.

```mermaid
flowchart TD
    start([Chat del anuncio])
    start --> propose[Vendedor: Proponer quedar]
    propose --> PROPOSED
    PROPOSED --> accept[Comprador: Aceptar]
    accept --> CONFIRMED
    PROPOSED -. opcional: Proponer cambios .-> COUNTER
    COUNTER[COUNTER_PROPOSED] --> sellerReview[Vendedor: Aceptar o reenviar propuesta]
    sellerReview --> CONFIRMED
    PROPOSED -.->|Pasa scheduledAt sin respuesta| propExpired
    COUNTER -.->|Pasa scheduledAt sin respuesta| propExpired
    propExpired[CANCELLED: PROPOSAL_EXPIRED]

    CONFIRMED --> window{Ventana de llegada -30m / +2h?}
    window -->|Abierta| arrived[Cualquiera: Estoy aqui]
    window -->|Aun no abre| wait[Anadir a Calendar / esperar ventana]
    wait --> window
    window -->|Ya cerro sin COMPLETE| meetupExpired
    meetupExpired[CANCELLED: MEETUP_EXPIRED]
    arrived --> ARRIVED
    ARRIVED --> paymentCheck{proposedPaymentMethod == WALLET?}
    paymentCheck -->|No| complete[Solo vendedor: Confirmar venta]
    paymentCheck -->|Si| buyerQr[Comprador ya llegado: Mostrar codigo QR]
    buyerQr --> sellerScan[Solo vendedor: Escanear codigo QR]
    complete --> COMPLETED([COMPLETED: Vendido])
    sellerScan --> COMPLETED

    classDef terminal fill:#DCEBFF,stroke:#4F7DB8,color:#1E3A5F;
    class COMPLETED terminal;
    classDef expired fill:#FDEBEC,stroke:#B23D41,color:#6B2426;
    class propExpired,meetupExpired expired;
```

Reglas clave del happy path:

- `ACCEPT` desde `PROPOSED` solo con rol comprador; desde `COUNTER_PROPOSED`, solo el vendedor acepta la contraoferta.
- `MARK_ARRIVED` habilitado en ventana `scheduledAt - 30 min` hasta `scheduledAt + 2 h`.
- `COMPLETE` solo desde `ARRIVED` y solo con rol vendedor.
- `EXPIRE` cierra la quedada sin repartir culpa entre las partes (no genera `reliabilityImpacts`): desde `PROPOSED`/`COUNTER_PROPOSED` caduca en `scheduledAt` con motivo `PROPOSAL_EXPIRED`; desde `CONFIRMED`/`ARRIVED` caduca al cerrarse la ventana de llegada (`scheduledAt + 2h`) con motivo `MEETUP_EXPIRED`. No aplica desde `COMPLETED`/`CANCELLED` ni antes de la hora de caducidad (`isMeetupExpired`).
- Pago con Wallapop Wallet: al `ACCEPT` una propuesta con `proposedPaymentMethod = WALLET` y precio > 0 se exige `buyerWalletAvailableEur >= finalPrice`; si falta saldo, la card bloquea la aceptación y ofrece abrir `WalletTopUpSheet` para recargar el monedero antes de reintentar. Al aceptar con saldo suficiente se guarda el importe en `walletHoldAmountEur` (el hold), que se limpia al `COMPLETE`, `CANCEL` o `EXPIRE`.
- El comprador solo ve el CTA "Mostrar código QR" en `ARRIVED` si además ha marcado su propia llegada (`arrivalCheckins.BUYER`); el vendedor ve "Escanear código QR" en vez de "Confirmar venta". Ambos CTA disparan el mismo evento `COMPLETE` con rol vendedor: Wallet no crea un estado nuevo, solo cambia la CTA visible.

## Diagrama histórico (no-show y ramas)

Flujo alternativo con reporte de no-show del vendedor (fuera del happy path básico).

```mermaid
graph TD
    P1["Vendedor propone quedada"]
    B1{"Comprador acepta o propone cambios?"}
    C1["Comprador propone cambios"]
    X1["Card anterior cancelada por contraoferta"]
    P2["Nueva meetup COUNTER_PROPOSED"]
    CF["Quedada confirmada CONFIRMED"]
    BN["Banner: venta pendiente"]

    P1 --> B1
    B1 -->|Aceptar| CF
    B1 -->|Proponer cambios| C1 --> X1 --> P2 --> CF
    CF --> BN

    A1{"Dentro de -30m/+2h?"}
    AR["CTA Estoy aqui"]
    RV["Al menos uno marca llegada ARRIVED"]
    CS["Vendedor: Confirmar venta COMPLETED"]

    CF --> A1
    A1 -->|Si| AR --> RV --> CS

    NS["Vendedor: comprador no ha aparecido"]
    G1{"Han pasado +5 min desde la hora?"}
    ER["Mensaje: cortesia 5 min"]
    BS["Bottom sheet confirmacion"]
    GPS{"Check-in comprador en radio seguro?"}
    AL["Alerta contradiccion"]
    FN["Confirmar no-show final"]
    CA["CANCELLED"]

    RV --> NS --> G1
    G1 -->|No| ER --> NS
    G1 -->|Si| BS --> GPS
    GPS -->|No| CA
    GPS -->|Si| AL --> FN --> CA

    classDef vendedor fill:#00C7AE,stroke:#0B6B5E,color:#073B35,stroke-width:1.5px;
    classDef comprador fill:#DCEBFF,stroke:#4F7DB8,color:#1E3A5F;
    classDef sistema fill:#FFE8CC,stroke:#C77D2B,color:#5C3A16,stroke-width:1.5px;
    classDef decision fill:#F3F4F6,stroke:#6B7280,color:#111827,stroke-width:1.5px;

    class P1,X1,P2,RV,CS,NS,FN vendedor;
    class C1 comprador;
    class CF,BN,AR,ER,BS,AL,CA sistema;
    class B1,A1,G1,GPS decision;
```
