import { useCallback, useEffect, useRef, useState } from "react"

interface ClickAndDragArgs {
    callback: ({ x, y, event }: { x?: number; y?: number; event?: MouseEvent }) => void
}

interface ClickAndDrag {
    isDragging: boolean
    ref: React.MutableRefObject<any>
}

export function useClickAndDrag({ callback }: ClickAndDragArgs): ClickAndDrag {
    const ref = useRef<any>(null)
    const [isDragging, setIsDragging] = useState<boolean>(false)

    const handleMouseDown = useCallback(
        (event: MouseEvent) => {
            event.stopPropagation()
            event.preventDefault()
            setIsDragging(true)
            callback({ x: event.clientX, y: event.clientY, event })
        },
        [callback]
    )

    const handleMouseMove = useCallback(
        (event: MouseEvent) => {
            event.stopPropagation()
            event.preventDefault()
            if (isDragging) {
                callback({ x: event.clientX, y: event.clientY, event })
            }
        },
        [callback, isDragging]
    )

    const handleMouseUp = useCallback(() => {
        if (isDragging) {
            setIsDragging(false)
        }
    }, [isDragging])

    useEffect(() => {
        const node = ref.current
        if (node) {
            node.addEventListener("mousedown", handleMouseDown)
            window.addEventListener("mousemove", handleMouseMove)
            window.addEventListener("mouseup", handleMouseUp)

            return () => {
                node.removeEventListener("mousedown", handleMouseDown)
                window.removeEventListener("mousemove", handleMouseMove)
                window.removeEventListener("mouseup", handleMouseUp)
            }
        }
    }, [handleMouseDown, handleMouseMove, handleMouseUp])

    return {
        isDragging,
        ref,
    }
}
