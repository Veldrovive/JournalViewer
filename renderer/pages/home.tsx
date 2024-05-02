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

    const { journalServiceAlive } = useJournalServer()
    const [timedOutState, setTimedOutState] = useState('idle')

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
                    { message && <p>{messageMap[message]}</p> }
                </div>
            )
        } else if (timedOutState === 'timed_out') {
            return (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", flexDirection: "column" }}>
                    <Loader />
                    <p>Journal Server is not responding.</p>
                    <p>Ensure you are on the same network as the Journal Server.</p>
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
