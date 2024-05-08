"use client"
import { OutputEntry } from "../../interfaces/entryApiInterfaces"
import ReactMarkdown from "react-markdown"

import rehypeKatex from 'rehype-katex'
import remarkMath from 'remark-math'
import 'katex/dist/katex.min.css' // `rehype-katex` does not import the CSS for you

import {Prism as SyntaxHighlighter} from 'react-syntax-highlighter'

export type TextEntryData = string

interface TextEntryProps {
    entry: OutputEntry<TextEntryData>
}

const TextEntry = ({ entry }: TextEntryProps) => {
    return (
        <div>
            <ReactMarkdown
                children={entry.data}
                remarkPlugins={[remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={{
                    code(props) {
                        const {children, className, node, ...rest} = props
                        const match = /language-(\w+)/.exec(className || '')
                        return match ? (
                            <SyntaxHighlighter
                                PreTag="div"
                                children={String(children).replace(/\n$/, '')}
                                language={match[1]}
                            />
                        ) : (
                            <code {...rest} className={className}>
                                {children}
                            </code>
                        )
                    }
                }}
            />
        </div>
    )
}

export default TextEntry
