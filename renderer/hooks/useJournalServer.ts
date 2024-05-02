/*
Defines a hook that keeps the IP address of the journal server as discovered using mDNS
*/

import { useState, useMemo, useEffect, useCallback } from "react"

import { caseFetch } from "../lib/fetch";

export type Service = {
    port: number
    addresses: string[]
};

export type InputHandlerInfo = {
    config: Record<string, any>
    triggerErrors: any[]
    inputFolder: string | null
    handlerState: Record<string, any>
    takesFileInput: boolean
};

export type InputHandlerInfos = Record<string, InputHandlerInfo>

export default function useJournalServer() {
    const [journalService, setJournalService] = useState<Service | null>(null)
    const [journalServiceAlive, setJournalServiceAlive] = useState<boolean>(false)
    const [journalDeviceFound, setJournalDeviceFound] = useState<boolean>(false)
    const [inputHandlerInfo, setInputHandlerInfo] = useState<InputHandlerInfos>(null)

    useEffect(() => {
        if (!window.ipc) {
            setJournalService({ port: 4650, addresses: ['localhost'] })
            return
        }
        window.ipc.on('journal_service', (service: Service) => {
            if (service) {
                setJournalDeviceFound(true)
            } else {
                setJournalDeviceFound(false)
            }
            setJournalService(service)
        })

        window.ipc.send('refresh_services', null)

         // Set a timer to refresh the services every 5 seconds
        const interval = setInterval(() => {
            window.ipc.send('refresh_services', null)
        }, 5000)

        return () => {
            clearInterval(interval)
        }
    }, [])

    const [journalServiceIp, journalServicePort]: [string, number] = useMemo(() => {
        if (journalService) {
            const port = journalService.port
            // Check if we are in dev
            if (journalService.addresses.length === 1 && journalService.addresses[0] === 'localhost') {
                return ['localhost', port]
            }
            // Otherwise search for the first IPv4 address
            for (const address of journalService.addresses) {
                if (address.includes(':')) {
                    continue
                }
                return [address, port]
            }
        }
        return [null, null]
    }, [journalService])


    const hasJournalService: boolean = useMemo(() => journalServiceIp !== null, [journalServiceIp])
    const journalServiceBaseUrl: string | null = useMemo(() => {
        if (journalServiceIp && journalServicePort) {
            return `http://${journalServiceIp}:${journalServicePort}`
        }
        return null
    }, [journalServiceIp, journalServicePort])

    // We also keep a heartbeat on `http://{journalServiceIp}:{journalServicePort}/ping` to check if the server is still alive
    useEffect(() => {
      if (journalServiceIp) {
          const checkJournalService = async () => {
              try {
                  const response = await fetch(`${journalServiceBaseUrl}/ping`)
                  if (response.ok) {
                      setJournalServiceAlive(true)
                  } else {
                      setJournalServiceAlive(false)
                  }
              } catch (error) {
                  setJournalServiceAlive(false)
              }
          }
          const interval = setInterval(checkJournalService, 5000)
          checkJournalService()
          return () => {
              clearInterval(interval)
          }
      }
  }, [journalServiceBaseUrl, setJournalServiceAlive])

  const refreshInputHandlerInfo = useCallback(async () => {
    try {
        const response = await caseFetch(`${journalServiceBaseUrl}/input_handlers`)
        setInputHandlerInfo(response)
    } catch (error) {
        console.error("Failed to fetch input handler info", error)
    }
  }, [journalServiceBaseUrl])

  useEffect(() => {
    if (journalServiceAlive) {
        refreshInputHandlerInfo()
    } else {
        setInputHandlerInfo(null)
    }
  }, [journalServiceAlive, refreshInputHandlerInfo])

    return { journalServiceBaseUrl, journalServiceIp, journalServicePort, hasJournalService, journalServiceAlive, journalDeviceFound, inputHandlerInfo, refreshInputHandlerInfo }
}
