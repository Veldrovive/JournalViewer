"use client"
import { useEffect, ReactNode, useRef, useCallback } from "react"
import { useIntersection } from "@mantine/hooks"

interface ScrollElementProps<T> {
    value: T
    onCenter: (value: T, percentY: number) => void
    onClick: (value: T) => void
    triggerLine: number
    children: ReactNode
    scrollBoxRef?: React.MutableRefObject<HTMLDivElement | null>
    id?: string
    style: React.CSSProperties
}

const ScrollElement = <T,>({
    value,
    onCenter,
    onClick,
    triggerLine,
    children,
    scrollBoxRef,
    id,
    style,
}: ScrollElementProps<T>) => {
    const { ref: intersectionRef, entry } = useIntersection({ threshold: 0 })
    const elementRef = useRef<HTMLDivElement | null>(null)

    useEffect(() => {
        if (entry && entry.isIntersecting) {
            const handleScroll = () => {
                const rect = elementRef.current?.getBoundingClientRect()
                if (!rect) return

                const elementTop = rect.top
                const elementBottom = rect.bottom
                const elementHeight = elementBottom - elementTop

                if (elementTop <= triggerLine && elementBottom >= triggerLine) {
                    const percentY = ((triggerLine - elementTop) / elementHeight) * 100
                    onCenter(value, percentY)
                }
            }

            const scrollBox = scrollBoxRef?.current ?? window
            scrollBox.addEventListener("scroll", handleScroll)
            handleScroll()

            return () => {
                scrollBox.removeEventListener("scroll", handleScroll)
            }
        }
    }, [elementRef, value, onCenter, triggerLine, scrollBoxRef, entry])

    const refFunc = useCallback(
        (node: HTMLDivElement | null) => {
            if (node) {
                elementRef.current = node
                intersectionRef(node)
            }
        },
        [intersectionRef]
    )

    return (
        <div ref={refFunc} style={{ width: "100%", margin: 0, padding: 0, border: "none", ...style }} id={id} onClick={() => onClick(value)}>
            {children}
        </div>
    )
}

export default ScrollElement
