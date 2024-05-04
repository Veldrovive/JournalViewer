import { useState, useMemo, useEffect, useCallback } from "react"
import { fetchEntries } from "../lib/entryApi"
import { OutputFilter, OutputEntry, LocationFilter } from "../interfaces/entryApiInterfaces"

interface UseEntries {
    setStartTime: (startTime: number) => void
    setEndTime: (endTime: number) => void
    startTime: number
    endTime: number
    setEntryTypeWhitelist: (entryTypeWhitelist: string[] | null) => void
    setLocationFilter: (locationFilter: LocationFilter | null) => void
    entries: OutputEntry[] | null
    error: string | null
    loading: boolean
}

export function useEntries(apiRoot: string): UseEntries {
    // Set up the parameters that are used to request entries from the API
    const [startTime, setStartTime] = useState<number>(-1)
    const [endTime, setEndTime] = useState<number>(-1)
    const [entryTypeWhitelist, setEntryTypeWhitelist] = useState<string[] | null>(null)
    const [locationFilter, setLocationFilter] = useState<LocationFilter | null>(null)

    const hasValidParameters: boolean = useMemo(() => {
        return startTime !== -1
    }, [startTime])

    const filterObject: OutputFilter = useMemo(
        () => ({
            timestampAfter: startTime,
            timestampBefore: endTime,
            entryTypes: entryTypeWhitelist,
            location: locationFilter,
        }),
        [startTime, endTime, entryTypeWhitelist, locationFilter]
    )

    // Set up the state that will be returned to the caller
    const [entries, setEntries] = useState<OutputEntry[] | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState<boolean>(false)

    // Fetch entries from the API when the parameters change
    useEffect(() => {
        const updateEntries = async () => {
            if (hasValidParameters && apiRoot) {
                console.log("Fetching entries")
                setLoading(true)
                const newEntries = await fetchEntries(apiRoot, filterObject)
                setLoading(false)
                // console.log("Fetch complete", newEntries)
                setEntries(newEntries)
                if (!newEntries) {
                    setError("Failed to fetch entries")
                } else {
                    setError(null)
                }
            } else {
                setEntries(null)
            }
        }

        updateEntries()
    }, [hasValidParameters, startTime, endTime, entryTypeWhitelist, apiRoot, filterObject, setLoading])

    return {
        setStartTime,
        setEndTime,
        startTime,
        endTime,
        setEntryTypeWhitelist,
        setLocationFilter,
        entries,
        error,
        loading,
    }
}
