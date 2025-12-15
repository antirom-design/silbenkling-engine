import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

export async function GET(req: NextRequest) {
  try {
    const result = await sql`
      SELECT DISTINCT topic FROM entries ORDER BY topic ASC
    `

    const topics = result.rows.map(row => row.topic)

    return NextResponse.json({
      success: true,
      topics
    })
  } catch (error) {
    console.error('Topics fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
