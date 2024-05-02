import { OutputFilter, OutputEntry } from "../interfaces/entryApiInterfaces"
import { caseFetch } from "./fetch"

export async function fetchEntries(apiRoot: string, filter: OutputFilter): Promise<OutputEntry[] | null> {
    const params = new URLSearchParams()

    if (filter.timestampAfter) {
        params.append("start_time", filter.timestampAfter.toString())
    }

    if (filter.timestampBefore) {
        params.append("end_time", filter.timestampBefore.toString())
    }

    if (filter.location) {
        // params.append("location_lat", filter.location.center[0].toString())
        // params.append("location_lon", filter.location.center[1].toString())
        // params.append("location_radius", filter.location.radius.toString())
        params.append("min_lat", filter.location.minLat.toString())
        params.append("max_lat", filter.location.maxLat.toString())
        params.append("min_lng", filter.location.minLng.toString())
        params.append("max_lng", filter.location.maxLng.toString())
    }

    if (filter.entryTypes) {
        for (const entryType of filter.entryTypes) {
            params.append("type_whitelist", entryType)
        }
    }

    if (filter.inputHandlerIds) {
        for (const inputSourceId of filter.inputHandlerIds) {
            params.append("input_handler_ids", inputSourceId)
        }
    }

    if (filter.groupIds) {
        for (const sourceUuid of filter.groupIds) {
            params.append("group_ids", sourceUuid)
        }
    }

    const url = `${apiRoot}/output/entries?${params.toString()}`
    console.log(`Fetching entries from ${url}`)
    try {
        const response = await caseFetch(url)
        return response
    } catch (e) {
        return null
    }
}

export type InsertionLog = {
    entry_uuid: string
    error: string | null
    mutated: boolean
    success: boolean
}

export async function uploadFile(apiRoot: string, handlerId: string, file: File, metadata: any): Promise<InsertionLog[]> {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("metadata", JSON.stringify(metadata))

    const url = `${apiRoot}/input_handlers/${handlerId}/request_trigger`
    console.log(`Uploading file to ${url}`)
    try {
        const res = await fetch(url, {
            method: "POST",
            body: formData
        })
        if (!res.ok) {
            console.error("Failed to upload file", res)
            return null
        }
        const data = await res.json()
        const success = data.success
        if (!success) {
            console.error("Failed to upload file", data)
            return null
        }
        return data.entry_insertion_log
    } catch (e) {
        console.error("Failed to upload file", e)
        return null
    }
}

export async function uploadFileWithProgress(apiRoot: string, handlerId: string, file: File, metadata: any, onProgress: (progress: number) => void): Promise<InsertionLog[]> {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("metadata", JSON.stringify(metadata))

    const url = `${apiRoot}/input_handlers/${handlerId}/request_trigger`
    console.log(`Uploading file to ${url}`)
    try {
        const xhr = new XMLHttpRequest();
        xhr.withCredentials = false;
        xhr.open("POST", url, true);
        xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
                onProgress(e.loaded / e.total)
            }
        }
        xhr.send(formData)
        const res = await new Promise<XMLHttpRequest>((resolve, reject) => {
            xhr.onload = () => resolve(xhr)
            xhr.onerror = () => reject(xhr)
        })
        if (res.status !== 200) {
            console.error("Failed to upload file", res)
            return null
        }
        const data = JSON.parse(res.responseText)
        const success = data.success
        if (!success) {
            console.error("Failed to upload file", data)
            return null
        }
        return data.entry_insertion_log
    } catch (e) {
        console.error("Failed to upload file", e)
        return []
    }
}

export async function runRpcCommand(apiRoot: string, handlerId: string, rpcName: string, body: Record<string, any>): Promise<any> {
    const url = `${apiRoot}/input_handlers/${handlerId}/rpc/${rpcName}`
    console.log(`Running RPC command on ${url}`)
    try {
        const res = await fetch(url, {
            method: "POST",
            body: JSON.stringify(body),
            headers: {
                'Content-Type': 'application/json'
            }
        })
        if (!res.ok) {
            console.error("Failed to run RPC command", res)
            return null
        }
        const data = await res.json()
        return data
    } catch (e) {
        console.error("Failed to run RPC command", e)
        return null
    }
}
