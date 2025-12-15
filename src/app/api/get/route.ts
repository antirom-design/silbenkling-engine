import { NextRequest, NextResponse } from 'next/server'
import { getAnswer } from '@/engine/get'
import type { GetRequest } from '@/types'

export async function POST(req: NextRequest) {
  try {
    const body: GetRequest = await req.json()

    if (!body.question || !body.topic || !body.actor) {
      return NextResponse.json(
        { error: 'Missing required fields: question, topic, actor' },
        { status: 400 }
      )
    }

    const response = await getAnswer(body)

    return NextResponse.json({
      success: true,
      ...response
    })
  } catch (error) {
    console.error('GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
