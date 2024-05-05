import { useCallback, useEffect, useMemo, useState } from "react"
import { Filter } from "../hooks/usePersistentFilters"

import { Divider } from "@mantine/core"
import { Accordion, AccordionControlProps, Box, ActionIcon, Flex, TextInput, MultiSelect } from '@mantine/core'
import { IconHeart, IconHeartFilled, IconTrash, IconSelect } from "@tabler/icons-react"

const getDayString = (timestamp: number) => {
    // Converts from a timestamp to a string like "April 2nd, 2021"
    const date = new Date(timestamp)
    const day = date.getDate()
    const month = date.toLocaleString('default', { month: 'long' })
    const year = date.getFullYear()

    return `${month} ${day}, ${year}`
}

type ComposedAccordionControlProps = AccordionControlProps & {
    onFilterSelected: (filter: Filter) => void
    setFavorite: (isFavorite: boolean) => void
    setName: (name: string) => void
    deleteFilter: () => void
    filter: Filter
};

function AccordionControl({
    onFilterSelected,
    setFavorite,
    setName,
    deleteFilter,
    filter,
    ...props
}: ComposedAccordionControlProps) {
    return (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Accordion.Control {...props} />
            <ActionIcon size="lg" onClick={() => onFilterSelected(filter)}>
                <IconSelect />
            </ActionIcon>
            <ActionIcon size="lg" onClick={deleteFilter}>
                <IconTrash />
            </ActionIcon>
            <ActionIcon size="lg" onClick={() => setFavorite(!filter.isFavorite)}>
                {filter.isFavorite ? <IconHeartFilled /> : <IconHeart />}
            </ActionIcon>
        </Box>
    )
}

const entryTypeNameMap = {
    'text': 'Text',
    'generic_file': 'File',
    'image_file': 'Image',
    'video_file': 'Video',
    'audio_file': 'Audio',
    'pdf_file': 'PDF',
    'fitbit_activity': 'Fitbit Activity'
}

function FilterElem({
    filter,
    onFilterSelected,
    setFavorite,
    setName,
    setEntryTypes,
    deleteFilter,
    allowedEntryTypes
}: {
    filter: Filter,
    onFilterSelected: (filter: Filter) => void
    setFavorite: (isFavorite: boolean) => void
    setName: (name: string) => void
    setEntryTypes: (entryTypes: string[]) => void
    deleteFilter: () => void
    allowedEntryTypes: string[]
}) {
    const data = useMemo(() => {
        return allowedEntryTypes.map(entryType => {
            return { value: entryType, label: entryTypeNameMap[entryType]}
        })

    }, [allowedEntryTypes])

    const displayName = useMemo(() => {
        if (filter.name) {
            return filter.name
        }
        // Then we construct the name using the dates
        const startDate = getDayString(filter.filter.timestampAfter)
        const endDate = getDayString(filter.filter.timestampBefore)

        if (filter.filter.location ) {
            return `${startDate} - ${endDate} w/ location`
        } else {
            return `${startDate} - ${endDate}`
        }

    }, [filter])

    return <Accordion.Item value={filter.id}>
        <AccordionControl
            onFilterSelected={onFilterSelected}
            setFavorite={setFavorite}
            setName={setName}
            deleteFilter={deleteFilter}
            filter={filter}
        >{ displayName }</AccordionControl>
        <Accordion.Panel>
            <Flex direction="column" align="flex-start" w='100%'>
                <TextInput
                    label="Name"
                    value={filter.name || ''}
                    onChange={(e) => setName(e.currentTarget.value)}
                />
                <MultiSelect
                    label="Entry Types"
                    data={data}
                    value={filter.filter.entryTypes || []}
                    onChange={setEntryTypes}
                />
            </Flex>
        </Accordion.Panel>
    </Accordion.Item>
}

export default function FilterPicker({
    favoriteFilters,
    orderedFilters,
    removeFilter,
    favoriteFilter,
    unfavoriteFilter,
    renameFilter,
    setEntryTypes,
    onFilterSelected,
    onCloseFilterPicker,
    allowedEntryTypes
}: {
    favoriteFilters: Filter[],
    orderedFilters: Filter[],
    removeFilter: (id: string) => void,
    favoriteFilter: (id: string) => void,
    unfavoriteFilter: (id: string) => void,
    renameFilter: (id: string, name: string) => void,
    setEntryTypes: (id: string, entryTypes: string[]) => void,
    onFilterSelected: (filter: Filter) => void,
    onCloseFilterPicker: () => void,
    allowedEntryTypes: string[]
}) {
    const _onFilterSelected = useCallback((filter: Filter) => {
        onFilterSelected(filter)
        onCloseFilterPicker()
    }, [onFilterSelected, onCloseFilterPicker])

    const setFavorite = useCallback((id: string, isFavorite: boolean) => {
        if (isFavorite) {
            favoriteFilter(id)
        } else {
            unfavoriteFilter(id)
        }
    }, [favoriteFilter, unfavoriteFilter])

    const [expandedFavorite, setExpandedFavorite] = useState<string | null>(null)
    const favoriteFiltersElems = useMemo(() => {
        return favoriteFilters.map(filter => {
            return <FilterElem
                key={filter.id}
                filter={filter}
                onFilterSelected={_onFilterSelected}
                setFavorite={isFavorite => setFavorite(filter.id, isFavorite)}
                setName={name => renameFilter(filter.id, name)}
                setEntryTypes={entryTypes => setEntryTypes(filter.id, entryTypes)}
                deleteFilter={() => removeFilter(filter.id)}
                allowedEntryTypes={allowedEntryTypes}
            />
        })
    }, [favoriteFilters, _onFilterSelected])

    const [expandedOrdered, setExpandedOrdered] = useState<string | null>(null)
    const orderedFiltersElems = useMemo(() => {
        return orderedFilters.filter(filter => !filter.isFavorite).map(filter => {
            return <FilterElem
                key={filter.id}
                filter={filter}
                onFilterSelected={_onFilterSelected}
                setFavorite={isFavorite => setFavorite(filter.id, isFavorite)}
                setName={name => renameFilter(filter.id, name)}
                setEntryTypes={entryTypes => setEntryTypes(filter.id, entryTypes)}
                deleteFilter={() => removeFilter(filter.id)}
                allowedEntryTypes={allowedEntryTypes}
            />
        })
    }, [orderedFilters, _onFilterSelected])

    return <div>
        <h3>Favorites</h3>
        <Accordion value={expandedFavorite} onChange={setExpandedFavorite} chevronPosition="left">
            {favoriteFiltersElems}
        </Accordion>
        <Divider />
        <Accordion value={expandedOrdered} onChange={setExpandedOrdered} chevronPosition="left">
            {orderedFiltersElems}
        </Accordion>
    </div>
}
