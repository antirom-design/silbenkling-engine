import { getDB } from '@/db'
import type { MonitorRequest, MonitorResponse, EventType } from '@/types'

export function monitorEvents(request: MonitorRequest): MonitorResponse {
  const db = getDB()

  const events = db.getEvents({
    topic: request.topic,
    types: request.event_types,
    from: request.from,
    to: request.to,
    actor: request.actor
  })

  const byType: Record<EventType, number> = {
    entry_added: 0,
    entry_updated: 0,
    question_asked: 0,
    question_answered: 0,
    question_unanswered: 0,
    qa_confirmed: 0,
    access_denied: 0
  }

  events.forEach(event => {
    byType[event.type] = (byType[event.type] || 0) + 1
  })

  return {
    events,
    summary: {
      total: events.length,
      by_type: byType
    }
  }
}
