import request from 'supertest';
import app from '../src/app.js';

describe('Vyraion Dataset Generator REST API Endpoint Test Suite', () => {
  it('GET /api/dataset - should return HTTP 200 with MongoDB records or valid disconnected error', async () => {
    const res = await request(app).get('/api/dataset');
    expect([200, 503]).toContain(res.status);
    if (res.status === 200) {
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('database');
      expect(res.body).toHaveProperty('collection');
      expect(res.body).toHaveProperty('records');
      expect(Array.isArray(res.body.records)).toBe(true);
    }
  });

  it('GET /dataset/incidents - should alias to dataset endpoint cleanly', async () => {
    const res = await request(app).get('/dataset/incidents');
    expect([200, 503]).toContain(res.status);
  });
});
