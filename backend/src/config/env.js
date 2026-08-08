import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/vyraion',
  jwtSecret: process.env.JWT_SECRET || 'vyraion_super_secret_jwt_key_2026',
  aiServiceUrl: process.env.AI_SERVICE_URL || 'http://localhost:8000',
  demoMode: process.env.DEMO_MODE !== 'false'
};
