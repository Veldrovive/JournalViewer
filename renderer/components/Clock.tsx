"use client"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useElementSize } from "@mantine/hooks"

interface ClockProps<T> {
    time: Date | null
    twentyFourHour?: boolean
    displayAmPm?: boolean
    zeroPad?: boolean
    displayDate?: boolean
    displayCurrentTime?: boolean
    markers?: { time: Date; value: T; highlighted?: boolean }[] | null
    onMarkerClick?: (value: T | null) => void
}

const FONT_SIZE = 14
const FONT_STYLE = `${FONT_SIZE}px Arial`

export default function Clock<T>({
    time,
    twentyFourHour = false,
    displayAmPm = false,
    zeroPad = false,
    displayDate = false,
    displayCurrentTime = false,
    markers,
    onMarkerClick,
}: ClockProps<T>) {
    const { ref: sizerRef, width, height } = useElementSize<HTMLDivElement>()
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const pointerCanvasRef = useRef<HTMLCanvasElement>(null)
    const markerCanvasRef = useRef<HTMLCanvasElement>(null)

    const [pixelRatio, setPixelRatio] = useState<number>(1)
    useEffect(() => {
        const ratio = window.devicePixelRatio || 1
        setPixelRatio(ratio)
    }, [])

    const currentTimeIsPm = useMemo(() => {
        return time ? time.getHours() >= 12 : false
    }, [time])

    const canvasContext = useMemo(() => {
        const context = canvasRef.current?.getContext("2d")
        if (context) {
            context!.font = FONT_STYLE
            context!.textAlign = "left"
            context!.textBaseline = "middle"
        }
        return context
    }, [canvasRef.current]) // eslint-disable-line react-hooks/exhaustive-deps

    const pointerCanvasContext = useMemo(() => {
        const context = pointerCanvasRef.current?.getContext("2d")
        return context
    }, [pointerCanvasRef.current]) // eslint-disable-line react-hooks/exhaustive-deps

    const markerCanvasContext = useMemo(() => {
        const context = markerCanvasRef.current?.getContext("2d")
        return context
    }, [markerCanvasRef.current]) // eslint-disable-line react-hooks/exhaustive-deps

    const canvasInfo = useMemo(
        () => ({
            width,
            height,
            canvasContext,
            canvas: canvasRef.current,
            ready: canvasContext != null && canvasRef.current != null,
        }),
        [width, height, canvasContext, canvasRef.current]
    ) // eslint-disable-line react-hooks/exhaustive-deps

    const pointerCanvasInfo = useMemo(
        () => ({
            width,
            height,
            canvasContext: pointerCanvasContext,
            canvas: pointerCanvasRef.current,
            ready: pointerCanvasContext != null && pointerCanvasRef.current != null,
        }),
        [width, height, pointerCanvasContext, pointerCanvasRef.current]
    ) // eslint-disable-line react-hooks/exhaustive-deps

    const markerCanvasInfo = useMemo(
        () => ({
            width,
            height,
            canvasContext: markerCanvasContext,
            canvas: markerCanvasRef.current,
            ready: markerCanvasContext != null && markerCanvasRef.current != null,
        }),
        [width, height, markerCanvasContext, markerCanvasRef.current]
    ) // eslint-disable-line react-hooks/exhaustive-deps

    const getHourString = useCallback(
        (hours: number) => {
            const toString = (num: number) => (zeroPad ? num.toString().padStart(2, "0") : num.toString())
            if (twentyFourHour) {
                return toString(hours)
            } else {
                const twelveHour = toString(hours === 0 || hours === 12 || hours === 24 ? 12 : hours % 12)
                return displayAmPm ? twelveHour + (currentTimeIsPm ? "pm" : "am") : twelveHour
            }
        },
        [twentyFourHour, displayAmPm, currentTimeIsPm, zeroPad]
    )

    const getDateString = useCallback((date: Date) => {
        // Returns the date string in the format "Month Day, Year" with month being the 3-letter month name and year being the two-digit year
        const month = date.toLocaleString("default", { month: "short" })
        const day = date.getDate()
        const year = date.getFullYear().toString().slice(-2)
        return `${month} ${day}, ${year}`
    }, [])

    const clockGeometry = useMemo(() => {
        const textXPadding = 4
        const textWidth = canvasContext?.measureText(getHourString(24)).width
        const textHeight = FONT_SIZE
        const remainingWidth = width - (textWidth ?? 0) - textXPadding
        const yPadding = 10
        return {
            numHours: twentyFourHour ? 24 : 12,

            hourTickWidth: remainingWidth,
            hourTickHeight: 4,
            tenMinuteTickWidth: (remainingWidth * 3) / 4,
            tenMinuteTickHeight: 1,

            markerWidth: (remainingWidth * 2) / 4,
            markerHeight: 8,
            markerStrokeStyle: "rgb(39, 174, 96)",
            markerHighlightStrokeStyle: "rgb(211, 84, 0)",

            textXPadding,
            yPadding,
            textHeight,
            datePadding: 2,

            markerTextSize: 20,
            markerTextPadding: 8,
            markerTextStyle: "black",
        }
    }, [twentyFourHour, width, getHourString, canvasContext, pixelRatio])

    const timeToPosition = useCallback(
        (hours: number, minutes: number, seconds: number, padding: number = 0) => {
            // Converts a time to a height position out of {height}
            const totalSeconds = hours * 60 * 60 + minutes * 60 + seconds
            const totalMilliseconds = totalSeconds * 1000

            let allowedHeight = height
            let heightOffset = 0
            allowedHeight -= padding * 2 // Subtract padding from top and bottom
            if (displayDate) {
                allowedHeight -= clockGeometry.textHeight + 2 * clockGeometry.datePadding // Subtract the height of the date text
                heightOffset += clockGeometry.textHeight + 2 * clockGeometry.datePadding // Add the height of the date text to the offset
            }

            return Math.round(
                (totalMilliseconds / (clockGeometry.numHours * 60 * 60 * 1000)) * allowedHeight + padding + heightOffset
            )
        },
        [height, clockGeometry, displayDate]
    )

    const positionToTime = useCallback(
        (yPos: number, padding: number = 0) => {
            // Converts a height position out of {height} to a time
            let allowedHeight = height
            let heightOffset = 0
            allowedHeight -= padding * 2 // Subtract padding from top and bottom
            if (displayDate) {
                allowedHeight -= clockGeometry.textHeight + 2 * clockGeometry.datePadding // Subtract the height of the date text
                heightOffset += clockGeometry.textHeight + 2 * clockGeometry.datePadding // Add the height of the date text to the offset
            }

            const totalMilliseconds =
                ((yPos - padding - heightOffset) / allowedHeight) * clockGeometry.numHours * 60 * 60 * 1000
            const totalSeconds = totalMilliseconds / 1000
            const hours = Math.floor(totalSeconds / (60 * 60))
            const minutes = Math.floor((totalSeconds % (60 * 60)) / 60)
            const seconds = Math.floor(totalSeconds % 60)
            return { hours, minutes, seconds }
        },
        [height, clockGeometry, displayDate]
    )

    // Background rendering
    useEffect(() => {
        if (!canvasInfo.ready) return
        const { canvasContext, width, height } = canvasInfo
        const padding = clockGeometry.yPadding
        const scaledWidth = width * pixelRatio
        const scaledHeight = height * pixelRatio

        canvasContext!.scale(pixelRatio, pixelRatio)

        canvasContext!.clearRect(0, 0, scaledWidth, scaledHeight)

        canvasContext!.font = FONT_STYLE
        canvasContext!.textAlign = "left"
        canvasContext!.textBaseline = "middle"

        // Draw hour ticks
        canvasContext!.beginPath() // Begin a new path for hour ticks
        canvasContext!.lineWidth = clockGeometry.hourTickHeight
        for (let hour = 0; hour < clockGeometry.numHours + 1; hour++) {
            const yPos = timeToPosition(hour, 0, 0, padding)
            canvasContext!.moveTo(0, yPos)
            canvasContext!.lineTo(clockGeometry.hourTickWidth, yPos)

            // Draw hour label
            const hourText = getHourString(hour)
            canvasContext!.fillText(
                hourText.toString(),
                clockGeometry.hourTickWidth + clockGeometry.textXPadding,
                yPos + 1
            )
        }
        canvasContext!.stroke() // Stroke hour ticks

        // Draw 10-minute ticks
        canvasContext!.beginPath() // Begin a new path for 10-minute ticks
        canvasContext!.lineWidth = clockGeometry.tenMinuteTickHeight
        for (let hour = 0; hour < clockGeometry.numHours; hour++) {
            for (let minute = 0; minute < 6; minute++) {
                const yPos = timeToPosition(hour, minute * 10, 0, padding)
                canvasContext!.moveTo(0, yPos)
                canvasContext!.lineTo(clockGeometry.tenMinuteTickWidth, yPos)
            }
        }
        canvasContext!.stroke() // Stroke 10-minute ticks

        canvasContext!.setTransform(1, 0, 0, 1, 0, 0)
    }, [canvasInfo, clockGeometry, getHourString, timeToPosition])

    // Time/Date rendering
    useEffect(() => {
        if (!pointerCanvasInfo.ready) return
        if (!time) return
        const { canvasContext, width, height } = pointerCanvasInfo
        const padding = clockGeometry.yPadding
        const scaledWidth = width * pixelRatio
        const scaledHeight = height * pixelRatio

        canvasContext!.scale(pixelRatio, pixelRatio)

        canvasContext!.clearRect(0, 0, width, height)

        canvasContext!.font = FONT_STYLE
        canvasContext!.textAlign = "left"
        canvasContext!.textBaseline = "middle"

        if (displayDate && time) {
            // Draw date text
            const dateText = getDateString(time)
            canvasContext!.fillText(dateText, 0, padding + clockGeometry.datePadding)
        }

        let hours = time.getHours()
        const minutes = time.getMinutes()
        const seconds = time.getSeconds()
        if (!twentyFourHour) {
            hours = hours % 12
        }
        const yPos = timeToPosition(hours, minutes, seconds, padding)

        // Set to draw red
        canvasContext!.strokeStyle = "red"

        // Draw hour pointer
        canvasContext!.beginPath()
        canvasContext!.lineWidth = 2
        canvasContext!.moveTo(0, yPos)
        canvasContext!.lineTo(width, yPos)
        canvasContext!.stroke()

        canvasContext!.setTransform(1, 0, 0, 1, 0, 0)

        if (displayCurrentTime) {
            // Place the time as HH:MM on the right side of the line
            const timeString = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`
            canvasContext!.textAlign = "right";
            // If the time will overlap with the clock times, shift it below the line
            const isBelow = minutes > 1 && minutes < 18
            canvasContext!.font = `${clockGeometry.markerTextSize}px Arial`;
            const textX = 2*width
            const textY = 2*yPos - 2*clockGeometry.markerTextPadding*(isBelow ? -1 : 1)
            canvasContext!.fillText(timeString, textX, textY);

            // Set the text size back to the default
            canvasContext!.font = FONT_STYLE;
        }
    }, [pointerCanvasInfo, timeToPosition, time, clockGeometry, twentyFourHour, displayDate, getDateString])

    // Marker rendering
    useEffect(() => {
        if (!markerCanvasInfo.ready) return
        if (!markers) return

        const { canvasContext, width, height } = markerCanvasInfo
        const padding = clockGeometry.yPadding
        const scaledWidth = width * pixelRatio
        const scaledHeight = height * pixelRatio

        canvasContext!.scale(pixelRatio, pixelRatio)
        canvasContext!.clearRect(0, 0, scaledWidth, scaledHeight)

        for (const marker of markers) {
            let { time: markerTime } = marker
            const timeIsPm = markerTime.getHours() >= 12
            if (timeIsPm !== currentTimeIsPm) {
                // Don't draw markers that are in the wrong half of the day
                continue
            }
            const timeIsToday = time?.getDate() === markerTime.getDate()
            if (!timeIsToday) {
                // Don't draw markers that aren't today
                continue
            }
            let hours = markerTime.getHours()
            if (!twentyFourHour) {
                hours = hours % 12
            }
            const minutes = markerTime.getMinutes()
            const seconds = markerTime.getSeconds()
            const yPos = timeToPosition(hours, minutes, seconds, padding)

            // Draw marker
            canvasContext!.beginPath()
            canvasContext!.lineWidth = clockGeometry.markerHeight
            if (marker.highlighted) {
                canvasContext!.strokeStyle = clockGeometry.markerHighlightStrokeStyle
            } else {
                canvasContext!.strokeStyle = clockGeometry.markerStrokeStyle
            }
            canvasContext!.moveTo(0, yPos)
            canvasContext!.lineTo(clockGeometry.markerWidth, yPos)
            canvasContext!.stroke()
            canvasContext!.closePath()
        }

        canvasContext!.setTransform(1, 0, 0, 1, 0, 0)
    }, [markerCanvasInfo, markers, clockGeometry, timeToPosition, currentTimeIsPm, time])

    const handleMarkerClick = useCallback(
        (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
            if (!markers) return
            if (!onMarkerClick) return

            const { canvas, canvasContext } = markerCanvasInfo
            if (!canvas || !canvasContext) return

            const rect = canvas.getBoundingClientRect()
            const x = e.clientX - rect.left
            const y = e.clientY - rect.top

            const padding = clockGeometry.yPadding
            let { hours, minutes, seconds } = positionToTime(y, padding)
            if (!twentyFourHour) {
                if (currentTimeIsPm) {
                    hours += 12
                }
            }
            const clickTime = new Date()
            clickTime.setHours(hours, minutes, seconds, 0)

            const msFromMidnight = (time: Date) => {
                return time.getHours() * 60 * 60 * 1000 + time.getMinutes() * 60 * 1000 + time.getSeconds() * 1000
            }

            // Choose the closest marker within 30 minutes
            let closestMarker: { time: Date; value: T } | null = null
            let closestMarkerDistance = Infinity
            for (const marker of markers) {
                const distance = Math.abs(msFromMidnight(marker.time) - msFromMidnight(clickTime))
                if (distance > 30 * 60 * 1000) continue
                if (distance < closestMarkerDistance) {
                    closestMarker = marker
                    closestMarkerDistance = distance
                }
            }

            onMarkerClick(closestMarker?.value ?? null)
        },
        [markers, onMarkerClick, markerCanvasInfo, clockGeometry, positionToTime, timeToPosition, currentTimeIsPm]
    )

    return (
        <div ref={sizerRef} style={{ width: "100%", height: "100%", position: "relative" }}>
            <canvas
                ref={canvasRef}
                style={{ position: "absolute", top: 0, left: 0, width, height, zIndex: 1, pointerEvents: "none" }}
                width={width * pixelRatio}
                height={height * pixelRatio}
            ></canvas>
            <canvas
                ref={pointerCanvasRef}
                style={{ position: "absolute", top: 0, left: 0, width, height, zIndex: 2, pointerEvents: "none" }}
                width={width * pixelRatio}
                height={height * pixelRatio}
            ></canvas>
            <canvas
                ref={markerCanvasRef}
                style={{ position: "absolute", top: 0, left: 0, width, height, zIndex: 0 }}
                width={width * pixelRatio}
                height={height * pixelRatio}
                onClick={handleMarkerClick}
            ></canvas>
        </div>
    )
}
