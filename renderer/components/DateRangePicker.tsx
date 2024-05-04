import { useCallback, useEffect, useState, useMemo } from "react"
import { DatePickerInput, MonthPickerInput, YearPickerInput } from "@mantine/dates"

interface DateRangePickerProps {
    onDateRangeChange: (dateRange: [Date | null, Date | null]) => void
    pickerType?: PickerType
    startTime: number
    endTime: number
}

export enum PickerType {
    DAY = "day",
    MONTH = "month",
    YEAR = "year",
}

const DateRangePicker = ({ onDateRangeChange, pickerType = PickerType.DAY, startTime, endTime }: DateRangePickerProps) => {
    const [value, _setValue] = useState<[Date | null, Date | null]>([null, null])

    const startDate = useMemo(() => {
        // Set the start date to the start of the day
        if (!startTime) {
            return null
        }
        const date = new Date(startTime)
        date.setHours(0, 0, 0, 0)
        return date
    }, [startTime])

    const endDate = useMemo(() => {
        // Set the end date to the start of the day
        if (!endTime) {
            return null
        }
        const date = new Date(endTime)
        date.setHours(0, 0, 0, 0)
        return date
    }, [endTime])

    const setValue = useCallback(
        (newValue: [Date | null, Date | null]) => {
            _setValue(newValue)
            onDateRangeChange(newValue)
            console.log("Date range changed", newValue)
        },
        [onDateRangeChange]
    )

    useEffect(() => {
        // Set the start and end date to today
        const startDate = new Date()
        startDate.setHours(0, 0, 0, 0)
        const endDate = new Date()
        endDate.setHours(0, 0, 0, 0)
        setValue([startDate, endDate])
    }, [setValue])

    useEffect(() => {
        console.log("Start and end time changed", startDate, endDate)
        if (startDate && endDate) {
            setValue([startDate, endDate])
        }
    }, [startDate, endDate, setValue])

    // For the month and year pickers, we need to place the end date at the end of the selected month or year. By default it is at the start of the month or year.
    const handleMonthChange = useCallback(([start, end]: [Date | null, Date | null]) => {
        if (end) {
            const newEnd = new Date(end)
            newEnd.setMonth(newEnd.getMonth() + 1)
            newEnd.setDate(newEnd.getDate() - 1)
            setValue([start, newEnd])
        } else {
            setValue([start, end])
        }
    }, [setValue])

    const handleYearChange = useCallback(([start, end]: [Date, Date]) => {
        if (end) {
            const newEnd = new Date(end)
            newEnd.setFullYear(newEnd.getFullYear() + 1)
            newEnd.setDate(newEnd.getDate() - 1)
            setValue([start, newEnd])
        } else {
            setValue([start, end])
        }
    }, [setValue])

    const picker = useMemo(() => {
        if (pickerType === PickerType.DAY) {
            return <DatePickerInput
                type="range"
                allowSingleDateInRange
                label="Pick dates range"
                value={value}
                onChange={setValue}
                // mx="auto"
                maw={400}
            />
        } else if (pickerType === PickerType.MONTH) {
            return <MonthPickerInput
                type="range"
                allowSingleDateInRange
                label="Pick dates range"
                value={value}
                onChange={handleMonthChange}
                // mx="auto"
                maw={400}
            />
        } else if (pickerType === PickerType.YEAR) {
            return <YearPickerInput
                type="range"
                allowSingleDateInRange
                label="Pick dates range"
                value={value}
                onChange={handleYearChange}
                // mx="auto"
                maw={400}
            />
        } else {
            throw new Error("Invalid picker type")
        }
    }, [pickerType, value, setValue])

    return (
        // <DatePicker type="range" allowSingleDateInRange value={value} onChange={setValue} />
        // <DatePickerInput
        //     type="range"
        //     allowSingleDateInRange
        //     label="Pick dates range"
        //     value={value}
        //     onChange={setValue}
        //     // mx="auto"
        //     maw={400}
        // />
        picker
    )
}

export default DateRangePicker
