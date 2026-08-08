import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import Incident from '../models/Incident.js';
import { generateCSVReport, generatePDFReportStream } from '../services/reportGenerator.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../../');
const sampleDir = path.join(projectRoot, 'sample-exports');

if (!fs.existsSync(sampleDir)) {
  fs.mkdirSync(sampleDir, { recursive: true });
}

async function run() {
  console.log('Generating sample exports for judging...');
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is missing');

  await mongoose.connect(uri, { dbName: 'vyraion' });
  console.log('Connected to MongoDB Atlas');

  let incident = await Incident.findOne().sort({ createdAt: -1 });

  if (!incident) {
    console.log('Creating sample incident in vyraion.incidents...');
    incident = await Incident.create({
      id: 'traffic',
      uniqueId: `traffic_sample_${Date.now()}`,
      title: 'Traffic Collision & Fuel Spill',
      type: 'Traffic Accident',
      severity: 'HIGH',
      status: 'RESOLVED',
      phase: 5,
      hotspot: 'PIE Expressway Corridor',
      lat: 1.3323,
      lng: 103.8580,
      destination: 'Singapore General Hospital',
      checklist: {
        incidentVerified: true,
        teamNotified: true,
        unitsDispatched: true,
        unitsArrived: true,
        hospitalNotified: true,
        incidentResolved: true
      },
      dispatchedUnits: [
        { unitId: 'u1', name: 'ALS Ambulance #12', type: 'ambulance', category: 'hospital', stationName: 'City General Hospital' },
        { unitId: 'u2', name: 'Traffic Police Unit #04', type: 'police', category: 'police', stationName: 'Tanglin Police HQ' }
      ],
      operator: 'Priyanshu (EOC Operator)',
      resolutionOutcome: 'Incident resolved successfully. Expressway corridor clear.'
    });
  }

  const incObj = incident.toObject ? incident.toObject() : incident;

  // 1. CSV
  const csvData = generateCSVReport(incObj);
  const csvPath = path.join(sampleDir, 'sample-incident-report.csv');
  fs.writeFileSync(csvPath, csvData, 'utf8');
  console.log(`Saved sample CSV: ${csvPath}`);

  // 2. PDF
  const pdfPath = path.join(sampleDir, 'sample-incident-report.pdf');
  const writeStream = fs.createWriteStream(pdfPath);
  generatePDFReportStream(incObj, writeStream);

  writeStream.on('finish', () => {
    console.log(`Saved sample PDF: ${pdfPath}`);
    mongoose.disconnect();
    process.exit(0);
  });
}

run().catch((e) => {
  console.error('Sample generation failed:', e);
  process.exit(1);
});
