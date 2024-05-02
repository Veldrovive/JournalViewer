"use client"
import { OutputEntry } from "../../interfaces/entryApiInterfaces"

export type GenericEntryData = any

interface GenericEntryProps {
    entry: OutputEntry<GenericEntryData>
}

const GenericEntry = ({ entry }: GenericEntryProps) => {
    return (
        <div>
            <p>{entry.entryType}</p>
        </div>
    )
}

export default GenericEntry
