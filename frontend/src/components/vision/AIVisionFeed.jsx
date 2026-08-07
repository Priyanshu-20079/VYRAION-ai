import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  Video,
  Eye,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Sparkles,
  Upload,
  RefreshCw,
  Zap,
  MapPin,
  Building,
  Sliders,
  Play,
  Pause
} from 'lucide-react';
import { CCTV_FEEDS, classifyVisionRisk } from '../../utils/aiVisionEngine';

export default function AIVisionFeed({ onTriggerIncident }) {
  const [selectedCamId, setSelectedCamId] = useState('cam_01');
  const [autoSimulate, setAutoSimulate] = useState(true);
  const [customImage, setCustomImage] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [webcamActive, setWebcamActive] = useState(false);
  const [triggerStatus, setTriggerStatus] = useState('');

  const videoRef = useRef(null);
  const webcamRef = useRef(null);

  const currentCam = CCTV_FEEDS.find((c) => c.id === selectedCamId) || CCTV_FEEDS[0];
  const riskInfo = classifyVisionRisk(currentCam.riskLevel);

  // Auto-scan cycle every 25 seconds across CCTV presets when autoSimulate is true
  useEffect(() => {
    if (!autoSimulate || webcamActive || customImage) return;

    const interval = setInterval(() => {
      setIsScanning(true);
      setTimeout(() => {
        setSelectedCamId((prevId) => {
          const idx = CCTV_FEEDS.findIndex((c) => c.id === prevId);
          const nextIdx = (idx + 1) % CCTV_FEEDS.length;
          return CCTV_FEEDS[nextIdx].id;
        });
        setIsScanning(false);
      }, 800);
    }, 25000);

    return () => clearInterval(interval);
  }, [autoSimulate, webcamActive, customImage]);

  // Handle image upload fallback
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setCustomImage(url);
      setWebcamActive(false);
      setIsScanning(true);
      setTimeout(() => setIsScanning(false), 900);
    }
  };

  // Toggle Webcam Feed
  const toggleWebcam = async () => {
    if (webcamActive) {
      if (webcamRef.current && webcamRef.current.srcObject) {
        const stream = webcamRef.current.srcObject;
        stream.getTracks().forEach((track) => track.stop());
      }
      setWebcamActive(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (webcamRef.current) {
          webcamRef.current.srcObject = stream;
        }
        setWebcamActive(true);
        setCustomImage(null);
      } catch (err) {
        alert('Webcam access denied or unavailable. Using simulated CCTV feed.');
      }
    }
  };

  // Trigger Vision Incident to Vyraion Emergency Lifecycle
  const handleDispatchVisionIncident = () => {
    setTriggerStatus('SENDING TO NOVA...');
    if (onTriggerIncident) {
      onTriggerIncident({
        id: currentCam.type,
        detectedBy: 'AI Vision',
        cameraName: currentCam.name,
        locationName: currentCam.location,
        lat: currentCam.lat,
        lng: currentCam.lng,
        riskLevel: currentCam.riskLevel,
        confidence: currentCam.confidence,
        recommendedAgencies: currentCam.recommendedAgencies,
        detectionEvents: [
          { source: 'AI CCTV Vision Stream', detail: `${currentCam.label} (${currentCam.confidence}% Conf.)`, realTime: '0.4s' },
          { source: 'Thermal Heat Matrix', detail: `Detected ${currentCam.detectedObjects.length} object signatures`, realTime: '0.2s' }
        ]
      });
    }

    setTimeout(() => {
      setTriggerStatus('INCIDENT DISPATCHED!');
      setTimeout(() => setTriggerStatus(''), 2500);
    }, 600);
  };

  return (
    <div className="glass-panel p-5 sm:p-6 rounded-3xl border border-white/10 space-y-4 bg-slate-950/80 shadow-2xl relative overflow-hidden font-sans">
      
      {/* Background Tech Glow */}
      <div className="absolute -top-24 -right-24 w-60 h-60 bg-[#33C8FF]/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* HEADER CONTROLS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 text-[10px] font-mono font-bold uppercase tracking-wider animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> LIVE CCTV FEED
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#33C8FF]/15 border border-[#33C8FF]/30 text-[#33C8FF] text-[10px] font-mono font-bold uppercase tracking-wider">
              <Sparkles className="w-3 h-3" /> DETECTED BY AI VISION
            </span>
          </div>
          <h2 className="text-lg font-extrabold text-white tracking-tight flex items-center gap-2 mt-1">
            <Camera className="w-5 h-5 text-[#33C8FF]" />
            Camera Risk Detection Engine
          </h2>
        </div>

        {/* CONTROLS */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <select
            value={selectedCamId}
            onChange={(e) => {
              setSelectedCamId(e.target.value);
              setCustomImage(null);
              if (webcamActive) toggleWebcam();
            }}
            className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-[#33C8FF] cursor-pointer"
          >
            {CCTV_FEEDS.map((feed) => (
              <option key={feed.id} value={feed.id}>
                {feed.name} [{feed.riskLevel}]
              </option>
            ))}
          </select>

          <button
            onClick={toggleWebcam}
            className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 text-xs transition-all ${
              webcamActive
                ? 'bg-rose-500/20 border-rose-500/50 text-rose-300 font-bold'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            {webcamActive ? 'Stop Cam' : 'Webcam'}
          </button>

          <label className="px-3 py-1.5 rounded-xl border bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700 cursor-pointer flex items-center gap-1.5 text-xs">
            <Upload className="w-3.5 h-3.5" />
            Upload
            <input type="file" accept="image/*,video/*" onChange={handleImageUpload} className="hidden" />
          </label>

          <button
            onClick={() => setAutoSimulate(!autoSimulate)}
            className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 text-xs transition-all ${
              autoSimulate
                ? 'bg-[#33C8FF]/15 border-[#33C8FF]/40 text-[#33C8FF] font-bold'
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
            title="Auto-scan CCTV feeds every 25 seconds"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${autoSimulate ? 'animate-spin' : ''}`} />
            Auto Scan {autoSimulate ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* MAIN CONTENT GRID: VIDEO PLAYER + DETECTION METRICS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        
        {/* VIDEO DISPLAY + BOUNDING BOX OVERLAY (Col 7) */}
        <div className="lg:col-span-7 relative bg-slate-950 rounded-2xl border border-white/10 overflow-hidden group aspect-video flex items-center justify-center">
          
          {/* CCTV VIDEO OR CUSTOM IMAGE OR WEBCAM */}
          {webcamActive ? (
            <video ref={webcamRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          ) : customImage ? (
            <img src={customImage} alt="Uploaded Feed" className="w-full h-full object-cover" />
          ) : (
            <video
              key={currentCam.id}
              ref={videoRef}
              src={currentCam.videoSrc}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover opacity-80"
            />
          )}

          {/* AI RADAR SCAN SWEEP LINE */}
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-[#33C8FF]/15 to-transparent w-full h-1/4 animate-pulse"></div>

          {/* AI BOUNDING BOX OVERLAYS */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-20">
            {currentCam.detectedObjects.map((obj, i) => (
              <g key={i}>
                {/* Rect Box */}
                <rect
                  x={`${obj.x}%`}
                  y={`${obj.y}%`}
                  width={`${obj.width}%`}
                  height={`${obj.height}%`}
                  fill="rgba(239, 68, 68, 0.15)"
                  stroke={obj.color}
                  strokeWidth="2"
                  strokeDasharray="4 2"
                  className="animate-pulse"
                />
                {/* Corner Accents */}
                <circle cx={`${obj.x}%`} cy={`${obj.y}%`} r="3" fill={obj.color} />
                <circle cx={`${obj.x + obj.width}%`} cy={`${obj.y}%`} r="3" fill={obj.color} />
                <circle cx={`${obj.x}%`} cy={`${obj.y + obj.height}%`} r="3" fill={obj.color} />
                <circle cx={`${obj.x + obj.width}%`} cy={`${obj.y + obj.height}%`} r="3" fill={obj.color} />

                {/* Object Label Tag */}
                <foreignObject
                  x={`${obj.x}%`}
                  y={`${Math.max(2, obj.y - 12)}%`}
                  width="220"
                  height="30"
                >
                  <div
                    style={{ backgroundColor: obj.color }}
                    className="text-slate-950 font-mono text-[10px] font-extrabold px-2 py-0.5 rounded shadow-lg flex items-center gap-1 w-max"
                  >
                    <span>{obj.label}</span>
                    <span className="opacity-80">({obj.confidence}%)</span>
                  </div>
                </foreignObject>
              </g>
            ))}
          </svg>

          {/* OVERLAY BADGES */}
          <div className="absolute top-3 left-3 z-30 flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-md bg-slate-950/80 backdrop-blur-md border border-white/10 text-white font-mono text-[11px] font-bold flex items-center gap-1.5 shadow-lg">
              <MapPin className="w-3.5 h-3.5 text-[#33C8FF]" />
              {currentCam.name}
            </span>
          </div>

          <div className="absolute bottom-3 right-3 z-30 flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-md bg-slate-950/90 backdrop-blur-md border border-[#33C8FF]/40 text-[#33C8FF] font-mono text-[10px] font-bold shadow-lg">
              FPS: 60.0 | RES: 1080p | MODEL: YOLO-v9-Emergency
            </span>
          </div>
        </div>

        {/* METRICS & RISK CLASSIFICATION PANEL (Col 5) */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-3 font-mono">
          
          {/* RISK CLASSIFICATION CARD */}
          <div className={`p-4 rounded-2xl border transition-all duration-300 space-y-3 ${riskInfo.cardBg}`}>
            
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                Risk Classification
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-extrabold border ${riskInfo.badgeBg}`}>
                {currentCam.riskLevel} RISK
              </span>
            </div>

            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4" style={{ color: riskInfo.color }} />
                {currentCam.label}
              </h3>
              <p className="text-xs text-slate-300 mt-1 leading-snug">
                {currentCam.description}
              </p>
            </div>

            {/* CONFIDENCE & LOCATION */}
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/10">
              <div>
                <span className="text-[10px] text-slate-400 block">AI Vision Confidence</span>
                <span className="text-sm font-bold text-[#33C8FF]">{currentCam.confidence}%</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Location Coordinates</span>
                <span className="text-xs font-bold text-slate-200 truncate block">
                  {currentCam.lat}, {currentCam.lng}
                </span>
              </div>
            </div>

          </div>

          {/* RECOMMENDED AGENCIES */}
          <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
            <span className="text-slate-400 text-[11px] font-bold uppercase block">
              Recommended Responding Agencies
            </span>
            <div className="flex flex-wrap gap-1.5">
              {currentCam.recommendedAgencies.map((agency, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 text-[11px] font-bold"
                >
                  {agency}
                </span>
              ))}
            </div>
          </div>

          {/* DISPATCH ACTION BUTTON */}
          <button
            onClick={handleDispatchVisionIncident}
            disabled={triggerStatus !== ''}
            className={`w-full py-3.5 px-4 rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl transition-all duration-300 ${
              triggerStatus
                ? 'bg-emerald-500 text-slate-950 font-extrabold'
                : 'bg-gradient-to-r from-[#33C8FF] to-blue-600 hover:from-[#33C8FF] hover:to-blue-500 text-slate-950 font-extrabold shadow-cyan-900/30 active:scale-[0.99]'
            }`}
          >
            <Zap className="w-4 h-4 fill-current" />
            {triggerStatus || `Trigger Incident (${currentCam.riskLevel} Risk)`}
          </button>

        </div>

      </div>

    </div>
  );
}
