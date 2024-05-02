/*
Used for data fetching and converting between the API that uses snake_case and the rest of the app that uses camelCase
*/

import camelcaseKeys from "camelcase-keys"
import snakecaseKeys from "snakecase-keys"

export const caseFetch = async (url: string, options: RequestInit = {}) => {
    // If the options has a body that is an object
    if (options.body && typeof options.body === "object") {
        // Convert the body to snake_case
        const body: any = options.body
        options.body = JSON.stringify(snakecaseKeys(body, { deep: true }))
    }

    const response = await fetch(url, options)
    if (!response.ok) {
        return null
    }
    const json = await response.json()
    return camelcaseKeys(json, { deep: true })
}
