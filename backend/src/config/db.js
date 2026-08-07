import mongoose from 'mongoose';
import { config } from './env.js';
import { logger } from '../utils/logger.js';

export const connectDB = async () => {
  if (process.env.NODE_ENV === 'test') {
    return;
  }
  if (!config.mongoUri) {
    if (process.env.NODE_ENV === 'production') {
      logger.error('CRITICAL: MONGODB_URI is required in production for permanent multi-device account storage!');
    } else {
      logger.warn('Running in development mode with temporary in-memory storage.');
    }
    return;
  }

  try {
    const conn = await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 5000
    });
    logger.info(`[MongoDB SUCCESS] Connected to MongoDB Cluster at ${conn.connection.host}. Permanent user persistence ACTIVE.`);
  } catch (error) {
    logger.error(`[MongoDB Connection Error]: ${error.message}`);
    if (process.env.NODE_ENV === 'production') {
      logger.error('CRITICAL: MongoDB connection failed in production. Permanent account storage is unavailable.');
    } else {
      logger.warn('Running in development mode with temporary in-memory storage.');
    }
  }
};
