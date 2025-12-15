import { sql } from '@vercel/postgres'
import type { Entry, Event } from '@/types'

class SilbenklingDB {
  async init() {
    // Create tables if they don't exist
    await sql`
      CREATE TABLE IF NOT EXISTS entries (
        id TEXT PRIMARY KEY,
        topic TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('doc', 'qa', 'fact', 'task', 'link', 'event')),
        content TEXT NOT NULL,
        tags JSONB NOT NULL DEFAULT '[]',
        context JSONB DEFAULT NULL,
        created_at TIMESTAMP NOT NULL,
        created_by TEXT NOT NULL,
        read_permissions JSONB NOT NULL DEFAULT '[]',
        write_permissions JSONB NOT NULL DEFAULT '[]',
        version INTEGER NOT NULL DEFAULT 1
      )
    `

    await sql`
      CREATE INDEX IF NOT EXISTS idx_entries_topic ON entries(topic)
    `

    await sql`
      CREATE INDEX IF NOT EXISTS idx_entries_type ON entries(type)
    `

    await sql`
      CREATE INDEX IF NOT EXISTS idx_entries_created_at ON entries(created_at)
    `

    await sql`
      CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL CHECK(type IN (
          'entry_added',
          'entry_updated',
          'question_asked',
          'question_answered',
          'question_unanswered',
          'qa_confirmed',
          'access_denied'
        )),
        timestamp TIMESTAMP NOT NULL,
        actor TEXT NOT NULL,
        topic TEXT NOT NULL,
        entry_id TEXT,
        payload JSONB DEFAULT NULL
      )
    `

    await sql`
      CREATE INDEX IF NOT EXISTS idx_events_type ON events(type)
    `

    await sql`
      CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp)
    `

    await sql`
      CREATE INDEX IF NOT EXISTS idx_events_topic ON events(topic)
    `

    await sql`
      CREATE INDEX IF NOT EXISTS idx_events_actor ON events(actor)
    `
  }

  async insertEntry(entry: Entry): Promise<void> {
    await sql`
      INSERT INTO entries (
        id, topic, type, content, tags, context,
        created_at, created_by, read_permissions, write_permissions, version
      ) VALUES (
        ${entry.id},
        ${entry.topic},
        ${entry.type},
        ${entry.content},
        ${JSON.stringify(entry.metadata.tags)}::jsonb,
        ${entry.metadata.context ? JSON.stringify(entry.metadata.context) : null}::jsonb,
        ${entry.metadata.created_at}::timestamp,
        ${entry.metadata.created_by},
        ${JSON.stringify(entry.permissions.read)}::jsonb,
        ${JSON.stringify(entry.permissions.write)}::jsonb,
        ${entry.version}
      )
    `
  }

  async insertEvent(event: Event): Promise<void> {
    await sql`
      INSERT INTO events (id, type, timestamp, actor, topic, entry_id, payload)
      VALUES (
        ${event.id},
        ${event.type},
        ${event.timestamp}::timestamp,
        ${event.actor},
        ${event.topic},
        ${event.entry_id || null},
        ${event.payload ? JSON.stringify(event.payload) : null}::jsonb
      )
    `
  }

  async searchEntries(topic: string, query: string, actor: string): Promise<Entry[]> {
    const topicPattern = topic.endsWith('%') ? topic.replace('%', '') + '%' : topic + '%'
    const searchPattern = `%${query}%`

    const result = await sql`
      SELECT * FROM entries
      WHERE topic LIKE ${topicPattern}
        AND (content LIKE ${searchPattern} OR tags::text LIKE ${searchPattern})
        AND (
          read_permissions = '[]'::jsonb
          OR read_permissions::text LIKE ${'%' + actor + '%'}
        )
      ORDER BY created_at DESC
      LIMIT 10
    `

    return result.rows.map(row => this.rowToEntry(row))
  }

  async getEntriesByTopic(topic: string, actor: string): Promise<Entry[]> {
    const topicPattern = topic.endsWith('%') ? topic.replace('%', '') + '%' : topic + '%'

    const result = await sql`
      SELECT * FROM entries
      WHERE topic LIKE ${topicPattern}
        AND (
          read_permissions = '[]'::jsonb
          OR read_permissions::text LIKE ${'%' + actor + '%'}
        )
      ORDER BY created_at DESC
    `

    return result.rows.map(row => this.rowToEntry(row))
  }

  async getEvents(filters: {
    topic?: string
    types?: string[]
    from?: string
    to?: string
    actor?: string
  }): Promise<Event[]> {
    let conditions = []
    let params: any[] = []

    if (filters.topic) {
      const topicPattern = filters.topic.replace('%', '') + '%'
      conditions.push(`topic LIKE '${topicPattern}'`)
    }

    if (filters.types && filters.types.length > 0) {
      const typesList = filters.types.map(t => `'${t}'`).join(',')
      conditions.push(`type IN (${typesList})`)
    }

    if (filters.from) {
      conditions.push(`timestamp >= '${filters.from}'::timestamp`)
    }

    if (filters.to) {
      conditions.push(`timestamp <= '${filters.to}'::timestamp`)
    }

    if (filters.actor) {
      conditions.push(`actor = '${filters.actor}'`)
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''

    const result = await sql.query(
      `SELECT * FROM events ${whereClause} ORDER BY timestamp DESC LIMIT 100`
    )

    return result.rows.map(row => this.rowToEvent(row))
  }

  private rowToEntry(row: any): Entry {
    return {
      id: row.id,
      topic: row.topic,
      type: row.type,
      content: row.content,
      metadata: {
        tags: Array.isArray(row.tags) ? row.tags : JSON.parse(row.tags || '[]'),
        created_at: new Date(row.created_at).toISOString(),
        created_by: row.created_by,
        context: row.context || undefined
      },
      permissions: {
        read: Array.isArray(row.read_permissions) ? row.read_permissions : JSON.parse(row.read_permissions || '[]'),
        write: Array.isArray(row.write_permissions) ? row.write_permissions : JSON.parse(row.write_permissions || '[]')
      },
      version: row.version
    }
  }

  private rowToEvent(row: any): Event {
    return {
      id: row.id,
      type: row.type,
      timestamp: new Date(row.timestamp).toISOString(),
      actor: row.actor,
      topic: row.topic,
      entry_id: row.entry_id || undefined,
      payload: row.payload || undefined
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
