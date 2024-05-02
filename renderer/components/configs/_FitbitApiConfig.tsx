
import { useEffect, useState } from 'react'
import { InputHandlerInfo } from '../../hooks/useJournalServer'
import { runRpcCommand } from '../../lib/entryApi'

interface FitbitHandlerState {
    rateLimited: boolean
    remainingRequests: number
    secondsTillReset: number
    authorized: boolean
    profile: any
}

export default function FitbitApiConfig({ handler, apiRoot, refreshInputHandlerInfo }: { handler: InputHandlerInfo, apiRoot: string, refreshInputHandlerInfo: () => void }) {
    const handlerState = handler.handlerState as FitbitHandlerState

    const [authUrl, setAuthUrl] = useState<string>("")

    // Get the auth URL
    useEffect(() => {
        async function getAuthUrl() {
            const res = await runRpcCommand(apiRoot, handler.config.handlerUuid, "get_auth_url", { "redirect_uri": "http://localhost:2897" })
            const authUrl = res.url
            console.log("Auth URL:", authUrl)
            setAuthUrl(authUrl)
        }

        if (apiRoot) {
            getAuthUrl()
        }

        window.ipc.on('fitbit-auth', async (code: string) => {
            console.log("Got code", code)
            const res = await runRpcCommand(apiRoot, handler.config.handlerUuid, "set_auth_code", { "auth_code": code })
            console.log("Auth response", res)
            await refreshInputHandlerInfo()
        })
    }, [apiRoot])

    const handleAuth = () => {
        if (!authUrl) {
            console.log("No auth URL")
            return
        }
        console.log("Authenticating")
        window.ipc.send('fitbit-auth', authUrl)
    }

    if (handlerState.rateLimited) {
        return (
            <>
                <p>Seconds Till Reset: {handlerState.secondsTillReset}</p>
            </>
        )
    } else {
        return (
            <>
                { handlerState.authorized ? <p>Logged In As: {handlerState.profile.fullName}</p> : <p>Not Logged In</p> }
                { !handlerState.authorized && <button onClick={handleAuth}>Authorize</button> }
            </>
        )
    }
}
