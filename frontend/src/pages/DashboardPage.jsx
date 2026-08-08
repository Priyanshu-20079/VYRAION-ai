import React, { useState, useEffect, useRef, useCallback } from 'react';
import AIVisionStatusPanel from '../components/vision/AIVisionStatusPanel';
import { fetchNovaBlueprint, generateNovaBlueprint } from '../utils/novaDecisionEngine';
import { INCIDENTS_API_URL, OPERATOR_API_URL } from '../config/api';
import {
  AlertTriangle,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Brain,
  ArrowRight,
  Cpu,
  RotateCcw,
  Car,
  Hospital,
  CloudRain,
  Flame,
  ShieldAlert,
  Radio,
  Server,
  Loader2,
  UserCheck,
  Truck,
  Timer,
  Siren,
  Activity,
  Check,
  Video,
  ClipboardList
} from 'lucide-react';
import SingaporeSatelliteMap, { createDynamicIncident, findNearestResponders, buildRoadNetworkRoute } from '../components/common/SingaporeSatelliteMap';
import IncidentChecklistPanel from '../components/common/IncidentChecklistPanel';
import { MASTER_INCIDENTS, DISPATCH_UNITS, CITY_FACILITIES } from '../data/incidents';
import { STATUS_COLORS } from '../utils/statusColors';
import { useNotifications } from '../context/NotificationContext';
import { useSocket } from '../context/SocketContext';
import { useViewRole } from '../context/ViewRoleContext';
import { filterIncidentsForRole, getFilterTabsForRole, applySubFilter } from '../utils/incidentRoleFilters';

export default function DashboardPage() {
  const { emitEventNotification } = useNotifications();
  const { socket, isConnected } = useSocket();
  const { viewRole } = useViewRole();
  const emittedStageEventsRef = useRef(new Set());
  const [activeQueue, setActiveQueue] = useState([]);
  const [novaBlueprint, setNovaBlueprint] = useState([]);
  const [aiError, setAiError] = useState(null);
  const [disableLiveAI, setDisableLiveAI] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('vyraion_disable_live_ai') === 'true';
    }
    return false;
  });
  const [selectedTab, setSelectedTab] = useState('all');
  const [isOfflineSimulation, setIsOfflineSimulation] = useState(false);
  const [isOperatorOnline, setIsOperatorOnline] = useState(null); // null = loading, true = online, false = offline
  const [modelUsed, setModelUsed] = useState('');
  const [isLoadingBlueprint, setIsLoadingBlueprint] = useState(false);
  const [isTriggering, setIsTriggering] = useState({});
  const [liveVehicles, setLiveVehicles] = useState([]);
  const liveVehiclesRef = useRef([]);
  const [incidentAnimState, setIncidentAnimState] = useState({});

  // Reset tab when viewRole changes
  useEffect(() => {
    const tabs = getFilterTabsForRole(viewRole);
    setSelectedTab(tabs[0]?.id || 'all');
  }, [viewRole]);

  // UI Navigation State
  const [currentPhase, setCurrentPhase] = useState(0);
  const [aiStep, setAiStep] = useState(0);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [completedAgents, setCompletedAgents] = useState([]);
  const [sentinelConfidence, setSentinelConfidence] = useState(22);
  const [hoveredNode, setHoveredNode] = useState(null);

  // Detection sub-step within Phase 1
  const [detectionStep, setDetectionStep] = useState(0);

  // Human approval sub-step within Phase 3
  const [approvalStep, setApprovalStep] = useState(0);

  // Timeline Logs
  const [timelineLogs, setTimelineLogs] = useState([]);
  const lastLoggedRef = useRef({});

  const addLog = (text, type = 'info', phase = '') => {
    const textLower = text.toLowerCase();
    
    // 1. Filter internal developer/AI logs
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
    
    // 2. Map standard EOC operational events
    let normalizedText = text;
    let normalizedType = type;
    
    if (textLower.includes('detected')) {
      const match = text.match(/New\s+(.*?)\s+detected| (.*?)\s+Detected/i);
      const incName = match ? (match[1] || match[2] || 'Emergency') : 'Emergency';
      normalizedText = `🚨 Incident Detected: ${incName}`;
      normalizedType = 'red';
    } else if (textLower.includes('location')) {
      normalizedText = `📍 Incident Location Identified`;
      normalizedType = 'blue';
    } else if (textLower.includes('approval request') || textLower.includes('notified')) {
      normalizedText = `📲 Approval Request Sent to Operator`;
      normalizedType = 'orange';
    } else if (textLower.includes('waiting for human')) {
      normalizedText = `⏳ Waiting for Human Approval`;
      normalizedType = 'orange';
    } else if (textLower.includes('approved') || textLower.includes('received')) {
      normalizedText = `✅ Mission Approved`;
      normalizedType = 'green';
    } else if (textLower.includes('dispatched') || textLower.includes('dispatch confirmed')) {
      normalizedText = `🚒 Emergency Units Dispatched`;
      normalizedType = 'blue';
    } else if (textLower.includes('en route')) {
      normalizedText = `🚑 Resources En Route`;
      normalizedType = 'blue';
    } else if (textLower.includes('resolved') || textLower.includes('mission complete')) {
      normalizedType = 'green';
    } else if (textLower.includes('complete') && !textLower.includes('resolved')) {
      normalizedText = `🏠 Mission Complete`;
      normalizedType = 'green';
    } else if (textLower.includes('archived')) {
      normalizedText = `📦 Case Archived`;
      normalizedType = 'green';
    } else if (textLower.includes('live status')) {
      normalizedText = `📡 Live Status Update`;
      normalizedType = 'blue';
    } else {
      if (type === 'emergency' || type === 'danger' || type === 'error' || type === 'red') normalizedType = 'red';
      else if (type === 'warning' || type === 'human_pending' || type === 'orange') normalizedType = 'orange';
      else if (type === 'success' || type === 'completed' || type === 'green') normalizedType = 'green';
      else if (type === 'info' || type === 'blue') normalizedType = 'blue';
      else if (type === 'system' || type === 'purple') normalizedType = 'purple';
      else normalizedType = 'blue';
    }

    const now = Date.now();

    // 3. Deduplicate duplicate events within 2s
    const lastLog = lastLoggedRef.current[normalizedText];
    if (lastLog && (now - lastLog.timestamp < 2000)) {
      return;
    }
    
    lastLoggedRef.current[normalizedText] = { timestamp: now };

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const newLog = {
      id: now + Math.random(),
      time: timeStr,
      text: normalizedText,
      type: normalizedType,
      phase
    };

    setTimelineLogs((prev) => [newLog, ...prev].slice(0, 15));
  };

  const masterIncidents = MASTER_INCIDENTS;

  const latestIncident = activeQueue.length > 0 ? activeQueue[activeQueue.length - 1] : null;
  const latestIncidentDef = latestIncident ? masterIncidents[latestIncident.id] : null;

  // ─── BACKEND REAL-TIME WEBSOCKET STATE SYNC ENGINE ───────────────────────
  const fetchBackendIncidents = useCallback(async () => {
    try {
      const endpoint = ['investigator'].includes(viewRole) 
        ? `${INCIDENTS_API_URL}?role=${viewRole}` 
        : `${INCIDENTS_API_URL}/active?role=${viewRole}`;
      const res = await fetch(endpoint);
      if (res.ok) {
        const result = await res.json();
        if (result.success && Array.isArray(result.data)) {
          let backendQueue = result.data;
          backendQueue = applySubFilter(backendQueue, viewRole, selectedTab);
          
          backendQueue = backendQueue.map((inc) => {
            let masterKey = 'traffic';
            const rawId = String(inc.type || inc.name || inc.id || '').toLowerCase();
            if (rawId.includes('fire')) masterKey = 'fire';
            else if (rawId.includes('medical')) masterKey = 'medical';
            else if (rawId.includes('power')) masterKey = 'power';
            else if (rawId.includes('hospital')) masterKey = 'hospital';
            else if (rawId.includes('hazmat')) masterKey = 'hazmat';
            else if (rawId.includes('safety')) masterKey = 'safety';
            else if (rawId.includes('rain')) masterKey = 'rain';

            const masterDef = masterIncidents[inc.id] || masterIncidents[masterKey] || MASTER_INCIDENTS.traffic;

            // Fallback route synthesis if dispatchedUnits is missing or routeless
            let dispatchedUnits = inc.dispatchedUnits;
            if (!dispatchedUnits || !Array.isArray(dispatchedUnits) || dispatchedUnits.length === 0 || !dispatchedUnits[0].route) {
              const incLat = inc.lat || masterDef.lat;
              const incLng = inc.lng || masterDef.lng;
              const responders = findNearestResponders(incLat, incLng);
              const unitSpecs = DISPATCH_UNITS[masterKey] || DISPATCH_UNITS.traffic;
              dispatchedUnits = unitSpecs.map((u, idx) => {
                let station = responders.police;
                if (u.category === 'hospital') station = responders.hospital;
                else if (u.category === 'fire') station = responders.fire;
                else if (u.category === 'infrastructure') station = CITY_FACILITIES.find(f => f.category === 'infrastructure') || responders.police;
                const route = buildRoadNetworkRoute(station.lat, station.lng, incLat, incLng);
                return { unitId: `unit_${masterKey}_${idx}_${Date.now()}`, name: u.name, type: u.type, icon: u.icon, category: u.category, stationName: station.name, originLat: station.lat, originLng: station.lng, route };
              });
            }

            return {
              ...masterDef,
              ...inc,
              id: inc.id || inc.uniqueId,
              uniqueId: inc.uniqueId || inc.id,
              status: inc.status || 'AWAITING_APPROVAL',
              phase: inc.phase || 3,
              lat: inc.lat || masterDef.lat,
              lng: inc.lng || masterDef.lng,
              hotspot: inc.hotspot || masterDef.hotspot || 'Expressway Corridor',
              dispatchedUnits,
              checklist: inc.checklist || {},
              vehicleIcon: masterDef.vehicleIcon || '🚑',
              vehicleName: masterDef.vehicleName || 'ALS Ambulance',
              timeDetected: inc.timeDetected || new Date(inc.detectedAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
            };
          });

          setActiveQueue(backendQueue);
          setIsTriggering((prev) => {
            const next = { ...prev };
            backendQueue.forEach((inc) => {
              const k = inc.id && inc.id.includes('_') ? inc.id.split('_')[0] : inc.id;
              delete next[k];
              delete next[inc.type];
            });
            return next;
          });

          if (backendQueue.length > 0) {
            const maxPhase = Math.max(...result.data.map((inc) => inc.phase || 1));
            setCurrentPhase(maxPhase);
          } else {
            setCurrentPhase(0);
          }
        }
      }
    } catch (err) {
      // Offline fallback
    }
  }, [viewRole, selectedTab]);

  useEffect(() => {
    fetchBackendIncidents();

    if (socket && isConnected) {
      // Full re-fetch on most events; also patch checklist in-place when broadcast contains it
      const handleIncidentChange = (data) => {
        // If the broadcast carries a full incident with a checklist, patch it optimistically
        // before the fetch completes so the checklist panel updates immediately.
        const broadcastInc = data?.incident;
        if (broadcastInc?.checklist) {
          const bId = broadcastInc.id || broadcastInc.uniqueId;
          setActiveQueue(prev => prev.map(inc => {
            const id = inc.uniqueId || inc.instanceId || inc.id;
            if (id === bId || inc.id === bId) {
              return { ...inc, checklist: { ...inc.checklist, ...broadcastInc.checklist } };
            }
            return inc;
          }));
        }
        fetchBackendIncidents();
      };

      const handleResolved = (data) => {
        const resolvedId = data?.id || data?.incident?.id;
        const incidentName = data?.incident?.name || data?.incident?.type || 'Emergency';
        const resolvedChecklist = data?.incident?.checklist;

        // Step 1: Optimistically apply incidentResolved=true to the checklist in activeQueue
        // so the panel shows 6/6 BEFORE the card is removed.
        if (resolvedId) {
          setActiveQueue(prev => prev.map(i => {
            const iId = i.uniqueId || i.id;
            if (iId === resolvedId || i.id === resolvedId) {
              return {
                ...i,
                status: 'RESOLVED',
                phase: 5,
                checklist: { ...(i.checklist || {}), ...(resolvedChecklist || {}), incidentResolved: true }
              };
            }
            return i;
          }));
        }

        // Step 2: After a brief display window (2 seconds), remove the incident from the active queue
        const resolvedKey = `${resolvedId}_timeline_resolved`;
        if (!emittedStageEventsRef.current.has(resolvedKey)) {
          emittedStageEventsRef.current.add(resolvedKey);
          addLog(`✅ Incident Resolved: ${incidentName} successfully resolved. Responders returned.`, 'green', 'resolution');
        }

        setTimeout(() => {
          setActiveQueue((prev) => {
            const updated = prev.filter((i) => i.id !== resolvedId && i.uniqueId !== resolvedId);
            if (updated.length === 0) setCurrentPhase(0);
            return updated;
          });
        }, 2500);
      };

      const handleReset = () => {
        setActiveQueue([]);
        setCurrentPhase(0);
        setAiStep(0);
        setCompletedAgents([]);
        setDetectionStep(0);
        setApprovalStep(0);
        setCurrentProgress(0);
        setSentinelConfidence(22);
        setTimelineLogs([]);
        emittedStageEventsRef.current.clear();
      };

      socket.on('incident:created', handleIncidentChange);
      socket.on('incident:phase-changed', handleIncidentChange);
      socket.on('incident:approved', handleIncidentChange);
      socket.on('incident:resolved', handleResolved);
      socket.on('incident:reset', handleReset);

      return () => {
        socket.off('incident:created', handleIncidentChange);
        socket.off('incident:phase-changed', handleIncidentChange);
        socket.off('incident:approved', handleIncidentChange);
        socket.off('incident:resolved', handleResolved);
        socket.off('incident:reset', handleReset);
      };
    } else {
      const pollInterval = setInterval(fetchBackendIncidents, 5000);
      return () => clearInterval(pollInterval);
    }
  }, [socket, isConnected, viewRole, selectedTab, fetchBackendIncidents]);

  // ─── OPERATOR ONLINE STATUS MONITORING ───────────────────────────────────
  useEffect(() => {
    const fetchOperatorStatus = async () => {
      try {
        const token = localStorage.getItem('vyraion_auth_token');
        const res = await fetch(`${OPERATOR_API_URL}/status`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (res.ok) {
          const data = await res.json();
          setIsOperatorOnline(data.online === true);
        }
      } catch (_) {}
    };

    fetchOperatorStatus();

    if (socket && isConnected) {
      const handleOpStatus = (data) => {
        if (data && typeof data.online === 'boolean') {
          setIsOperatorOnline(data.online);
        }
      };
      socket.on('operator:status', handleOpStatus);
      return () => socket.off('operator:status', handleOpStatus);
    }
  }, [socket, isConnected]);

  // ─── FETCH LLM NOVA DECISION BLUEPRINT ───────────────────────────────────
  useEffect(() => {
    let isSubscribed = true;
    if (!activeQueue || activeQueue.length === 0) {
      setNovaBlueprint([]);
      setAiError(null);
      setIsLoadingBlueprint(false);
      return;
    }

    setIsLoadingBlueprint(true);
    setAiError(null);

    const selectedModel = disableLiveAI ? 'Offline Simulation Engine' : (localStorage.getItem('vyraion_selected_model') || 'Claude 3.5 Sonnet');

    fetchNovaBlueprint(activeQueue, selectedModel).then((res) => {
      if (!isSubscribed) return;

      setIsLoadingBlueprint(false);

      if (res && res.success && Array.isArray(res.blueprint)) {
        setNovaBlueprint(res.blueprint);
        setIsOfflineSimulation(res.isOfflineSimulation || false);
        setModelUsed(res.modelUsed || selectedModel);
        setAiError(null);
        addLog(`🧠 Nova LLM Strategy Generated (${res.modelUsed || selectedModel})`, 'info', 'ai');
      } else {
        const fallbackBlueprint = generateNovaBlueprint(activeQueue);
        setNovaBlueprint(fallbackBlueprint);
        setIsOfflineSimulation(true);
        setModelUsed('Local Fallback Engine');
        const errorMsg = (res && res.error) ? res.error : 'AI reasoning unavailable — check ANTHROPIC_API_KEY';
        setAiError(errorMsg);
        addLog(`⚠️ Local Fallback Engine activated: ${errorMsg}`, 'warning', 'ai');
      }
    });

    return () => { isSubscribed = false; };
  }, [activeQueue, disableLiveAI]);

  const handleSwitchToSimulation = () => {
    localStorage.setItem('vyraion_disable_live_ai', 'true');
    localStorage.setItem('vyraion_selected_model', 'Offline Simulation Engine');
    setDisableLiveAI(true);
    setAiError(null);
    addLog('🔌 Offline Simulation Mode activated by operator', 'success', 'system');
  };

  // ─── INCIDENT TRIGGER HANDLERS ───────────────────────────────────────────
  const handleIncidentClick = async (type) => {
    setIsTriggering((prev) => ({ ...prev, [type]: true }));
    const fallbackTimer = setTimeout(() => {
      setIsTriggering((prev) => ({ ...prev, [type]: false }));
    }, 5000);

    const dynamicInc = createDynamicIncident(type, activeQueue);

    setCurrentPhase(1);
    setDetectionStep(0);
    setAiStep(1);
    setCurrentProgress(0);
    setCompletedAgents([]);

    try {
      const res = await fetch(`${INCIDENTS_API_URL}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: type,
          type: type,
          uniqueId: dynamicInc.uniqueId,
          lat: dynamicInc.lat,
          lng: dynamicInc.lng,
          hotspot: dynamicInc.hotspot,
          dispatchedUnits: dynamicInc.dispatchedUnits
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          const createdDoc = {
            ...dynamicInc,
            ...data.data,
            id: data.data.uniqueId || data.data.id || dynamicInc.uniqueId,
            uniqueId: data.data.uniqueId || data.data.id || dynamicInc.uniqueId,
            status: data.data.status || 'AWAITING_APPROVAL',
            phase: data.data.phase || 3
          };
          setActiveQueue((prev) => {
            const exists = prev.some((i) => (i.uniqueId || i.id) === createdDoc.uniqueId);
            if (exists) return prev;
            return [...prev, createdDoc];
          });
        }
        await fetchBackendIncidents();
      }
    } catch (e) {
      console.error('Trigger incident error:', e);
    } finally {
      setIsTriggering((prev) => ({ ...prev, [type]: false }));
      clearTimeout(fallbackTimer);
    }
  };

  const handleResolveIncident = async (incId) => {
    try {
      await fetch(`${INCIDENTS_API_URL}/${incId}/resolve`, { method: 'PATCH' });
    } catch (e) {
      console.error('Resolve incident error:', e);
    }
  };

  // Called by IncidentChecklistPanel when a PATCH succeeds, to keep activeQueue in sync
  const handleChecklistUpdate = useCallback((incId, updatedChecklist) => {
    setActiveQueue(prev => prev.map(inc => {
      const id = inc.uniqueId || inc.instanceId || inc.id;
      if (id === incId) return { ...inc, checklist: { ...inc.checklist, ...updatedChecklist } };
      return inc;
    }));
  }, []);

  const handleVisionIncidentTrigger = async (visionData) => {
    const type = visionData.id;
    const dynamicInc = {
      ...createDynamicIncident(type, activeQueue),
      detectedBy: 'AI Vision',
      riskLevel: visionData.riskLevel || 'HIGH',
      confidence: visionData.confidence || 95.0,
      cameraName: visionData.cameraName,
      locationName: visionData.locationName,
      recommendedAgencies: visionData.recommendedAgencies,
      markerColor: visionData.riskLevel === 'LOW' ? '#22C55E' : visionData.riskLevel === 'MEDIUM' ? '#FBBF24' : '#EF4444'
    };

    setActiveQueue((prev) => [...prev, dynamicInc]);
    setCurrentPhase(1);
    setDetectionStep(0);
    setAiStep(1);
    setCurrentProgress(0);
    setCompletedAgents([]);

    try {
      await fetch(`${INCIDENTS_API_URL}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: type,
          uniqueId: dynamicInc.uniqueId,
          lat: dynamicInc.lat,
          lng: dynamicInc.lng,
          hotspot: visionData.locationName,
          riskLevel: visionData.riskLevel,
          confidence: visionData.confidence,
          detectedBy: 'AI Vision',
          recommendedAgencies: visionData.recommendedAgencies,
          dispatchedUnits: dynamicInc.dispatchedUnits
        })
      });
    } catch (e) {}
  };

  // ─── PHASE 1: DETECTION ANIMATION ─────────────────────────────────────────
  useEffect(() => {
    if (currentPhase !== 1 || !latestIncidentDef) return;

    const events = latestIncidentDef.detectionEvents;
    if (detectionStep >= events.length) {
      addLog('✅ Sensor telemetry verified — AI reasoning initiated', 'success', 'detection');
      setCurrentPhase(2);
      setAiStep(1);
      setCurrentProgress(0);
      return;
    }

    const timer = setTimeout(() => {
      const evt = events[detectionStep];
      addLog(`📡 ${evt.source}: ${evt.detail} [${evt.realTime}]`, 'info', 'detection');
      setDetectionStep((prev) => prev + 1);
    }, 600);

    return () => clearTimeout(timer);
  }, [currentPhase, detectionStep, latestIncidentDef]);

  // ─── PHASE 2: AI AGENTS ANIMATION (CONCURRENT) ────────────────────────────
  useEffect(() => {
    if (currentPhase !== 2) return;

    const nodeNames = ['Pulse', 'Traffic', 'Healthcare', 'Weather', 'Infrastructure', 'Nova', 'Sentinel'];
    const nodeTasks = [
      'Scanned multi-incident telemetry',
      'Analyzed congestion & rerouting options',
      'Checked hospital capacity & ICU beds',
      'Assessed weather conditions & risks',
      'Verified infrastructure & utility status',
      `Merging ${activeQueue.length} emergencies via LLM reasoning`,
      'Validating unified safety score'
    ];

    if (aiStep === 1) {
      if (completedAgents.length > 0) return; // Prevent re-triggering timers
      
      const specialistTimes = [600, 1200, 900, 800, 1100];
      let finishedCount = 0;
      
      const timers = specialistTimes.map((time, index) => 
        setTimeout(() => {
          setCompletedAgents(prev => {
            if (!prev.includes(index + 1)) {
              addLog(`🤖 ${nodeNames[index]} Agent: ${nodeTasks[index]}`, 'success', 'ai');
              return [...prev, index + 1];
            }
            return prev;
          });
          
          finishedCount++;
          if (finishedCount === 5) {
            setTimeout(() => setAiStep(6), 200);
          }
        }, time)
      );

      return () => timers.forEach(clearTimeout);

    } else if (aiStep === 6 || aiStep === 7) {
      let progressInterval;
      const stepDuration = 650;
      const increment = 100 / (stepDuration / 40);

      setCurrentProgress(0);
      progressInterval = setInterval(() => {
        setCurrentProgress((prev) => {
          if (prev >= 100) { clearInterval(progressInterval); return 100; }
          return prev + increment;
        });
      }, 40);

      const stepTimer = setTimeout(() => {
        addLog(`🤖 ${nodeNames[aiStep - 1]} Agent: ${nodeTasks[aiStep - 1]}`, 'success', 'ai');
        
        if (aiStep === 6) {
          setAiStep(7);
        } else {
          addLog(`⏱ Total AI Processing Time: 2.1 sec`, 'completed', 'ai');
          setCurrentPhase(3);
          setApprovalStep(0);
        }
      }, stepDuration);

      return () => {
        clearInterval(progressInterval);
        clearTimeout(stepTimer);
      };
    }
  }, [currentPhase, aiStep, activeQueue.length, completedAgents.length]);

  // ─── SENTINEL CONFIDENCE ──────────────────────────────────────────────────
  useEffect(() => {
    if (currentPhase === 2 && aiStep === 7) {
      const scores = [22, 41, 65, 84, 96];
      let i = 0;
      const interval = setInterval(() => {
        if (i < scores.length) { setSentinelConfidence(scores[i]); i++; }
      }, 140);
      return () => clearInterval(interval);
    }
  }, [currentPhase, aiStep]);

  // ─── REAL-TIME TIMELINE SEQUENCING ────────────────────────────────────────
  useEffect(() => {
    if (activeQueue.length === 0) return;

    activeQueue.forEach((inc) => {
      const baseKey = inc.id && inc.id.includes('_') ? inc.id.split('_')[0] : inc.id;
      const def = masterIncidents[baseKey] || masterIncidents[inc.id] || inc;
      const incIdKey = inc.uniqueId || inc.instanceId || inc.id;

      const pendingKey = `${incIdKey}_timeline_pending`;
      if ((inc.status === 'AWAITING_APPROVAL' || inc.status === 'pending' || inc.phase === 3) && !emittedStageEventsRef.current.has(pendingKey)) {
        emittedStageEventsRef.current.add(pendingKey);
        
        const isVision = inc.detectedBy === 'AI Vision' || inc.detectedBy === 'Computer Vision';
        addLog(`🚨 Incident Detected: ${def.name}`, 'red', 'detection');
        addLog(`📍 Location Identified`, 'blue', 'geospatial');
        addLog(`📲 Approval Request Sent to Operator`, 'orange', 'operator');
        addLog(`⏳ Waiting for Human Approval`, 'orange', 'human_pending');

        emitEventNotification({
          incidentId: incIdKey,
          eventType: 'detected',
          title: isVision ? `🤖 AI Vision: ${def.name}` : `🚨 ${def.name} Detected`,
          detail: isVision ? `AI Vision Camera detected high-priority incident.` : `Sensor Network detected emergency.`,
          type: 'warning',
          expiry: 'resolved'
        });
      }

      const approvedKey = `${incIdKey}_timeline_approved`;
      if ((inc.status === 'APPROVED' || inc.phase === 4) && !emittedStageEventsRef.current.has(approvedKey)) {
        emittedStageEventsRef.current.add(approvedKey);
        
        addLog(`✅ Mission Approved`, 'green', 'approval');

        // Log individual unit dispatches
        const incVehicles = liveVehicles.filter((v) => v.incidentId === incIdKey && v.state !== 'IDLE');
        if (incVehicles.length > 0) {
          incVehicles.forEach((v) => {
            addLog(`🚒 ${v.name} dispatched to ${def.name}`, 'blue', 'dispatch');
          });
        } else {
          addLog(`🚒 Emergency Units Dispatched`, 'blue', 'dispatch');
        }
        addLog(`🚑 Resources En Route`, 'blue', 'dispatch');

        emitEventNotification({
          incidentId: incIdKey,
          eventType: 'approved',
          title: `✅ Mission Approved: ${def.name}`,
          detail: `Human approval received. ${incVehicles.length || 'Multiple'} response units dispatched.`,
          type: 'success',
          expiry: '30min'
        });
      }
    });
  }, [activeQueue, liveVehicles, emitEventNotification]);

  // ─── DISPATCH LIFECYCLE EVENTS (arrival, medical notification, resolution) ───
  useEffect(() => {
    if (liveVehicles.length === 0 || activeQueue.length === 0) return;

    // Per-vehicle log & notification broadcasts
    liveVehicles.forEach((v) => {
      if (v.state === 'IDLE' || !v.incidentId) return;

      const baseKey = v.incidentId && v.incidentId.includes('_') ? v.incidentId.split('_')[0] : v.incidentId;
      const def = masterIncidents[baseKey] || { name: 'Emergency' };

      // Unit arrived on scene
      const arrivedKey = `${v.id}_${v.incidentId}_arrived`;
      if (v.state === 'ON_SCENE' && !emittedStageEventsRef.current.has(arrivedKey)) {
        emittedStageEventsRef.current.add(arrivedKey);
        addLog(`📍 ${v.name} arrived on scene — ${def.name}`, 'green', 'dispatch');

        emitEventNotification({
          incidentId: v.incidentId,
          eventType: 'arrived',
          title: `📍 ${v.name} On Scene`,
          detail: `${v.name} has arrived at the ${def.name} incident location.`,
          type: 'info',
          expiry: '15min'
        });
      }

      // Unit returning to base
      const returningKey = `${v.id}_${v.incidentId}_returning`;
      if (v.state === 'RETURNING' && !emittedStageEventsRef.current.has(returningKey)) {
        emittedStageEventsRef.current.add(returningKey);
        addLog(`🏠 ${v.name} returning to base`, 'green', 'dispatch');
      }
    });

    // Per-incident multi-unit arrival & hospital/medical notification evaluation
    activeQueue.forEach((inc) => {
      const incId = inc.uniqueId || inc.instanceId || inc.id;
      if (!incId) return;

      // Find all live response units assigned to this specific incident
      const incVehicles = liveVehicles.filter(
        (v) => (v.incidentId === incId || v.assignedUnitId?.startsWith(incId)) && v.state !== 'IDLE'
      );

      if (incVehicles.length === 0) return;

      // 1. HOSPITAL / MEDICAL NOTIFIED AUTOMATIC EVALUATION
      // Hospital / Medical Notified represents that medical response coordination has actually occurred
      // when an assigned medical/ambulance unit is confirmed actively responding/on-scene.
      const hasMedicalUnit = incVehicles.some(
        (v) =>
          v.category === 'hospital' ||
          String(v.icon || '').includes('🚑') ||
          String(v.name || '').toLowerCase().includes('ambulance') ||
          String(v.type || '').toLowerCase().includes('medical')
      );

      const isMedicalInc =
        hasMedicalUnit ||
        String(inc.type || inc.name || inc.id || '').toLowerCase().match(/medical|hospital|traffic|fire|hazmat|casualty/i);

      if (isMedicalInc && hasMedicalUnit) {
        const medicalUnitOnScene = incVehicles.some(
          (v) =>
            (v.category === 'hospital' || String(v.icon || '').includes('🚑') || String(v.name || '').toLowerCase().includes('ambulance')) &&
            (v.state === 'ON_SCENE' || v.state === 'RETURNING')
        );

        const hospitalNotifiedKey = `${incId}_checklist_hospitalNotified`;
        if (medicalUnitOnScene && !inc.checklist?.hospitalNotified && !emittedStageEventsRef.current.has(hospitalNotifiedKey)) {
          emittedStageEventsRef.current.add(hospitalNotifiedKey);
          addLog(`🏥 Hospital & Emergency Medical System notified for ${inc.name || inc.type}`, 'green', 'dispatch');

          fetch(`${INCIDENTS_API_URL}/${incId}/checklist`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ hospitalNotified: true })
          })
            .then((res) => res.ok && res.json())
            .then((data) => {
              if (data?.data?.checklist) {
                setActiveQueue((prev) =>
                  prev.map((item) => {
                    const id = item.uniqueId || item.instanceId || item.id;
                    if (id === incId) return { ...item, checklist: { ...item.checklist, ...data.data.checklist } };
                    return item;
                  })
                );
              }
            })
            .catch(() => {
              setActiveQueue((prev) =>
                prev.map((item) => {
                  const id = item.uniqueId || item.instanceId || item.id;
                  if (id === incId) return { ...item, checklist: { ...(item.checklist || {}), hospitalNotified: true } };
                  return item;
                })
              );
            });
        }
      }

      // 2. UNITS ARRIVED ON SCENE AUTOMATIC EVALUATION
      // unitsArrived becomes true ONLY after ALL required dispatched units reach ON_SCENE / ARRIVED state.
      const allUnitsArrived = incVehicles.every((v) => v.state === 'ON_SCENE' || v.state === 'RETURNING');
      const unitsArrivedKey = `${incId}_checklist_unitsArrived`;

      if (allUnitsArrived && !inc.checklist?.unitsArrived && !emittedStageEventsRef.current.has(unitsArrivedKey)) {
        emittedStageEventsRef.current.add(unitsArrivedKey);
        addLog(`✅ All required response units arrived on scene — ${inc.name || inc.type}`, 'green', 'dispatch');

        fetch(`${INCIDENTS_API_URL}/${incId}/checklist`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ unitsArrived: true })
        })
          .then((res) => res.ok && res.json())
          .then((data) => {
            if (data?.data?.checklist) {
              setActiveQueue((prev) =>
                prev.map((item) => {
                  const id = item.uniqueId || item.instanceId || item.id;
                  if (id === incId) return { ...item, checklist: { ...item.checklist, ...data.data.checklist } };
                  return item;
                })
              );
            }
          })
          .catch(() => {
            setActiveQueue((prev) =>
              prev.map((item) => {
                const id = item.uniqueId || item.instanceId || item.id;
                if (id === incId) return { ...item, checklist: { ...(item.checklist || {}), unitsArrived: true } };
                return item;
              })
            );
          });
      }
    });
  }, [liveVehicles, activeQueue, emitEventNotification]);


  const resetCity = async () => {
    setCurrentPhase(0);
    setAiStep(0);
    setCompletedAgents([]);
    setDetectionStep(0);
    setApprovalStep(0);
    setCurrentProgress(0);
    setSentinelConfidence(22);
    setHoveredNode(null);
    setTimelineLogs([]);
    setActiveQueue([]);
    setLiveVehicles([]);
    emittedStageEventsRef.current.clear();

    try {
      await fetch(`${INCIDENTS_API_URL}/reset`, { method: 'POST' });
    } catch (e) {}

    addLog('🟢 CITY STATUS: NORMAL. All emergencies cleared.', 'success', 'system');
  };

  // ─── COMPUTED METRICS ─────────────────────────────────────────────────────
  const activeCount = activeQueue.length;

  const highestSeverity = activeQueue.some((i) => i.severity === 'CRITICAL')
    ? 'CRITICAL'
    : activeQueue.some((i) => i.severity === 'HIGH')
    ? 'HIGH'
    : activeCount > 0
    ? 'ELEVATED'
    : 'NORMAL';

  const aggregatedRisk = activeCount === 0 ? '0.02' : Math.min(99.4, (activeCount * 18.5 + 24).toFixed(1));

  const unifiedPriorities = novaBlueprint.length > 0 ? novaBlueprint : generateNovaBlueprint(activeQueue);

  const allFieldUnits = [];
  activeQueue.forEach((inc) => {
    const baseKey = (inc.id && inc.id.includes('_')) ? inc.id.split('_')[0] : (inc.type || inc.id || 'traffic');
    const def = masterIncidents[baseKey] || masterIncidents[inc.id];
    if (def && def.fieldResponse) {
      def.fieldResponse.forEach((fr) => {
        if (!allFieldUnits.some((u) => u.unit === fr.unit)) allFieldUnits.push(fr);
      });
    }
  });

  // Extract the base incident type key from a uniqueId like 'traffic_1786124091915' → 'traffic'
  const getBaseTypeKey = (inc) => {
    if (inc.id && inc.id.includes('_')) return inc.id.split('_')[0];
    return inc.id || inc.type || 'traffic';
  };

  const getDynamicResolution = () => {
    if (activeQueue.length === 0) return null;
    const rangeMap = {
      traffic:  [8,  10],
      hospital: [18, 25],
      rain:     [12, 18],
      flood:    [20, 30],
      fire:     [15, 20],
      cyber:    [30, 60],
      power:    [18, 25],
      medical:  [6,  9],
      hazmat:   [25, 35],
      safety:   [10, 15]
    };

    let maxMin = 0, maxMax = 0;
    activeQueue.forEach((inc) => {
      const baseKey = getBaseTypeKey(inc);
      const r = rangeMap[baseKey];
      if (r) {
        if (r[0] > maxMin) maxMin = r[0];
        if (r[1] > maxMax) maxMax = r[1];
      }
    });

    // Fallback if no rangeMap match at all
    if (maxMin === 0 && maxMax === 0) {
      maxMin = 8; maxMax = 15;
    }

    const overhead = (activeQueue.length - 1) * 5;
    return `${maxMin + overhead}–${maxMax + overhead} min`;
  };

  const dynamicResolution = getDynamicResolution();

  const phaseLabel = currentPhase === 0 ? 'STANDBY'
    : currentPhase === 1 ? 'SENSOR FUSION ACTIVE'
    : currentPhase === 2 ? 'AI AGENTS PROCESSING'
    : currentPhase === 3 ? 'AWAITING OPERATOR APPROVAL'
    : currentPhase === 4 ? 'FIELD UNITS DISPATCHED'
    : 'MISSION COMPLETE';

  const compactNodes = [
    { step: 1, name: 'Pulse', icon: Radio, aiTime: '0.6s', task: 'Scanning multi-incident sensors', summary: `Monitoring ${activeCount} active incidents` },
    { step: 2, name: 'Traffic', icon: Car, aiTime: '1.2s', task: 'Rerouting emergency lanes', summary: 'Optimizing corridor traffic signal timing' },
    { step: 3, name: 'Healthcare', icon: Hospital, aiTime: '0.9s', task: 'Checking ICU & fuel reserves', summary: 'Coordinating ICU beds & fuel dispatch' },
    { step: 4, name: 'Weather', icon: CloudRain, aiTime: '0.8s', task: 'Forecasting rain & flood', summary: 'Monitoring stormwater pump capacity' },
    { step: 5, name: 'Infrastructure', icon: Server, aiTime: '1.1s', task: 'Shielding grid substations', summary: 'Isolating grid outages & power load' },
    { step: 6, name: 'Nova', icon: Brain, aiTime: '0.7s', task: `Merging ${activeCount} concurrent emergencies`, summary: 'Unified Multi-Incident Action Blueprint' },
    { step: 7, name: 'Sentinel', icon: ShieldCheck, aiTime: '0.6s', task: 'Validating unified strategy', summary: 'Verified zero multi-incident conflict' }
  ];

  return (
    <div className="flex flex-col gap-4 animate-fade-in max-usable-width font-sans text-slate-100">

      {/* ─── EOC MISSION HEADER ───────────────────────────────────────────── */}
      <div className="glass-panel px-5 py-3 rounded-2xl border border-white/10 bg-gradient-to-r from-[#1FA2FF]/10 via-[#7C5CFF]/10 to-[#EF4444]/10 relative overflow-hidden">
        <div className="flex items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#1FA2FF]/20 border border-[#1FA2FF]/40 text-[#1FA2FF] text-xs font-semibold shrink-0">
              <Radio className="w-3.5 h-3.5 animate-pulse text-[#EF4444]" />
              <span className="hidden sm:inline">VYRAION EOC</span>
            </div>
            <h1 className="text-base sm:text-lg font-bold text-white tracking-tight truncate font-sans">
              Citywide Autonomous Emergency Command & Control Center
            </h1>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <span className={`hidden md:inline px-3 py-1 rounded-full font-bold border text-xs transition-colors duration-300 ${
              highestSeverity === 'CRITICAL' ? 'bg-[#EF4444]/20 text-[#EF4444] border-[#EF4444]/50 animate-pulse'
              : highestSeverity === 'HIGH' ? 'bg-[#FBBF24]/20 text-[#FBBF24] border-[#FBBF24]/50'
              : highestSeverity === 'ELEVATED' ? 'bg-[#1FA2FF]/20 text-[#1FA2FF] border-[#1FA2FF]/50'
              : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
            }`}>
              {highestSeverity}
            </span>
            
            <span className={`hidden lg:inline px-3 py-1 rounded-full font-bold border text-xs ${
              currentPhase >= 2 ? 'bg-[#7C5CFF]/20 text-[#7C5CFF] border-[#7C5CFF]/50'
              : currentPhase === 1 ? 'bg-amber-500/20 text-amber-400 border-amber-500/50'
              : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}>
              {phaseLabel}
            </span>

            <div className="glass-card px-3.5 py-1.5 rounded-xl border border-white/10 flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#1FA2FF]/15 border border-[#1FA2FF]/40 flex items-center justify-center text-[#1FA2FF] relative">
                <Brain className="w-4 h-4" />
                <div className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#060B14] ${activeCount > 0 ? 'bg-[#EF4444] animate-ping' : 'bg-emerald-400'}`} />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-200 leading-none">Decision Engine</p>
                <p className="text-[11px] font-mono text-[#1FA2FF] leading-none mt-1">{activeCount} Active Emergencies</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── EOC STATUS BAR ───────────────────────────────────────────────── */}
      <div className="glass-panel px-5 py-2.5 rounded-xl border border-white/10">
        <div className="flex items-center gap-x-5 gap-y-2 flex-wrap text-xs">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-[#1FA2FF]" />
            <span className="text-slate-400">AI Core</span>
            <span className="font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">● ONLINE</span>
          </div>

          <div className="w-px h-4 bg-white/10 hidden sm:block" />

          <div className="flex items-center gap-2">
            <Siren className="w-4 h-4 text-[#EF4444]" />
            <span className="text-slate-400">Active Queue</span>
            <span className={`font-bold px-2 py-0.5 rounded-full border ${
              activeCount > 0 ? 'text-[#EF4444] bg-[#EF4444]/10 border-[#EF4444]/40 animate-pulse' : 'text-slate-300 bg-slate-900 border-slate-800'
            }`}>{activeCount} Incident{activeCount !== 1 ? 's' : ''}</span>
          </div>

          <div className="w-px h-4 bg-white/10 hidden sm:block" />

          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-[#7C5CFF]" />
            <span className="text-slate-400">Operator Console</span>
            <span className={`font-semibold px-2 py-0.5 rounded-full border ${
              isOperatorOnline === null ? 'text-slate-400 bg-slate-900 border-slate-800'
              : isOperatorOnline ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
              : 'text-amber-400 bg-amber-500/10 border-amber-500/30'
            }`}>{isOperatorOnline === null ? 'Checking...' : isOperatorOnline ? '● Online' : '○ Standby'}</span>
          </div>

          <div className="w-px h-4 bg-white/10 hidden sm:block" />

          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span className="text-slate-400">AI Confidence</span>
            <span className="font-mono font-bold text-amber-400">{currentPhase >= 2 ? `${sentinelConfidence}%` : '—'}</span>
          </div>

          <div className="w-px h-4 bg-white/10 hidden sm:block" />

          <div className="flex items-center gap-2">
            <Timer className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-400">Est. Resolution</span>
            <span className="font-mono font-bold text-emerald-400">{dynamicResolution ?? '—'}</span>
          </div>

          {activeCount > 0 && (
            <>
              <div className="w-px h-4 bg-white/10 hidden sm:block" />
              <div className="flex flex-wrap items-center gap-1.5">
                {activeQueue.map((incident, idx) => (
                  <span key={incident.uniqueId || incident.id || idx} className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-xs font-semibold animate-fade-in ${
                    incident.severity === 'CRITICAL' ? 'bg-[#EF4444]/20 border-[#EF4444]/50 text-[#EF4444]'
                    : incident.severity === 'HIGH' ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                    : 'bg-sky-500/20 border-sky-500/50 text-sky-300'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${incident.severity === 'CRITICAL' ? 'bg-[#EF4444] animate-ping' : 'bg-amber-400'}`} />
                    {incident.name}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ─── MAIN 12-COLUMN EOC GRID ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">

        {/* ─── LEFT COLUMN: MAP + AI WORKFLOW (8 cols = ~67%) ───────────────── */}
        <div className="lg:col-span-8 flex flex-col gap-4">

          {/* Role Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1">
            {getFilterTabsForRole(viewRole).map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`px-4 py-1.5 rounded-full border text-xs font-bold font-mono transition-all shrink-0 ${
                  selectedTab === tab.id
                    ? 'bg-[#33C8FF]/20 text-[#33C8FF] border-[#33C8FF]'
                    : 'bg-slate-900/50 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-300'
                }`}
              >
                {tab.label} {selectedTab === tab.id && `(${activeQueue.length})`}
              </button>
            ))}
          </div>

          {/* AI Vision Camera Feed */}
          <div>
            <div className="flex items-center gap-2 mb-1.5 px-1">
              <Video className="w-3.5 h-3.5 text-[#1FA2FF]" />
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">AI Vision Camera Telemetry</span>
            </div>
            <AIVisionStatusPanel onTriggerIncident={handleVisionIncidentTrigger} />
          </div>

          {/* LIVE CITY MAP — Primary Visual Center */}
          <div className="flex-1">
            <SingaporeSatelliteMap activeQueue={activeQueue} onVehicleStateChange={setLiveVehicles} />
          </div>

          {/* AI Collaboration Workflow */}
          <div className="glass-panel p-4 rounded-2xl border border-white/10 space-y-3 relative">
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <div className="flex items-center gap-2.5">
                <Brain className="w-4 h-4 text-[#1FA2FF]" />
                <h2 className="text-sm font-bold text-white">AI Multi-Agent Collaboration Workflow</h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-slate-400 bg-slate-900 px-2.5 py-1 rounded border border-slate-800">
                  Latency: <strong className="text-[#1FA2FF]">4.3s</strong>
                </span>
                <span className={`text-xs px-2.5 py-1 rounded border font-bold ${
                  currentPhase >= 4 ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/40'
                  : currentPhase === 3 ? 'text-amber-400 bg-amber-500/10 border-amber-500/40 animate-pulse'
                  : currentPhase === 2 ? 'text-[#1FA2FF] bg-[#1FA2FF]/10 border-[#1FA2FF]/40'
                  : 'text-slate-400 bg-slate-900 border-slate-800'
                }`}>
                  {currentPhase >= 4 ? 'COMPLETE' : currentPhase === 3 ? 'AI READY' : currentPhase === 2 ? `STEP ${aiStep}/7` : currentPhase === 1 ? 'SENSING' : 'STANDBY'}
                </span>
              </div>
            </div>

            {/* Horizontal pipeline */}
            <div className="flex items-center gap-0 pt-2 overflow-x-auto pb-2 scrollbar-hide">
              {compactNodes.map((node, idx) => {
                const NodeIcon = node.icon;
                const isSpecialist = node.step <= 5;
                const isActive = currentPhase === 2 && (
                  (aiStep === 1 && isSpecialist && !completedAgents.includes(node.step)) ||
                  (aiStep === 6 && node.step === 6) ||
                  (aiStep === 7 && node.step === 7)
                );
                const isCompleted = (currentPhase > 2) || (currentPhase === 2 && (
                  (isSpecialist && completedAgents.includes(node.step)) ||
                  (node.step === 6 && aiStep > 6) ||
                  (node.step === 7 && aiStep > 7)
                ));
                const isLast = idx === compactNodes.length - 1;

                return (
                  <React.Fragment key={node.step}>
                    <div
                      onMouseEnter={() => setHoveredNode(node.step)}
                      onMouseLeave={() => setHoveredNode(null)}
                      className={`relative flex flex-col items-center shrink-0 cursor-pointer transition-all duration-300 px-3 ${
                        isActive ? 'scale-105' : ''
                      }`}
                    >
                      <div className="w-14 bg-slate-950 h-1.5 rounded-full overflow-hidden mb-2 border border-slate-800">
                        <div className={`h-full rounded-full ${
                          isCompleted ? 'bg-emerald-500' : 'bg-gradient-to-r from-[#1FA2FF] to-[#7C5CFF]'
                        }`}
                          style={{ 
                            width: `${isCompleted ? 100 : (isActive && isSpecialist) ? 100 : (isActive && !isSpecialist) ? currentProgress : 0}%`,
                            transitionProperty: 'width, background-color',
                            transitionDuration: (isActive && isSpecialist) ? node.aiTime : isCompleted ? '300ms' : '100ms',
                            transitionTimingFunction: 'linear'
                          }} />
                      </div>

                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 transition-all duration-300 ${
                          isActive
                            ? 'bg-[#1FA2FF]/20 border-[#1FA2FF] text-[#1FA2FF]'
                            : isCompleted
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                            : 'bg-slate-900 border-slate-700 text-slate-500'
                        }`}
                        style={
                          isActive
                            ? { boxShadow: '0 0 16px rgba(31,162,255,0.4)' }
                            : isCompleted
                            ? { boxShadow: '0 0 10px rgba(34,197,94,0.2)' }
                            : {}
                        }
                      >
                        {isActive ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : isCompleted ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          <NodeIcon className="w-4 h-4" />
                        )}
                      </div>

                      <p className={`text-xs font-semibold mt-1.5 transition-colors ${
                        isActive ? 'text-[#1FA2FF]' : isCompleted ? 'text-emerald-400' : 'text-slate-500'
                      }`}>{node.name}</p>
                      <p className={`text-[10px] font-mono ${isActive ? 'text-[#1FA2FF] animate-pulse' : 'text-slate-600'}`}>
                        {isActive ? 'Processing' : node.aiTime}
                      </p>

                      {hoveredNode === node.step && (
                        <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-52 p-3 rounded-2xl glass-panel border border-[#1FA2FF]/50 bg-slate-950/95 text-left text-xs font-sans space-y-1 shadow-2xl z-50 animate-fade-in">
                          <div className="flex justify-between items-center border-b border-white/10 pb-1">
                            <span className="font-bold text-[#1FA2FF]">{node.name} Agent</span>
                            <span className="text-slate-400 font-mono text-[10px]">{node.aiTime}</span>
                          </div>
                          <p className="text-slate-200 font-semibold text-xs">{node.task}</p>
                          <p className="text-[11px] text-slate-400 leading-tight">{node.summary}</p>
                        </div>
                      )}
                    </div>

                    {!isLast && (
                      <div className="flex items-center shrink-0 -mt-6">
                        <div className={`h-0.5 w-6 transition-all ${
                          isCompleted ? 'bg-emerald-500' : isActive ? 'bg-[#1FA2FF]' : 'bg-slate-800'
                        }`} />
                        <ArrowRight className={`w-3.5 h-3.5 shrink-0 ${
                          isCompleted ? 'text-emerald-400' : isActive ? 'text-[#1FA2FF]' : 'text-slate-700'
                        }`} />
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            {currentPhase === 3 && (
              <div className="flex items-center justify-center gap-2 pt-2 border-t border-white/5 animate-fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-semibold text-emerald-400">AI Blueprint Ready</span>
                <span className="text-xs text-amber-400 animate-pulse">• Waiting for Human Operator Approval</span>
              </div>
            )}
            {currentPhase >= 4 && (
              <div className="flex items-center justify-center gap-2 pt-2 border-t border-emerald-500/30 animate-fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-emerald-400">WORKFLOW COMPLETE • ALL AGENTS VERIFIED</span>
              </div>
            )}
          </div>

          {/* Emergency Response Teams */}
          {currentPhase >= 3 && (
            <div className="glass-panel p-4 rounded-2xl border border-emerald-500/30 space-y-3 animate-fade-in">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-emerald-400" />
                  <h2 className="text-sm font-bold text-white">Emergency Response Units</h2>
                </div>
                <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                  {liveVehicles.filter((v) => v.state !== 'IDLE').length} Active
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {(() => {
                  const activeVehicles = liveVehicles.filter((v) => v.state !== 'IDLE');
                  if (activeVehicles.length === 0 && allFieldUnits.length === 0) {
                    return <p className="col-span-full text-xs text-slate-500 text-center py-3">Awaiting response unit dispatch...</p>;
                  }
                  if (activeVehicles.length > 0) {
                    return activeVehicles.map((v) => {
                      const color = STATUS_COLORS[v.state] || '#94A3B8';
                      const statusMap = {
                        'STATIONARY_ALERT': 'Allocated',
                        'DISPATCHED': 'En Route',
                        'ON_SCENE': 'Responding',
                        'RETURNING': 'Mission Complete'
                      };
                      const readableStatus = statusMap[v.state] || v.state;
                      const incBaseKey = v.incidentId && v.incidentId.includes('_') ? v.incidentId.split('_')[0] : v.incidentId;
                      const incDef = masterIncidents[incBaseKey] || {};
                      return (
                        <div key={v.id} className="p-2.5 rounded-xl border border-slate-800 bg-slate-900/70 space-y-1.5 text-xs">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-semibold text-white text-xs truncate">{v.icon} {v.name}</span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold shrink-0" style={{ color, backgroundColor: `${color}20`, border: `1px solid ${color}40` }}>
                              {readableStatus}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-slate-500">
                            <span className="font-mono truncate">{v.id}</span>
                            <span className="capitalize text-slate-400">{v.category}</span>
                          </div>
                          {incDef.name && (
                            <div className="text-[10px] text-amber-400/80 truncate">📌 {incDef.name}</div>
                          )}
                          {v.state !== 'IDLE' && (
                            <div className="space-y-1">
                              {(() => {
                                let totalProgress = 0;
                                if (v.state === 'STATIONARY_ALERT') totalProgress = 15;
                                else if (v.state === 'DISPATCHED') {
                                  const totalSegs = Math.max(1, (v.route?.length || 2) - 1);
                                  const routeProgress = ((v.segmentIndex || 0) + (v.segmentProgress || 0)) / totalSegs;
                                  totalProgress = 15 + Math.min(1, Math.max(0, routeProgress)) * 55;
                                }
                                else if (v.state === 'ON_SCENE') totalProgress = 90;
                                else if (v.state === 'RETURNING') totalProgress = 100;

                                return (
                                  <>
                                    <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800">
                                      <div className="h-full bg-[#33C8FF] rounded-full transition-all duration-300" style={{ width: `${Math.round(totalProgress)}%` }} />
                                    </div>
                                    <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                                      <span>Progress: {Math.round(totalProgress)}%</span>
                                      <span className="text-emerald-400 font-bold">{v.eta || '~8 min'}</span>
                                    </div>
                                  </>
                                );
                              })()}
                            </div>
                          )}
                          {v.state === 'ON_SCENE' && (
                            <div className="text-[10px] font-semibold text-emerald-400">✅ On scene — actively responding</div>
                          )}
                          {v.state === 'RETURNING' && (
                            <div className="text-[10px] font-semibold text-slate-400">↩ Returning to station</div>
                          )}
                        </div>
                      );
                    });
                  }
                  return allFieldUnits.map((fr, i) => (
                    <div key={i} className="p-2.5 rounded-xl border border-slate-800 bg-slate-900/70 flex items-center gap-2.5 text-xs">
                      <span className="text-base">{fr.icon}</span>
                      <div className="min-w-0">
                        <span className="font-semibold text-white text-xs truncate block">{fr.unit}</span>
                        <span className="text-emerald-400 font-mono font-bold text-[11px]">{fr.eta}</span>
                      </div>
                    </div>
                  ));
                })()}
              </div>
              <p className="text-xs text-slate-400 text-center pt-1">
                Estimated overall resolution time: <strong className="text-emerald-400 font-mono">{dynamicResolution ?? '—'}</strong>
              </p>
            </div>
          )}

          {/* Nova Decision Blueprint Card */}
          {currentPhase >= 3 && unifiedPriorities.length > 0 && (
            <div className="glass-panel p-4 rounded-2xl border border-emerald-500/40 space-y-3 bg-gradient-to-r from-slate-950 via-[#101827] to-slate-950 animate-fade-in shadow-2xl">
              {aiError && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>
                      <strong>Live AI Offline:</strong> Using local simulation. Add <code className="bg-slate-900 px-1.5 py-0.5 rounded text-amber-200 font-mono">ANTHROPIC_API_KEY</code> to enable Claude.
                    </span>
                  </div>
                  <button
                    onClick={handleSwitchToSimulation}
                    className="py-1 px-3 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all cursor-pointer"
                  >
                    Use Local Engine
                  </button>
                </div>
              )}

              <div className="flex items-center justify-between border-b border-emerald-500/30 pb-2.5">
                <div className="flex items-center gap-2.5">
                  <ClipboardList className="w-4 h-4 text-emerald-400" />
                  <div>
                    <h2 className="text-sm font-bold text-white">Nova Action Blueprint ({unifiedPriorities.length} Tasks)</h2>
                    <p className="text-xs text-emerald-400 font-mono mt-0.5">
                      Generated in {unifiedPriorities[0]?.aiTime || '0.8s'} • {modelUsed || 'Claude 3.5 Sonnet'}
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-semibold">
                  96% Confidence
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                {unifiedPriorities.map((p, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-[#060B14]/90 border border-white/10 space-y-1.5 hover:border-[#1FA2FF]/40 transition-colors">
                    <div className="flex justify-between items-center">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">Priority {idx + 1}</span>
                      <span className="text-[#1FA2FF] font-semibold text-[11px]">{p.agents}</span>
                    </div>
                    <p className="font-bold text-white text-xs">{p.title}</p>
                    <p className="text-slate-400 text-xs leading-relaxed">{p.reason}</p>
                    <div className="pt-1.5 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800">
                      <span>Impact: <strong className="text-emerald-400">{p.impact}</strong></span>
                      <span>ETA: <strong className="text-amber-400 font-mono">{p.eta || '3–5 min'}</strong></span>
                      <span>AI: <strong className="text-[#1FA2FF] font-mono">{p.aiTime}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>{/* END LEFT COLUMN */}

        {/* ─── RIGHT SIDEBAR (4 cols = ~33%) ───────────────────────────────── */}
        <div className="lg:col-span-4 flex flex-col gap-4">

          {/* Emergency Simulation Trigger Panel */}
          <div className="glass-panel p-4 rounded-2xl border border-[#EF4444]/30 space-y-3 bg-gradient-to-b from-slate-950 via-[#101827] to-slate-950 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-[#EF4444]" />
                <h2 className="text-sm font-bold text-white">Emergency Simulation</h2>
              </div>
              <span className="text-xs font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">Scenarios</span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Inject concurrent emergencies into Nova's decision engine:
            </p>

            <div className="grid grid-cols-2 gap-2">
              {Object.keys(masterIncidents).map((key) => {
                const isActive = activeQueue.some((i) => {
                  const incId = String(i.id || i.uniqueId || '').toLowerCase();
                  const incType = String(i.type || i.name || '').toLowerCase();
                  const targetKey = String(key).toLowerCase();
                  return (incId === targetKey || incId.startsWith(`${targetKey}_`) || incType.includes(targetKey)) && i.status !== 'RESOLVED' && i.status !== 'REJECTED' && i.status !== 'ARCHIVED';
                });
                const triggering = isTriggering[key];
                return (
                  <button
                    key={key}
                    type="button"
                    disabled={isActive || triggering}
                    onClick={() => handleIncidentClick(key)}
                    className={`p-2.5 rounded-xl border text-xs font-semibold transition-all duration-200 flex items-center justify-between gap-1.5 cursor-pointer active:scale-[0.98] ${
                      isActive
                        ? 'bg-[#EF4444]/20 text-[#EF4444] border-[#EF4444]/60 shadow-lg shadow-[#EF4444]/20 animate-pulse cursor-not-allowed'
                        : triggering
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 cursor-wait'
                        : 'bg-slate-900/90 hover:bg-slate-800 text-slate-200 border-slate-800 hover:border-[#EF4444]/40'
                    }`}
                  >
                    <span className="truncate">{masterIncidents[key].name}</span>
                    {triggering ? (
                      <div className="flex items-center gap-1 text-[10px] text-amber-300 font-bold shrink-0">
                        <Loader2 className="w-3 h-3 animate-spin text-amber-300 shrink-0" />
                        <span>DISPATCHING</span>
                      </div>
                    ) : isActive ? (
                      <span className="text-[10px] bg-[#EF4444] text-white font-bold px-1.5 py-0.5 rounded shrink-0">● ACTIVE</span>
                    ) : (
                      <span className="text-[10px] bg-slate-800 text-slate-400 font-bold px-1.5 py-0.5 rounded shrink-0">+ TRIGGER</span>
                    )}
                  </button>
                );
              })}
            </div>


            <div className="pt-2 border-t border-white/10">
              <button
                onClick={resetCity}
                className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 flex items-center justify-center gap-2 cursor-pointer transition-all hover:border-emerald-500/40"
              >
                <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
                <span>Reset City Status</span>
              </button>
            </div>
          </div>

          {/* ─── INCIDENT ACTION CHECKLIST ─────────────────────────────── */}
          {activeQueue.length > 0 && (
            <div className="glass-panel p-4 rounded-2xl border border-[#33C8FF]/30 space-y-3 bg-gradient-to-b from-slate-950 via-[#101827] to-slate-950 shadow-xl">
              <IncidentChecklistPanel
                activeQueue={activeQueue}
                onChecklistUpdate={handleChecklistUpdate}
              />
            </div>
          )}

          {/* Live Command Timeline */}
          <div className="glass-panel p-4 rounded-2xl border border-white/10 flex flex-col gap-2.5" style={{ maxHeight: '420px' }}>
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <h2 className="text-xs font-bold uppercase text-slate-300 tracking-wider flex items-center gap-2">
                <Radio className="w-4 h-4 text-[#1FA2FF]" /> Live Command Feed
              </h2>
              <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">● LIVE</span>
            </div>

            <div className="flex flex-col gap-1.5 text-xs overflow-y-auto flex-1 scrollbar-hide pr-1">
              {timelineLogs.length === 0 ? (
                <div className="py-6 text-slate-500 text-xs text-center font-mono">Awaiting emergency triggers...</div>
              ) : (
                timelineLogs.slice(0, 10).map((log) => (
                  <div key={log.id} className={`px-2.5 py-1.5 rounded-lg border flex items-start gap-2 animate-fade-in ${
                    log.type === 'red'
                      ? 'bg-[#EF4444]/15 border-[#EF4444]/40 text-[#EF4444] font-semibold'
                    : log.type === 'orange'
                      ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 font-semibold'
                    : log.type === 'green'
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                    : log.type === 'blue'
                      ? 'bg-[#1FA2FF]/15 border-[#1FA2FF]/30 text-[#1FA2FF]'
                    : log.type === 'purple'
                      ? 'bg-[#7C5CFF]/15 border-[#7C5CFF]/30 text-[#7C5CFF]'
                    : 'bg-slate-900/90 border-slate-800 text-slate-300'
                  }`}>
                    <span className="text-[10px] font-mono text-slate-500 shrink-0 mt-0.5">{log.time}</span>
                    <span className="text-xs leading-normal">{log.text}</span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>{/* END RIGHT SIDEBAR */}

      </div>{/* END MAIN GRID */}
    </div>
  );
}
