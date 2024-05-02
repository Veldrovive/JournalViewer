import { useMemo, useState, useRef, useEffect } from "react";
import { FileInput, Button, Group, Dialog, Stack, Progress } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';

import { InputHandlerInfos, InputHandlerInfo } from '../hooks/useJournalServer'
import { uploadFile, uploadFileWithProgress, InsertionLog } from "../lib/entryApi"

import { handlerTypeToComponentMap } from "./configs";

function HandlerConfig({ handler, apiRoot, refreshInputHandlerInfo }: { handler: InputHandlerInfo, apiRoot: string, refreshInputHandlerInfo: () => void }) {
    const handlerType = handler.config.handlerType
    const handlerName = handler.config.handlerName
    const handlerUuid = handler.config.handlerUuid
    const takesFileInput = handler.takesFileInput

    const [file, setFile] = useState<File>(null)
    const [uploading, setUploading] = useState<boolean>(false)
    const [uploadProgress, setUploadProgress] = useState<number>(0)
    const [alertOpen, { open: openAlert, close: _closeAlert }] = useDisclosure()

    useEffect(() => {
        const interval = setInterval(() => refreshInputHandlerInfo(), 1000)
        refreshInputHandlerInfo()
        return () => clearInterval(interval)
    }, [])

    const handleFileChange = (e: File) => {
        setFile(e)
    }

    const handleUploadProgress = (progress: number) => {
        setUploadProgress(progress)
    }

    const handleUpload = async () => {
        if (file) {
            setUploading(true)
            const res = await uploadFileWithProgress(apiRoot, handlerUuid, file, {}, handleUploadProgress)
            console.log(res)
            setUploading(false)
            updateAndShowAlert(res)
        }
    }

    // const hideAlertTimeout = useRef(null)
    const [alertText, setAlertText] = useState<string>("")
    const updateAndShowAlert = (log: InsertionLog[]) => {
        openAlert()
        setAlertText(`Inserted ${log.length} entries`)
        // clearTimeout(hideAlertTimeout.current)
        // hideAlertTimeout.current = setTimeout(_closeAlert, 5000)
    }

    const closeAlert = () => {
        _closeAlert()
        // clearTimeout(hideAlertTimeout.current)
    }

    const extraConfig = useMemo(() => {
        // Each handler type can define its own configuration component
        // If the handler type is not in the map, we just use null
        const Component = handlerTypeToComponentMap[handlerType] || null
        if (Component) {
            return <Component handler={handler} apiRoot={apiRoot} refreshInputHandlerInfo={refreshInputHandlerInfo} />
        } else {
            return null
        }
    }, [handlerType, handler, apiRoot])

    return (
        <div>
            <h3>{ handlerName }</h3>
            {
                takesFileInput ? (
                    <Group>
                        <Stack spacing={0}>
                            <FileInput onChange={handleFileChange} w={200}/>
                            {
                            uploading ?
                                <Progress
                                    size={"xl"}
                                    value={uploadProgress * 100}
                                    label={uploadProgress < 1 ? `${Math.round(uploadProgress * 100)}%` : "Processing..."}
                                /> : null
                            }
                        </Stack>
                        <Button onClick={handleUpload} loading={uploading}>Upload</Button>
                    </Group>
                ) : null
            }
            { extraConfig }
            <Dialog
                opened={alertOpen}
                withCloseButton
                onClose={closeAlert}
                size="sm"
            >
                <p>{ alertText }</p>
            </Dialog>
        </div>
    )
}

export default function Config({ inputHandlerInfo, refreshInputHandlerInfo, apiRoot, apiAlive }: { inputHandlerInfo: InputHandlerInfos, refreshInputHandlerInfo: () => void, apiRoot: string, apiAlive: boolean }) {

    const handlerConfig = useMemo(() => {
        if (inputHandlerInfo) {
            return Object.keys(inputHandlerInfo).map((handlerId) => {
                const handler = inputHandlerInfo[handlerId]
                return (
                    <HandlerConfig key={handlerId} handler={handler} apiRoot={apiRoot} refreshInputHandlerInfo={refreshInputHandlerInfo} />
                )
            })
        } else {
            return null
        }
    }, [inputHandlerInfo])

    return (
        <div>
            {/* <p>{ apiAlive ? "API Alive" : "API Dead" }</p> */}
            { handlerConfig }
        </div>
    )
}
