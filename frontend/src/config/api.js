/* ═══════════════════════════════════════════════════════════
   VYRAION FRONTEND API CONFIGURATION & PRODUCTION BASE URL
═══════════════════════════════════════════════════════════ */

const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  
  if (envUrl && typeof envUrl === 'string' && envUrl.trim() !== '') {
    // Strip trailing slash if present
    return envUrl.trim().replace(/\/+$/, '');
  }

  // Local development default fallback
  return 'http://localhost:5000';
};

export const API_BASE_URL = getApiBaseUrl();
export const AUTH_API_URL = `${API_BASE_URL}/api/auth`;
export const INCIDENTS_API_URL = `${API_BASE_URL}/api/incidents`;
export const OPERATOR_API_URL = `${API_BASE_URL}/api/operator`;
export const NOVA_API_URL = `${API_BASE_URL}/api/nova`;
export const KNOWLEDGE_API_URL = `${API_BASE_URL}/api/knowledge`;
export const DATASET_API_URL = `${API_BASE_URL}/api/dataset`;
export const AI_SERVICE_URL = import.meta.env.VITE_AI_SERVICE_URL || 'http://localhost:8000';

export const getIncidentReportUrl = (id, format = 'pdf') => `${INCIDENTS_API_URL}/${id}/report?format=${format}`;
