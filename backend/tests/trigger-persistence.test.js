import request from 'supertest';
import app from '../src/app.js';

describe('Vyraion Emergency Trigger & Persistence End-to-End Test Suite', () => {
  it('POST /api/incidents - should trigger incident, persist to MongoDB Atlas, and appear in GET /api/incidents/active', async () => {
    const testPayload = {
      id: 'traffic',
      type: 'Traffic Accident',
      uniqueId: `traffic_test_${Date.now()}`,
      lat: 1.3323,
      lng: 103.8580,
      hotspot: 'PIE expressway Flyover',
      dispatchedUnits: [{ unitId: 'unit_1', name: 'ALS Ambulance', type: 'ambulance', icon: '🚑' }]
    };

    // 1. Trigger incident
    const postRes = await request(app)
      .post('/api/incidents')
      .send(testPayload);

    expect(postRes.status).toBe(201);
    expect(postRes.body).toHaveProperty('success', true);
    expect(postRes.body.data).toHaveProperty('uniqueId', testPayload.uniqueId);

    // 2. Fetch active incidents
    const activeRes = await request(app).get('/api/incidents/active');
    expect(activeRes.status).toBe(200);
    expect(activeRes.body).toHaveProperty('success', true);
    expect(Array.isArray(activeRes.body.data)).toBe(true);

    const foundInActive = activeRes.body.data.some(
      (inc) => (inc.uniqueId || inc.id) === testPayload.uniqueId
    );
    expect(foundInActive).toBe(true);

    // 3. Fetch Dataset Generator API
    const datasetRes = await request(app).get('/api/dataset');
    expect([200, 503]).toContain(datasetRes.status);
    if (datasetRes.status === 200) {
      expect(datasetRes.body).toHaveProperty('success', true);
      const foundInDataset = datasetRes.body.records.some(
        (rec) => (rec.uniqueId || rec.id) === testPayload.uniqueId
      );
      expect(foundInDataset).toBe(true);
    }
  });
});
