import type { Meta, StoryObj } from "@storybook/react-vite"
import * as React from "react"

import { MeetupLocationMap } from "@/components/meetup/meetup-location-map"

const safePoints = [
    { id: "station", name: "Estación de Sants", lat: 41.37906, lng: 2.14006 },
    { id: "mall", name: "Centro comercial Arenas", lat: 41.37617, lng: 2.14918 },
    { id: "police", name: "Comisaria Mossos - Les Corts", lat: 41.38762, lng: 2.13441 },
]

const meta = {
    title: "Design System/Meetup Location Map",
    component: MeetupLocationMap,
    parameters: {
        layout: "centered",
    },
    tags: ["autodocs"],
    decorators: [
        (Story) => (
            <div className="w-full min-w-[var(--wm-size-340)] max-w-[var(--wm-size-720)] bg-[color:var(--bg-base)] p-4">
                <Story />
            </div>
        ),
    ],
} satisfies Meta<typeof MeetupLocationMap>

export default meta
type Story = StoryObj<typeof meta>

function MapHarness({
    initialCenter,
    initialPointId,
    initialCustomPoint,
}: {
    initialCenter: { lat: number; lng: number }
    initialPointId: string
    initialCustomPoint: { lat: number; lng: number } | null
}) {
    const [center, setCenter] = React.useState(initialCenter)
    const [selectedPointId, setSelectedPointId] = React.useState(initialPointId)
    const [selectedCustomPoint, setSelectedCustomPoint] = React.useState(initialCustomPoint)

    return (
        <div className="space-y-3">
            <MeetupLocationMap
                center={center}
                safePoints={safePoints}
                selectedPointId={selectedPointId}
                selectedCustomPoint={selectedPointId === "custom" ? selectedCustomPoint : null}
                onMapClick={(lat, lng) => {
                    setSelectedPointId("custom")
                    setCenter({ lat, lng })
                    setSelectedCustomPoint({ lat, lng })
                }}
                onSafePointClick={(pointId) => {
                    setSelectedPointId(pointId)
                    const nextPoint = safePoints.find((point) => point.id === pointId)
                    if (nextPoint) {
                        setCenter({ lat: nextPoint.lat, lng: nextPoint.lng })
                    }
                    setSelectedCustomPoint(null)
                }}
            />
            <p className="font-brand-text text-[length:var(--wm-size-12)] text-[color:var(--text-secondary)]">
                Punto seleccionado: {selectedPointId || "ninguno"}
            </p>
        </div>
    )
}

export const SafePointSelected: Story = {
    args: {
        center: { lat: safePoints[0].lat, lng: safePoints[0].lng },
        safePoints,
        selectedPointId: "station",
        selectedCustomPoint: null,
        onMapClick: () => undefined,
        onSafePointClick: () => undefined,
    },
    render: () => (
        <MapHarness
            initialCenter={{ lat: safePoints[0].lat, lng: safePoints[0].lng }}
            initialPointId="station"
            initialCustomPoint={null}
        />
    ),
}

export const CustomPointSelected: Story = {
    args: {
        center: { lat: 41.3811, lng: 2.1462 },
        safePoints,
        selectedPointId: "custom",
        selectedCustomPoint: { lat: 41.3811, lng: 2.1462 },
        onMapClick: () => undefined,
        onSafePointClick: () => undefined,
    },
    render: () => (
        <MapHarness
            initialCenter={{ lat: 41.3811, lng: 2.1462 }}
            initialPointId="custom"
            initialCustomPoint={{ lat: 41.3811, lng: 2.1462 }}
        />
    ),
}

