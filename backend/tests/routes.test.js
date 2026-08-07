import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';

describe('Vyraion Backend REST API Routes Test Suite', () => {
  afterAll(async () => {
    await mongoose.connection.close();
  });

  it('GET /api/incidents/active - should return active emergency incident queue', async () => {
    const res = await request(app).get('/api/incidents/active');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  }, 10000);

  it('POST /api/auth/login - should validate missing fields cleanly', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/nova/blueprint - should return blueprint response for active queue', async () => {
    const res = await request(app).post('/api/nova/blueprint').send({
      activeQueue: [{ id: 'traffic', name: 'Traffic Collision', severity: 'HIGH' }]
    });
    expect([200, 503]).toContain(res.statusCode);
  });
});
