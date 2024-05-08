"use client"
import { OutputEntry } from "../../interfaces/entryApiInterfaces"
import ReactMarkdown from "react-markdown"

import rehypeKatex from 'rehype-katex'
import remarkMath from 'remark-math'
import 'katex/dist/katex.min.css' // `rehype-katex` does not import the CSS for you

export type TextEntryData = string

interface TextEntryProps {
    entry: OutputEntry<TextEntryData>
}

const TextEntry = ({ entry }: TextEntryProps) => {
    return (
        <div>
            <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{entry.data}</ReactMarkdown>
        </div>
    )
}

export default TextEntry
