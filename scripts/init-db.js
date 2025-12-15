const fs = require('fs')
const path = require('path')

const dbPath = process.env.DB_PATH || './data/silbenkling.db'
const dbDir = path.dirname(dbPath)

if (!fs.existsSync(dbDir)) {
  console.log(`Creating database directory: ${dbDir}`)
  fs.mkdirSync(dbDir, { recursive: true })
}

console.log('Database initialization complete')
