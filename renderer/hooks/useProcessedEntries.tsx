/*
This model holds methods that are used to process entries as they come in and return useful quantities like location mapped entries.
*/

import { OutputEntry } from "../interfaces/entryApiInterfaces"
import { useEffect, useState, useMemo } from "react"

export interface GeoLocation {
    entryIndex: number
    entry: OutputEntry
    timestamp: number
    lat: number | null
    lng: number | null
    unknownLocation: boolean
}

interface SimpleLocation {
    lat: number
    lng: number
}

interface UseProcessedEntries {
    locations: GeoLocation[] | null // All locations in order
    splitLocations: GeoLocation[][] | null // All locations split where the distance between two locations is greater than the threshold
    geotaggedEntries: GeoLocation[][] | null // Entries that have been assigned a definite location. Entries with the same location are grouped together
    geotaggedEntriesTweens: GeoLocation[][] | null // For index i, this is the list of locations between geotaggedEntries[i] and geotaggedEntries[i+1] inclusive on the lower end and exclusive on the upper end
}

interface UseProcessedEntriesOptions {
    splitLocationsDistanceThreshold?: number
    entryTypeWhitelist?: string[]
}

// https://stackoverflow.com/questions/639695/how-to-convert-latitude-or-longitude-to-meters
function measure(lat1: number, lon1: number, lat2: number, lon2: number) {
    // generally used geo measurement function
    var R = 6378.137 // Radius of earth in KM
    var dLat = (lat2 * Math.PI) / 180 - (lat1 * Math.PI) / 180
    var dLon = (lon2 * Math.PI) / 180 - (lon1 * Math.PI) / 180
    var a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    var d = R * c
    return d * 1000 // meters
}

export function useProcessedEntries(
    entries: OutputEntry[] | null,
    options?: UseProcessedEntriesOptions
): UseProcessedEntries {
    const [locations, setLocations] = useState<GeoLocation[] | null>(null)
    const filteredEntries = useMemo(() => {
        if (entries != null) {
            return entries.filter((entry) => {
                if (options?.entryTypeWhitelist == null) {
                    return true
                } else {
                    return options.entryTypeWhitelist.includes(entry.entryType) || entry.entryType === "geolocation"
                }
            })
        } else {
            return null
        }
    }, [entries, options?.entryTypeWhitelist])

    const updateLocations = (entries: OutputEntry[]): GeoLocation[] => {
        const locations: GeoLocation[] = entries
            .map((entry, index) => ({ entryIndex: index, entry }))
            .filter((entryInfo) => entryInfo.entry.entryType == "geolocation")
            .filter((entryInfo) => entryInfo.entry.latitude != null)
            .map((entryInfo) => ({
                entryIndex: entryInfo.entryIndex,
                entry: entryInfo.entry,
                timestamp: entryInfo.entry.startTime,
                lat: entryInfo.entry.latitude!,
                lng: entryInfo.entry.longitude!,
                unknownLocation: false,
            }))
        setLocations(locations)
        return locations
    }

    const resetLocations = () => {
        setLocations(null)
    }

    const splitLocations = useMemo(() => {
        if (locations != null) {
            const distanceThreshold = options?.splitLocationsDistanceThreshold ?? 1000
            const splitLocations: GeoLocation[][] = []
            let currentList = []
            for (let i = 0; i < locations.length; i++) {
                const currentLocation = locations[i]
                if (currentList.length === 0) {
                    currentList.push(currentLocation)
                } else {
                    const lastLocation = currentList[currentList.length - 1]
                    const distance = measure(
                        lastLocation.lat,
                        lastLocation.lng,
                        currentLocation.lat,
                        currentLocation.lng
                    )
                    if (distance > distanceThreshold) {
                        splitLocations.push(currentList)
                        currentList = []
                    }
                    currentList.push(currentLocation)
                }
            }
            if (currentList.length > 0) {
                splitLocations.push(currentList)
            }
            return splitLocations
        } else {
            return null
        }
    }, [locations, options?.splitLocationsDistanceThreshold])

    const [geotaggedEntries, setGeotaggedEntries] = useState<GeoLocation[][] | null>(null)
    const [geotaggedEntriesTweens, setGeotaggedEntriesTweens] = useState<GeoLocation[][] | null>(null)

    const updateGeotaggedEntries = (entries: OutputEntry[]): void => {
        /*
        Generates the geotaggedEntries and the tweens in parallel
        */
        const geotaggedEntries: GeoLocation[][] = []
        const geotaggedEntriesTweens: GeoLocation[][] = []

        let currentTween: GeoLocation[] = []
        let currentLocationGroup: GeoLocation[] = []
        let lastDefiniteLocation: SimpleLocation | null = null
        for (let i = 0; i < entries.length; i++) {
            const entry = entries[i]
            if (entry.entryType === "geolocation") {
                // Then we update the lastDefiniteLocation and add the entry to the currentTween
                if (entry.latitude != null && entry.longitude != null) {
                    lastDefiniteLocation = { lat: entry.latitude, lng: entry.longitude }
                }
                currentTween.push({
                    entryIndex: i,
                    entry,
                    timestamp: entry.startTime,
                    lat: lastDefiniteLocation?.lat ?? 0,
                    lng: lastDefiniteLocation?.lng ?? 0,
                    unknownLocation: lastDefiniteLocation == null,
                })
                if (currentLocationGroup.length > 0) {
                    geotaggedEntries.push(currentLocationGroup)
                    currentLocationGroup = []
                }
            } else {
                // // Check if we have a location. If we don't, just pass
                // if (lastDefiniteLocation == null) {
                //     currentLocationGroup.push({
                //         entryIndex: i,
                //         entry,
                //         timestamp: entry.startTime,
                //         lat: 0,
                //         lng: 0,
                //         unknownLocation: true,
                //     })
                // }
                // Then we add the currentTween to the geotaggedEntriesTweens and reset the currentTween
                if (currentTween.length > 0) {
                    currentTween.push({
                        entryIndex: i,
                        entry,
                        timestamp: entry.startTime,
                        lat: lastDefiniteLocation?.lat ?? 0,
                        lng: lastDefiniteLocation?.lng ?? 0,
                        unknownLocation: lastDefiniteLocation == null,
                    })
                    geotaggedEntriesTweens.push(currentTween)
                    currentTween = []
                }
                // Then we add the entry to the geotaggedEntries
                currentLocationGroup.push({
                    entryIndex: i,
                    entry,
                    timestamp: entry.startTime,
                    lat: lastDefiniteLocation?.lat ?? 0,
                    lng: lastDefiniteLocation?.lng ?? 0,
                    unknownLocation: lastDefiniteLocation == null,
                })
            }
        }
        if (currentTween.length > 0) {
            geotaggedEntriesTweens.push(currentTween)
        }
        geotaggedEntries.push(currentLocationGroup)

        setGeotaggedEntries(geotaggedEntries)
        setGeotaggedEntriesTweens(geotaggedEntriesTweens)
    }

    const resetGeotaggedEntries = () => {
        setGeotaggedEntries(null)
        setGeotaggedEntriesTweens(null)
    }

    useEffect(() => {
        if (entries != null) {
            // console.log("New Entries", entries)
            updateLocations(entries)
        } else {
            resetLocations()
        }

        if (filteredEntries != null) {
            // console.log("New Filtered Entries", filteredEntries)
            updateGeotaggedEntries(filteredEntries)
        } else {
            resetGeotaggedEntries()
        }
    }, [entries, filteredEntries])

    return {
        locations,
        splitLocations,
        geotaggedEntries,
        geotaggedEntriesTweens,
    }
}
