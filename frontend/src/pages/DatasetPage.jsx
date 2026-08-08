import React, { useState, useEffect } from 'react';
import {
  Database,
  Download,
  RefreshCw,
  Search,
  CheckCircle2,
  Table as TableIcon,
  Server,
  FileSpreadsheet,
  FileJson,
  FileText,
  Layers,
  Filter,
  Info,
  X,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { DATASET_API_URL, getIncidentReportUrl } from '../config/api';

export default function DatasetPage() {
  const [datasetData, setDatasetData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [filterType, setFilterType] = useState('ALL');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const fetchDataset = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(DATASET_API_URL);
      if (!res.ok) {
        throw new Error(`Dataset API returned HTTP status ${res.status}`);
      }
      const data = await res.json();
      if (data.success) {
        setDatasetData(data);
      } else {
        throw new Error(data.message || 'Failed to load dataset records from MongoDB Atlas');
      }
    } catch (err) {
      console.error('Dataset fetch error:', err);
      setError(err.message || 'Error connecting to dataset API service');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDataset();
  }, []);

  const records = datasetData?.records || [];
  const metadata = datasetData?.metadata || {};

  // Filter records based on search and dropdown filters
  const filteredRecords = records.filter((rec) => {
    const matchesSearch =
      searchQuery === '' ||
      (rec.title && rec.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (rec.uniqueId && rec.uniqueId.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (rec.type && rec.type.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (rec.hotspot && rec.hotspot.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (rec._id && rec._id.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesSeverity =
      filterSeverity === 'ALL' || rec.severity === filterSeverity;

    const matchesType =
      filterType === 'ALL' || rec.type.toLowerCase().includes(filterType.toLowerCase());

    return matchesSearch && matchesSeverity && matchesType;
  });

  // Pagination calculation
  const totalPages = Math.ceil(filteredRecords.length / rowsPerPage) || 1;
  const paginatedRecords = filteredRecords.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  // CSV Export Generator
  const downloadCSV = () => {
    if (!filteredRecords || filteredRecords.length === 0) return;

    const headers = [
      'MongoDB_ObjectID',
      'Incident_ID',
      'Unique_ID',
      'Title',
      'Category_Type',
      'Severity',
      'Status',
      'Phase',
      'Hotspot_Zone',
      'Latitude',
      'Longitude',
      'Destination_Facility',
      'Est_Resolution_Time',
      'Time_Detected',
      'Agents_Count',
      'Units_Count',
      'Created_At_ISO'
    ];

    const csvRows = [headers.join(',')];

    filteredRecords.forEach((r) => {
      const row = [
        `"${r._id || ''}"`,
        `"${r.id || ''}"`,
        `"${r.uniqueId || ''}"`,
        `"${(r.title || '').replace(/"/g, '""')}"`,
        `"${(r.type || '').replace(/"/g, '""')}"`,
        `"${r.severity || ''}"`,
        `"${r.status || ''}"`,
        r.phase || 0,
        `"${(r.hotspot || '').replace(/"/g, '""')}"`,
        r.lat || 0,
        r.lng || 0,
        `"${(r.destination || '').replace(/"/g, '""')}"`,
        `"${r.resolutionTime || ''}"`,
        `"${r.timeDetected || ''}"`,
        r.assignedAgentsCount || 0,
        r.dispatchedUnitsCount || 0,
        `"${r.createdAt || ''}"`
      ];
      csvRows.push(row.join(','));
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `vyraion_incidents_dataset_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // JSON Export Generator
  const downloadJSON = () => {
    if (!filteredRecords || filteredRecords.length === 0) return;
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(
        {
          exportMetadata: {
            source: 'MongoDB Atlas',
            database: datasetData?.database || 'vyraion',
            collection: datasetData?.collection || 'incidents',
            totalExportedRecords: filteredRecords.length,
            exportedAt: new Date().toISOString()
          },
          records: filteredRecords
        },
        null,
        2
      )
    )}`;
    const link = document.createElement('a');
    link.setAttribute('href', jsonString);
    link.setAttribute('download', `vyraion_incidents_dataset_${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in max-usable-width font-sans text-slate-100 p-6">
      
      {/* ─── DATASET GENERATOR HEADER ────────────────────────────────────── */}
      <div className="glass-panel p-6 rounded-2xl border border-white/10 bg-gradient-to-r from-[#33C8FF]/10 via-[#7C5CFF]/10 to-[#101827] relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-[#33C8FF]/20 border border-[#33C8FF]/40 text-[#33C8FF] text-[10px] font-mono font-bold tracking-wider uppercase">
              READ-ONLY DATASET ENGINE
            </span>
            <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              Atlas Direct Pipeline
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-[#33C8FF]" />
            VYRAION DATASET GENERATOR
          </h1>
          <p className="text-xs text-slate-400 max-w-2xl">
            Converts live emergency incident documents stored in MongoDB Atlas (<code className="text-[#33C8FF] font-mono">vyraion.incidents</code>) into clean, tabular machine-learning datasets for verification & audit download.
          </p>
        </div>

        {/* Action Button Bar */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={fetchDataset}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-semibold text-xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#33C8FF]' : 'text-slate-300'}`} />
            <span>Refresh Atlas Data</span>
          </button>

          <button
            onClick={downloadCSV}
            disabled={loading || filteredRecords.length === 0}
            className="px-4 py-2 rounded-xl bg-emerald-600/20 border border-emerald-500/40 hover:bg-emerald-600/30 text-emerald-300 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-500/10 disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Download CSV</span>
          </button>

          <button
            onClick={downloadJSON}
            disabled={loading || filteredRecords.length === 0}
            className="px-4 py-2 rounded-xl bg-[#33C8FF]/20 border border-[#33C8FF]/40 hover:bg-[#33C8FF]/30 text-[#33C8FF] font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-[#33C8FF]/10 disabled:opacity-40"
          >
            <FileJson className="w-3.5 h-3.5 text-[#33C8FF]" />
            <span>Download JSON</span>
          </button>
        </div>
      </div>

      {/* ─── LIVE MONGODB ATLAS METRICS BAR ──────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-xl border border-white/10 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-mono text-slate-400">Total MongoDB Records</span>
            <div className="text-xl font-bold font-mono text-white">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-[#33C8FF]" /> : records.length}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Database className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-white/10 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-mono text-slate-400">Source Database</span>
            <div className="text-sm font-bold font-mono text-[#33C8FF] truncate">
              {metadata.database || 'vyraion'}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#33C8FF]/10 border border-[#33C8FF]/30 flex items-center justify-center text-[#33C8FF]">
            <Server className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-white/10 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-mono text-slate-400">Primary Collection</span>
            <div className="text-sm font-bold font-mono text-indigo-400 truncate">
              {metadata.collection || 'incidents'}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-white/10 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-mono text-slate-400">Schema Attributes</span>
            <div className="text-xl font-bold font-mono text-amber-400">
              {metadata.schema ? metadata.schema.length : 22} Fields
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <TableIcon className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ─── SEARCH & FILTER TOOLBAR ─────────────────────────────────────── */}
      <div className="glass-panel p-4 rounded-xl border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs bg-[#0B101D]/80">
        
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Title, ID, Type, Hotspot..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-[#33C8FF]"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400 font-mono text-[11px]">Severity:</span>
            <select
              value={filterSeverity}
              onChange={(e) => {
                setFilterSeverity(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-slate-900 border border-white/10 text-white rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:border-[#33C8FF]"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">CRITICAL</option>
              <option value="HIGH">HIGH</option>
              <option value="ELEVATED">ELEVATED</option>
              <option value="LOW">LOW</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-mono text-[11px]">Category:</span>
            <select
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-slate-900 border border-white/10 text-white rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:border-[#33C8FF]"
            >
              <option value="ALL">All Categories</option>
              <option value="traffic">Traffic Collision</option>
              <option value="fire">Fire Outbreak</option>
              <option value="medical">Medical Emergency</option>
              <option value="power">Power Grid Failure</option>
              <option value="hospital">Hospital Power</option>
              <option value="hazmat">Hazmat Spill</option>
              <option value="safety">Public Safety</option>
              <option value="rain">Heavy Rain</option>
            </select>
          </div>
        </div>
      </div>

      {/* ─── TABULAR DATASET VIEW ─────────────────────────────────────────── */}
      <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden bg-[#0A0F1D]">
        
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#33C8FF]" />
            <p className="text-sm font-semibold text-slate-300 font-mono">Querying MongoDB Atlas collection vyraion.incidents...</p>
          </div>
        ) : error ? (
          <div className="p-8 flex flex-col items-center justify-center gap-3 text-center bg-red-500/10 border border-red-500/20">
            <AlertTriangle className="w-8 h-8 text-red-400" />
            <p className="text-sm font-bold text-red-300 font-mono">{error}</p>
            <button
              onClick={fetchDataset}
              className="px-4 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-white font-semibold text-xs transition-colors"
            >
              Retry Database Connection
            </button>
          </div>
        ) : paginatedRecords.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3 text-center">
            <FileSpreadsheet className="w-10 h-10 text-slate-600" />
            <p className="text-sm font-bold text-slate-400 font-mono">No incident records found matching query filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono border-collapse">
              <thead>
                <tr className="bg-[#111827] text-slate-400 border-b border-white/10 uppercase tracking-wider text-[10px]">
                  <th className="px-4 py-3 font-bold text-center text-[#33C8FF] whitespace-nowrap">Report Export</th>
                  <th className="px-4 py-3 font-bold text-[#33C8FF]">MongoDB ObjectId</th>
                  <th className="px-4 py-3 font-bold">Unique ID</th>
                  <th className="px-4 py-3 font-bold">Title</th>
                  <th className="px-4 py-3 font-bold">Category</th>
                  <th className="px-4 py-3 font-bold text-center">Severity</th>
                  <th className="px-4 py-3 font-bold text-center">Status</th>
                  <th className="px-4 py-3 font-bold text-center">Phase</th>
                  <th className="px-4 py-3 font-bold">Hotspot</th>
                  <th className="px-4 py-3 font-bold">Lat</th>
                  <th className="px-4 py-3 font-bold">Lng</th>
                  <th className="px-4 py-3 font-bold">Destination</th>
                  <th className="px-4 py-3 font-bold">Est. Res.</th>
                  <th className="px-4 py-3 font-bold">Time Detected</th>
                  <th className="px-4 py-3 font-bold text-center">Agents</th>
                  <th className="px-4 py-3 font-bold text-center">Units</th>
                  <th className="px-4 py-3 font-bold text-center">Events</th>
                  <th className="px-4 py-3 font-bold text-center">Responders</th>
                  <th className="px-4 py-3 font-bold text-center">Priorities</th>
                  <th className="px-4 py-3 font-bold">Created At</th>
                  <th className="px-4 py-3 font-bold">Updated At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-[11px]">
                {paginatedRecords.map((row) => {
                  return (
                    <tr
                      key={row._id || row.uniqueId}
                      onClick={() => setSelectedRecord(row)}
                      className="hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1">
                          <a
                            href={getIncidentReportUrl(row._id || row.uniqueId || row.id, 'pdf')}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2 py-1 rounded bg-[#33C8FF]/20 border border-[#33C8FF]/40 text-[#33C8FF] hover:bg-[#33C8FF]/30 text-[10px] font-bold font-mono inline-flex items-center gap-1 transition-colors"
                            title="Download PDF Incident Resolution Report"
                          >
                            <FileText className="w-3 h-3" />
                            <span>PDF</span>
                          </a>
                          <a
                            href={getIncidentReportUrl(row._id || row.uniqueId || row.id, 'csv')}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2 py-1 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/30 text-[10px] font-bold font-mono inline-flex items-center gap-1 transition-colors"
                            title="Download CSV Incident Report"
                          >
                            <span>CSV</span>
                          </a>
                          <a
                            href={getIncidentReportUrl(row._id || row.uniqueId || row.id, 'html')}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2 py-1 rounded bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 hover:bg-indigo-500/30 text-[10px] font-bold font-mono inline-flex items-center gap-1 transition-colors"
                            title="Open HTML Printable Report"
                          >
                            <span>HTML</span>
                          </a>
                          <a
                            href={getIncidentReportUrl(row._id || row.uniqueId || row.id, 'json')}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2 py-1 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 text-[10px] font-bold font-mono inline-flex items-center gap-1 transition-colors"
                            title="View JSON Payload Report"
                          >
                            <span>JSON</span>
                          </a>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-bold text-[#33C8FF] whitespace-nowrap">
                        {row._id}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-300 whitespace-nowrap">
                        {row.uniqueId || row.id}
                      </td>
                      <td className="px-4 py-3 font-semibold text-white max-w-xs truncate">
                        {row.title}
                      </td>
                      <td className="px-4 py-3 text-indigo-300 whitespace-nowrap">
                        {row.type}
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            row.severity === 'CRITICAL'
                              ? 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse'
                              : row.severity === 'HIGH'
                              ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                              : row.severity === 'ELEVATED'
                              ? 'bg-blue-500/20 text-blue-400 border-blue-500/40'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          {row.severity}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            row.status === 'APPROVED'
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                              : row.status === 'RESOLVED'
                              ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/40'
                              : row.status === 'REJECTED'
                              ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                              : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-slate-300">
                        P{row.phase}
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        {row.hotspot}
                      </td>
                      <td className="px-4 py-3 text-slate-400">
                        {row.lat}
                      </td>
                      <td className="px-4 py-3 text-slate-400">
                        {row.lng}
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        {row.destination}
                      </td>
                      <td className="px-4 py-3 text-slate-400">
                        {row.resolutionTime}
                      </td>
                      <td className="px-4 py-3 text-slate-400">
                        {row.timeDetected}
                      </td>
                      <td className="px-4 py-3 text-center text-slate-300 font-bold">
                        {row.assignedAgentsCount}
                      </td>
                      <td className="px-4 py-3 text-center text-slate-300 font-bold">
                        {row.dispatchedUnitsCount}
                      </td>
                      <td className="px-4 py-3 text-center text-slate-300 font-bold">
                        {row.detectionEventsCount}
                      </td>
                      <td className="px-4 py-3 text-center text-slate-300 font-bold">
                        {row.fieldResponseCount}
                      </td>
                      <td className="px-4 py-3 text-center text-slate-300 font-bold">
                        {row.prioritiesCount}
                      </td>
                      <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                        {new Date(row.createdAt).toLocaleTimeString()}
                      </td>
                      <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                        {new Date(row.updatedAt).toLocaleTimeString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Bottom Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-white/10 flex items-center justify-between bg-[#111827]">
            <span className="text-xs text-slate-400 font-mono">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 text-xs font-semibold disabled:opacity-40 transition-colors cursor-pointer"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 text-xs font-semibold disabled:opacity-40 transition-colors cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Row Detail View Drawer / Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex justify-end transition-opacity">
          <div className="w-full max-w-2xl bg-[#0B101D] border-l border-white/10 h-full p-6 space-y-6 overflow-y-auto shadow-2xl flex flex-col justify-between">
            <div className="space-y-6">
              
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#33C8FF]/10 border border-[#33C8FF]/30 flex items-center justify-center">
                    <Info className="w-5 h-5 text-[#33C8FF]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">MongoDB Incident Document Detail</h3>
                    <p className="text-xs text-slate-400 font-mono">ObjectId: <span className="text-[#33C8FF]">{selectedRecord._id}</span></p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedRecord(null)}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-[#111827] border border-white/5 space-y-1">
                  <span className="text-[10px] font-mono text-slate-400">Incident Name</span>
                  <div className="font-semibold text-white">{selectedRecord.title || selectedRecord.name}</div>
                </div>
                <div className="p-3 rounded-xl bg-[#111827] border border-white/5 space-y-1">
                  <span className="text-[10px] font-mono text-slate-400">Unique ID</span>
                  <div className="font-semibold text-[#33C8FF] font-mono">{selectedRecord.uniqueId || selectedRecord.id}</div>
                </div>
                <div className="p-3 rounded-xl bg-[#111827] border border-white/5 space-y-1">
                  <span className="text-[10px] font-mono text-slate-400">Category Type</span>
                  <div className="font-semibold text-indigo-300">{selectedRecord.type}</div>
                </div>
                <div className="p-3 rounded-xl bg-[#111827] border border-white/5 space-y-1">
                  <span className="text-[10px] font-mono text-slate-400">Severity / Status</span>
                  <div className="font-semibold text-amber-400">{selectedRecord.severity} ({selectedRecord.status})</div>
                </div>
              </div>

              {/* Location & Destination */}
              <div className="p-4 rounded-xl bg-[#111827] border border-white/5 space-y-2 text-xs">
                <h4 className="font-bold text-slate-300 font-mono text-[11px]">Location & Operations</h4>
                <div className="grid grid-cols-2 gap-2 text-slate-300">
                  <div>Hotspot Zone: <strong className="text-white">{selectedRecord.hotspot}</strong></div>
                  <div>Destination: <strong className="text-white">{selectedRecord.destination}</strong></div>
                  <div>Coordinates: <strong className="text-white font-mono">{selectedRecord.lat}, {selectedRecord.lng}</strong></div>
                  <div>Est. Resolution: <strong className="text-white">{selectedRecord.resolutionTime}</strong></div>
                </div>
              </div>

              {/* Single Incident Report Export Box */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-[#33C8FF]/10 via-[#7C5CFF]/10 to-transparent border border-[#33C8FF]/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#33C8FF]" />
                    <h4 className="font-bold text-white text-xs font-mono">Download Incident Resolution Report</h4>
                  </div>
                  <span className="text-[10px] font-mono text-[#33C8FF] bg-[#33C8FF]/10 px-2 py-0.5 rounded border border-[#33C8FF]/30">
                    MongoDB Atlas Source
                  </span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Exports a project-specific resolution report for this exact incident ({selectedRecord.uniqueId || selectedRecord.id}), including captured fields, AI blueprints, action checklist, and resolution notes.
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <a
                    href={getIncidentReportUrl(selectedRecord._id || selectedRecord.uniqueId || selectedRecord.id, 'pdf')}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-1.5 rounded-lg bg-[#33C8FF]/20 border border-[#33C8FF]/40 text-[#33C8FF] hover:bg-[#33C8FF]/30 font-bold text-xs inline-flex items-center gap-1.5 transition-all shadow-md"
                  >
                    <FileText className="w-3.5 h-3.5 text-[#33C8FF]" />
                    <span>Download PDF</span>
                  </a>
                  <a
                    href={getIncidentReportUrl(selectedRecord._id || selectedRecord.uniqueId || selectedRecord.id, 'csv')}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30 font-bold text-xs inline-flex items-center gap-1.5 transition-all shadow-md"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Download CSV</span>
                  </a>
                  <a
                    href={getIncidentReportUrl(selectedRecord._id || selectedRecord.uniqueId || selectedRecord.id, 'html')}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-1.5 rounded-lg bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 hover:bg-indigo-500/30 font-bold text-xs inline-flex items-center gap-1.5 transition-all shadow-md"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Open Printable HTML</span>
                  </a>
                  <a
                    href={getIncidentReportUrl(selectedRecord._id || selectedRecord.uniqueId || selectedRecord.id, 'json')}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 font-bold text-xs inline-flex items-center gap-1.5 transition-all shadow-md"
                  >
                    <FileJson className="w-3.5 h-3.5 text-amber-400" />
                    <span>View JSON</span>
                  </a>
                </div>
              </div>

              {/* Raw JSON Record */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-300 font-mono text-xs flex items-center justify-between">
                  <span>Raw MongoDB Document Payload</span>
                  <span className="text-[10px] text-[#33C8FF] font-mono">vyraion.incidents</span>
                </h4>
                <pre className="p-4 rounded-xl bg-[#050811] border border-white/10 text-[11px] font-mono text-emerald-400 overflow-x-auto max-h-96">
                  {JSON.stringify(selectedRecord.rawDoc || selectedRecord, null, 2)}
                </pre>
              </div>

            </div>

            <div className="pt-4 border-t border-white/10 flex justify-end">
              <button
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition-colors cursor-pointer"
              >
                Close Panel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
