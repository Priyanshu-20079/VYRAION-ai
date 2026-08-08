/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ROLE-AWARE INCIDENT FILTERING (FRONTEND SOURCE OF TRUTH)
 * MUST REMAIN IN SYNC WITH backend/src/routes/incident.routes.js (applyServerRoleFilter)
 *
 * Supported Roles (7):
 * 1. operator     : Incidents awaiting or under dispatch (AWAITING_APPROVAL, APPROVED, RESOLVED)
 * 2. authority    : All incidents, sorted by severity
 * 3. hospital     : Incidents involving medical/hospital response (category===hospital or type medical/hospital)
 * 4. investigator : Resolved and rejected incidents only (RESOLVED, REJECTED)
 * 5. reviewer     : Incidents with AI-generated response blueprints (AWAITING_APPROVAL, APPROVED, priorities)
 * 6. admin        : Full unrestricted incident visibility (sorted by severity)
 * 7. user         : Active, non-resolved incidents (excludes RESOLVED, REJECTED)
 * ═══════════════════════════════════════════════════════════════════════════
 */

export const ROLE_LABELS = {
  operator: 'Operator',
  authority: 'Authority',
  hospital: 'Hospital',
  investigator: 'Investigator',
  reviewer: 'Reviewer',
  admin: 'Admin',
  user: 'Citizen User',
};

export const ROLE_DESCRIPTIONS = {
  operator: 'Incidents awaiting or under your dispatch',
  authority: 'All incidents, sorted by severity',
  hospital: 'Incidents involving medical/hospital response',
  investigator: 'Resolved and rejected incidents only',
  reviewer: 'Incidents with AI-generated response blueprints',
  admin: 'Full unrestricted incident visibility',
  user: 'Active, non-resolved incidents',
};

export function isHospitalIncident(i) {
  if (!i) return false;

  const typeStr = String(i.type || i.name || i.id || '').toLowerCase();
  const catStr = String(i.category || '').toLowerCase();

  // 1. Incident defined type/category match
  if (
    typeStr.match(/medical|hospital|ambulance|injury|casualty|patient/) ||
    catStr.match(/medical|hospital/)
  ) {
    return true;
  }

  // 2. Dispatched units match
  if (Array.isArray(i.dispatchedUnits)) {
    return i.dispatchedUnits.some((u) => {
      const uCat = String(u.category || '').toLowerCase();
      const uType = String(u.type || '').toLowerCase();
      const uName = String(u.name || '').toLowerCase();
      const uIcon = String(u.icon || '');
      return (
        uCat === 'hospital' ||
        uCat === 'medical' ||
        uType.includes('ambulance') ||
        uType.includes('medical') ||
        uName.includes('ambulance') ||
        uIcon.includes('🚑')
      );
    });
  }

  return false;
}

export function filterIncidentsForRole(incidents, viewRole) {
  if (!incidents || !Array.isArray(incidents)) return [];

  const role = viewRole || 'authority';

  if (role === 'operator') {
    return incidents.filter(
      (i) => i.status === 'AWAITING_APPROVAL' || i.status === 'APPROVED' || i.status === 'RESOLVED'
    );
  }

  if (role === 'authority') {
    const sevWeight = { CRITICAL: 3, HIGH: 2, ELEVATED: 1, LOW: 0 };
    return [...incidents].sort((a, b) => {
      const wa = sevWeight[a.severity] ?? -1;
      const wb = sevWeight[b.severity] ?? -1;
      return wb - wa;
    });
  }

  if (role === 'hospital') {
    return incidents.filter(isHospitalIncident);
  }

  if (role === 'reviewer') {
    return incidents.filter(
      (i) =>
        i.status === 'AWAITING_APPROVAL' ||
        i.status === 'APPROVED' ||
        (i.priorities && i.priorities.length > 0)
    );
  }

  if (role === 'investigator') {
    return incidents.filter((i) => i.status === 'RESOLVED' || i.status === 'REJECTED');
  }

  if (role === 'admin') {
    const sevWeight = { CRITICAL: 3, HIGH: 2, ELEVATED: 1, LOW: 0 };
    return [...incidents].sort((a, b) => {
      const wa = sevWeight[a.severity] ?? -1;
      const wb = sevWeight[b.severity] ?? -1;
      return wb - wa;
    });
  }

  if (role === 'user') {
    return incidents.filter((i) => i.status !== 'RESOLVED' && i.status !== 'REJECTED');
  }

  return incidents;
}

export function getFilterTabsForRole(viewRole) {
  switch (viewRole) {
    case 'operator':
      return [
        { id: 'all', label: 'Assigned (Active)' },
        { id: 'pending', label: 'Pending' },
        { id: 'resolved', label: 'Resolved' },
      ];
    case 'authority':
      return [
        { id: 'all', label: 'All Incidents' },
        { id: 'critical', label: 'Critical / High' },
      ];
    case 'hospital':
      return [
        { id: 'medical', label: 'Medical' },
        { id: 'assigned', label: 'Assigned' },
        { id: 'nearby', label: 'Nearby' },
      ];
    case 'investigator':
      return [{ id: 'all', label: 'All Resolved' }];
    case 'reviewer':
      return [
        { id: 'all', label: 'All Reviewable' },
        { id: 'with-ai', label: 'AI Blueprints' },
      ];
    case 'admin':
      return [
        { id: 'all', label: 'All System Incidents' },
        { id: 'critical', label: 'Critical / High' },
      ];
    case 'user':
      return [{ id: 'all', label: 'Active Alerts' }];
    default:
      return [{ id: 'all', label: 'All' }];
  }
}

export function applySubFilter(incidents, viewRole, tabId) {
  if (viewRole === 'operator') {
    if (tabId === 'pending') return incidents.filter((i) => i.status === 'AWAITING_APPROVAL');
    if (tabId === 'resolved') return incidents.filter((i) => i.status === 'RESOLVED');
    return incidents.filter((i) => i.status === 'AWAITING_APPROVAL' || i.status === 'APPROVED');
  }

  if (viewRole === 'authority' || viewRole === 'admin') {
    if (tabId === 'critical') return incidents.filter((i) => i.severity === 'CRITICAL' || i.severity === 'HIGH');
    return incidents;
  }

  if (viewRole === 'hospital') {
    return incidents;
  }

  if (viewRole === 'reviewer') {
    if (tabId === 'with-ai') return incidents.filter((i) => i.priorities && i.priorities.length > 0);
    return incidents;
  }

  if (viewRole === 'user') {
    return incidents.filter((i) => i.status !== 'RESOLVED' && i.status !== 'REJECTED');
  }

  return incidents;
}
