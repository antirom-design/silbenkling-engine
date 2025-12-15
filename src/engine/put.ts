import { nanoid } from 'nanoid'
import { getDB } from '@/db'
import type { Entry, Event, PutRequest } from '@/types'

export function putEntry(request: PutRequest): Entry {
  const db = getDB()

  const entry: Entry = {
    id: nanoid(),
    topic: request.topic,
    type: request.type,
    content: request.content,
    metadata: {
      tags: request.tags || [],
      created_at: new Date().toISOString(),
      created_by: request.actor,
      context: request.context
    },
    permissions: {
      read: [],
      write: []
    },
    version: 1
  }

  db.insertEntry(entry)

  const event: Event = {
    id: nanoid(),
    type: 'entry_added',
    timestamp: new Date().toISOString(),
    actor: request.actor,
    topic: request.topic,
    entry_id: entry.id,
    payload: {
      entry_type: entry.type,
      tags: entry.metadata.tags
    }
  }

  db.insertEvent(event)

  return entry
}

export function putQA(question: string, answer: string, topic: string, actor: string): Entry {
  return putEntry({
    topic,
    type: 'qa',
    content: `Q: ${question}\n\nA: ${answer}`,
    tags: ['qa'],
    actor
  })
}
