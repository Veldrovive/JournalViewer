import { useEffect, useMemo, forwardRef, ForwardedRef } from "react"
import { OutputEntry } from "../interfaces/entryApiInterfaces"
import ScrollList, { ScrollListRef, TriggerLineType } from "./ScrollList"
import { processEntry } from "./entries"
import { Divider } from "@mantine/core"

declare module "react" {
    function forwardRef<T, P = {}>(
        render: (props: P, ref: React.Ref<T>) => React.ReactNode | null
    ): (props: P & React.RefAttributes<T>) => React.ReactNode | null
}

export interface ScrollElementValue<T> {
    metadata: T
    entry: OutputEntry
}

interface EntriesListProps<T> {
    entries: (ScrollElementValue<T> | null)[] | null
    onCenter: (value: ScrollElementValue<T> | null, percentY: number) => void
    onClick: (value: ScrollElementValue<T> | null) => void
    inCenterStyle: React.CSSProperties
    triggerLineType?: TriggerLineType
    triggerLineStaticPosition?: number
    triggerLineScrollStartPadding?: number
    triggerLineScrollEndPadding?: number
    visualizeTriggerLine?: boolean
}

export type EntriesListRef<T> = ScrollListRef<ScrollElementValue<T> | null>

export default forwardRef(function EntriesList<T>(
    {
        entries,
        onCenter,
        onClick,
        inCenterStyle,
        triggerLineType = TriggerLineType.FollowMouse,
        triggerLineStaticPosition,
        triggerLineScrollStartPadding = 0,
        triggerLineScrollEndPadding = 0,
        visualizeTriggerLine,
    }: EntriesListProps<T>,
    ref: ForwardedRef<EntriesListRef<T>>
) {
    const elements = useMemo(
        () =>
            entries?.map((value, index) => {
                if (!value) {
                    return {
                        value: null,
                        component: <Divider key={index} my="sm" variant="dashed" />,
                        triggerable: false,
                    }
                } else {
                    return {
                        value: value,
                        component: processEntry(value.entry),
                        triggerable: true,
                    }
                }
            }),
        [entries]
    )

    useEffect(() => {
        if (entries) {
            console.log("Building scroll list from entries", entries)
        }
    }, [entries])

    useEffect(() => {
        console.log("Scroll list elements changed", elements)
    }, [elements])

    return (
        <ScrollList
            elements={elements ?? []}
            triggerLineType={triggerLineType}
            triggerLineStaticPosition={triggerLineStaticPosition}
            triggerLineScrollStartPadding={triggerLineScrollStartPadding}
            triggerLineScrollEndPadding={triggerLineScrollEndPadding}
            visualizeTriggerLine={visualizeTriggerLine}
            onCenter={onCenter}
            onClick={onClick}
            inCenterStyle={inCenterStyle}
            ref={ref}
        />
    )
})
