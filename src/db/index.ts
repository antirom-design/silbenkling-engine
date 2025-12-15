import Database from 'better-sqlite3'
import { readFileSync } from 'fs'
import { join } from 'path'
import type { Entry, Event } from '@/types'

const DB_PATH = process.env.DB_PATH || './data/silbenkling.db'

class SilbenklingDB {
  private db: Database.Database

  constructor(dbPath: string = DB_PATH) {
    this.db = new Database(dbPath)
    this.init()
  }

  private init() {
    const schema = readFileSync(join(process.cwd(), 'src/db/schema.sql'), 'utf-8')
    this.db.exec(schema)
  }

  insertEntry(entry: Entry): void {
    const stmt = this.db.prepare(`
      INSERT INTO entries (
        id, topic, type, content, tags, context,
        created_at, created_by, read_permissions, write_permissions, version
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    stmt.run(
      entry.id,
      entry.topic,
      entry.type,
      entry.content,
      JSON.stringify(entry.metadata.tags),
      entry.metadata.context ? JSON.stringify(entry.metadata.context) : null,
      entry.metadata.created_at,
      entry.metadata.created_by,
      JSON.stringify(entry.permissions.read),
      JSON.stringify(entry.permissions.write),
      entry.version
    )
  }

  insertEvent(event: Event): void {
    const stmt = this.db.prepare(`
      INSERT INTO events (id, type, timestamp, actor, topic, entry_id, payload)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)

    stmt.run(
      event.id,
      event.type,
      event.timestamp,
      event.actor,
      event.topic,
      event.entry_id || null,
      event.payload ? JSON.stringify(event.payload) : null
    )
  }

  searchEntries(topic: string, query: string, actor: string): Entry[] {
    const topicPattern = topic.endsWith('%') ? topic : `${topic}%`

    const stmt = this.db.prepare(`
      SELECT * FROM entries
      WHERE topic LIKE ?
        AND (content LIKE ? OR tags LIKE ?)
        AND (
          read_permissions = '[]'
          OR read_permissions LIKE ?
        )
      ORDER BY created_at DESC
      LIMIT 10
    `)

    const searchPattern = `%${query}%`
    const actorPattern = `%"${actor}"%`

    const rows = stmt.all(topicPattern, searchPattern, searchPattern, actorPattern) as any[]

    return rows.map(row => this.rowToEntry(row))
  }

  getEntriesByTopic(topic: string, actor: string): Entry[] {
    const topicPattern = topic.endsWith('%') ? topic : `${topic}%`

    const stmt = this.db.prepare(`
      SELECT * FROM entries
      WHERE topic LIKE ?
        AND (
          read_permissions = '[]'
          OR read_permissions LIKE ?
        )
      ORDER BY created_at DESC
    `)

    const actorPattern = `%"${actor}"%`
    const rows = stmt.all(topicPattern, actorPattern) as any[]

    return rows.map(row => this.rowToEntry(row))
  }

  getEvents(filters: {
    topic?: string
    types?: string[]
    from?: string
    to?: string
    actor?: string
  }): Event[] {
    let query = 'SELECT * FROM events WHERE 1=1'
    const params: any[] = []

    if (filters.topic) {
      query += ' AND topic LIKE ?'
      params.push(`${filters.topic}%`)
    }

    if (filters.types && filters.types.length > 0) {
      query += ` AND type IN (${filters.types.map(() => '?').join(',')})`
      params.push(...filters.types)
    }

    if (filters.from) {
      query += ' AND timestamp >= ?'
      params.push(filters.from)
    }

    if (filters.to) {
      query += ' AND timestamp <= ?'
      params.push(filters.to)
    }

    if (filters.actor) {
      query += ' AND actor = ?'
      params.push(filters.actor)
    }

    query += ' ORDER BY timestamp DESC LIMIT 100'

    const stmt = this.db.prepare(query)
    const rows = stmt.all(...params) as any[]

    return rows.map(row => this.rowToEvent(row))
  }

  private rowToEntry(row: any): Entry {
    return {
      id: row.id,
      topic: row.topic,
      type: row.type,
      content: row.content,
      metadata: {
        tags: JSON.parse(row.tags),
        created_at: row.created_at,
        created_by: row.created_by,
        context: row.context ? JSON.parse(row.context) : undefined
      },
      permissions: {
        read: JSON.parse(row.read_permissions),
        write: JSON.parse(row.write_permissions)
      },
      version: row.version
    }
  }

  private rowToEvent(row: any): Event {
    return {
      id: row.id,
      type: row.type,
      timestamp: row.timestamp,
      actor: row.actor,
      topic: row.topic,
      entry_id: row.entry_id || undefined,
      payload: row.payload ? JSON.parse(row.payload) : undefined
    }
  }

  close() {
    this.db.close()
  }
}

let dbInstance: SilbenklingDB | null = null

export function getDB(): SilbenklingDB {
  if (!dbInstance) {
    dbInstance = new SilbenklingDB()
  }
  return dbInstance
}

export default SilbenklingDB
