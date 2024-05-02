"use client"
import { OutputEntry, FileData } from "../../interfaces/entryApiInterfaces"

interface VideoEntryProps {
    entry: OutputEntry<FileData>
}

const VideoEntry = ({ entry }: VideoEntryProps) => {
    const videoUrl = entry.data.fileUrl

    return (
        <div>
            <video src={videoUrl} controls style={{ maxWidth: "100%" }} />
        </div>
    )
}

export default VideoEntry
