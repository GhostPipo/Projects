jest.mock('../models/User', () => ({
  findOne: jest.fn()
}));

jest.mock('bcrypt', () => ({
  compare: jest.fn()
}));

const request = require('supertest');
const bcrypt = require('bcrypt');
const app = require('../app');
const User = require('../models/User');

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 for wrong password (Proof of Concept)', async () => {
    User.findOne.mockResolvedValue({
      username: 'alice',
      password: 'hashed-password'
    });
    bcrypt.compare.mockResolvedValue(false);

    const response = await request(app)
      .post('/api/auth/login')
      .send({ username: 'alice', password: 'wrong-password' });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'invalid_credentials' });
  });
});
