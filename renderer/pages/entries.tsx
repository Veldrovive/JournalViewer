import { useMemo, useState, useCallback, useRef, useEffect } from "react"
import Head from 'next/head'

import { useHotkeys, useDisclosure } from "@mantine/hooks"
import { useSearchParams } from 'next/navigation'
import { Flex, Grid, Skeleton, Paper, Button, Modal } from "@mantine/core"
import { IconSettings } from '@tabler/icons-react';

import HerosJourneyMap, { HerosJourneyRef } from "../components/HerosJourneyMap"
import DateRangePicker from "../components/DateRangePicker"
import EntriesList, { ScrollElementValue, EntriesListRef } from "../components/EntriesList"
import Clock from "../components/Clock"
import Providers from "../components/Providers"
import Config from "../components/Config"

import { useClickAndDrag } from "../hooks/useClickAndDrag"
import useJournalServer from '../hooks/useJournalServer'
import { useEntries } from '../hooks/useEntries'
import { GeoLocation, useProcessedEntries } from '../hooks/useProcessedEntries'

import { TriggerLineType } from "../components/ScrollList"

import style from "../styles/entries.module.scss"
import { OutputEntry } from "../interfaces/entryApiInterfaces"

const ENTRY_DISPLAY_TYPE_WHITELIST = ["text", "generic_file", "image_file", "video_file", "audio_file", "pdf_file", "fitbit_activity"]
const ENTRY_DISPLAY_WIDTH = 50

interface ScrollElementMetadata {
    entryGroupIndex: number
    entryIndex: number
}

export default function EntriesPage() {
    const { journalServiceBaseUrl, journalServiceAlive, inputHandlerInfo, refreshInputHandlerInfo } = useJournalServer()
    const {
        setStartTime,
        setEndTime,
        setEntryTypeWhitelist,
        setLocationFilter,
        entries,
        error: entryFetchError,
        loading: entriesLoading,
    } = useEntries(journalServiceBaseUrl)
    const { locations, splitLocations, geotaggedEntries, geotaggedEntriesTweens } = useProcessedEntries(entries, {
        entryTypeWhitelist: ENTRY_DISPLAY_TYPE_WHITELIST,
        splitLocationsDistanceThreshold: 5000,
    })

    const [googleApiKey, setGoogleApiKey] = useState<string | null>(null)

    useEffect(() => {
        window.ipc.on('google-auth', (key: string) => {
            setGoogleApiKey(key)
        })
        window.ipc.send('google-auth', {})
    }, [setGoogleApiKey])

    // useEffect(() => {
    //     console.log("Input Handler Info Changed", inputHandlerInfo)
    // }, [inputHandlerInfo])

    const wasAlive = useRef<boolean>(false)
    useEffect(() => {
        if (journalServiceAlive) {
            wasAlive.current = true
        }
        if (!journalServiceAlive && wasAlive.current) {
            // Move back to the loading page
            window.location.href = '/home?message=died'
        }
    }, [journalServiceAlive])

    useEffect(() => {
        const entryTypeWhitelist = [...ENTRY_DISPLAY_TYPE_WHITELIST, 'geolocation']
        setEntryTypeWhitelist(entryTypeWhitelist)
    }, [setEntryTypeWhitelist])

    const mapRef = useRef<HerosJourneyRef>(null)
    const [currentTime, setCurrentTime] = useState<Date | null>(null)
    const [displayClockDate, setDisplayClockDate] = useState<boolean>(false)

    const searchParams = useSearchParams()
    // Get the start and end time query params
    const startTimeQueryParam = searchParams.get("startTime")
    const endTimeQueryParam = searchParams.get("endTime")

    useEffect(() => {
        if (startTimeQueryParam && endTimeQueryParam) {
            const startTime = parseInt(startTimeQueryParam)
            const endTime = parseInt(endTimeQueryParam)
            setStartTime(startTime)
            setEndTime(endTime)
        }
    }, [startTimeQueryParam, endTimeQueryParam])

    // useEffect(() => {
    //     console.log("Entries updated", entries)
    // }, [entries])

    const entriesListRef = useRef<EntriesListRef<ScrollElementMetadata>>(null)
    const [entriesListWidth, setEntriesListWidth] = useState<number>(ENTRY_DISPLAY_WIDTH)

    useHotkeys([
        ["ArrowLeft", () => setEntriesListWidth(entriesListWidth - 1)],
        ["ArrowRight", () => setEntriesListWidth(entriesListWidth + 1)],
        ["shift+ArrowLeft", () => setEntriesListWidth(entriesListWidth - 10)],
        ["shift+ArrowRight", () => setEntriesListWidth(entriesListWidth + 10)],
    ])
    const onDrag = useCallback(
        ({ x }: { x?: number }) => {
            if (typeof window === "undefined") {
                return
            }
            const percentScreenWidth = Math.floor((x! / window?.innerWidth) * 100)
            console.log(`Percent screen width: ${percentScreenWidth}`)
            setEntriesListWidth(percentScreenWidth - 3)
        },
        [setEntriesListWidth]
    )
    const { ref } = useClickAndDrag({ callback: onDrag })

    const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null)

    const onDateRangeChange = useCallback(
        (dateRange: [Date | null, Date | null]) => {
            // We convert these to start and end times. The start time is the millis for the midnight on the start date
            // The end time is 11:59:59.999 on the end date
            const [startDate, endDate] = dateRange
            if (startDate && endDate) {
                const startTime = startDate.getTime()
                const endTime = endDate.getTime() + 24 * 60 * 60 * 1000 - 1

                // If the start and end time are more than 24 hours apart, we set the display clock date to true
                setDisplayClockDate(endTime - startTime > 24 * 60 * 60 * 1000)

                console.log(`Start time: ${startTime}, End time: ${endTime}`)
                setStartTime(startTime)
                setEndTime(endTime)

                // Set the query string params
                const searchParams = new URLSearchParams()
                searchParams.set("startTime", startTime.toString())
                searchParams.set("endTime", endTime.toString())
                window.history.replaceState({}, "", `${window.location.pathname}?${searchParams.toString()}`)
            }
        },
        [setStartTime, setEndTime]
    )

    const entryListValues = useMemo(() => {
        const entries: (ScrollElementValue<ScrollElementMetadata> | null)[] = []
        if (geotaggedEntries) {
            geotaggedEntries.forEach((entryGroup, entryGroupIndex) => {
                for (let i = 0; i < entryGroup.length; i++) {
                    const entry = entryGroup[i].entry
                    entries.push({
                        metadata: {
                            entryGroupIndex,
                            entryIndex: i,
                        },
                        entry,
                    })
                }
                entries.push(null)
            })
            // Remove the last null
            if (entries.length > 0) {
                entries.pop()
            }
            entriesListRef.current?.scrollToTop()
            return entries
        } else {
            return null
        }
    }, [geotaggedEntries])

    const clockMarkers = useMemo(() => {
        // Very similar to the entryListValues code above
        const markers: { time: Date; value: { entryGroupIndex: number; entryIndex: number }; highlighted: boolean }[] =
            []
        if (geotaggedEntries) {
            geotaggedEntries.forEach((entryGroup, entryGroupIndex) => {
                if (entryGroup.length === 0) {
                    return
                }
                for (let entryIndex = 0; entryIndex < entryGroup.length; entryIndex++) {
                    const entry = entryGroup[entryIndex].entry
                    markers.push({
                        time: new Date(entry.startTime),
                        value: { entryGroupIndex, entryIndex },
                        highlighted: false,
                    })
                }
            })
            return markers
        } else {
            return null
        }
    }, [geotaggedEntries])

    const onCenter = useCallback(
        (value: ScrollElementValue<ScrollElementMetadata> | null, percentY: number) => {
            if (value) {
                const { entryGroupIndex, entryIndex } = value.metadata
                const entryGroup = geotaggedEntries![entryGroupIndex]
                const geolocation = entryGroup[entryIndex]
                setCurrentTime(new Date(geolocation.entry.startTime))
                if (!geolocation.unknownLocation) {
                    setCurrentLocation(entryGroup[0])
                }
            }
        },
        [geotaggedEntries]
    )

    const onListEntryClicked = useCallback(
        (value: ScrollElementValue<ScrollElementMetadata> | null) => {
            if (value) {
                const { entryGroupIndex, entryIndex } = value.metadata
                const entryGroup = geotaggedEntries![entryGroupIndex]
                const geolocation = entryGroup[entryIndex]
                mapRef.current?.focusOnEntry(geolocation)
            }
        },
        [geotaggedEntries]
    )

    const onGeotaggedEntryClick = useCallback(
        (entryGroup: GeoLocation[], entryGroupIndex: number) => {
            console.log(`Geotagged entry clicked:`, entryGroup, entryGroupIndex)
            // We need to find the index of this element in the entryListValues array by adding up the lengths of the previous entry groups
            let index = 0
            for (let i = 0; i < entryGroupIndex; i++) {
                index += geotaggedEntries![i].length + 1
            }
            // index += entryGroup.length - 1
            console.log(`Index: ${index}`)
            entriesListRef.current?.scrollTo(index)
        },
        [geotaggedEntries]
    )

    const onGeolocationClick = useCallback(
        (loc: GeoLocation) => {
            setCurrentTime(new Date(loc.entry.startTime))
            const location = { lat: loc.lat!, lng: loc.lng! }
            setCurrentLocation(location)
        },
        [setCurrentTime]
    )

    const onClockMarkerClick = useCallback(
        (value: { entryGroupIndex: number; entryIndex: number } | null) => {
            // The same as when a geotagged entry is clicked
            console.log(`Clock marker clicked:`, value)
            if (!value) {
                return
            }
            let index = 0
            for (let i = 0; i < value.entryGroupIndex; i++) {
                index += geotaggedEntries![i].length + 1
            }
            index += value.entryIndex
            console.log(`Index: ${index}`)
            entriesListRef.current?.scrollTo(index)
        },
        [geotaggedEntries]
    )

    const entriesComponent = useMemo(() => {
        if (entryFetchError) {
            return (
                <Flex h="100%" align="center" justify="center" style={{ color: "red" }}>
                    {entryFetchError}
                </Flex>
            )
        } else if (entriesLoading) {
            return (
                <div style={{ padding: "8px" }}>
                    <Skeleton height={50} circle mb="xl" />
                    <Skeleton height={8} radius="xl" />
                    <Skeleton height={8} mt={6} radius="xl" />
                    <Skeleton height={8} mt={6} width="70%" radius="xl" />
                    <Skeleton height={8} mt={20} radius="xl" />
                    <Skeleton height={8} mt={6} radius="xl" />
                    <Skeleton height={8} mt={6} width="70%" radius="xl" />
                    <Skeleton height={8} mt={20} radius="xl" />
                    <Skeleton height={8} mt={6} radius="xl" />
                    <Skeleton height={8} mt={6} width="70%" radius="xl" />
                </div>
            )
        } else if (!entryListValues || entryListValues!.length === 0) {
            return (
                <Flex h="100%" align="center" justify="center">
                    No entries found
                </Flex>
            )
        } else {
            return (
                <EntriesList
                    entries={entryListValues}
                    onCenter={onCenter}
                    onClick={onListEntryClicked}
                    inCenterStyle={{ outline: "1px solid rgba(189, 195, 199, 0.5)" }}
                    triggerLineType={TriggerLineType.FollowMouse}
                    triggerLineStaticPosition={typeof window === "undefined" ? 0 : window?.innerHeight / 6}
                    triggerLineScrollEndPadding={0}
                    triggerLineScrollStartPadding={0}
                    visualizeTriggerLine={false}
                    ref={entriesListRef}
                />
            )
        }
    }, [entryFetchError, entriesLoading, entryListValues, onCenter])


    const [settingsOpen, { open: openSettings, close: closeSettings }] = useDisclosure(false)

    return (
        <>
            <Head>
                <title>Journal Entries</title>
            </Head>
            <Providers>
                <Modal opened={settingsOpen} onClose={closeSettings} title="Configuration">
                    <Config inputHandlerInfo={inputHandlerInfo} refreshInputHandlerInfo={refreshInputHandlerInfo} apiRoot={journalServiceBaseUrl} apiAlive={journalServiceAlive} />
                </Modal>
                <Grid className={style["main-grid"]} columns={100}>
                    <Grid.Col span={5} className={`${style["main-grid__item"]} ${style["clock-container"]}`}>
                        <Clock
                            time={currentTime}
                            twentyFourHour={false}
                            displayAmPm={true}
                            zeroPad={false}
                            displayCurrentTime={true}
                            displayDate={displayClockDate}
                            markers={clockMarkers}
                            onMarkerClick={onClockMarkerClick}
                        ></Clock>
                    </Grid.Col>
                    <Grid.Col span={entriesListWidth} className={`${style["main-grid__item"]} ${style["entries-container"]}`}>
                        <Flex direction="row" h="100%">
                            <div style={{ position: "relative", width: "calc(100% - 13px)" }}>
                                <Paper w="100%" h="100%" pos="relative" shadow="sm" px="xs">
                                    {entriesComponent}
                                </Paper>
                            </div>
                            <div className={style["entries-drag-indicator"]} ref={ref}>
                                <div className={style["drag-handle"]}></div>
                            </div>
                        </Flex>
                    </Grid.Col>
                    <Grid.Col
                        span={100 - entriesListWidth - 5}
                        className={`${style["main-grid__item"]} ${style["map-container"]}`}
                    >
                        <div className={style["date-picker-positioner"]}>
                            <div
                                style={{
                                    padding: "10px",
                                    backgroundColor: "white",
                                    margin: "5px",
                                    borderRadius: "10px",
                                    minWidth: "50%",
                                    display: "flex",
                                    flexDirection: "row",
                                    alignItems: "flex-end",
                                    justifyContent: "space-between",
                                }}
                            >
                                <DateRangePicker onDateRangeChange={onDateRangeChange} />
                                <Button onClick={openSettings} variant="subtle" ml={5}><IconSettings /></Button>
                            </div>
                        </div>
                        {
                            googleApiKey && <HerosJourneyMap
                                googleApiKey={googleApiKey}
                                splitLocations={splitLocations}
                                geotaggedEntries={geotaggedEntries}
                                currentLocation={currentLocation}

                                onGeotaggedEntryClick={onGeotaggedEntryClick}
                                onGeolocationClick={onGeolocationClick}
                                onAreaSelect={setLocationFilter}

                                ref={mapRef}
                            ></HerosJourneyMap>
                        }
                    </Grid.Col>
                </Grid>
            </Providers>
        </>
    )
}