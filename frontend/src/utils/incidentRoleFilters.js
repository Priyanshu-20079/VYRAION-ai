export function filterIncidentsForRole(incidents, viewRole) {
  if (!incidents || !Array.isArray(incidents)) return [];

  if (viewRole === 'operator') {
    return incidents.filter(i => i.status === 'AWAITING_APPROVAL' || i.status === 'APPROVED' || i.status === 'RESOLVED');
  }

  if (viewRole === 'authority') {
    const sevWeight = { 'CRITICAL': 3, 'HIGH': 2, 'ELEVATED': 1, 'LOW': 0 };
    return [...incidents].sort((a, b) => {
      const wa = sevWeight[a.severity] ?? -1;
      const wb = sevWeight[b.severity] ?? -1;
      return wb - wa;
    });
  }

  if (viewRole === 'hospital') {
    return incidents.filter(i => {
      const typeStr = (i.type || '').toLowerCase();
      const idStr = (i.id || '').toLowerCase();
      if (typeStr.includes('medical') || typeStr.includes('hospital') || idStr.includes('medical') || idStr.includes('hospital')) {
        return true;
      }
      if (Array.isArray(i.dispatchedUnits)) {
        return i.dispatchedUnits.some(u => (u.category || '').toLowerCase() === 'hospital');
      }
      return false;
    });
  }

  if (viewRole === 'reviewer') {
    return incidents.filter(i => i.status === 'AWAITING_APPROVAL' || i.status === 'APPROVED' || (i.priorities && i.priorities.length > 0));
  }

  if (viewRole === 'investigator') {
    return incidents.filter(i => i.status === 'RESOLVED' || i.status === 'REJECTED');
  }

  return incidents;
}

export function getFilterTabsForRole(viewRole) {
  switch (viewRole) {
    case 'operator':
      return [
        { id: 'all', label: 'Assigned (Active)' },
        { id: 'pending', label: 'Pending' },
        { id: 'resolved', label: 'Resolved' }
      ];
    case 'authority':
      return [
        { id: 'all', label: 'All Incidents' },
        { id: 'critical', label: 'Critical / High' }
      ];
    case 'hospital':
      return [
        { id: 'medical', label: 'Medical' },
        { id: 'assigned', label: 'Assigned' },
        { id: 'nearby', label: 'Nearby' }
      ];
    case 'investigator':
      return [
        { id: 'all', label: 'All Resolved' }
      ];
    case 'reviewer':
      return [
        { id: 'all', label: 'All Resolved' },
        { id: 'with-ai', label: 'AI Blueprints' }
      ];
    default:
      return [{ id: 'all', label: 'All' }];
  }
}

export function applySubFilter(incidents, viewRole, tabId) {
  if (viewRole === 'operator') {
    if (tabId === 'pending') return incidents.filter(i => i.status === 'AWAITING_APPROVAL');
    if (tabId === 'resolved') return incidents.filter(i => i.status === 'RESOLVED');
    // 'all' (Assigned/Active) falls through to this narrowing filter:
    return incidents.filter(i => i.status === 'AWAITING_APPROVAL' || i.status === 'APPROVED');
  }

  if (viewRole === 'authority') {
    if (tabId === 'critical') return incidents.filter(i => i.severity === 'CRITICAL' || i.severity === 'HIGH');
    return incidents;
  }

  if (viewRole === 'hospital') {
    // medical/assigned/nearby currently share the same result set
    return incidents;
  }

  if (viewRole === 'reviewer') {
    if (tabId === 'with-ai') return incidents.filter(i => i.priorities && i.priorities.length > 0);
    return incidents;
  }

  // investigator and any other role/tabId combination
  return incidents;
}
