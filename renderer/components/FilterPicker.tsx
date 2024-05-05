import { useCallback, useMemo, useState } from "react"
import { Filter } from "../hooks/usePersistentFilters"
import { OutputFilter } from "../interfaces/entryApiInterfaces"

import { Button, Divider } from "@mantine/core"
import { Accordion, AccordionControlProps, Box, ActionIcon, Flex, TextInput } from '@mantine/core'
import { IconHeart, IconHeartFilled, IconTrash, IconSelect } from "@tabler/icons-react"

const getDayString = (timestamp: number) => {
    // Converts from a timestamp to a string like "April 2nd, 2021"
    const date = new Date(timestamp)
    const day = date.getDate()
    const month = date.toLocaleString('default', { month: 'long' })
    const year = date.getFullYear()

    return `${month} ${day}, ${year}`
}

// Compose AccordianControlProps with onFilterSelected, setFavorite, setName, deleteFilter, and filter
type ComposedAccordionControlProps = AccordionControlProps & {
    onFilterSelected: (filter: Filter) => void;
    setFavorite: (isFavorite: boolean) => void;
    setName: (name: string) => void;
    deleteFilter: () => void;
    filter: Filter;
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
    );
  }

function FilterElem({
    filter,
    onFilterSelected,
    setFavorite,
    setName,
    deleteFilter,
}: {
    filter: Filter,
    onFilterSelected: (filter: Filter) => void
    setFavorite: (isFavorite: boolean) => void
    setName: (name: string) => void
    deleteFilter: () => void
}) {
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

    const onFavorite = useCallback(() => {
        setFavorite(!filter.isFavorite)
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
            <Flex direction="column" align="center" w='100%'>
                <Flex w='100%'>
                    <TextInput
                        label="Name"
                        value={filter.name || ''}
                        onChange={(e) => setName(e.currentTarget.value)}
                    />
                </Flex>
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
    onFilterSelected
}: {
    favoriteFilters: Filter[],
    orderedFilters: Filter[],
    removeFilter: (id: string) => void,
    favoriteFilter: (id: string) => void,
    unfavoriteFilter: (id: string) => void,
    renameFilter: (id: string, name: string) => void,
    onFilterSelected: (filter: Filter) => void
}) {
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
                onFilterSelected={onFilterSelected}
                setFavorite={isFavorite => setFavorite(filter.id, isFavorite)}
                setName={name => renameFilter(filter.id, name)}
                deleteFilter={() => removeFilter(filter.id)}
            />
        })
    }, [favoriteFilters, onFilterSelected])

    const [expandedOrdered, setExpandedOrdered] = useState<string | null>(null)
    const orderedFiltersElems = useMemo(() => {
        return orderedFilters.filter(filter => !filter.isFavorite).map(filter => {
            return <FilterElem
                key={filter.id}
                filter={filter}
                onFilterSelected={onFilterSelected}
                setFavorite={isFavorite => setFavorite(filter.id, isFavorite)}
                setName={name => renameFilter(filter.id, name)}
                deleteFilter={() => removeFilter(filter.id)}
            />
        })
    }, [orderedFilters, onFilterSelected])

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
