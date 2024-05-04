import { useCallback, useEffect, useState, useMemo } from "react"
import { DatePickerInput, MonthPickerInput, YearPickerInput } from "@mantine/dates"

interface DateRangePickerProps {
    onDateRangeChange: (dateRange: [Date | null, Date | null]) => void
    pickerType?: PickerType
}

export enum PickerType {
    DAY = "day",
    MONTH = "month",
    YEAR = "year",
}

const DateRangePicker = ({ onDateRangeChange, pickerType = PickerType.DAY }: DateRangePickerProps) => {
    const [value, _setValue] = useState<[Date | null, Date | null]>([null, null])

    const setValue = useCallback(
        (newValue: [Date | null, Date | null]) => {
            _setValue(newValue)
            onDateRangeChange(newValue)
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
                onChange={setValue}
                // mx="auto"
                maw={400}
            />
        } else if (pickerType === PickerType.YEAR) {
            return <YearPickerInput
                type="range"
                allowSingleDateInRange
                label="Pick dates range"
                value={value}
                onChange={setValue}
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
