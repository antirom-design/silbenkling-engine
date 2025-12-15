import { NextRequest, NextResponse } from 'next/server'
import { putEntry } from '@/engine/put'
import type { PutRequest } from '@/types'

export async function POST(req: NextRequest) {
  try {
    const body: PutRequest = await req.json()

    if (!body.topic || !body.type || !body.content || !body.actor) {
      return NextResponse.json(
        { error: 'Missing required fields: topic, type, content, actor' },
        { status: 400 }
      )
    }

    const entry = putEntry(body)

    return NextResponse.json({
      success: true,
      entry
    })
  } catch (error) {
    console.error('PUT error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
