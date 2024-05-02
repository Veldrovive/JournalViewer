"use client"
import { OutputEntry, FileData } from "../../interfaces/entryApiInterfaces"

interface AudioEntryProps {
    entry: OutputEntry<FileData>
}

const AudioEntry = ({ entry }: AudioEntryProps) => {
    const url = entry.data.fileUrl

    return (
        <div style={{ display: "flex", justifyContent: "center" }}>
            <audio src={url} controls style={{ maxWidth: "100%" }} />
        </div>
    )
}

export default AudioEntry
