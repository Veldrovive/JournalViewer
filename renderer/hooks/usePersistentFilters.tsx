/*
This hook provides access to previously used filters.
It also provides ways to name specific filters and favorite them.
It persists the filters

SHOULD PROBABLY BE A CONTEXT
*/

import { useState, useEffect, useCallback, useMemo } from 'react'
import { OutputFilter } from "../interfaces/entryApiInterfaces"

const MAX_NON_FAVORITE_FILTERS = 10

const saveFilters = (obj: Record<string, Filter>) => {
    window.ipc.send('save', { key: 'filters', value: obj})
}

const recoverFilters = () => {
    return new Promise((resolve: (arg: Record<string, Filter> | null) => void, reject) => {
        console.log('Recovering filters')
        window.ipc.on('load', (arg: Record<string, Filter> | null) => {
            resolve(arg)
        })
        window.ipc.send('load', 'filters')
    })
}

export interface Filter {
    name: string | null
    filter: OutputFilter
    isFavorite: boolean
    tags: string[]
    id: string
    addedTime: number
}

export default function usePersistentFilters() {
    const [filters, setFilters] = useState<Record<string, Filter>>({})

    useEffect(() => {
        const loadFilters = async () => {
            const filters = await recoverFilters()
            console.log('Loaded filters', filters)
            setFilters(filters || {})
        }
        loadFilters()
    }, [])

    useEffect(() => {
        if (filters && Object.keys(filters).length > 0) {
            // console.log('Saving filters', filters)
            saveFilters(filters)
        }
    }, [filters])

    const addFilter = useCallback((name: string, filter: OutputFilter, tags: string[]) => {
        const id = Math.random().toString(36).substring(7)
        setFilters(filters => {
            // Add the new filter and delete the oldest non-favorite filters if we have too many
            const newFilters = { ...filters, [id]: { name, filter, isFavorite: false, tags, id, addedTime: Date.now() } }
            const nonFavoriteFilters = Object.values(newFilters).filter(f => !f.isFavorite)
            if (nonFavoriteFilters.length > MAX_NON_FAVORITE_FILTERS) {
                const sortedNonFavoriteFilters = nonFavoriteFilters.sort((a, b) => a.addedTime - b.addedTime)
                const numToDelete = nonFavoriteFilters.length - MAX_NON_FAVORITE_FILTERS
                for (let i = 0; i < numToDelete; i++) {
                    delete newFilters[sortedNonFavoriteFilters[i].id]
                }
            }
            return newFilters
        })
        return id
    }, [setFilters])

    const addFilterSimple = useCallback((filter: OutputFilter) => {
        return addFilter(null, filter, [])
    }, [addFilter])

    const removeFilter = useCallback((id: string) => {
        setFilters(filters => {
            const newFilters = { ...filters }
            delete newFilters[id]
            return newFilters
        })
    }, [setFilters])

    const favoriteFilter = useCallback((id: string) => {
        setFilters(filters => {
            return {
                ...filters,
                [id]: {
                    ...filters[id],
                    isFavorite: true
                }
            }
        })
    }, [setFilters])

    const unfavoriteFilter = useCallback((id: string) => {
        setFilters(filters => {
            return {
                ...filters,
                [id]: {
                    ...filters[id],
                    isFavorite: false
                }
            }
        })
    }, [setFilters])

    const renameFilter = useCallback((id: string, name: string) => {
        setFilters(filters => {
            return {
                ...filters,
                [id]: {
                    ...filters[id],
                    name
                }
            }
        })
    }, [setFilters])

    const addTag = useCallback((id: string, tag: string) => {
        setFilters(filters => {
            return {
                ...filters,
                [id]: {
                    ...filters[id],
                    tags: [...filters[id].tags, tag]
                }
            }
        })
    }, [setFilters])

    const removeTag = useCallback((id: string, tag: string) => {
        setFilters(filters => {
            return {
                ...filters,
                [id]: {
                    ...filters[id],
                    tags: filters[id].tags.filter(t => t !== tag)
                }
            }
        })
    }, [setFilters])

    const setFilterEntryTypes = useCallback((id: string, entryTypes: string[]) => {
        console.log('Setting entry types', id, entryTypes)
        setFilters(filters => {
            return {
                ...filters,
                [id]: {
                    ...filters[id],
                    filter: {
                        ...filters[id].filter,
                        entryTypes
                    }
                }
            }
        })
    }, [setFilters])

    const favoriteFilters = useMemo(() => {
        return Object.values(filters).filter(f => f.isFavorite).sort((a, b) => b.addedTime - a.addedTime)
    }, [filters])

    const orderedFilters = useMemo(() => {
        return Object.values(filters).sort((a, b) => b.addedTime - a.addedTime)
    }, [filters])

    return { addFilter, addFilterSimple, removeFilter, favoriteFilter, unfavoriteFilter, renameFilter, addTag, removeTag, setFilterEntryTypes, favoriteFilters, orderedFilters }
}
