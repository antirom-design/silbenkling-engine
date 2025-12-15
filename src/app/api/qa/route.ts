import { NextRequest, NextResponse } from 'next/server'
import { putQA } from '@/engine/put'
import { nanoid } from 'nanoid'
import { getDB } from '@/db'
import type { Event } from '@/types'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    if (!body.question || !body.answer || !body.topic || !body.actor) {
      return NextResponse.json(
        { error: 'Missing required fields: question, answer, topic, actor' },
        { status: 400 }
      )
    }

    const entry = await putQA(body.question, body.answer, body.topic, body.actor)

    const db = await getDB()
    const confirmedEvent: Event = {
      id: nanoid(),
      type: 'qa_confirmed',
      timestamp: new Date().toISOString(),
      actor: body.actor,
      topic: body.topic,
      entry_id: entry.id,
      payload: {
        question: body.question
      }
    }
    db.insertEvent(confirmedEvent)

    return NextResponse.json({
      success: true,
      entry
    })
  } catch (error) {
    console.error('QA save error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
