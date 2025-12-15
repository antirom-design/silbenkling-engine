import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

export async function GET(req: NextRequest) {
  try {
    const result = await sql`
      SELECT DISTINCT type FROM entries ORDER BY type ASC
    `

    const types = result.rows.map(row => row.type)

    return NextResponse.json({
      success: true,
      types
    })
  } catch (error) {
    console.error('Types fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
