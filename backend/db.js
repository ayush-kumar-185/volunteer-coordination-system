const { Pool } = require('pg')
require('dotenv').config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

pool.connect((err, client, release) => {
  if (err) {
    console.log(`${process.env.DATABASE_URL}`);
    
    console.error('Database connection failed:', err.message)
    return
  }
  release()
  console.log('Database connected successfully')
})

module.exports = pool

// test lines
// pool.query('SELECT NOW()', (err, result) => {
//   if (err) {
//     console.error('Test query failed:', err.message)
//   } else {
//     console.log('DB timestamp:', result.rows[0].now)
//   }
// })