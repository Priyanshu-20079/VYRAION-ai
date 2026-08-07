import { incidentService } from '../services/incidentService.js';
import { connectDB } from '../config/db.js';
import { logger } from '../utils/logger.js';

async function seedDemo() {
  logger.info('[Seed Demo] Resetting and seeding initial emergency incidents...');
  await connectDB();
  
  await incidentService.resetAllIncidents();
  
  // Seed 3 realistic in-progress incidents
  const i1 = await incidentService.triggerIncident('traffic');
  const i2 = await incidentService.triggerIncident('fire');
  const i3 = await incidentService.triggerIncident('hospital');
  
  logger.info(`[Seed Demo] Successfully seeded 3 active incidents: ${i1.id}, ${i2.id}, ${i3.id}`);
  process.exit(0);
}

seedDemo().catch((err) => {
  logger.error('[Seed Demo Error]:', err.message);
  process.exit(1);
});
