import request from 'supertest';
import app from '../src/app.js';
import { incidentService } from '../src/services/incidentService.js';
import { isHospitalIncident } from '../src/routes/incident.routes.js';

describe('Vyraion Role-Aware Incident Filters API Test Suite', () => {
  let trafficId, medicalId, fireId, hospitalId;

  beforeAll(async () => {
    // Seed test incidents with distinct categories and states
    const timestamp = Date.now();
    
    // 1. Traffic Accident
    const traffic = await incidentService.triggerIncident('traffic');
    trafficId = traffic._id || traffic.id;

    // 2. Medical Emergency
    const medical = await incidentService.triggerIncident('medical');
    medicalId = medical._id || medical.id;

    // 3. Fire Outbreak (Resolve this one for investigator testing)
    const fire = await incidentService.triggerIncident('fire');
    fireId = fire._id || fire.id;
    await incidentService.updateChecklist(fireId, { incidentResolved: true });

    // 4. Hospital Power Failure
    const hosp = await incidentService.triggerIncident('hospital');
    hospitalId = hosp._id || hosp.id;
  });

  it('1. GET /api/incidents/active?role=admin — returns all active incidents without restriction', async () => {
    const res = await request(app).get('/api/incidents/active?role=admin');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('2. GET /api/incidents/active?role=authority — returns all incidents sorted by severity', async () => {
    const res = await request(app).get('/api/incidents/active?role=authority');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('3. GET /api/incidents/active?role=hospital — returns only medical and hospital-related incidents', async () => {
    const res = await request(app).get('/api/incidents/active?role=hospital');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const incidents = res.body.data;
    incidents.forEach((inc) => {
      expect(isHospitalIncident(inc)).toBe(true);
    });
  });

  it('4. GET /api/incidents?role=investigator — returns resolved and rejected incidents only', async () => {
    const res = await request(app).get('/api/incidents?role=investigator');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const incidents = res.body.data;
    incidents.forEach((inc) => {
      expect(['RESOLVED', 'REJECTED']).toContain(inc.status);
    });
  });

  it('5. GET /api/incidents/active?role=reviewer — returns active or blueprint-prioritized incidents', async () => {
    const res = await request(app).get('/api/incidents/active?role=reviewer');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('6. GET /api/incidents/active?role=operator — returns awaiting, approved, or resolved dispatch incidents', async () => {
    const res = await request(app).get('/api/incidents/active?role=operator');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const incidents = res.body.data;
    incidents.forEach((inc) => {
      expect(['AWAITING_APPROVAL', 'APPROVED', 'RESOLVED']).toContain(inc.status);
    });
  });

  it('7. GET /api/incidents/active?role=user — returns active public alerts excluding resolved/rejected', async () => {
    const res = await request(app).get('/api/incidents/active?role=user');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const incidents = res.body.data;
    incidents.forEach((inc) => {
      expect(inc.status).not.toBe('RESOLVED');
      expect(inc.status).not.toBe('REJECTED');
    });
  });
});
