"use client"
import { OutputEntry } from "../../interfaces/entryApiInterfaces"
import ReactMarkdown from "react-markdown"

export type TextEntryData = string

interface TextEntryProps {
    entry: OutputEntry<TextEntryData>
}

const TextEntry = ({ entry }: TextEntryProps) => {
    return (
        <div>
            <ReactMarkdown>{entry.data}</ReactMarkdown>
        </div>
    )
}

export default TextEntry
