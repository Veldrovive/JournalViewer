

export const timeString = (seconds: number, options: { includeSeconds: boolean } = { includeSeconds: true }): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const remainingSeconds = seconds % 60

    const hourString = hours > 0 ? `${hours}h ` : ""
    const minuteString = minutes > 0 ? `${minutes}m ` : ""
    const secondString = remainingSeconds > 0 ? `${remainingSeconds}s` : ""

    if (!options.includeSeconds) {
        return `${hourString}${minuteString}`
    } else {
        return `${hourString}${minuteString}${secondString}`
    }
}
