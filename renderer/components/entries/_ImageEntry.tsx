"use client"
import { OutputEntry, FileData } from "../../interfaces/entryApiInterfaces"
import { Image } from "@mantine/core"

interface ImageEntryProps {
    entry: OutputEntry<FileData>
}

const ImageEntry = ({ entry }: ImageEntryProps) => {
    const imageUrl = entry.data.fileUrl

    return (
        <div>
            <Image src={imageUrl} alt={entry.entryType} />
        </div>
    )
}

export default ImageEntry
