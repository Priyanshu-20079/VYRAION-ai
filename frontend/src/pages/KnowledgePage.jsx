import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  CheckCircle2,
  UploadCloud,
  Clock,
  ChevronRight,
  X,
  AlertTriangle,
  Flame,
  Car,
  Zap,
  CloudRain,
  ShieldCheck,
  Building2,
  ShieldAlert,
  Calendar,
  Tag,
  BookOpen,
  Filter,
  Check,
  FileUp,
  Download
} from 'lucide-react';
import { KNOWLEDGE_API_URL } from '../config/api';

/* ═══════════════════════════════════════════════════════════
   SAMPLE EMERGENCY INCIDENT REPORTS DATA
   ═══════════════════════════════════════════════════════════ */
const SAMPLE_REPORTS = [
  {
    id: 'rep-01',
    title: 'Expressway Multi-Vehicle Collision',
    date: 'August 4, 2026',
    type: 'Traffic Accident',
    typeBadgeColor: 'bg-[#33C8FF]/15 text-[#33C8FF] border-[#33C8FF]/30',
    icon: Car,
    status: 'Resolved',
    summary: 'A 4-vehicle pileup occurred on Expressway E-4 during peak rush hour due to an uncontained oil slick. Traffic backed up 3.2 km within 10 minutes.',
    timeline: [
      { time: '08:14 AM', event: 'Collision detected via CCTV AI Vision Sensors' },
      { time: '08:15 AM', event: 'Automated traffic signal rerouting engaged on Corridor B-9' },
      { time: '08:22 AM', event: 'Emergency paramedics & heavy towing units arrived on site' },
      { time: '08:45 AM', event: 'Damaged vehicles cleared and oil absorbent applied to lanes' },
      { time: '08:52 AM', event: 'Expressway traffic flow fully restored' }
    ],
    aiRecommendation: 'Divert incoming traffic to Corridor B-9, extend green signal phase by +15s, dispatch Heavy Tow Unit 4 and Hazmat Absorbent Crew.',
    agenciesDispatched: ['Traffic Police', 'Emergency Paramedics', 'City Heavy Towing', 'Municipal Hazmat Cleaning Crew'],
    resolution: 'Collision cleared in 31 minutes. 2 individuals transported with non-life-threatening injuries. Full traffic flow restored by 08:52 AM.',
    lessonsLearned: 'Pre-positioning oil absorbent kits at Highway Station 3 reduces lane closure duration by ~12 minutes.'
  },
  {
    id: 'rep-02',
    title: 'Commercial High-Rise Fire',
    date: 'August 1, 2026',
    type: 'Fire Outbreak',
    typeBadgeColor: 'bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/30',
    icon: Flame,
    status: 'Resolved',
    summary: 'An electrical short circuit in an IT server rack triggered a Level-2 fire alarm on Floor 14 of Apex Tower. Automatic sprinklers partially engaged.',
    timeline: [
      { time: '14:02 PM', event: 'Floor 14 smoke & heat sensors triggered alarm' },
      { time: '14:03 PM', event: 'HVAC ventilation isolated to prevent smoke spread' },
      { time: '14:09 PM', event: '3 Fire Tenders and Aerial Ladder 2 arrived' },
      { time: '14:24 PM', event: 'Primary flame source localized and suppressed' },
      { time: '14:35 PM', event: 'Overhaul complete; building cleared of smoke' }
    ],
    aiRecommendation: 'Isolate HVAC Zone 4, activate stairwell pressurization fans, dispatch Fire Squads 12 & 14 + Aerial Ladder 2, notify Power Utility.',
    agenciesDispatched: ['Fire & Rescue Services', 'Municipal Power Utility', 'Emergency Medical Response', 'Building Safety Bureau'],
    resolution: 'All 140 occupants evacuated safely via pressurized emergency stairwells. Zero fatalities. Structural integrity confirmed intact.',
    lessonsLearned: 'Automated HVAC zone isolation prevented toxic smoke infiltration into upper refuge floors completely.'
  },
  {
    id: 'rep-03',
    title: 'Central Hospital Primary Power Failure',
    date: 'July 28, 2026',
    type: 'Hospital Power Failure',
    typeBadgeColor: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    icon: Zap,
    status: 'Resolved',
    summary: 'Main substation transformer trip caused total loss of municipal grid power to St. Jude Central Hospital ICU & Surgical wings.',
    timeline: [
      { time: '22:41 PM', event: 'Substation transformer trip detected' },
      { time: '22:41 PM', event: 'Instantaneous UPS transfer (<8ms) maintained ICU power' },
      { time: '22:42 PM', event: 'Emergency Diesel Generator 1 auto-started and assumed full load' },
      { time: '22:44 PM', event: 'Mobile emergency fuel tanker dispatched' },
      { time: '01:53 AM', event: 'Main grid Line B re-energized and stabilized' }
    ],
    aiRecommendation: 'Priority dispatch of Mobile Generator Unit 3, load-shed non-critical admin wings, reroute municipal grid Line B to hospital feeder.',
    agenciesDispatched: ['Power Distribution Utility', 'Hospital Operations Team', 'Emergency Fuel Supply Corps', 'Civil Defense'],
    resolution: 'Emergency backup generators maintained continuous power for 3h 12m until main grid Line B was energized. Zero medical equipment downtime.',
    lessonsLearned: 'Dual-redundant ATS switches successfully prevented zero-power drops in critical ICU wards.'
  },
  {
    id: 'rep-04',
    title: 'Downtown Monsoon Flooding',
    date: 'July 20, 2026',
    type: 'Heavy Rain Flooding',
    typeBadgeColor: 'bg-[#7C5CFF]/15 text-[#7C5CFF] border-[#7C5CFF]/30',
    icon: CloudRain,
    status: 'Resolved',
    summary: 'Intense cloudburst dropped 110mm of rainfall in 45 minutes, overwhelming stormwater drains in the South Metro Underpass.',
    timeline: [
      { time: '16:10 PM', event: 'Flood sensors detected 40cm water depth in underpass' },
      { time: '16:11 PM', event: 'Automated underpass flood barriers raised' },
      { time: '16:15 PM', event: 'High-capacity auxiliary storm pumps 3 & 4 engaged' },
      { time: '16:45 PM', event: 'Water level receded below 10cm safety threshold' },
      { time: '17:00 PM', event: 'Debris cleared and underpass reopened' }
    ],
    aiRecommendation: 'Raise automated underpass gates, engage auxiliary pumps 3 & 4, broadcast severe flood warning to civic alert app, divert bus routes.',
    agenciesDispatched: ['Stormwater Management Bureau', 'Civil Defense Force', 'Transit Authority', 'Emergency Road Services'],
    resolution: 'Underpass drained of 450,000 liters of water in 40 minutes. Zero submerged vehicles. Traffic reopened in 50 minutes.',
    lessonsLearned: 'Raising automated barriers at the 30cm water mark prevented vehicle strandings entirely.'
  },
  {
    id: 'rep-05',
    title: 'Industrial Chemical Leak',
    date: 'July 12, 2026',
    type: 'Hazardous Material Leak',
    typeBadgeColor: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    icon: ShieldAlert,
    status: 'Resolved',
    summary: 'A ruptured containment valve at Northgate Industrial Zone released 340 liters of chlorine-based solvent, triggering Level-3 hazmat protocols.',
    timeline: [
      { time: '10:22 AM', event: 'Chemical vapor sensors triggered Level-3 hazmat alarm at Zone NW-7' },
      { time: '10:23 AM', event: 'Automated perimeter lockdown engaged within 90-meter exclusion radius' },
      { time: '10:30 AM', event: 'Hazmat Response Teams Alpha & Beta deployed in full SCBA gear' },
      { time: '11:05 AM', event: 'Containment foam applied; secondary spill barrier deployed' },
      { time: '12:44 PM', event: 'Leak source sealed; decontamination of affected zone completed' }
    ],
    aiRecommendation: 'Activate 90m exclusion zone, dispatch Hazmat Units Alpha & Beta with Class-B suits, notify Environmental Protection Authority, set up downwind air monitoring.',
    agenciesDispatched: ['Hazmat Emergency Response Unit', 'Environmental Protection Authority', 'Fire & Rescue Services', 'Civil Defense Medical Corps'],
    resolution: 'Leak fully contained in 2h 22m. 8 workers decontaminated with no lasting exposure injuries. Environmental impact classified as minimal.',
    lessonsLearned: 'Automated perimeter lockdown prevented civilian exposure entirely; quarterly valve integrity inspections recommended.'
  },
  {
    id: 'rep-06',
    title: 'Multi-Vehicle Casualty Response',
    date: 'July 6, 2026',
    type: 'Medical Emergency',
    typeBadgeColor: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    icon: ShieldCheck,
    status: 'Resolved',
    summary: 'A 6-vehicle collision on Interchange 9B during heavy fog resulted in 14 casualties requiring immediate triage and trauma care.',
    timeline: [
      { time: '06:48 AM', event: 'Multi-vehicle collision reported by CCTV AI at Interchange 9B' },
      { time: '06:49 AM', event: 'Mass Casualty Incident (MCI) protocol activated; 5 ALS units dispatched' },
      { time: '06:55 AM', event: 'First responders established forward triage zone on site' },
      { time: '07:10 AM', event: 'Air ambulance deployed for 2 critical trauma patients' },
      { time: '07:55 AM', event: 'All 14 casualties transported; scene cleared for lane reopening' }
    ],
    aiRecommendation: 'Activate MCI protocol, dispatch 5 ALS ambulances + 1 air ambulance, designate St. Jude Hospital as primary trauma center, coordinate lane closures with traffic command.',
    agenciesDispatched: ['Emergency Medical Services', 'Traffic Police', 'Air Ambulance Unit', 'St. Jude Trauma Center', 'Fire & Rescue (Extrication)'],
    resolution: '14 casualties treated: 2 critical stabilized via air transfer, 8 moderate injuries hospitalized, 4 minor injuries treated on-scene. Zero fatalities.',
    lessonsLearned: 'Pre-activating MCI protocol before scene confirmation reduced first-response arrival time by 4 minutes; air ambulance staging proved critical.'
  }
];

export default function KnowledgePage() {
  const [documents, setDocuments] = useState([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedReport, setSelectedReport] = useState(null);

  // Upload State
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadDocName, setUploadDocName] = useState('');

  // Fetch documents from backend
  const fetchDocuments = async () => {
    try {
      setIsLoadingDocs(true);
      const res = await fetch(`${KNOWLEDGE_API_URL}/documents`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.documents)) {
          setDocuments(data.documents);
        }
      }
    } catch (err) {
      console.error('[KnowledgePage] Failed to fetch documents:', err.message);
    } finally {
      setIsLoadingDocs(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  // File Upload Handler (UI File Upload -> Backend Endpoint)
  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setUploadDocName(file.name);
    setUploading(true);
    setUploadProgress(25);

    const timer = setInterval(() => {
      setUploadProgress((prev) => Math.min(90, prev + 20));
    }, 300);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', 'Emergency Incident Report');

      const res = await fetch(`${KNOWLEDGE_API_URL}/upload`, {
        method: 'POST',
        body: formData
      });

      clearInterval(timer);

      if (res.ok) {
        setUploadProgress(100);
        await fetchDocuments();
        setTimeout(() => {
          setUploading(false);
          setUploadProgress(0);
        }, 1000);
      } else {
        alert('File upload failed. Ensure file is a valid PDF, DOCX, or TXT document.');
        setUploading(false);
      }
    } catch (err) {
      clearInterval(timer);
      console.error('[KnowledgePage] Upload error:', err.message);
      alert('Upload failed — backend unreachable.');
      setUploading(false);
    }
  };

  // Filter the fixed 6 historical reports based on search query and category tab
  const filteredReports = SAMPLE_REPORTS.filter((rep) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      rep.title.toLowerCase().includes(q) ||
      rep.type.toLowerCase().includes(q) ||
      rep.summary.toLowerCase().includes(q) ||
      rep.resolution.toLowerCase().includes(q);

    const matchesFilter =
      selectedFilter === 'all' ||
      rep.type.toLowerCase().includes(selectedFilter.toLowerCase());

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-8 animate-fade-in select-none max-usable-width">

      {/* ═══════════════════════════════════════════════════════════
         PAGE HEADER & UNIFIED SEARCH
      ═══════════════════════════════════════════════════════════ */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6 bg-gradient-to-r from-slate-950 via-[#070B14] to-slate-950 shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#33C8FF]/15 border border-[#33C8FF]/30 text-[#33C8FF] text-xs font-mono font-bold">
              <BookOpen className="w-3.5 h-3.5" />
              <span>EMERGENCY INCIDENT REPORTS & DOCUMENT REPOSITORY</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Emergency Incident Reports & Document Repository
            </h1>
            <p className="text-xs text-slate-400 font-mono">
              Centralized repository of verified emergency incident reports, operational post-mortems, and AI recommendations.
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs text-slate-400">
            <div className="px-3.5 py-2 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#33C8FF]" />
              <span>Total Reports: <strong className="text-white font-bold">{SAMPLE_REPORTS.length}</strong></span>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reports by title, type, summary, or resolution..."
              className="w-full pl-12 pr-10 py-3.5 rounded-2xl bg-slate-900/90 border border-slate-700 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#33C8FF] focus:ring-1 focus:ring-[#33C8FF]/40 font-mono transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-3.5 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter Category Tabs */}
          <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
            <span className="text-slate-400 text-[11px] flex items-center gap-1 mr-1">
              <Filter className="w-3 h-3" /> Filter:
            </span>
            {[
              { id: 'all', label: 'All Reports' },
              { id: 'traffic', label: 'Traffic Collisions' },
              { id: 'fire', label: 'Fire Outbreaks' },
              { id: 'power', label: 'Power Failures' },
              { id: 'flooding', label: 'Flooding' },
              { id: 'hazardous', label: 'Hazmat' },
              { id: 'medical', label: 'Medical Emergency' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  selectedFilter === tab.id
                    ? 'bg-[#33C8FF]/20 border-[#33C8FF] text-[#33C8FF]'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
         SECTION 1 – PREVIOUS EMERGENCY REPORTS
      ═══════════════════════════════════════════════════════════ */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-white flex items-center gap-2 font-mono">
            <FileText className="w-5 h-5 text-[#33C8FF]" />
            <span>Previous Emergency Reports</span>
            <span className="text-xs text-slate-400 font-normal">({filteredReports.length} reports)</span>
          </h2>
        </div>

        {filteredReports.length === 0 ? (
          <div className="glass-panel p-8 text-center rounded-3xl border border-slate-800 font-mono space-y-2">
            <p className="text-sm text-slate-400">No emergency reports found matching "{searchQuery}".</p>
            <button
              onClick={() => { setSearchQuery(''); setSelectedFilter('all'); }}
              className="text-xs text-[#33C8FF] hover:underline"
            >
              Clear search filter
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredReports.map((report) => {
              const IconComponent = report.icon || FileText;
              return (
                <div
                  key={report.id}
                  className="glass-card p-6 rounded-3xl border border-white/10 hover:border-[#33C8FF]/40 transition-all duration-300 flex flex-col justify-between space-y-4 group bg-gradient-to-b from-slate-950 via-[#0B101D] to-slate-950 shadow-xl"
                >
                  <div className="space-y-3">
                    {/* Header Row: Type Badge & Status */}
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className={`px-2.5 py-1 rounded-full border text-[10px] font-bold ${report.typeBadgeColor}`}>
                        {report.type}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" /> {report.status}
                      </span>
                    </div>

                    {/* Title */}
                    <div className="flex items-start gap-3 pt-1">
                      <div className="p-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-[#33C8FF] group-hover:scale-105 transition-transform shrink-0">
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white group-hover:text-[#33C8FF] transition-colors leading-snug">
                          {report.title}
                        </h3>
                        <p className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
                          <Calendar className="w-3 h-3" /> {report.date}
                        </p>
                      </div>
                    </div>

                    {/* Brief Summary */}
                    <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed font-sans pt-1 border-t border-white/5">
                      {report.summary}
                    </p>
                  </div>

                  {/* View Report Action Button */}
                  <div className="pt-3 border-t border-white/10">
                    <button
                      onClick={() => setSelectedReport(report)}
                      className="w-full py-2.5 px-4 rounded-xl font-mono text-xs font-bold bg-slate-900 hover:bg-[#33C8FF]/15 text-[#33C8FF] border border-[#33C8FF]/30 flex items-center justify-center gap-2 transition-all cursor-pointer group-hover:border-[#33C8FF]"
                    >
                      <span>View Report</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════
         SECTION 2 – UPLOAD NEW REPORT
      ═══════════════════════════════════════════════════════════ */}
      <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4 bg-gradient-to-r from-slate-950 via-[#070B14] to-slate-950 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2 font-mono">
            <UploadCloud className="w-5 h-5 text-[#33C8FF]" />
            <h2 className="text-base font-bold text-white">Upload New Report</h2>
          </div>
          <span className="text-[10px] font-mono text-slate-400">Add documents to operational repository</span>
        </div>

        {uploading ? (
          <div className="p-6 rounded-2xl bg-slate-900 border border-[#33C8FF]/40 space-y-3 font-mono text-xs animate-fade-in text-center">
            <p className="font-bold text-white">Uploading Document: <span className="text-[#33C8FF]">{uploadDocName}</span></p>
            <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800 max-w-md mx-auto">
              <div
                className="bg-[#33C8FF] h-full rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="text-[11px] text-slate-400">Processing and indexing report into repository...</p>
          </div>
        ) : (
          <div className="glass-panel p-6 sm:p-8 rounded-2xl border-2 border-dashed border-white/15 hover:border-[#33C8FF]/50 transition-all text-center space-y-3 relative group">
            <input
              type="file"
              onChange={handleFileUpload}
              accept=".pdf,.docx,.txt"
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
            />
            <div className="w-12 h-12 mx-auto rounded-2xl bg-[#33C8FF]/10 border border-[#33C8FF]/30 flex items-center justify-center text-[#33C8FF] group-hover:scale-110 transition-transform">
              <FileUp className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white">Drag & drop emergency incident report here</h3>
              <p className="text-xs text-slate-400 font-mono">
                or <span className="text-[#33C8FF] underline font-bold">browse files</span> from your computer
              </p>
            </div>

            <div className="pt-2 flex items-center justify-center gap-2 font-mono text-[10px] text-slate-400">
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">Supported Formats: PDF, DOCX, TXT</span>
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════
         REPORT DETAIL MODAL (WHEN VIEW REPORT IS CLICKED)
      ═══════════════════════════════════════════════════════════ */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in font-sans">
          <div className="max-w-3xl w-full glass-panel border border-white/20 rounded-3xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto bg-slate-950 text-slate-100 shadow-2xl relative">
            
            {/* Modal Close Button */}
            <button
              onClick={() => setSelectedReport(null)}
              className="absolute top-6 right-6 p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="space-y-2 pr-10">
              <div className="flex items-center gap-2 font-mono text-xs">
                <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${selectedReport.typeBadgeColor}`}>
                  {selectedReport.type}
                </span>
                <span className="text-slate-400">• {selectedReport.date}</span>
                <span className="text-emerald-400 font-bold ml-auto flex items-center gap-1 text-[10px] bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-mono">
                  <CheckCircle2 className="w-3 h-3" /> {selectedReport.status}
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                {selectedReport.title}
              </h2>
            </div>

            {/* Modal Body Sections */}
            <div className="space-y-5 text-sm font-sans border-t border-white/10 pt-4">

              {/* 1. Incident Summary */}
              <div className="space-y-1.5">
                <h3 className="text-xs font-bold text-[#33C8FF] uppercase tracking-wider font-mono">
                  📄 Incident Summary
                </h3>
                <p className="text-xs text-slate-200 leading-relaxed bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800">
                  {selectedReport.summary}
                </p>
              </div>

              {/* 2. Timeline */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-[#7C5CFF] uppercase tracking-wider font-mono">
                  ⏱ Incident Timeline
                </h3>
                <div className="space-y-1.5 font-mono text-xs">
                  {selectedReport.timeline.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-900/40 border border-slate-800/80">
                      <span className="text-[#33C8FF] font-bold shrink-0">{step.time}</span>
                      <span className="text-slate-300 text-xs">{step.event}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. AI Recommendation */}
              <div className="space-y-1.5">
                <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider font-mono">
                  🤖 AI Recommendation (Nova Engine)
                </h3>
                <div className="p-3.5 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-xs text-amber-200 leading-relaxed font-mono">
                  {selectedReport.aiRecommendation}
                </div>
              </div>

              {/* 4. Agencies Dispatched */}
              <div className="space-y-1.5">
                <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider font-mono">
                  🚨 Agencies Dispatched
                </h3>
                <div className="flex flex-wrap gap-2 font-mono text-xs">
                  {selectedReport.agenciesDispatched.map((agency, idx) => (
                    <span key={idx} className="px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px]">
                      ✓ {agency}
                    </span>
                  ))}
                </div>
              </div>

              {/* 5. Resolution */}
              <div className="space-y-1.5">
                <h3 className="text-xs font-bold text-[#33C8FF] uppercase tracking-wider font-mono">
                  ✅ Incident Resolution
                </h3>
                <p className="text-xs text-slate-200 leading-relaxed bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800">
                  {selectedReport.resolution}
                </p>
              </div>

              {/* 6. Lessons Learned */}
              <div className="space-y-1.5">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                  💡 Lessons Learned & Protocol Updates
                </h3>
                <p className="text-xs text-slate-300 italic leading-relaxed bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800">
                  "{selectedReport.lessonsLearned}"
                </p>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-white/10 flex justify-end">
              <button
                onClick={() => setSelectedReport(null)}
                className="py-2.5 px-5 rounded-xl font-mono text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white border border-slate-700 transition-colors cursor-pointer"
              >
                Close Report
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
