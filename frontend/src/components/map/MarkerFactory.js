/**
 * MarkerFactory.js — Command-Center SVG Marker System for Live City Map.
 *
 * Uniform Circular Glass Marker Design (26-30px max):
 * - Dark circular glass background (rgba(16,24,39,0.95))
 * - Colored outer glow & thin 1.5px border
 * - Hover & selection micro-animations (scale 1.08, drop-shadow glow)
 * - Smart labels on hover/selection
 *
 * Icon Family:
 * - Police: Blue (#1FA2FF) shield badge
 * - Fire: Red (#EF4444) fire badge
 * - Hospital: Green (#22C55E) medical cross
 * - Ambulance: Cyan (#06B6D4) ambulance in circle
 * - Traffic: Orange (#F97316) warning triangle
 * - Power: Yellow (#FBBF24) lightning bolt
 * - Heavy Rain: Blue (#38BDF8) rain cloud
 * - Hazmat: Purple (#A855F7) hazard icon
 * - Camera: Cyan (#06B6D4) CCTV camera
 * - Infrastructure: Gray (#94A3B8) building
 */
import L from 'leaflet';

const iconCache = new Map();

// Circumference at r=12 for capacity ring
const RING_C = 2 * Math.PI * 12;

function capacityDash(available, total) {
  if (!total || total === 0) return `${RING_C.toFixed(1)} 0`;
  const ratio = Math.max(0, Math.min(1, available / total));
  const filled = ratio * RING_C;
  return `${filled.toFixed(1)} ${(RING_C - filled).toFixed(1)}`;
}

function labelHtml(text) {
  if (!text) return '';
  return `<div class="eoc-marker-label" style="
    margin-top:2px;padding:2px 6px;border-radius:5px;
    background:rgba(6,11,20,0.92);border:1px solid rgba(255,255,255,0.12);
    color:#F1F5F9;font-size:9px;font-weight:600;
    font-family:'Inter', sans-serif;
    white-space:nowrap;max-width:120px;
    overflow:hidden;text-overflow:ellipsis;
    box-shadow:0 4px 10px rgba(0,0,0,0.6);
    pointer-events:none;user-select:none;
    backdrop-filter:blur(6px);
  ">${text}</div>`;
}

function make(html, w, h, ax, ay) {
  return L.divIcon({
    className: 'eoc-marker',
    html,
    iconSize: [w, h],
    iconAnchor: [ax, ay],
    popupAnchor: [0, -(ay - 4)],
  });
}

/* ─── 1. HOSPITAL — Green (#22C55E) Medical Cross ──────────────────────── */
export function getHospitalIcon({ available = 1, total = 1, isAlert = false, label = '' } = {}) {
  const ratio = Math.round((total > 0 ? available / total : 1) * 10) / 10;
  const key = `hosp_${ratio}_${+isAlert}_${label}`;
  if (iconCache.has(key)) return iconCache.get(key);

  const accent = isAlert ? '#EF4444' : '#22C55E';
  const dash = capacityDash(available, total);

  const html = `<div class="eoc-marker-wrapper" style="display:flex;flex-direction:column;align-items:center;pointer-events:none">
    <div style="position:relative;width:28px;height:28px;pointer-events:auto;cursor:pointer;filter:drop-shadow(0 3px 8px ${accent}44);">
      <svg width="28" height="28" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg">
        <circle cx="14" cy="14" r="13" fill="#101827" stroke="${accent}" stroke-width="1.6"/>
        <circle cx="14" cy="14" r="12" fill="none" stroke="${accent}" stroke-width="1.8" stroke-dasharray="${dash}" stroke-linecap="round" transform="rotate(-90 14 14)"/>
        <!-- Medical Cross -->
        <rect x="12.5" y="8" width="3" height="12" rx="1" fill="${accent}"/>
        <rect x="8" y="12.5" width="12" height="3" rx="1" fill="${accent}"/>
      </svg>
      ${isAlert ? `<div class="eoc-pulse-ring" style="position:absolute;inset:-4px;border-radius:50%;border:1.2px solid ${accent};animation:eocPulse 1.2s ease-out infinite;pointer-events:none;"></div>` : ''}
    </div>
    ${labelHtml(label)}
  </div>`;

  const icon = make(html, 28, label ? 44 : 28, 14, label ? 37 : 28);
  iconCache.set(key, icon);
  return icon;
}

/* ─── 2. POLICE — Blue (#1FA2FF) Shield Badge ────────────────────────────── */
export function getPoliceIcon({ isAlert = false, label = '' } = {}) {
  const key = `police_${+isAlert}_${label}`;
  if (iconCache.has(key)) return iconCache.get(key);

  const accent = isAlert ? '#EF4444' : '#1FA2FF';
  const html = `<div class="eoc-marker-wrapper" style="display:flex;flex-direction:column;align-items:center;pointer-events:none">
    <div style="position:relative;width:28px;height:28px;pointer-events:auto;cursor:pointer;filter:drop-shadow(0 3px 8px ${accent}44);">
      <svg width="28" height="28" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg">
        <circle cx="14" cy="14" r="13" fill="#101827" stroke="${accent}" stroke-width="1.6"/>
        <!-- Shield Badge -->
        <path d="M14,6 L21,9.5 L21,17 Q21,22 14,25.5 Q7,22 7,17 L7,9.5 Z"
          fill="none" stroke="${accent}" stroke-width="1.6"/>
        <polygon points="14,10 15.5,13 19,13.5 16.5,16 17,19.5 14,18 11,19.5 11.5,16 9,13.5 12.5,13" fill="${accent}"/>
      </svg>
      ${isAlert ? `<div class="eoc-pulse-ring" style="position:absolute;inset:-4px;border-radius:50%;border:1.2px solid ${accent};animation:eocPulse 1s ease-out infinite;pointer-events:none;"></div>` : ''}
    </div>
    ${labelHtml(label)}
  </div>`;

  const icon = make(html, 28, label ? 44 : 28, 14, label ? 37 : 28);
  iconCache.set(key, icon);
  return icon;
}

/* ─── 3. FIRE — Red (#EF4444) Fire Badge ─────────────────────────────────── */
export function getFireIcon({ isAlert = false, isResponding = false, label = '' } = {}) {
  const key = `fire_${+isAlert}_${+isResponding}_${label}`;
  if (iconCache.has(key)) return iconCache.get(key);

  const accent = '#EF4444';
  const html = `<div class="eoc-marker-wrapper" style="display:flex;flex-direction:column;align-items:center;pointer-events:none">
    <div style="position:relative;width:28px;height:28px;pointer-events:auto;cursor:pointer;filter:drop-shadow(0 3px 8px ${accent}44);">
      <svg width="28" height="28" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg">
        <circle cx="14" cy="14" r="13" fill="#101827" stroke="${accent}" stroke-width="1.6"/>
        <!-- Flame Icon -->
        <path d="M14,6 C14,6 10,11 10,15 C10,18.3 11.8,21 14,21 C16.2,21 18,18.3 18,15 C18,11 14,6 14,6 Z" fill="${accent}"/>
        <path d="M14,12 C14,12 12,14.5 12,16.5 C12,18 12.9,19 14,19 C15.1,19 16,18 16,16.5 C16,14.5 14,12 14,12 Z" fill="#FBBF24"/>
      </svg>
      ${(isAlert || isResponding) ? `<div class="eoc-pulse-ring" style="position:absolute;inset:-4px;border-radius:50%;border:1.2px solid ${accent};animation:eocPulse 1s ease-out infinite;pointer-events:none;"></div>` : ''}
    </div>
    ${labelHtml(label)}
  </div>`;

  const icon = make(html, 28, label ? 44 : 28, 14, label ? 37 : 28);
  iconCache.set(key, icon);
  return icon;
}

/* ─── 4. AMBULANCE — Cyan (#06B6D4) Circle Icon ─────────────────────────── */
export function getAmbulanceIcon({ bearing = 0, phase = 'idle', label = '' } = {}) {
  const snapBear = Math.round(bearing / 15) * 15;
  const key = `amb_${snapBear}_${phase}_${label}`;
  if (iconCache.has(key)) return iconCache.get(key);

  const isMoving = phase === 'dispatched' || phase === 'departing' || phase === 'returning';
  const accent = phase === 'onscene' ? '#EF4444'
    : phase === 'returning' ? '#64748B'
    : '#06B6D4';

  const html = `<div class="eoc-marker-wrapper" style="display:flex;flex-direction:column;align-items:center;pointer-events:none">
    <div style="position:relative;width:26px;height:26px;pointer-events:auto;cursor:pointer;filter:drop-shadow(0 3px 8px ${accent}44);">
      <svg width="26" height="26" viewBox="0 0 26 26" xmlns="http://www.w3.org/2000/svg">
        <circle cx="13" cy="13" r="12" fill="#101827" stroke="${accent}" stroke-width="1.6"/>
        <g transform="rotate(${snapBear} 13 13)">
          <polygon points="13,4 18,15 8,15" fill="${accent}" opacity="${isMoving ? '1' : '0.6'}"/>
        </g>
        <circle cx="13" cy="13" r="3" fill="${accent}" opacity="0.3"/>
      </svg>
      ${isMoving ? `<div class="eoc-pulse-ring" style="position:absolute;inset:-4px;border-radius:50%;border:1.2px solid ${accent};animation:eocPulse 1.2s ease-out infinite;pointer-events:none;"></div>` : ''}
    </div>
    ${labelHtml(label)}
  </div>`;

  const icon = make(html, 26, label ? 42 : 26, 13, label ? 35 : 26);
  iconCache.set(key, icon);
  return icon;
}

/* ─── 5. INFRASTRUCTURE — Yellow (#FBBF24) Building/Diamond ─────────────── */
export function getInfraIcon({ isAlert = false, label = '' } = {}) {
  const key = `infra_${+isAlert}_${label}`;
  if (iconCache.has(key)) return iconCache.get(key);

  const accent = isAlert ? '#EF4444' : '#FBBF24';
  const html = `<div class="eoc-marker-wrapper" style="display:flex;flex-direction:column;align-items:center;pointer-events:none">
    <div style="position:relative;width:26px;height:26px;pointer-events:auto;cursor:pointer;filter:drop-shadow(0 3px 8px ${accent}44);">
      <svg width="26" height="26" viewBox="0 0 26 26" xmlns="http://www.w3.org/2000/svg">
        <circle cx="13" cy="13" r="12" fill="#101827" stroke="${accent}" stroke-width="1.5"/>
        <polygon points="13,4 20,13 13,22 6,13" fill="none" stroke="${accent}" stroke-width="1.5"/>
        <polygon points="13,7 17,13 13,19 9,13" fill="${accent}" opacity="0.4"/>
      </svg>
      ${isAlert ? `<div class="eoc-pulse-ring" style="position:absolute;inset:-4px;border-radius:50%;border:1.2px solid ${accent};animation:eocPulse 1.2s ease-out infinite;pointer-events:none;"></div>` : ''}
    </div>
    ${labelHtml(label)}
  </div>`;

  const icon = make(html, 26, label ? 42 : 26, 13, label ? 35 : 26);
  iconCache.set(key, icon);
  return icon;
}

/* ─── 6. CAMERA — Cyan (#06B6D4) CCTV Camera ────────────────────────────── */
export function getCCTVIcon({ isActive = false, hasIncident = false, label = '' } = {}) {
  const key = `cctv_${+isActive}_${+hasIncident}_${label}`;
  if (iconCache.has(key)) return iconCache.get(key);

  const accent = hasIncident ? '#EF4444' : isActive ? '#06B6D4' : '#64748B';
  const html = `<div class="eoc-marker-wrapper" style="display:flex;flex-direction:column;align-items:center;pointer-events:none">
    <div style="position:relative;width:24px;height:24px;pointer-events:auto;cursor:pointer;filter:drop-shadow(0 3px 6px ${accent}44);">
      <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="11" fill="#101827" stroke="${accent}" stroke-width="1.5"/>
        <rect x="5" y="8" width="10" height="8" rx="1.5" fill="none" stroke="${accent}" stroke-width="1.4"/>
        <polygon points="15,10 19,8 19,16 15,14" fill="${accent}"/>
      </svg>
      ${(isActive || hasIncident) ? `<div class="eoc-pulse-ring" style="position:absolute;inset:-3px;border-radius:50%;border:1.2px solid ${accent};animation:eocPulse 1.2s ease-out infinite;pointer-events:none;"></div>` : ''}
    </div>
    ${labelHtml(label)}
  </div>`;

  const icon = make(html, 24, label ? 40 : 24, 12, label ? 33 : 24);
  iconCache.set(key, icon);
  return icon;
}

/* ─── 7. INCIDENT — Red/Orange/Yellow Warning Triangle ─────────────────── */
const SEVERITY_COLOR = {
  LOW: '#1FA2FF',
  NORMAL: '#1FA2FF',
  MEDIUM: '#FBBF24',
  ELEVATED: '#FBBF24',
  HIGH: '#F97316',
  CRITICAL: '#EF4444'
};
const PULSE_SPEED = { LOW: '2.2s', NORMAL: '2.2s', MEDIUM: '1.5s', ELEVATED: '1.5s', HIGH: '1.0s', CRITICAL: '0.7s' };

export function getIncidentIcon({ severity = 'HIGH', status = 'AWAITING_APPROVAL', isSelected = false, count = 0, label = '' } = {}) {
  const sev = (severity || 'HIGH').toUpperCase();
  const key = `inc_${sev}_${status}_${+isSelected}_${count}_${label}`;
  if (iconCache.has(key)) return iconCache.get(key);

  const accent = SEVERITY_COLOR[sev] || '#EF4444';
  const speed = PULSE_SPEED[sev] || '1.0s';

  const isAwaiting = status === 'AWAITING_APPROVAL' || status === 'NEW';
  const isOnScene = status === 'ON_SCENE';
  const statusBadgeColor = isAwaiting ? '#F59E0B' : isOnScene ? '#EF4444' : '#1FA2FF';

  const html = `<div class="eoc-marker-wrapper" style="display:flex;flex-direction:column;align-items:center;pointer-events:none">
    <div style="position:relative;width:32px;height:32px;pointer-events:auto;cursor:pointer;filter:drop-shadow(0 3px 12px ${accent}77);">
      <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
        ${isSelected ? `<circle cx="16" cy="16" r="14" fill="none" stroke="#1FA2FF" stroke-width="1.6" stroke-dasharray="3,3"><animateTransform attributeName="transform" type="rotate" from="0 16 16" to="360 16 16" dur="8s" repeatCount="indefinite"/></circle>` : ''}
        <polygon points="16,28 3,6 29,6" fill="#101827" stroke="${accent}" stroke-width="2"/>
        <text x="16" y="20" text-anchor="middle" font-size="11" fill="${accent}">⚠</text>
        <!-- Top-left status badge (Amber dot = Awaiting, Blue dot = Approved/Dispatched, Red ring = On Scene) -->
        <circle cx="7" cy="6" r="4" fill="${statusBadgeColor}" stroke="#101827" stroke-width="1" ${isOnScene ? 'fill-opacity="0.3" stroke-width="1.5"' : ''}/>
        ${count > 1 ? `<circle cx="25" cy="6" r="5.5" fill="${accent}"/><text x="25" y="9" text-anchor="middle" font-size="7" font-weight="bold" fill="#060B14">${count}</text>` : ''}
      </svg>
      <div class="eoc-inc-pulse" style="position:absolute;inset:-6px;border-radius:50%;border:1.5px solid ${accent};animation:eocPulse ${speed} ease-out infinite;opacity:0.75;pointer-events:none;"></div>
    </div>
    ${labelHtml(label)}
  </div>`;

  const icon = make(html, 32, label ? 48 : 32, 16, label ? 41 : 32);
  iconCache.set(key, icon);
  return icon;
}

/* ─── 8. HAZMAT — Purple (#A855F7) Hazard Icon ─────────────────────────── */
export function getHazmatIcon({ isAlert = false, label = '' } = {}) {
  const key = `hazmat_${+isAlert}_${label}`;
  if (iconCache.has(key)) return iconCache.get(key);

  const accent = '#A855F7';
  const html = `<div class="eoc-marker-wrapper" style="display:flex;flex-direction:column;align-items:center;pointer-events:none">
    <div style="position:relative;width:28px;height:28px;pointer-events:auto;cursor:pointer;filter:drop-shadow(0 3px 8px ${accent}44);">
      <svg width="28" height="28" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg">
        <polygon points="8,2 20,2 26,8 26,20 20,26 8,26 2,20 2,8"
          fill="#101827" stroke="${accent}" stroke-width="1.6"/>
        <text x="14" y="19" text-anchor="middle" font-size="11" fill="${accent}">☣</text>
      </svg>
      ${isAlert ? `<div class="eoc-pulse-ring" style="position:absolute;inset:-4px;border-radius:50%;border:1.2px solid ${accent};animation:eocPulse 0.8s ease-out infinite;pointer-events:none;"></div>` : ''}
    </div>
    ${labelHtml(label)}
  </div>`;

  const icon = make(html, 28, label ? 44 : 28, 14, label ? 37 : 28);
  iconCache.set(key, icon);
  return icon;
}

/* ─── 9. WEATHER SENSOR — Sky Blue (#38BDF8) Rain Cloud ─────────────────── */
export function getWeatherSensorIcon({ isRaining = false, label = '' } = {}) {
  const key = `weather_${+isRaining}_${label}`;
  if (iconCache.has(key)) return iconCache.get(key);

  const accent = isRaining ? '#EF4444' : '#38BDF8';
  const html = `<div class="eoc-marker-wrapper" style="display:flex;flex-direction:column;align-items:center;pointer-events:none">
    <div style="position:relative;width:26px;height:26px;pointer-events:auto;cursor:pointer;filter:drop-shadow(0 3px 6px ${accent}44);">
      <svg width="26" height="26" viewBox="0 0 26 26" xmlns="http://www.w3.org/2000/svg">
        <circle cx="13" cy="13" r="12" fill="#101827" stroke="${accent}" stroke-width="1.5"/>
        <path d="M7,14 Q7,10 11,10 Q12,7 16,8 Q19,8 19,11 Q21,11 21,14 Q21,17 18,17 L8,17 Q7,17 7,14 Z" fill="none" stroke="${accent}" stroke-width="1.4"/>
      </svg>
      ${isRaining ? `<div class="eoc-pulse-ring" style="position:absolute;inset:-3px;border-radius:50%;border:1.2px solid ${accent};animation:eocPulse 1.5s ease-out infinite;pointer-events:none;"></div>` : ''}
    </div>
    ${labelHtml(label)}
  </div>`;

  const icon = make(html, 26, label ? 42 : 26, 13, label ? 35 : 26);
  iconCache.set(key, icon);
  return icon;
}

/* ─── 10. PARKS / ENVIRONMENTAL ─────────────────────────────────────────── */
export function getParksIcon({ label = '' } = {}) {
  const key = `parks_${label}`;
  if (iconCache.has(key)) return iconCache.get(key);

  const html = `<div class="eoc-marker-wrapper" style="display:flex;flex-direction:column;align-items:center;pointer-events:none">
    <div style="position:relative;width:24px;height:24px;pointer-events:auto;cursor:pointer;filter:drop-shadow(0 3px 6px rgba(0,0,0,0.5));">
      <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="11" fill="#101827" stroke="#22C55E" stroke-width="1.5"/>
        <text x="12" y="16" text-anchor="middle" font-size="10">🌳</text>
      </svg>
    </div>
    ${labelHtml(label)}
  </div>`;

  const icon = make(html, 24, label ? 38 : 24, 12, label ? 31 : 24);
  iconCache.set(key, icon);
  return icon;
}

/* ─── 11. CLUSTER PILL ───────────────────────────────────────────────────── */
const CAT_COLORS = { hospital: '#22C55E', fire: '#EF4444', police: '#1FA2FF', infrastructure: '#FBBF24', parks: '#22C55E' };
const CAT_EMOJI  = { hospital: '🏥', fire: '🚒', police: '🚓', infrastructure: '⚡', parks: '🌳' };

export function getClusterIcon({ category = 'hospital', count = 2 } = {}) {
  const key = `cluster_${category}_${count}`;
  if (iconCache.has(key)) return iconCache.get(key);

  const accent = CAT_COLORS[category] || '#64748B';
  const emoji  = CAT_EMOJI[category]  || '📍';

  const html = `<div style="
    display:flex;align-items:center;gap:4px;
    padding:4px 9px;border-radius:14px;
    background:rgba(16,24,39,0.95);border:1.5px solid ${accent};
    box-shadow:0 0 12px ${accent}44, 0 3px 8px rgba(0,0,0,0.5);
    font-size:10px;font-weight:700;color:${accent};
    font-family:'Inter', sans-serif;
    pointer-events:auto;cursor:pointer;white-space:nowrap;
    backdrop-filter:blur(6px);
  ">${emoji} <span>${count}</span></div>`;

  const icon = make(html, 66, 24, 33, 12);
  iconCache.set(key, icon);
  return icon;
}

/* ─── 12. SELECTION RING ─────────────────────────────────────────────────── */
export function getSelectionRingIcon() {
  const key = 'sel_ring';
  if (iconCache.has(key)) return iconCache.get(key);

  const html = `<div style="width:44px;height:44px;pointer-events:none">
    <svg width="44" height="44" viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg">
      <circle cx="22" cy="22" r="19" fill="none" stroke="#1FA2FF" stroke-width="1.8" stroke-dasharray="4,3">
        <animateTransform attributeName="transform" type="rotate"
          from="0 22 22" to="360 22 22" dur="8s" repeatCount="indefinite"/>
      </circle>
    </svg>
  </div>`;

  const icon = make(html, 44, 44, 22, 22);
  iconCache.set(key, icon);
  return icon;
}

/* ─── 13. RESPONDING TEAM FLOATING CHIP ──────────────────────────────────── */
export function getDispatchTicketIcon(unitName = '', eta = '') {
  let emoji = '🚨';
  let accent = '#1FA2FF';
  const nameLower = unitName.toLowerCase();
  if (nameLower.includes('police')) { emoji = '🚓'; accent = '#1FA2FF'; }
  else if (nameLower.includes('ambulance') || nameLower.includes('medical')) { emoji = '🚑'; accent = '#06B6D4'; }
  else if (nameLower.includes('fire') || nameLower.includes('hazmat')) { emoji = '🚒'; accent = '#EF4444'; }
  else if (nameLower.includes('power') || nameLower.includes('utility')) { emoji = '⚡'; accent = '#FBBF24'; }

  const html = `<div style="
    padding:3px 8px;border-radius:6px;
    background:rgba(6,11,20,0.95);border:1px solid ${accent};
    box-shadow:0 0 12px ${accent}66;
    font-size:10px;font-weight:700;color:${accent};
    font-family:'Inter',sans-serif;white-space:nowrap;
    animation:eocFadeOut 4s ease-out forwards;pointer-events:none;
    backdrop-filter:blur(8px);
  ">${emoji} ${unitName} Responding · ETA: ${eta}</div>`;

  return make(html, 220, 24, 110, 24);
}

/* ─── Icon cache utilities ───────────────────────────────────────────────── */
export const clearIconCache = () => iconCache.clear();
export const getIconCacheSize = () => iconCache.size;

export function getCustomIcon(emoji, color = '#1FA2FF', isPulse = false, isResolved = false, label = null, badgeCount = null) {
  const key = `legacy_${emoji}_${color}_${+isPulse}_${+isResolved}_${label || ''}_${badgeCount || ''}`;
  if (iconCache.has(key)) return iconCache.get(key);

  const html = `<div class="eoc-marker-wrapper" style="display:flex;flex-direction:column;align-items:center;gap:2px;pointer-events:none">
    <div style="position:relative;width:26px;height:26px;pointer-events:auto;cursor:pointer">
      <div style="
        width:26px;height:26px;border-radius:50%;
        background:${isResolved ? '#064E3B' : 'rgba(16,24,39,0.95)'};
        border:1.5px solid ${isResolved ? '#22C55E' : color};
        box-shadow:0 0 10px ${isResolved ? '#22C55E70' : color + '70'},0 2px 6px rgba(0,0,0,0.5);
        display:flex;align-items:center;justify-content:center;font-size:11px;cursor:pointer;
      ">${isResolved ? '✅' : emoji}</div>
      ${isPulse && !isResolved ? `<div style="position:absolute;inset:-4px;border-radius:50%;border:1.2px solid ${color};animation:leafletPulse 1.5s ease-out infinite;opacity:0.65;"></div>` : ''}
      ${badgeCount ? `<div style="position:absolute;top:-3px;right:-3px;min-width:14px;height:14px;padding:0 2px;border-radius:7px;background:${color};color:#060B14;font-size:8px;font-weight:800;display:flex;align-items:center;justify-content:center;border:1px solid #060B14;font-family:'Inter',sans-serif;">${badgeCount}</div>` : ''}
    </div>
    ${labelHtml(label || '')}
  </div>`;

  const icon = make(html, 60, label ? 42 : 26, 30, label ? 35 : 26);
  iconCache.set(key, icon);
  return icon;
}
