"use client"
import { OutputEntry, FileData } from "../../interfaces/entryApiInterfaces"
import { useDisclosure } from "@mantine/hooks"
import { Image, ActionIcon, Modal } from "@mantine/core"
import { IconMaximize } from "@tabler/icons-react"
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch"

interface ImageEntryProps {
    entry: OutputEntry<FileData>
}

const ImageEntry = ({ entry }: ImageEntryProps) => {
    const imageUrl = entry.data.fileUrl

    const [opened, { open, close }] = useDisclosure(false);

    const goFullScreen = (e) => {
        e.stopPropagation()  // Prevent the map from updating
        open()
    }

    return (
        <div style={{ position: 'relative' }}>
            <Image src={imageUrl} alt={entry.entryType} />
            <ActionIcon style={{ position: 'absolute', top: 5, left: 5 }} size="lg" onClick={goFullScreen}>
                <IconMaximize />
            </ActionIcon>
            <Modal.Root opened={opened} onClose={close} size="auto" centered onClick={e => e.stopPropagation()}>
                <Modal.Overlay opacity={0.7} blur={3} />
                <Modal.Content style={{ backgroundColor: "rgba(0, 0, 0, 0.15)" }}>
                    <Modal.Body style={{ padding: 0 }}>
                        <ActionIcon style={{ zIndex: 10, position: 'absolute', top: 5, left: 5 }} size="lg" onClick={close}>
                            <IconMaximize />
                        </ActionIcon>
                        <TransformWrapper>
                            <TransformComponent>
                                <Image src={imageUrl} alt={entry.entryType}/>
                            </TransformComponent>
                        </TransformWrapper>
                    </Modal.Body>
                </Modal.Content>
            </Modal.Root>
        </div>
    )
}

export default ImageEntry
