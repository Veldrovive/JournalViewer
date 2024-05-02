/*
This folder holds the render logic for all entry types.
It maps from the entryType parameter to a component used to render the entry.
It also exports a function that takes an OutputEntry object and returns a ReactElement.
*/

import { OutputEntry } from "../../interfaces/entryApiInterfaces"

import GenericEntry, { GenericEntryData } from "./_GenericEntry"
import TextEntry, { TextEntryData } from "./_TextEntry"
import ImageEntry from "./_ImageEntry"
import VideoEntry from "./_VideoEntry"
import AudioEntry from "./_AudioEntry"
import PdfEntry from "./_PdfEntry"
import FitBitActivityEntry from "./_FitBitActivityEntry"

export const entryTypeToComponentMap: Record<string, React.FC<any>> = {
    text: TextEntry,
    image_file: ImageEntry,
    video_file: VideoEntry,
    audio_file: AudioEntry,
    pdf_file: PdfEntry,
    fitbit_activity: FitBitActivityEntry,
}

export function processEntry(entry: OutputEntry): React.ReactElement {
    const entryType = entry.entryType

    for (const [key, Component] of Object.entries(entryTypeToComponentMap)) {
        if (key === entryType) {
            return <Component entry={entry} />
        }
    }

    return <GenericEntry entry={entry} />
}
