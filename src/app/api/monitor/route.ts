import { NextRequest, NextResponse } from 'next/server'
import { monitorEvents } from '@/engine/monitor'
import type { MonitorRequest } from '@/types'

export async function POST(req: NextRequest) {
  try {
    const body: MonitorRequest = await req.json()

    if (!body.actor) {
      return NextResponse.json(
        { error: 'Missing required field: actor' },
        { status: 400 }
      )
    }

    const response = monitorEvents(body)

    return NextResponse.json({
      success: true,
      ...response
    })
  } catch (error) {
    console.error('MONITOR error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
