"use client"
import {
    useState,
    ReactNode,
    useEffect,
    useRef,
    useCallback,
    useMemo,
    forwardRef,
    ForwardedRef,
    useImperativeHandle,
} from "react"
import ScrollElement from "./ScrollElement"
import { throttle } from "throttle-debounce"

declare module "react" {
    function forwardRef<T, P = {}>(
        render: (props: P, ref: React.Ref<T>) => React.ReactNode | null
    ): (props: P & React.RefAttributes<T>) => React.ReactNode | null
}

// Define a type that is a list of objects with keys "value" and "component" where value is a generic type T and component is a ReactNode
type ScrollListElement<T> = {
    value: T
    component: ReactNode
    triggerable: boolean
}

// Create an enum for trigger line type which is "static", "followMouse", or "followScroll"
export enum TriggerLineType {
    Static = "static",
    FollowMouse = "followMouse",
    FollowScroll = "followScroll",
}

interface ScrollListProps<T> {
    elements: ScrollListElement<T>[]
    onCenter: (value: T, percentY: number) => void
    onClick: (value: T) => void
    inCenterStyle: React.CSSProperties
    triggerLineType?: TriggerLineType
    triggerLineStaticPosition?: number
    triggerLineScrollStartPadding?: number
    triggerLineScrollEndPadding?: number
    visualizeTriggerLine?: boolean
}

export interface ScrollListRef<T> {
    scrollTo: (value: T | number) => Promise<boolean>
    scrollToTop: () => void
}

const notScrolling = (element: HTMLElement | null) => {
    // Resolves when a scroll event has not been fired for 50ms
    if (!element) return Promise.resolve()
    return new Promise<void>((resolve) => {
        let timeout: NodeJS.Timeout
        const handleScroll = () => {
            clearTimeout(timeout)
            timeout = setTimeout(() => {
                element.removeEventListener("scroll", handleScroll)
                resolve()
            }, 50)
        }
        element.addEventListener("scroll", handleScroll)
        handleScroll()
    })
}

const ScrollList = forwardRef(function ScrollList<T>(
    {
        elements,
        onCenter,
        onClick,
        inCenterStyle,
        triggerLineType = TriggerLineType.FollowMouse,
        triggerLineStaticPosition,
        triggerLineScrollStartPadding = 0,
        triggerLineScrollEndPadding = 0,
        visualizeTriggerLine = false,
    }: ScrollListProps<T>,
    ref: ForwardedRef<ScrollListRef<T>>
) {
    const [triggerLine, setTriggerLine] = useState<number>(0)
    const scrollBoxRef = useRef<HTMLDivElement | null>(null)
    const throttledOnCenter = useMemo(() => throttle(100, onCenter), [onCenter])
    const [centeredIndex, setCenteredIndex] = useState<number | null>(null)

    useImperativeHandle(ref, () => ({
        scrollTo: async (value: T | number) => {
            let scrollIndex = -1
            if (typeof value !== "number") {
                const element = elements.find((element) => element.value === value)
                if (!element) return false
                scrollIndex = elements.indexOf(element)
            } else {
                scrollIndex = value
            }

            if (scrollIndex === -1) return false
            const scrollElementId = `scroll-element-${scrollIndex}`

            const scrollElement = document.getElementById(scrollElementId)
            if (!scrollElement) return false

            // Scroll such that the element lies at the top of the trigger line
            scrollElement.scrollIntoView({ behavior: "smooth" })
            await notScrolling(scrollBoxRef.current)

            // Place the trigger line in the middle of the scroll element
            const rect = scrollElement.getBoundingClientRect()
            const elementTop = rect.top
            const elementBottom = rect.bottom
            const elementHeight = elementBottom - elementTop
            const newTriggerLine = elementTop + elementHeight / 2
            setTriggerLine(newTriggerLine)
            return true
        },
        scrollToTop: () => {
            if (!scrollBoxRef.current) return
            scrollBoxRef.current.scrollTop = 0
        },
    }))

    useEffect(() => {
        const handleScroll = () => {
            if (!scrollBoxRef.current) return
            if (triggerLineType === TriggerLineType.FollowScroll) {
                // Get the top and bottom of the scrollbox relative to the viewport
                const rect = scrollBoxRef.current.getBoundingClientRect()
                const scrollBoxTop = rect.top
                const scrollBoxBottom = rect.bottom
                const scrollBoxHeight = scrollBoxBottom - scrollBoxTop
                const paddedScrollBoxTop =
                    scrollBoxHeight - (triggerLineScrollStartPadding! + triggerLineScrollEndPadding!)

                // Calculate the scrollable height of the content within the scroll box
                const scrollHeight = scrollBoxRef.current.scrollHeight
                const clientHeight = scrollBoxRef.current.clientHeight
                const scrollableHeight = scrollHeight - clientHeight

                // Calculate the current scroll position of the scroll box
                const scrollTop = scrollBoxRef.current.scrollTop

                // Calculate the % of the scrollbar that has been scrolled
                const scrollPercent = (scrollTop / scrollableHeight) * 100

                // Linearly interpolate the trigger line between the top and bottom
                const newTriggerLine =
                    scrollBoxTop + triggerLineScrollStartPadding! + paddedScrollBoxTop * (scrollPercent / 100)

                // Round to the nearest integer
                const roundedTriggerLine = Math.round(newTriggerLine)

                setTriggerLine(roundedTriggerLine)
            }
        }

        const scrollBox = scrollBoxRef?.current ?? window
        scrollBox.addEventListener("scroll", handleScroll)
        handleScroll() // Call once initially to set

        return () => {
            scrollBox.removeEventListener("scroll", handleScroll)
        }
    }, [scrollBoxRef, triggerLineScrollEndPadding, triggerLineScrollStartPadding, triggerLineType])

    useEffect(() => {
        if (triggerLineType === TriggerLineType.Static) {
            const halfHeight = window.innerHeight / 2
            setTriggerLine(triggerLineStaticPosition ?? halfHeight)
        }
    }, [triggerLineType, triggerLineStaticPosition])

    useEffect(() => {
        const handleMouseMove = (event: MouseEvent) => {
            if (triggerLineType === TriggerLineType.FollowMouse) {
                setTriggerLine(event.clientY)
            }
        }

        const scrollBoxElement = scrollBoxRef.current
        if (!scrollBoxElement) return
        scrollBoxElement.addEventListener("mousemove", handleMouseMove)
        return () => {
            scrollBoxElement.removeEventListener("mousemove", handleMouseMove)
        }
    }, [scrollBoxRef, triggerLineType])

    const handleCenter = useCallback(
        (index: number, value: T, percentY: number) => {
            setCenteredIndex(index)
            throttledOnCenter(value, percentY)
        },
        [throttledOnCenter]
    )

    const visualizedTriggerLine = useMemo(
        () => (
            <div
                style={{
                    position: "absolute",
                    top: `${triggerLine}px`,
                    width: "100%",
                    height: "2px",
                    backgroundColor: "red",
                    pointerEvents: "none",
                }}
            />
        ),
        [triggerLine]
    )

    return (
        <div ref={scrollBoxRef} style={{ overflowY: "scroll", height: "100%" }}>
            {elements.map((element, index) => (
                <ScrollElement
                    key={index}
                    value={element.value}
                    onCenter={(value: T, percentY: number) =>
                        element.triggerable ? handleCenter(index, value, percentY) : null
                    }
                    onClick={(value: T) => (element.triggerable ? onClick(value) : null)}
                    triggerLine={triggerLine}
                    scrollBoxRef={scrollBoxRef}
                    id={`scroll-element-${index}`}
                    style={centeredIndex === index ? inCenterStyle : {}}
                >
                    {element.component}
                </ScrollElement>
            ))}
            {visualizeTriggerLine && visualizedTriggerLine}
        </div>
    )
})

export default ScrollList
