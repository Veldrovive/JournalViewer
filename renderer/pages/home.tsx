import React, { useEffect, useMemo, useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { Loader } from '@mantine/core'

import useJournalServer from '../hooks/useJournalServer'

const messageMap: Record<string, string> = {
    'died': 'Lost connection to the Journal Server',
}

// We may get a 'message' query string parameter
export default function HomePage() {
    const router = useRouter()
    const { message }: { message?: string } = router.query

    const { journalServiceAlive, journalDeviceFound } = useJournalServer()
    const [timedOutState, setTimedOutState] = useState('idle')
    const [currentLoadingState, setCurrentLoadingState] = useState('Looking for Journal Server device...')

    useEffect(() => {
        // If the device isn't found, then we are 'Looking for Journal Server device...'
        // If the device is found, but the service isn't alive, then we are 'Connecting to Journal Server...'
        // If the service is alive, we are 'Loading Journal Server...'
        if (!journalDeviceFound) {
            setCurrentLoadingState('Looking for Journal Server device...')
        } else if (journalDeviceFound && !journalServiceAlive) {
            setCurrentLoadingState('Connecting to Journal Server...')
        } else if (journalServiceAlive) {
            setCurrentLoadingState('Loading Journal Server...')
        }
    }, [journalServiceAlive, journalDeviceFound])

    useEffect(() => {
        // When the journal service becomes alive, we move to the entries page
        if (journalServiceAlive) {
            window.location.href = '/entries'
        }
    }, [journalServiceAlive])

        useEffect(() => {
            const final_timeout = setTimeout(() => setTimedOutState('timed_out'), 15000)
            const loading_timeout = setTimeout(() => setTimedOutState('loading'), 500)
            return () => {
                clearTimeout(final_timeout)
                clearTimeout(loading_timeout)
            }
        }, [setTimedOutState])

    const mainContent = useMemo(() => {
        if (timedOutState === 'idle') {
            return null
        } else if (timedOutState === 'loading') {
            return (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", flexDirection: "column" }}>
                    <Loader />
                    { message ? <p>{messageMap[message]}</p> : <p>{currentLoadingState}</p> }
                </div>
            )
        } else if (timedOutState === 'timed_out') {
            return (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", flexDirection: "column" }}>
                    <Loader />
                    {
                        journalDeviceFound ?
                            <>
                                <p>Journal device found, but Journal Server is not responding.</p>
                                <p>Journal Server may have crashed. Try restarting the Journal device.</p>
                            </>
                            :
                            <>
                                <p>Journal device not found.</p>
                                <p>Ensure that Journal Device is on and you are on the same WiFi network.</p>
                            </>
                    }
                </div>
            )
        }
    }, [timedOutState])

  return (
    <>
        <Head>
            <title>Journal Loading Page</title>
        </Head>
        <div style={{ height: '100vh' }}>
            { mainContent }
        </div>
    </>
  )
}
