const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const pool = require('../db')

const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }  
  )
  return { accessToken } 
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { email, password, full_name, role, phone} = req.body

  if (!email || !password || !role) {
    return res.status(400).json({ success: false, error: 'email, password and role are required' })
  }

  const validRoles = ['ngo_admin', 'field_worker', 'volunteer']
  if (!validRoles.includes(role)) {
    return res.status(400).json({ success: false, error: 'Invalid role' })
  }

  try {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email])
    if (existing.rows.length > 0) {
      return res.status(409).json({ success: false, error: 'Email already registered' })
    }

    const password_hash = await bcrypt.hash(password, 12)

    const result = await pool.query(
      `INSERT INTO users (email, password_hash, full_name, role, phone)
       VALUES ($1,$2,$3,$4,$5) RETURNING id, email, role, full_name`,
      [email, password_hash, full_name, role, phone ]
    )

    const user = result.rows[0]
    const { accessToken } = generateTokens(user)

    // await pool.query(
    //   `INSERT INTO refresh_tokens (user_id, token, expires_at)
    //    VALUES ($1,$2, NOW() + INTERVAL '7 days')`,
    //   [user.id, refreshToken]
    // )

    res.status(201).json({
      success: true,
      data: { user, accessToken}
    })

  } catch (err) {
    console.error('Register error:', err.message)
    res.status(500).json({ success: false, error: 'Registration failed' })
  }
})

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password required' })
  }

  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND is_active = TRUE',
      [email]
    )

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' })
    }

    const user = result.rows[0]
    const isValid = await bcrypt.compare(password, user.password_hash)

    if (!isValid) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' })
    }

    await pool.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id])

    const { accessToken } = generateTokens(user)

    // await pool.query(
    //   `INSERT INTO refresh_tokens (user_id, token, expires_at)
    //    VALUES ($1,$2, NOW() + INTERVAL '7 days')`,
    //   [user.id, refreshToken]
    // )

    res.json({
      success: true,
      data: {
        user: { id: user.id, email: user.email, role: user.role, full_name: user.full_name },
        accessToken
      }
    })

  } catch (err) {
    console.error('Login error:', err.message)
    res.status(500).json({ success: false, error: 'Login failed' })
  }
})

// POST /api/auth/logout
router.post('/logout', async (req, res) => {
  // const { refreshToken } = req.body
  // if (refreshToken) {
  //   await pool.query(
  //     'UPDATE refresh_tokens SET is_revoked = TRUE WHERE token = $1',
  //     [refreshToken]
  //   )
  // }
  res.json({ success: true, message: 'Logged out' })
})

module.exports = router