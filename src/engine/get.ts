import { nanoid } from 'nanoid'
import { getDB } from '@/db'
import { getLLMProvider } from './llm'
import type { GetRequest, GetResponse, Event } from '@/types'

export async function getAnswer(request: GetRequest): Promise<GetResponse> {
  const db = await getDB()

  const questionEvent: Event = {
    id: nanoid(),
    type: 'question_asked',
    timestamp: new Date().toISOString(),
    actor: request.actor,
    topic: request.topic,
    payload: {
      question: request.question
    }
  }
  await db.insertEvent(questionEvent)

  // Hole ALLE Entries zum Topic - Frage ist nur für die KI
  const entries = await db.getEntriesByTopic(request.topic, request.actor)

  if (entries.length === 0) {
    const unansweredEvent: Event = {
      id: nanoid(),
      type: 'question_unanswered',
      timestamp: new Date().toISOString(),
      actor: request.actor,
      topic: request.topic,
      payload: {
        question: request.question
      }
    }
    await db.insertEvent(unansweredEvent)

    return {
      answer: "Ich habe keine passenden Einträge zu dieser Frage gefunden. Möchtest du Wissen hinzufügen?",
      sources: []
    }
  }

  const llm = getLLMProvider()
  const llmResponse = await llm.generateAnswer(request.question, entries)

  const answeredEvent: Event = {
    id: nanoid(),
    type: 'question_answered',
    timestamp: new Date().toISOString(),
    actor: request.actor,
    topic: request.topic,
    payload: {
      question: request.question,
      sources_count: entries.length
    }
  }
  await db.insertEvent(answeredEvent)

  return {
    answer: llmResponse.answer,
    sources: entries.map(e => ({
      entry_id: e.id,
      topic: e.topic,
      type: e.type,
      excerpt: e.content.substring(0, 150) + (e.content.length > 150 ? '...' : '')
    })),
    followups: llmResponse.followups
  }
}
