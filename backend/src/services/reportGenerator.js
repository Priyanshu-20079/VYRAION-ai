import PDFDocument from 'pdfkit';

/**
 * Normalizes incident document data into a clean, complete report structure.
 */
export function buildReportPayload(inc) {
  const obj = inc?.toObject ? inc.toObject() : (inc || {});
  
  const _id = String(obj._id || obj.id || 'N/A');
  const uniqueId = obj.uniqueId || obj.id || _id;
  const title = obj.title || obj.name || 'Emergency Incident';
  const type = obj.type || 'Emergency';
  const severity = obj.severity || 'HIGH';
  const status = obj.status || 'AWAITING_APPROVAL';
  const phase = obj.phase ?? 3;

  const timeDetected = obj.timeDetected || (obj.detectedAt ? new Date(obj.detectedAt).toLocaleTimeString() : 'N/A');
  const createdAt = obj.createdAt ? new Date(obj.createdAt).toISOString() : new Date().toISOString();
  const approvedAt = obj.approvedAt ? new Date(obj.approvedAt).toISOString() : 'N/A';
  const resolvedAt = obj.resolvedAt ? new Date(obj.resolvedAt).toISOString() : 'N/A';
  const updatedAt = obj.updatedAt ? new Date(obj.updatedAt).toISOString() : createdAt;

  const hotspot = obj.hotspot || 'Central Command Zone';
  const lat = obj.lat || 1.3521;
  const lng = obj.lng || 103.8198;
  const destination = obj.destination || obj.nearestHospital || 'Singapore General Hospital';

  const dispatchedUnits = Array.isArray(obj.dispatchedUnits) ? obj.dispatchedUnits : [];
  const assignedAgents = Array.isArray(obj.assignedAgents) ? obj.assignedAgents : ['Pulse Agent', 'Sentinel Agent', 'Nova AI Core'];
  const operator = obj.operator || 'Priyanshu (EOC Operator)';
  const detectedBy = obj.detectedBy || 'AI Vision Telemetry System (CAM-01)';

  const checklist = {
    incidentVerified:  Boolean(obj.checklist?.incidentVerified),
    teamNotified:      Boolean(obj.checklist?.teamNotified),
    unitsDispatched:   Boolean(obj.checklist?.unitsDispatched),
    unitsArrived:      Boolean(obj.checklist?.unitsArrived),
    hospitalNotified:  Boolean(obj.checklist?.hospitalNotified),
    incidentResolved:  Boolean(obj.checklist?.incidentResolved),
  };

  const priorities = Array.isArray(obj.priorities) && obj.priorities.length > 0
    ? obj.priorities
    : [
        { priority: 1, title: 'Dispatch Primary Emergency Units', action: 'Route nearest first-response teams via priority corridor.' },
        { priority: 2, title: 'Coordinate Medical & Facility Systems', action: 'Pre-notify receiving hospital ICU reserves & fuel feeds.' },
        { priority: 3, title: 'Citywide Sentinel Conflict Prevention', action: 'Verify zero resource collision across active Singapore EOC sectors.' }
      ];

  const resolutionOutcome = obj.resolutionOutcome || obj.outcome || (status === 'RESOLVED' ? 'Incident fully resolved, emergency corridor cleared.' : 'Active response in progress.');
  const notes = obj.notes || obj.operatorNotes || 'No notes recorded.';

  return {
    source: 'MongoDB Atlas / vyraion.incidents',
    generatedAt: new Date().toISOString(),
    incident: {
      _id,
      id: obj.id || _id,
      uniqueId,
      title,
      type,
      severity,
      status,
      phase,
      timeDetected,
      createdAt,
      approvedAt,
      resolvedAt,
      updatedAt,
      hotspot,
      lat,
      lng,
      destination,
      dispatchedUnits,
      assignedAgents,
      operator,
      detectedBy,
      checklist,
      priorities,
      resolutionOutcome,
      notes
    }
  };
}

/**
 * Generates JSON Report
 */
export function generateJSONReport(inc) {
  return buildReportPayload(inc);
}

/**
 * Generates CSV Report
 */
export function generateCSVReport(inc) {
  const data = buildReportPayload(inc);
  const i = data.incident;

  const headers = [
    'Source',
    'Generated_At',
    'MongoDB_ObjectID',
    'Unique_ID',
    'Title',
    'Type',
    'Severity',
    'Status',
    'Phase',
    'Hotspot_Zone',
    'Latitude',
    'Longitude',
    'Destination',
    'Time_Detected',
    'Created_At',
    'Approved_At',
    'Resolved_At',
    'Operator',
    'Detected_By',
    'Units_Count',
    'Dispatched_Units',
    'Checklist_Verified',
    'Checklist_Notified',
    'Checklist_Dispatched',
    'Checklist_Arrived',
    'Checklist_HospitalNotified',
    'Checklist_Resolved',
    'Resolution_Outcome',
    'Notes'
  ];

  const unitsStr = i.dispatchedUnits.map(u => `${u.name || u.type} (${u.category || 'unit'})`).join(' | ');

  const row = [
    `"${data.source}"`,
    `"${data.generatedAt}"`,
    `"${i._id}"`,
    `"${i.uniqueId}"`,
    `"${(i.title).replace(/"/g, '""')}"`,
    `"${(i.type).replace(/"/g, '""')}"`,
    `"${i.severity}"`,
    `"${i.status}"`,
    i.phase,
    `"${(i.hotspot).replace(/"/g, '""')}"`,
    i.lat,
    i.lng,
    `"${(i.destination).replace(/"/g, '""')}"`,
    `"${i.timeDetected}"`,
    `"${i.createdAt}"`,
    `"${i.approvedAt}"`,
    `"${i.resolvedAt}"`,
    `"${(i.operator).replace(/"/g, '""')}"`,
    `"${(i.detectedBy).replace(/"/g, '""')}"`,
    i.dispatchedUnits.length,
    `"${unitsStr.replace(/"/g, '""')}"`,
    i.checklist.incidentVerified,
    i.checklist.teamNotified,
    i.checklist.unitsDispatched,
    i.checklist.unitsArrived,
    i.checklist.hospitalNotified,
    i.checklist.incidentResolved,
    `"${(i.resolutionOutcome).replace(/"/g, '""')}"`,
    `"${(i.notes).replace(/"/g, '""')}"`
  ];

  return `${headers.join(',')}\n${row.join(',')}`;
}

/**
 * Generates Printable HTML Report
 */
export function generateHTMLReport(inc) {
  const data = buildReportPayload(inc);
  const i = data.incident;

  const checklistRows = [
    { label: 'Incident Verified', val: i.checklist.incidentVerified },
    { label: 'Response Team Notified', val: i.checklist.teamNotified },
    { label: 'Emergency Units Dispatched', val: i.checklist.unitsDispatched },
    { label: 'Units Arrived On Scene', val: i.checklist.unitsArrived },
    { label: 'Hospital / Medical Notified', val: i.checklist.hospitalNotified },
    { label: 'Incident Resolved', val: i.checklist.incidentResolved },
  ];

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>VYRAION Incident Report - ${i.uniqueId}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #0B101D; color: #E2E8F0; margin: 0; padding: 40px; }
    .container { max-width: 900px; margin: 0 auto; background: #0F172A; border: 1px solid #1E293B; border-radius: 16px; padding: 40px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); }
    .header { border-b: 2px solid #33C8FF; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-start; }
    .title { font-size: 24px; font-weight: 800; color: #FFFFFF; letter-spacing: -0.025em; margin: 0; }
    .subtitle { font-size: 13px; color: #33C8FF; font-family: monospace; font-weight: 700; margin-top: 6px; }
    .source-tag { background: rgba(51, 200, 255, 0.1); border: 1px solid rgba(51, 200, 255, 0.3); color: #33C8FF; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-family: monospace; font-weight: bold; }
    .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 30px; }
    .card { background: #1E293B; border: 1px solid #334155; padding: 16px; border-radius: 12px; }
    .card-label { font-size: 11px; color: #94A3B8; font-family: monospace; text-transform: uppercase; margin-bottom: 4px; }
    .card-val { font-size: 14px; font-weight: 700; color: #F8FAFC; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; font-family: monospace; }
    .badge-critical { background: rgba(239, 68, 68, 0.2); color: #EF4444; border: 1px solid rgba(239, 68, 68, 0.4); }
    .badge-high { background: rgba(251, 191, 36, 0.2); color: #FBBF24; border: 1px solid rgba(251, 191, 36, 0.4); }
    .badge-status { background: rgba(16, 185, 129, 0.2); color: #10B981; border: 1px solid rgba(16, 185, 129, 0.4); }
    section { margin-bottom: 30px; }
    h2 { font-size: 15px; font-family: monospace; color: #33C8FF; text-transform: uppercase; border-bottom: 1px solid #334155; padding-bottom: 8px; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; font-family: monospace; }
    th { background: #1E293B; text-align: left; padding: 10px; color: #94A3B8; font-weight: 700; border-bottom: 1px solid #334155; }
    td { padding: 10px; border-bottom: 1px solid #1E293B; color: #CBD5E1; }
    .check-done { color: #10B981; font-weight: bold; }
    .check-pending { color: #64748B; }
    .footer { border-top: 1px solid #334155; padding-top: 20px; font-size: 11px; color: #64748B; font-family: monospace; display: flex; justify-content: space-between; }
    @media print {
      body { background: #FFF; color: #000; padding: 0; }
      .container { border: none; box-shadow: none; background: #FFF; color: #000; max-width: 100%; padding: 0; }
      .card { background: #F8FAFC; border: 1px solid #E2E8F0; }
      .card-val { color: #0F172A; }
      th { background: #F1F5F9; color: #475569; border-bottom: 1px solid #CBD5E1; }
      td { border-bottom: 1px solid #E2E8F0; color: #0F172A; }
      h2 { color: #0284C7; border-bottom-color: #CBD5E1; }
      .header { border-bottom-color: #0284C7; }
      .subtitle { color: #0284C7; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <h1 class="title">VYRAION OS — Incident Resolution Report</h1>
        <div class="subtitle">AUTOMATED EMERGENCY COMMAND TELEMETRY & AUDIT RECORD</div>
      </div>
      <div class="source-tag">${data.source}</div>
    </div>

    <div class="grid">
      <div class="card">
        <div class="card-label">Incident Identity</div>
        <div class="card-val">${i.title} (${i.type})</div>
        <div style="font-family: monospace; font-size: 11px; color: #33C8FF; margin-top: 4px;">ID: ${i.uniqueId}</div>
      </div>
      <div class="card">
        <div class="card-label">Severity & Status</div>
        <div style="margin-top: 4px;">
          <span class="badge ${i.severity === 'CRITICAL' ? 'badge-critical' : 'badge-high'}">${i.severity}</span>
          <span class="badge badge-status" style="margin-left: 6px;">${i.status} (Phase ${i.phase})</span>
        </div>
      </div>
      <div class="card">
        <div class="card-label">Geographic Location</div>
        <div class="card-val">${i.hotspot}</div>
        <div style="font-family: monospace; font-size: 11px; color: #94A3B8; margin-top: 4px;">Lat: ${i.lat}, Lng: ${i.lng}</div>
      </div>
      <div class="card">
        <div class="card-label">Receiving Facility</div>
        <div class="card-val">${i.destination}</div>
      </div>
    </div>

    <section>
      <h2>1. Timeline & Detection Events</h2>
      <table>
        <thead>
          <tr>
            <th>Event Stage</th>
            <th>Details / Timestamp</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Time Detected</td>
            <td>${i.timeDetected}</td>
          </tr>
          <tr>
            <td>Created At</td>
            <td>${i.createdAt}</td>
          </tr>
          <tr>
            <td>Human Operator Approval</td>
            <td>${i.approvedAt}</td>
          </tr>
          <tr>
            <td>Resolution Completed</td>
            <td>${i.resolvedAt}</td>
          </tr>
          <tr>
            <td>Telemetry Source</td>
            <td>${i.detectedBy}</td>
          </tr>
        </tbody>
      </table>
    </section>

    <section>
      <h2>2. AI Multi-Agent Blueprint & Recommendations</h2>
      <table>
        <thead>
          <tr>
            <th>Priority</th>
            <th>Strategy Title</th>
            <th>Action Execution Plan</th>
          </tr>
        </thead>
        <tbody>
          ${i.priorities.map(p => `
            <tr>
              <td style="font-weight: bold; color: #33C8FF;">#${p.priority || 1}</td>
              <td style="font-weight: bold;">${p.title}</td>
              <td>${p.action}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </section>

    <section>
      <h2>3. Emergency Response Units</h2>
      <table>
        <thead>
          <tr>
            <th>Unit Name</th>
            <th>Category</th>
            <th>Station Origin</th>
          </tr>
        </thead>
        <tbody>
          ${i.dispatchedUnits.length > 0 ? i.dispatchedUnits.map(u => `
            <tr>
              <td>${u.icon || '🚑'} ${u.name}</td>
              <td style="text-transform: uppercase;">${u.category || u.type || 'First Responder'}</td>
              <td>${u.stationName || 'Central EOC Station'}</td>
            </tr>
          `).join('') : `
            <tr>
              <td colspan="3">Dispatched multi-agency emergency response team</td>
            </tr>
          `}
        </tbody>
      </table>
    </section>

    <section>
      <h2>4. Action Checklist Lifecycle</h2>
      <table>
        <thead>
          <tr>
            <th>Checklist Item</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${checklistRows.map(c => `
            <tr>
              <td>${c.label}</td>
              <td class="${c.val ? 'check-done' : 'check-pending'}">${c.val ? '✓ COMPLETE (AUTO)' : '○ PENDING'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </section>

    <section>
      <h2>5. Resolution Outcome & Operator Notes</h2>
      <div class="card" style="margin-bottom: 12px;">
        <div class="card-label">Resolution Outcome</div>
        <div class="card-val" style="color: #10B981;">${i.resolutionOutcome}</div>
      </div>
      <div class="card">
        <div class="card-label">Operator Audit Notes</div>
        <div class="card-val" style="font-weight: 400;">${i.notes}</div>
      </div>
    </section>

    <div class="footer">
      <span>VYRAION EOC — MongoDB Atlas Incident Document: ${i._id}</span>
      <span>Report Generated: ${data.generatedAt}</span>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Generates Server-Side PDF Stream (using PDFKit)
 */
export function generatePDFReportStream(inc, outStream) {
  const data = buildReportPayload(inc);
  const i = data.incident;

  const doc = new PDFDocument({ margin: 40, size: 'A4' });

  if (typeof outStream.setHeader === 'function') {
    outStream.setHeader('Content-Type', 'application/pdf');
    outStream.setHeader('Content-Disposition', `inline; filename="incident-report-${i.uniqueId}.pdf"`);
  }

  doc.pipe(outStream);

  // Styling palette
  const primaryColor = '#0284C7';
  const darkTextColor = '#0F172A';
  const lightTextColor = '#475569';
  const borderColor = '#CBD5E1';

  // Header
  doc.fillColor(primaryColor).fontSize(20).text('VYRAION OS', { continued: true }).fillColor(darkTextColor).text(' — Incident Resolution Report');
  doc.fontSize(9).fillColor(lightTextColor).text('AUTOMATED EMERGENCY COMMAND TELEMETRY & AUDIT RECORD');
  doc.fontSize(9).fillColor(primaryColor).text(`Source: ${data.source}`, { align: 'right' });
  doc.moveDown(0.5);
  doc.strokeColor(primaryColor).lineWidth(2).moveTo(40, doc.y).lineTo(550, doc.y).stroke();
  doc.moveDown(1);

  // Section 1: Executive Summary
  doc.fontSize(12).fillColor(primaryColor).text('1. INCIDENT EXECUTIVE SUMMARY');
  doc.strokeColor(borderColor).lineWidth(0.5).moveTo(40, doc.y).lineTo(550, doc.y).stroke();
  doc.moveDown(0.5);

  doc.fontSize(10).fillColor(darkTextColor);
  doc.text(`Incident Title: ${i.title} (${i.type})`);
  doc.text(`Unique ID: ${i.uniqueId}  |  MongoDB _id: ${i._id}`);
  doc.text(`Severity: ${i.severity}  |  Status: ${i.status} (Phase ${i.phase})`);
  doc.text(`Telemetry Detection: ${i.detectedBy} at ${i.timeDetected}`);
  doc.moveDown(1);

  // Section 2: Geographic & Location
  doc.fontSize(12).fillColor(primaryColor).text('2. GEOGRAPHIC & LOCATION TELEMETRY');
  doc.strokeColor(borderColor).lineWidth(0.5).moveTo(40, doc.y).lineTo(550, doc.y).stroke();
  doc.moveDown(0.5);

  doc.fontSize(10).fillColor(darkTextColor);
  doc.text(`Hotspot Zone: ${i.hotspot}`);
  doc.text(`Coordinates: Latitude ${i.lat}, Longitude ${i.lng}`);
  doc.text(`Destination Facility: ${i.destination}`);
  doc.moveDown(1);

  // Section 3: AI Recommendations
  doc.fontSize(12).fillColor(primaryColor).text('3. AI MULTI-AGENT BLUEPRINT & RECOMMENDATIONS');
  doc.strokeColor(borderColor).lineWidth(0.5).moveTo(40, doc.y).lineTo(550, doc.y).stroke();
  doc.moveDown(0.5);

  i.priorities.forEach((p) => {
    doc.fontSize(10).fillColor(darkTextColor).text(`Priority #${p.priority || 1}: ${p.title}`, { underline: true });
    doc.fontSize(9).fillColor(lightTextColor).text(`Action: ${p.action}`);
    doc.moveDown(0.3);
  });
  doc.moveDown(0.5);

  // Section 4: Emergency Response Units
  doc.fontSize(12).fillColor(primaryColor).text('4. DISPATCHED RESPONSE UNITS');
  doc.strokeColor(borderColor).lineWidth(0.5).moveTo(40, doc.y).lineTo(550, doc.y).stroke();
  doc.moveDown(0.5);

  if (i.dispatchedUnits.length > 0) {
    i.dispatchedUnits.forEach(u => {
      doc.fontSize(9).fillColor(darkTextColor).text(`• ${u.name} [${(u.category || 'Unit').toUpperCase()}] — Station: ${u.stationName || 'EOC Base'}`);
    });
  } else {
    doc.fontSize(9).fillColor(darkTextColor).text('• Dispatched multi-agency emergency response units assigned.');
  }
  doc.moveDown(1);

  // Section 5: Action Checklist
  doc.fontSize(12).fillColor(primaryColor).text('5. INCIDENT ACTION CHECKLIST LIFECYCLE');
  doc.strokeColor(borderColor).lineWidth(0.5).moveTo(40, doc.y).lineTo(550, doc.y).stroke();
  doc.moveDown(0.5);

  const checklistItems = [
    ['Incident Verified', i.checklist.incidentVerified],
    ['Response Team Notified', i.checklist.teamNotified],
    ['Emergency Units Dispatched', i.checklist.unitsDispatched],
    ['Units Arrived On Scene', i.checklist.unitsArrived],
    ['Hospital / Medical Notified', i.checklist.hospitalNotified],
    ['Incident Resolved', i.checklist.incidentResolved],
  ];

  checklistItems.forEach(([label, done]) => {
    const statusText = done ? '✓ COMPLETE (AUTO)' : '○ PENDING';
    doc.fontSize(9).fillColor(done ? '#10B981' : lightTextColor).text(`[ ${statusText} ]  ${label}`);
  });
  doc.moveDown(1);

  // Section 6: Resolution & Notes
  doc.fontSize(12).fillColor(primaryColor).text('6. RESOLUTION OUTCOME & OPERATOR NOTES');
  doc.strokeColor(borderColor).lineWidth(0.5).moveTo(40, doc.y).lineTo(550, doc.y).stroke();
  doc.moveDown(0.5);

  doc.fontSize(10).fillColor(darkTextColor).text(`Outcome: ${i.resolutionOutcome}`);
  doc.fontSize(9).fillColor(lightTextColor).text(`Operator Notes: ${i.notes}`);
  doc.moveDown(1.5);

  // Footer
  doc.strokeColor(borderColor).lineWidth(0.5).moveTo(40, doc.y).lineTo(550, doc.y).stroke();
  doc.moveDown(0.5);
  doc.fontSize(8).fillColor(lightTextColor).text(`Report Generated: ${data.generatedAt}  |  VYRAION EOC MongoDB Atlas Document`, { align: 'center' });

  doc.end();
}
