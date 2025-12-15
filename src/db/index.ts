import initSqlJs, { Database } from 'sql.js'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'
import type { Entry, Event } from '@/types'

const DB_PATH = process.env.DB_PATH || './data/silbenkling.db'

class SilbenklingDB {
  private db: Database | null = null
  private SQL: any = null

  async init() {
    if (this.db) return

    this.SQL = await initSqlJs()

    if (existsSync(DB_PATH)) {
      const buffer = readFileSync(DB_PATH)
      this.db = new this.SQL.Database(buffer)
    } else {
      this.db = new this.SQL.Database()
    }

    const schema = readFileSync(join(process.cwd(), 'src/db/schema.sql'), 'utf-8')
    this.db.exec(schema)
    this.persist()
  }

  private persist() {
    if (!this.db) return
    const data = this.db.export()
    writeFileSync(DB_PATH, Buffer.from(data))
  }

  insertEntry(entry: Entry): void {
    if (!this.db) throw new Error('Database not initialized')

    this.db.run(
      `INSERT INTO entries (
        id, topic, type, content, tags, context,
        created_at, created_by, read_permissions, write_permissions, version
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
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
      ]
    )
    this.persist()
  }

  insertEvent(event: Event): void {
    if (!this.db) throw new Error('Database not initialized')

    this.db.run(
      `INSERT INTO events (id, type, timestamp, actor, topic, entry_id, payload)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        event.id,
        event.type,
        event.timestamp,
        event.actor,
        event.topic,
        event.entry_id || null,
        event.payload ? JSON.stringify(event.payload) : null
      ]
    )
    this.persist()
  }

  searchEntries(topic: string, query: string, actor: string): Entry[] {
    if (!this.db) throw new Error('Database not initialized')

    const topicPattern = topic.endsWith('%') ? topic : `${topic}%`
    const searchPattern = `%${query}%`
    const actorPattern = `%"${actor}"%`

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

    stmt.bind([topicPattern, searchPattern, searchPattern, actorPattern])

    const rows: any[] = []
    while (stmt.step()) {
      rows.push(stmt.getAsObject())
    }
    stmt.free()

    return rows.map(row => this.rowToEntry(row))
  }

  getEntriesByTopic(topic: string, actor: string): Entry[] {
    if (!this.db) throw new Error('Database not initialized')

    const topicPattern = topic.endsWith('%') ? topic : `${topic}%`
    const actorPattern = `%"${actor}"%`

    const stmt = this.db.prepare(`
      SELECT * FROM entries
      WHERE topic LIKE ?
        AND (
          read_permissions = '[]'
          OR read_permissions LIKE ?
        )
      ORDER BY created_at DESC
    `)

    stmt.bind([topicPattern, actorPattern])

    const rows: any[] = []
    while (stmt.step()) {
      rows.push(stmt.getAsObject())
    }
    stmt.free()

    return rows.map(row => this.rowToEntry(row))
  }

  getEvents(filters: {
    topic?: string
    types?: string[]
    from?: string
    to?: string
    actor?: string
  }): Event[] {
    if (!this.db) throw new Error('Database not initialized')

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
    stmt.bind(params)

    const rows: any[] = []
    while (stmt.step()) {
      rows.push(stmt.getAsObject())
    }
    stmt.free()

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
    if (this.db) {
      this.persist()
      this.db.close()
    }
  }
}

let dbInstance: SilbenklingDB | null = null

export async function getDB(): Promise<SilbenklingDB> {
  if (!dbInstance) {
    dbInstance = new SilbenklingDB()
    await dbInstance.init()
  }
  return dbInstance
}

export default SilbenklingDB
