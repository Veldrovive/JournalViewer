"use client"
import { useState } from "react"
import { OutputEntry, FileData } from "../../interfaces/entryApiInterfaces"

import { pdfjs, Document, Page } from "react-pdf"
import { useElementSize } from "@mantine/hooks"
import { Pagination } from "@mantine/core"

if (typeof window !== 'undefined') {
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.js',
      import.meta.url,
    ).toString();
  }

interface PdfEntryProps {
    entry: OutputEntry<FileData>
}

const PdfEntry = ({ entry }: PdfEntryProps) => {
    const pdfUrl = entry.data.fileUrl
    const { ref, width, height } = useElementSize();
    const [page, setPage] = useState<number>(1)
    const [numPages, setNumPages] = useState<number | null>(null)
    const onPdfLoad = (pdfInfo: any) => {
        setNumPages(pdfInfo.numPages)
    }

    return (
        <div style={{ width: "100%", display: 'flex', flexDirection: 'column', alignItems: 'center' }} ref={ref}>
            {
                numPages != null ? <Pagination my="0.5rem" total={numPages} value={page} onChange={setPage} /> : null
            }
            <Document file={pdfUrl} onLoadSuccess={onPdfLoad}>
                <Page pageNumber={page} width={width} renderTextLayer={false} renderAnnotationLayer={false}/>
            </Document>
        </div>
    )
}

export default PdfEntry
