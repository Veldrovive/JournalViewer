"use client"
import { OutputEntry } from "../../interfaces/entryApiInterfaces"
import { timeString } from "../../lib/timeString"

import { Progress, Tooltip } from '@mantine/core'
import { IconCpu, IconWalk, IconRun, IconBike, IconWeight } from "@tabler/icons-react"

enum ActivityLevelName {
    SEDENTARY = "sedentary",
    LIGHTLY = "lightly",
    FAIRLY = "fairly",
    VERY = "very",
}

interface ActivityLevel {
    name: ActivityLevelName
    minutes: number
}

interface FitBitActivity {
    activeDuration: number
    activityLevel: ActivityLevel[]
    activityName: string
    activityTypeId: number
    averageHeartRate?: number
    calories: number
    distance?: number
    distanceUnit?: string
    elevationGain?: number
    logId: number
    logType: string
    originalDuration: number
    originalStartTime: string
    steps?: number
    tcxLink?: string
}

interface FitBitActivityEntryProps {
    entry: OutputEntry<FitBitActivity>
}

const nameIconMap: Record<string, JSX.Element> = {
    Walk: <IconWalk />,
    Run: <IconRun />,
    Bike: <IconBike />,
    Workout: <IconWeight />,
}

const ActivityLevelColorMap: Record<ActivityLevelName, string> = {
    [ActivityLevelName.SEDENTARY]: "gray",
    [ActivityLevelName.LIGHTLY]: "blue",
    [ActivityLevelName.FAIRLY]: "green",
    [ActivityLevelName.VERY]: "red",
}

const ActivityLevelNameMap: Record<ActivityLevelName, string> = {
    [ActivityLevelName.SEDENTARY]: "Rest",
    [ActivityLevelName.LIGHTLY]: "Light",
    [ActivityLevelName.FAIRLY]: "Moderate",
    [ActivityLevelName.VERY]: "Vigorous",
}

const FitBitActivityEntry = ({ entry }: FitBitActivityEntryProps) => {
    const activity = entry.data
    const durationSeconds = activity.activeDuration / 1000
    const durationString = timeString(durationSeconds, { includeSeconds: false })

    const autoDetected = activity.logType === "auto_detected"

    const startTimeMs = entry.startTime
    const endTimeMs = entry.endTime
    // Only take the hours and minutes
    const startTimeString = new Date(startTimeMs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    const endTimeString = new Date(endTimeMs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

    const activityLevels = activity.activityLevel
    const totalMinutes = activityLevels.reduce((acc, level) => acc + level.minutes, 0)
    const progressSections = activityLevels.map((level, index) => ({
        value: level.minutes / totalMinutes * 100,
        color: ActivityLevelColorMap[level.name],
        label: ActivityLevelNameMap[level.name],
        tooltip: `${ActivityLevelNameMap[level.name]} - ${level.minutes} minutes`,
    }))

    const pStyle = {
        'margin': '0',
    }

    const icon = nameIconMap[activity.activityName] || <IconWalk />
    return (
        <div style={{ display: "flex", justifyContent: "flex-start", alignItems: "center", position: "relative" }}>
            <div style={{ flex: '0 1 auto', height: '100%', display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
                { icon }
                { autoDetected && <Tooltip label="Auto-detected" position="right" style={{ marginTop: '5px' }}><IconCpu size="10" /></Tooltip> }
            </div>
            <div style={{ flex: '1 0 auto', height: '100%', display: 'flex', flexDirection: 'column', marginLeft: '10px' }}>
                <div>
                    <h3 style={{ width: '100%', textAlign: 'center', margin: '0 0 10px 0' }}>{activity.activityName}</h3>
                    <p style={pStyle}>Duration: {durationString} ({startTimeString} - {endTimeString})</p>
                    <p style={pStyle}>Calories: {activity.calories}</p>
                    { activity.steps && <p style={pStyle}>Steps: {activity.steps}</p> }
                    { activity.distance && <p style={pStyle}>Distance: {Math.round(activity.distance * 10) / 10} {activity.distanceUnit}</p> }
                </div>
                <Progress radius="xl" size={24} sections={progressSections} style={{ marginBottom: '10px' }} />
            </div>
        </div>
    )
}

export default FitBitActivityEntry
