import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import healthRoutes from './routes/health.routes.js';
import incidentRoutes from './routes/incident.routes.js';
import authRoutes from './routes/auth.routes.js';
import operatorRoutes from './routes/operator.routes.js';
import novaRoutes from './routes/nova.routes.js';
import knowledgeRoutes from './routes/knowledge.routes.js';
import visionRoutes from './routes/vision.routes.js';
import datasetRoutes from './routes/dataset.routes.js';
import { errorHandler } from './middleware/error.middleware.js';

const app = express();

app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);
app.options('*', cors());
app.use(express.json());
app.use(morgan('dev'));

// Health routes
app.use('/', healthRoutes);
app.use('/api', healthRoutes);

// Auth REST API Endpoints
app.use('/api/auth', authRoutes);

// Incident REST API Endpoints
app.use('/api/incidents', incidentRoutes);

// Operator Console REST API Endpoints
app.use('/api/operator', operatorRoutes);

// Nova AI Decision Blueprint REST API Endpoints
app.use('/api/nova', novaRoutes);

// RAG Knowledge Base REST API Endpoints
app.use('/api/knowledge', knowledgeRoutes);

// AI Vision Inference Backend REST API Endpoints
app.use('/api/vision', visionRoutes);

// Dataset Generator Backend REST API Endpoints
app.use('/dataset', datasetRoutes);
app.use('/api/dataset', datasetRoutes);

// Global Error Handler
app.use(errorHandler);

export default app;
