import { useCallback, useEffect, useState } from "react"
import { DatePickerInput } from "@mantine/dates"

interface DateRangePickerProps {
    onDateRangeChange: (dateRange: [Date | null, Date | null]) => void
}

const DateRangePicker = ({ onDateRangeChange }: DateRangePickerProps) => {
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

    return (
        // <DatePicker type="range" allowSingleDateInRange value={value} onChange={setValue} />
        <DatePickerInput
            type="range"
            allowSingleDateInRange
            label="Pick dates range"
            value={value}
            onChange={setValue}
            // mx="auto"
            maw={400}
        />
    )
}

export default DateRangePicker
