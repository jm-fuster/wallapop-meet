import * as React from "react"
import L from "leaflet"
import type { DesignSystemEntityMeta } from "@/design-system/catalog/types"
import {
    CircleMarker,
    MapContainer,
    Marker,
    TileLayer,
    Tooltip,
    useMap,
    useMapEvents,
} from "react-leaflet"

type LatLng = {
    lat: number
    lng: number
}

type SafePoint = {
    id: string
    name: string
    lat: number
    lng: number
}

type MeetupLocationMapProps = {
    center: LatLng
    safePoints: SafePoint[]
    selectedPointId: string
    selectedCustomPoint: LatLng | null
    onMapClick: (lat: number, lng: number) => void
    onSafePointClick: (pointId: string) => void
}

function resolveCssColor(variableName: string, fallback: string): string {
    if (typeof window === "undefined" || typeof document === "undefined") {
        return fallback
    }
    const value = getComputedStyle(document.documentElement).getPropertyValue(variableName).trim()
    return value || fallback
}

function createCustomPointIcon(): L.DivIcon {
    return L.divIcon({
        className: "wm-map-marker-icon",
        html: `
        <span class="wm-map-marker-shell">
            <span class="wm-map-marker-bubble wm-map-marker-bubble-md wm-map-marker-pressed wm-map-marker-shadow-strong">
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
}

function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
    useMapEvents({
        click: (event) => {
            onMapClick(event.latlng.lat, event.latlng.lng)
        },
    })

    return null
}

function MapCenterController({ center }: { center: LatLng }) {
    const map = useMap()

    React.useEffect(() => {
        map.flyTo([center.lat, center.lng], map.getZoom(), { duration: 0.6 })
    }, [center, map])

    return null
}

function MeetupLocationMap({
    center,
    safePoints,
    selectedPointId,
    selectedCustomPoint,
    onMapClick,
    onSafePointClick,
}: MeetupLocationMapProps) {
    const safePointDefaultColor = React.useMemo(
        () => resolveCssColor("--action-primary", "var(--action-primary)"),
        []
    )
    const safePointSelectedColor = React.useMemo(
        () => resolveCssColor("--action-primary-pressed", "var(--action-primary-pressed)"),
        []
    )
    const customPointIcon = React.useMemo(
        () => createCustomPointIcon(),
        []
    )

    return (
        <div className="h-[var(--wm-size-280)] w-full overflow-hidden rounded-[var(--wm-size-16)] border border-[color:var(--border-strong)]">
            <MapContainer
                center={[center.lat, center.lng]}
                zoom={14}
                scrollWheelZoom
                className="h-full w-full"
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapClickHandler onMapClick={onMapClick} />
                <MapCenterController center={center} />

                {safePoints.map((point) => (
                    <CircleMarker
                        key={point.id}
                        center={[point.lat, point.lng]}
                        radius={7}
                        pathOptions={{
                            color: resolveCssColor("--text-inverse", "var(--text-inverse)"),
                            weight: 2,
                            fillColor:
                                selectedPointId === point.id
                                    ? safePointSelectedColor
                                    : safePointDefaultColor,
                            fillOpacity: 1,
                        }}
                        eventHandlers={{
                            click: (event) => {
                                event.originalEvent.stopPropagation()
                                onSafePointClick(point.id)
                            },
                        }}
                    >
                        {selectedPointId === point.id ? (
                            <Tooltip direction="top" offset={[0, -10]} permanent>
                                {point.name} - Punto seguro
                            </Tooltip>
                        ) : null}
                    </CircleMarker>
                ))}

                {selectedCustomPoint ? (
                    <Marker
                        position={[selectedCustomPoint.lat, selectedCustomPoint.lng]}
                        icon={customPointIcon}
                    />
                ) : null}
            </MapContainer>
        </div>
    )
}


const designSystemMeta = {
    id: "meetup-location-map",
    entityType: "component",
    title: "Meetup Location Map",
    description: "Meetup Location Map del design system de Wallapop Meet.",
    status: "ready",
    states: ["default","selected"],
    storybookTitle: "Design System/Meetup Location Map",
    tokensUsed: ["tokens.color.semantic.action.primary","tokens.color.semantic.text.primary","tokens.color.semantic.border.divider"],
} satisfies DesignSystemEntityMeta

// eslint-disable-next-line react-refresh/only-export-components
export { MeetupLocationMap, designSystemMeta }
export type { LatLng, SafePoint }

