import { logger } from '../utils/logger.js';
import EventEmitter from 'events';

export const sessionEvents = new EventEmitter();

// Global state for tracking the active operator session
export const activeOperatorSession = {
  sessionId: null, // unique ID of current active session (uuid / random string)
  email: null,
  loginTime: null,
  socketId: null  // Socket.io ID of currently connected operator client
};

/**
 * Register an operator socket connection
 * @param {string} socketId - Socket ID
 * @param {string} sessionId - Operator session ID
 * @returns {boolean} - True if registration belongs to the current active session
 */
export const setOperatorOnline = (socketId, sessionId) => {
  if (activeOperatorSession.sessionId === sessionId) {
    activeOperatorSession.socketId = socketId;
    logger.info(`[SessionManager] Operator socket registered: ${socketId} for session ${sessionId}`);
    return true;
  }
  logger.warn(`[SessionManager] Operator socket registration failed: Session ID mismatch. Registered: ${activeOperatorSession.sessionId}, Got: ${sessionId}`);
  return false;
};

/**
 * Remove operator socket registration on disconnect
 * @param {string} socketId - Socket ID
 * @returns {boolean} - True if operator went offline
 */
export const setOperatorOffline = (socketId) => {
  if (activeOperatorSession.socketId === socketId) {
    activeOperatorSession.socketId = null;
    logger.info('[SessionManager] Operator socket disconnected (Operator offline)');
    return true;
  }
  return false;
};

/**
 * Check if the operator is currently online (socket connected)
 * @returns {boolean}
 */
export const isOperatorOnline = () => {
  return activeOperatorSession.socketId !== null;
};

/**
 * Invalidate current session and start a new one
 * @param {string} email - Operator email
 * @returns {string} - The new sessionId
 */
export const invalidateAndStartSession = (email) => {
  const oldSessionId = activeOperatorSession.sessionId;
  const newSessionId = 'sess_' + Math.random().toString(36).substring(2, 11);
  activeOperatorSession.sessionId = newSessionId;
  activeOperatorSession.email = email;
  activeOperatorSession.loginTime = new Date();
  activeOperatorSession.socketId = null; // Wait for new socket to register
  logger.info(`[SessionManager] New operator session started: ${newSessionId} for ${email}`);
  
  if (oldSessionId) {
    sessionEvents.emit('session-invalidated', oldSessionId);
  }
  
  return newSessionId;
};
