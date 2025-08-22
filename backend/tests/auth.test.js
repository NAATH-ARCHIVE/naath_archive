const request = require('supertest')
const app = require('../server')
const { pool } = require('../config/database')
const bcrypt = require('bcryptjs')

describe('Authentication Endpoints', () => {
  let testUser
  let authToken

  beforeAll(async () => {
    // Create a test user
    const hashedPassword = await bcrypt.hash('TestPassword123', 12)
    const result = await pool.query(
      'INSERT INTO users (username, email, password_hash, first_name, last_name, role) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, username, email, first_name, last_name, role',
      ['testuser', 'test@example.com', hashedPassword, 'Test', 'User', 'user']
    )
    testUser = result.rows[0]
  })

  afterAll(async () => {
    // Clean up test user
    if (testUser) {
      await pool.query('DELETE FROM users WHERE id = $1', [testUser.id])
    }
    await pool.end()
  })

  describe('POST /api/auth/register', () => {
    it('should register a new user with valid data', async () => {
      const userData = {
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'NewPassword123',
        firstName: 'New',
        lastName: 'User'
      }

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201)

      expect(response.body).toHaveProperty('message', 'User registered successfully')
      expect(response.body).toHaveProperty('user')
      expect(response.body).toHaveProperty('token')
      expect(response.body.user.username).toBe(userData.username)
      expect(response.body.user.email).toBe(userData.email)
      expect(response.body.user.firstName).toBe(userData.firstName)
      expect(response.body.user.lastName).toBe(userData.lastName)
      expect(response.body.user.role).toBe('user')

      // Clean up
      await pool.query('DELETE FROM users WHERE username = $1', [userData.username])
    })

    it('should reject registration with existing username', async () => {
      const userData = {
        username: 'testuser', // Already exists
        email: 'another@example.com',
        password: 'AnotherPassword123',
        firstName: 'Another',
        lastName: 'User'
      }

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400)

      expect(response.body).toHaveProperty('error', 'Username already exists')
    })

    it('should reject registration with existing email', async () => {
      const userData = {
        username: 'anotheruser',
        email: 'test@example.com', // Already exists
        password: 'AnotherPassword123',
        firstName: 'Another',
        lastName: 'User'
      }

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400)

      expect(response.body).toHaveProperty('error', 'Email already exists')
    })

    it('should reject registration with weak password', async () => {
      const userData = {
        username: 'weakuser',
        email: 'weak@example.com',
        password: 'weak', // Too short
        firstName: 'Weak',
        lastName: 'User'
      }

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400)

      expect(response.body).toHaveProperty('error', 'Validation failed')
    })

    it('should reject registration with invalid email format', async () => {
      const userData = {
        username: 'invaliduser',
        email: 'invalid-email',
        password: 'ValidPassword123',
        firstName: 'Invalid',
        lastName: 'User'
      }

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400)

      expect(response.body).toHaveProperty('error', 'Validation failed')
    })
  })

  describe('POST /api/auth/login', () => {
    it('should login with valid username and password', async () => {
      const loginData = {
        username: 'testuser',
        password: 'TestPassword123'
      }

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200)

      expect(response.body).toHaveProperty('message', 'Login successful')
      expect(response.body).toHaveProperty('user')
      expect(response.body).toHaveProperty('token')
      expect(response.body.user.username).toBe(loginData.username)
      expect(response.body.user.role).toBe('user')

      authToken = response.body.token
    })

    it('should login with valid email and password', async () => {
      const loginData = {
        username: 'test@example.com',
        password: 'TestPassword123'
      }

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200)

      expect(response.body).toHaveProperty('message', 'Login successful')
      expect(response.body.user.email).toBe(loginData.username)
    })

    it('should reject login with invalid username', async () => {
      const loginData = {
        username: 'nonexistentuser',
        password: 'TestPassword123'
      }

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401)

      expect(response.body).toHaveProperty('error', 'Invalid credentials')
    })

    it('should reject login with invalid password', async () => {
      const loginData = {
        username: 'testuser',
        password: 'WrongPassword123'
      }

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401)

      expect(response.body).toHaveProperty('error', 'Invalid credentials')
    })

    it('should reject login with missing credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({})
        .expect(400)

      expect(response.body).toHaveProperty('error', 'Validation failed')
    })
  })

  describe('GET /api/auth/me', () => {
    it('should return current user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body).toHaveProperty('user')
      expect(response.body.user.username).toBe('testuser')
      expect(response.body.user.email).toBe('test@example.com')
    })

    it('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401)

      expect(response.body).toHaveProperty('error', 'Access token required')
    })

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(403)

      expect(response.body).toHaveProperty('error', 'Invalid token')
    })
  })

  describe('POST /api/auth/refresh', () => {
    it('should refresh token with valid token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body).toHaveProperty('message', 'Token refreshed successfully')
      expect(response.body).toHaveProperty('token')
      expect(response.body.token).not.toBe(authToken)
    })

    it('should reject refresh without token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .expect(401)

      expect(response.body).toHaveProperty('error', 'Access token required')
    })
  })

  describe('PUT /api/auth/change-password', () => {
    it('should change password with valid current password', async () => {
      const passwordData = {
        currentPassword: 'TestPassword123',
        newPassword: 'NewTestPassword123'
      }

      const response = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(passwordData)
        .expect(200)

      expect(response.body).toHaveProperty('message', 'Password changed successfully')

      // Verify new password works
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'NewTestPassword123'
        })
        .expect(200)

      expect(loginResponse.body).toHaveProperty('token')

      // Change back to original password
      await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${loginResponse.body.token}`)
        .send({
          currentPassword: 'NewTestPassword123',
          newPassword: 'TestPassword123'
        })
    })

    it('should reject password change with invalid current password', async () => {
      const passwordData = {
        currentPassword: 'WrongPassword123',
        newPassword: 'NewTestPassword123'
      }

      const response = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(passwordData)
        .expect(400)

      expect(response.body).toHaveProperty('error', 'Invalid current password')
    })

    it('should reject password change with weak new password', async () => {
      const passwordData = {
        currentPassword: 'TestPassword123',
        newPassword: 'weak'
      }

      const response = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(passwordData)
        .expect(400)

      expect(response.body).toHaveProperty('error', 'Validation failed')
    })
  })
})
