import request from 'supertest';
import app from '../src/app.js';

describe('Vyraion Incident Checklist Lifecycle API Test Suite', () => {
  it('PATCH /api/incidents/:id/checklist - should automatically update unitsArrived & hospitalNotified and persist to MongoDB Atlas', async () => {
    // 1. Create a test incident
    const testId = `traffic_checklist_test_${Date.now()}`;
    const createRes = await request(app)
      .post('/api/incidents')
      .send({
        id: 'traffic',
        type: 'Traffic Accident',
        uniqueId: testId,
        lat: 1.3323,
        lng: 103.8580,
        hotspot: 'CTE Interchange'
      });

    expect(createRes.status).toBe(201);

    // 2. Patch hospitalNotified = true
    const hospPatch = await request(app)
      .patch(`/api/incidents/${testId}/checklist`)
      .send({ hospitalNotified: true });

    expect(hospPatch.status).toBe(200);
    expect(hospPatch.body.data.checklist).toHaveProperty('hospitalNotified', true);

    // 3. Patch unitsArrived = true
    const arrivedPatch = await request(app)
      .patch(`/api/incidents/${testId}/checklist`)
      .send({ unitsArrived: true });

    expect(arrivedPatch.status).toBe(200);
    expect(arrivedPatch.body.data.checklist).toHaveProperty('unitsArrived', true);
    expect(arrivedPatch.body.data.checklist).toHaveProperty('hospitalNotified', true);
  });
});
