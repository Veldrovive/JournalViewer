import { forwardRef, useState, useEffect, useMemo, useImperativeHandle, useCallback, ReactElement } from "react"
import { createPortal } from "react-dom"

import { GoogleMap, useJsApiLoader, Polyline, Marker } from "@react-google-maps/api"

import { GeoLocation } from "../hooks/useProcessedEntries"
import { ActionIcon } from "@mantine/core"
import { IconBoxModel2 } from "@tabler/icons-react"

declare module "react" {
    function forwardRef<T, P = {}>(
        render: (props: P, ref: React.Ref<T>) => React.ReactNode | null
    ): (props: P & React.RefAttributes<T>) => React.ReactNode | null
}
interface HerosJourneyMapProps {
    googleApiKey: string
    splitLocations: GeoLocation[][] | null
    geotaggedEntries: GeoLocation[][] | null
    currentLocation: { lat: number; lng: number } | null
    onGeotaggedEntryClick: (entryGroup: GeoLocation[], entryGroupIndex: number) => void
    onGeolocationClick: (location: GeoLocation) => void
    onAreaSelect: (bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number } | null) => void
}

export interface HerosJourneyRef {
    setCenter: (center: { lat: number; lng: number }) => void
    setZoom: (zoom: number) => void
    setBounds: (bounds: google.maps.LatLngBounds) => void
    focusOnEntry: (entry: GeoLocation, zoom?: number) => void
}

export default forwardRef(function HerosJourneyMap(
    {
        googleApiKey,
        splitLocations,
        geotaggedEntries,
        currentLocation,
        onGeotaggedEntryClick,
        onGeolocationClick,
        onAreaSelect,
    }: HerosJourneyMapProps,
    ref: React.Ref<HerosJourneyRef>
) {
    // locations is expected to be an array of arrays of objects with lat and lng properties
    // locationEntries is an array of objects with the properties lat, lng, and component
    //  renders the component as a marker on the map
    const [libraries, setLibraries] = useState<any[]>(["drawing"])

    const { isLoaded, loadError } = useJsApiLoader({
        id: "google-map-script",
        googleMapsApiKey: googleApiKey,
        libraries: libraries,
    })
    const [map, setMap] = useState<google.maps.Map | null>(null)

    useImperativeHandle(ref, () => ({
        setCenter: (center: { lat: number; lng: number }) => {
            if (map) {
                map.panTo(center)
            }
        },
        setZoom: (zoom: number) => {
            if (map) {
                map.setZoom(zoom)
            }
        },
        setBounds: (bounds: google.maps.LatLngBounds) => {
            if (map) {
                console.log("Setting bounds", bounds)
                map.fitBounds(bounds)
            }
        },
        focusOnEntry: (entry: GeoLocation, zoom?: number) => {
            if (map) {
                map.panTo({ lat: entry.lat, lng: entry.lng })
                if (zoom) {
                    map.setZoom(zoom)
                }
            }
        },
    }))

    // useEffect(() => {
    //     console.log("Maps loaded:", isLoaded)
    // }, [isLoaded])

    useEffect(() => {
        if (map) {
            // Set gesture handling to auto
            map.setOptions({ gestureHandling: "auto" })
            // Set clickable icons to false
            map.setOptions({ clickableIcons: false })
        }
    }, [map])

    const allLocations = useMemo(() => {
        if (splitLocations === null) {
            return null
        }
        return splitLocations.reduce((acc, val) => acc.concat(val), [])
    }, [splitLocations])

    const center = useMemo(() => {
        if (allLocations === null || allLocations.length === 0) {
            return { lat: 0, lng: 0 }
        }
        const center = { lat: allLocations[0].lat, lng: allLocations[0].lng }
        return center
    }, [allLocations])

    const findEntryByLatLng = (lat: number, lng: number) => {
        // Iterates over the splitLocations array and returns the closest entry to the given lat and lng
        if (splitLocations === null) {
            return null
        }
        let closestEntry = null
        let closestDistance = Infinity
        splitLocations.forEach((geolocation, index) => {
            geolocation.forEach((location) => {
                const distance = Math.sqrt((location.lat - lat) ** 2 + (location.lng - lng) ** 2)
                if (distance < closestDistance) {
                    closestDistance = distance
                    closestEntry = location
                }
            })
        })
        return closestEntry
    }

    const polylineMapChildren = useMemo(() => {
        if (splitLocations == null) {
            return null
        }
        return splitLocations.map((geolocation, index) => {
            return (
                <Polyline
                    // onMouseOver={(e) => console.log("Mouse over polyline!", e, e.latLng.toString(), findEntryByLatLng(e.latLng.lat(), e.latLng.lng()))}
                    onClick={(e) => onGeolocationClick(findEntryByLatLng(e.latLng.lat(), e.latLng.lng()))}
                    key={index}
                    path={geolocation.map((location) => ({ lat: location.lat, lng: location.lng, t: index }))}
                    options={{
                        strokeColor: "#8e44ad",
                        strokeOpacity: 0.6,
                        strokeWeight: 2,
                        geodesic: true,
                        icons: [
                            {
                                icon: {
                                    path: 2,
                                },
                                offset: "100%",
                                repeat: "100px",
                            },
                        ],
                    }}
                />
            )
        })
    }, [splitLocations])

    useEffect(() => {
        if (isLoaded && map && allLocations && allLocations.length > 0) {
            // Fit the map to the bounds of the locations
            const minLat = Math.min(...allLocations.map((location) => location.lat)) - 0.004
            const maxLat = Math.max(...allLocations.map((location) => location.lat))
            const minLng = Math.min(...allLocations.map((location) => location.lng))
            const maxLng = Math.max(...allLocations.map((location) => location.lng))

            const bounds = new window.google.maps.LatLngBounds()
            bounds.extend(new window.google.maps.LatLng(minLat, minLng))
            bounds.extend(new window.google.maps.LatLng(maxLat, maxLng))

            // console.log("Locations Changed", bounds)
            map.fitBounds(bounds)
        }
    }, [isLoaded, map, allLocations])

    const currentPositionMarker = useMemo(() => {
        if (currentLocation === null) {
            return null
        }
        return (
            <Marker
                position={currentLocation}
                icon={{
                    path: window.google.maps.SymbolPath.CIRCLE,
                    scale: 5,
                    fillColor: "red",
                    fillOpacity: 1,
                    strokeWeight: 0,
                }}
                zIndex={1000}
            />
        )
    }, [currentLocation])

    const geotaggedEntriesMarkers = useMemo(() => {
        if (geotaggedEntries === null || geotaggedEntries.length === 0) {
            return null
        }

        return geotaggedEntries.map((geolocation, index) => {
            if (geolocation.length === 0) {
                return null
            }
            if (geolocation[0].unknownLocation) {
                return null
            }
            return (
                <Marker
                    key={index}
                    position={{ lat: geolocation[0].lat, lng: geolocation[0].lng }}
                    icon={{
                        path: window.google.maps.SymbolPath.CIRCLE,
                        scale: 5,
                        fillColor: "#8e44ad",
                        fillOpacity: 1,
                        strokeWeight: 0,
                    }}
                    onClick={() => onGeotaggedEntryClick(geolocation, index)}
                />
            )
        })
    }, [geotaggedEntries, onGeotaggedEntryClick])


    // Initialize the drawing manager. We allow the user to draw only rectangles
    const [drawingManager, setDrawingManager] = useState<google.maps.drawing.DrawingManager | null>(null)
    const [selecting, setSelecting] = useState<boolean>(false)
    const [selectionRectangle, setSelectionRectangle] = useState<google.maps.Rectangle | null>(null)
    const [controlDiv, setControlDiv] = useState<HTMLDivElement | null>(null)
    const [customControlPortal, setCustomControlPortal] = useState<ReactElement | null>(null)

    const onEnterSelectionMode = useCallback(() => {
        console.log("Entering selection mode")
        if (drawingManager) {
            drawingManager.setDrawingMode(google.maps.drawing.OverlayType.RECTANGLE)
            setSelecting(true)
        }
    }, [drawingManager])

    const onExitSelectionMode = useCallback(() => {
        if (drawingManager) {
            drawingManager.setDrawingMode(null)
            setSelecting(false)
        }
    }, [drawingManager])

    const onRemoveSelection = useCallback(() => {
        if (selectionRectangle) {
            selectionRectangle.setMap(null)
            setSelectionRectangle(null)
        }
    }, [selectionRectangle, setSelectionRectangle])

    const onRectangleComplete = useCallback((rectangle: google.maps.Rectangle) => {
        if (selectionRectangle) {
            selectionRectangle.setMap(null)
        }
        const bounds = rectangle.getBounds()
        setSelectionRectangle(rectangle)
        onExitSelectionMode()
    }, [selectionRectangle, setSelectionRectangle, onExitSelectionMode])

    useEffect(() => {
        if (selectionRectangle) {
            const bounds = selectionRectangle.getBounds()
            const minLat = bounds.getSouthWest().lat()
            const maxLat = bounds.getNorthEast().lat()
            const minLng = bounds.getSouthWest().lng()
            const maxLng = bounds.getNorthEast().lng()
            onAreaSelect({ minLat, maxLat, minLng, maxLng })
        } else {
            onAreaSelect(null)
        }
    }, [selectionRectangle])

    useEffect(() => {
        if (map) {
            const drawingManager = new window.google.maps.drawing.DrawingManager({
                drawingMode: null,
                drawingControl: false,
                drawingControlOptions: {
                    position: google.maps.ControlPosition.TOP_CENTER,
                    drawingModes: [google.maps.drawing.OverlayType.RECTANGLE],
                },
                rectangleOptions: {
                    strokeColor: "#000000",
                    strokeOpacity: 0.3,
                    strokeWeight: 2,
                    fillColor: null,
                    fillOpacity: 0.0,
                    zIndex: -1,
                },
            })
            drawingManager.setMap(map)
            setDrawingManager(drawingManager)

            return () => {
                drawingManager.setMap(null)
            }
        }
    }, [map])

    useEffect(() => {
        if (drawingManager) {
            window.google.maps.event.addListener(drawingManager, "rectanglecomplete", onRectangleComplete)
        }

        return () => {
            if (drawingManager) {
                window.google.maps.event.clearListeners(drawingManager, "rectanglecomplete")
            }
        }
    }, [drawingManager, onRectangleComplete])

    useEffect(() => {
        if (drawingManager) {
            const control = document.createElement("div")
            control.style.background = "white"
            control.style.marginRight = "10px"
            control.style.boxShadow = "rgba(0, 0, 0, 0.3) 0px 1px 4px -1px"
            control.style.borderRadius = "2px"
            control.style.cursor = "pointer"
            control.style.width = "40px"
            control.style.height = "40px"
            control.style.display = "flex"
            control.style.justifyContent = "center"
            control.style.alignItems = "center"

            map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(control)
            setControlDiv(control)
        }

        return () => {
            if (drawingManager) {
                map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].clear()
                setControlDiv(null)
            }
        }
    }, [map, drawingManager, setControlDiv])

    const customControlIcon = useMemo(() => {
        // Clicking this button has a few different optional effects
        // 1. If there is not currently a selection and we are not in selection mode, enter selection mode
        // 2. If there is a selection and we are not in selection mode, remove the selection
        // 3. If there is not currently a selection and we are in selection mode, exit selection mode
        // 4. If there is a selection and we are in selection mode, exit selection mode
        const onClick = () => {
            if (selectionRectangle && !selecting) {
                onRemoveSelection()
            } else if (selecting) {
                onExitSelectionMode()
            } else {
                onEnterSelectionMode()
            }
        }
        // If we are selecting or have a selection, change the background color to be a light gray
        const backgroundStyle = {
            backgroundColor: selecting || selectionRectangle ? "rgba(0, 0, 0, 0.1)" : "white",
        }
        return (
            <ActionIcon style={{ width: '100%', height: '100%', ...backgroundStyle }} onClick={onClick}>
                <IconBoxModel2 style={{ width: '90%', height: '90%' }} />
            </ActionIcon>
        )
    }, [onEnterSelectionMode, selecting, selectionRectangle, onRemoveSelection, onExitSelectionMode])

    useEffect(() => {
        if (controlDiv) {
            const portal = createPortal(customControlIcon, controlDiv)
            setCustomControlPortal(portal)
        }
    }, [controlDiv, customControlIcon, setCustomControlPortal])


    return isLoaded ? (
        <GoogleMap
            mapContainerStyle={{ height: "100%", width: "100%" }}
            center={center}
            zoom={1}
            onLoad={(map) => setMap(map)}
        >
            {polylineMapChildren}
            {geotaggedEntriesMarkers}
            {currentPositionMarker}
            {customControlPortal}
        </GoogleMap>
    ) : (
        <></>
    )
})
