export type DataUUID = string
export type GroupUUID = string
export type EntryUUID = string
export type EntryHash = string

export enum Privacy {
  Public = 0,
  Sensitive = 1,
  Private = 2
}

export interface FileData {
    fileUrl: string
    fileName: string
    fileType: string
    fileMetadata: any
}

export interface OutputEntry<T = any> {
    entryType: string
    data: T
    metadata: any | null
    privacy: Privacy
    startTime: number
    endTime: number | null
    latitude: number | null
    longitude: number | null
    height: number | null
    groupId: GroupUUID
    seqId: number
    inputHandlerId: string
    tags: string[]
    mutationCount: number
    entryUuid: EntryUUID
    entryHash: EntryHash
}

export interface LocationFilter {
    minLat: number
    maxLat: number
    minLng: number
    maxLng: number
}

export interface OutputFilter {
    timestampAfter?: number | null
    timestampBefore?: number | null
    location?: LocationFilter | null
    entryTypes?: string[] | null
    inputHandlerIds?: string[] | null
    groupIds?: GroupUUID[] | null
}
