import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { CircleAlert, CheckCircle2, Zap, Server, Siren, Truck, ShieldAlert } from 'lucide-react';

const NotificationContext = createContext();

const nowMs = Date.now();
const INITIAL_NOTIFICATIONS = [
  {
    id: 'system_memory_warning',
    incidentId: 'system',
    eventType: 'memory_warning',
    agentType: 'Sentinel',
    read: false,
    icon: CircleAlert,
    iconColor: 'text-amber-400',
    title: 'Memory Bottleneck Forecast',
    detail: 'AI model cache nearing 89% capacity. Recommend purge.',
    time: '2m ago',
    type: 'warning',
    expiry: 'acknowledge',
    createdAt: nowMs - 2 * 60 * 1000
  },
  {
    id: 'system_chromadb_sync',
    incidentId: 'system',
    eventType: 'index_synced',
    agentType: 'ChromaDB',
    read: false,
    icon: CheckCircle2,
    iconColor: 'text-emerald-400',
    title: 'ChromaDB Index Synced',
    detail: 'Vector index rebuilt successfully. 1,204 embeddings updated.',
    time: '5m ago',
    type: 'success',
    expiry: '30min',
    createdAt: nowMs - 5 * 60 * 1000
  },
  {
    id: 'system_swarm_rebalance',
    incidentId: 'system',
    eventType: 'queue_rebalanced',
    agentType: 'SwarmAgent',
    read: false,
    icon: Zap,
    iconColor: 'text-[#7C5CFF]',
    title: 'Swarm Agent #4 Rebalanced Queue',
    detail: 'Task queue redistributed across 7 agents. Latency normalized.',
    time: '12m ago',
    type: 'info',
    expiry: '30min',
    createdAt: nowMs - 12 * 60 * 1000
  },
  {
    id: 'power_cascade_failure',
    incidentId: 'power',
    eventType: 'cascade_failure',
    agentType: 'Infrastructure',
    read: false,
    icon: Server,
    iconColor: 'text-[#EF4444]',
    title: 'Emergency Alert: Power Grid Failure',
    detail: 'Substation 12 cascade failure detected. Nova response queued.',
    time: '18m ago',
    type: 'emergency',
    expiry: 'resolved',
    createdAt: nowMs - 18 * 60 * 1000
  },
];

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);

  // Set tracking active notification keys: incidentId + '_' + eventType
  const activeKeysRef = useRef(new Set(INITIAL_NOTIFICATIONS.map((n) => n.id)));

  // ─── EXPIRY ENGINE: Removes expired notifications & synchronizes live ───
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      setNotifications((prev) => {
        const filtered = prev.filter((n) => {
          if (n.expiry === '30min') {
            const ageMs = now - (n.createdAt || now);
            return ageMs < 30 * 60 * 1000; // Auto-remove after 30 min
          }
          return true;
        });

        // Re-sync active keys
        activeKeysRef.current = new Set(filtered.map((n) => n.id));
        return filtered;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // ─── EVENT-DRIVEN NOTIFICATION EMITTER ───
  // Key format: incidentId + '_' + eventType (e.g. 'traffic_dispatched_Ambulance')
  const emitEventNotification = useCallback((payload) => {
    const {
      incidentId,
      eventType,
      title,
      detail,
      type = 'info',
      expiry = '30min',
      icon = Siren,
      iconColor = 'text-[#33C8FF]',
      eta = null
    } = payload;

    if (!incidentId || !eventType) return;

    // Filter out internal debug notifications
    const textLower = `${title} ${detail}`.toLowerCase();
    const filterPatterns = [
      /strategy generated/i,
      /blueprint generated/i,
      /llm request/i,
      /llm response/i,
      /ai thinking/i,
      /ai processing/i,
      /sensor data collected/i,
      /agent:/i,
      /total ai processing/i,
      /strategy/i,
      /blueprint/i,
      /telemetry/i,
      /debug/i,
      /offline simulation/i,
      /local fallback/i,
      /offline simulation mode/i,
      /scada/i,
      /forecast/i,
      /synced/i,
      /rebalanced/i
    ];
    
    if (filterPatterns.some(pat => pat.test(textLower))) {
      return;
    }

    // Unique Event Key: incidentId + '_' + eventType
    const eventKey = `${incidentId}_${eventType}`;

    setNotifications((prev) => {
      const existingIndex = prev.findIndex((n) => n.id === eventKey);
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      if (existingIndex !== -1) {
        // Key exists! Update existing notification in-place ONLY if details or ETA changed
        const existing = prev[existingIndex];
        if (existing.detail === detail && existing.title === title && existing.eta === eta) {
          return prev; // DO NOT re-emit or duplicate on timer ticks / re-renders
        }

        const updatedList = [...prev];
        updatedList[existingIndex] = {
          ...existing,
          title,
          detail,
          type,
          expiry,
          eta,
          time: timeStr
        };
        return updatedList;
      }

      // Key does NOT exist! Create exactly ONE notification per event per incident
      activeKeysRef.current.add(eventKey);

      const newNotif = {
        id: eventKey,
        incidentId,
        eventType,
        title,
        detail,
        type,
        expiry,
        eta,
        icon,
        iconColor,
        read: false,
        time: 'Just now',
        createdAt: Date.now()
      };

      return [newNotif, ...prev];
    });
  }, []);

  // ─── REMOVE NOTIFICATIONS ON INCIDENT RESOLUTION ───
  const removeIncidentNotifications = useCallback((incidentId) => {
    setNotifications((prev) => {
      const filtered = prev.filter((n) => n.incidentId !== incidentId);
      activeKeysRef.current = new Set(filtered.map((n) => n.id));
      return filtered;
    });
  }, []);

  const markRead = useCallback((id) => {
    setNotifications((prev) =>
      prev.reduce((acc, n) => {
        if (n.id === id) {
          if (n.expiry === 'acknowledge') {
            return acc; // Auto-dismiss on acknowledge
          }
          acc.push({ ...n, read: true });
        } else {
          acc.push(n);
        }
        return acc;
      }, [])
    );
  }, []);

  const dismissNotification = useCallback((id) => {
    setNotifications((prev) => {
      const filtered = prev.filter((n) => n.id !== id);
      activeKeysRef.current = new Set(filtered.map((n) => n.id));
      return filtered;
    });
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) =>
      prev.filter((n) => n.expiry !== 'acknowledge').map((n) => ({ ...n, read: true }))
    );
  }, []);

  const clearAll = useCallback(() => {
    activeKeysRef.current.clear();
    setNotifications([]);
  }, []);

  return (
    <NotificationContext.Provider value={{
      notifications,
      emitEventNotification,
      addOrUpdateNotification: emitEventNotification, // alias
      removeIncidentNotifications,
      markRead,
      dismissNotification,
      markAllRead,
      clearAll
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
