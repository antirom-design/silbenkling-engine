export type EntryType = 'doc' | 'qa' | 'fact' | 'task' | 'link' | 'event'

export interface Entry {
  id: string
  topic: string
  type: EntryType
  content: string
  metadata: {
    tags: string[]
    created_at: string
    created_by: string
    context?: Record<string, string>
  }
  permissions: {
    read: string[]
    write: string[]
  }
  version: number
}

export type EventType =
  | 'entry_added'
  | 'entry_updated'
  | 'question_asked'
  | 'question_answered'
  | 'question_unanswered'
  | 'qa_confirmed'
  | 'access_denied'

export interface Event {
  id: string
  type: EventType
  timestamp: string
  actor: string
  topic: string
  entry_id?: string
  payload?: Record<string, any>
}

export interface PutRequest {
  topic: string
  type: EntryType
  content: string
  tags?: string[]
  context?: Record<string, string>
  actor: string
}

export interface GetRequest {
  question: string
  topic: string
  actor: string
}

export interface GetResponse {
  answer: string
  sources: Array<{
    entry_id: string
    topic: string
    type: EntryType
    excerpt: string
  }>
  followups?: string[]
}

export interface MonitorRequest {
  topic?: string
  event_types?: EventType[]
  from?: string
  to?: string
  actor: string
}

export interface MonitorResponse {
  events: Event[]
  summary: {
    total: number
    by_type: Record<EventType, number>
  }
}
