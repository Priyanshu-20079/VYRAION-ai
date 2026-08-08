import request from 'supertest';
import app from '../src/app.js';

describe('Vyraion Single-Incident Report Export API Test Suite', () => {
  let testIncidentId;

  beforeAll(async () => {
    // Create a real test incident in MongoDB Atlas
    const testId = `traffic_report_test_${Date.now()}`;
    const createRes = await request(app)
      .post('/api/incidents')
      .send({
        id: 'traffic',
        type: 'Traffic Accident',
        uniqueId: testId,
        lat: 1.3323,
        lng: 103.8580,
        hotspot: 'Orchard Road Crossing'
      });

    expect(createRes.status).toBe(201);
    testIncidentId = createRes.body.data._id || testId;
  });

  it('GET /api/incidents/:id/report?format=json - should return full structured report payload', async () => {
    const res = await request(app).get(`/api/incidents/${testIncidentId}/report?format=json`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('source', 'MongoDB Atlas / vyraion.incidents');
    expect(res.body).toHaveProperty('incident');
    expect(res.body.incident).toHaveProperty('title');
    expect(res.body.incident).toHaveProperty('checklist');
    expect(res.body.incident).toHaveProperty('priorities');
  });

  it('GET /api/incidents/:id/report?format=csv - should return text/csv report', async () => {
    const res = await request(app).get(`/api/incidents/${testIncidentId}/report?format=csv`);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.text).toContain('Source,Generated_At,MongoDB_ObjectID');
  });

  it('GET /api/incidents/:id/report?format=html - should return text/html printable report', async () => {
    const res = await request(app).get(`/api/incidents/${testIncidentId}/report?format=html`);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/html');
    expect(res.text).toContain('VYRAION OS — Incident Resolution Report');
  });

  it('GET /api/incidents/:id/report?format=pdf - should return application/pdf stream', async () => {
    const res = await request(app).get(`/api/incidents/${testIncidentId}/report?format=pdf`);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('application/pdf');
  });

  it('GET /api/incidents/nonexistent_12345/report?format=pdf - should return HTTP 404 without crashing server', async () => {
    const res = await request(app).get('/api/incidents/nonexistent_12345/report?format=pdf');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('success', false);
  });
});
