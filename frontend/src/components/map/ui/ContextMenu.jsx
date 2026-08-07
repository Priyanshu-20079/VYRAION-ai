/**
 * ContextMenu.jsx
 * Right-click (desktop) / long-press (touch, ~500ms) floating context menu.
 * Positioned at cursor coordinates, auto-dismissed on outside click.
 */
import React, { useEffect, useRef } from 'react';
import { Eye, AlertTriangle, XCircle, Users, CornerDownLeft } from 'lucide-react';

const MENU_ITEMS = {
  incident: [
    { id: 'view', label: 'View Details', icon: Eye },
    { id: 'escalate', label: 'Escalate Severity', icon: AlertTriangle },
    { id: 'false_alarm', label: 'Mark False Alarm', icon: XCircle },
  ],
  station: [
    { id: 'roster', label: 'View Roster', icon: Users },
  ],
  vehicle: [
    { id: 'recall', label: 'Recall to Station', icon: CornerDownLeft },
    { id: 'view', label: 'View Details', icon: Eye },
  ],
};

export default function ContextMenu({
  menu,    // { x, y, entityType, entityId } | null
  onClose,
  onAction, // (entityType, entityId, actionId) => void
}) {
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menu) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [menu, onClose]);

  // Close on Escape
  useEffect(() => {
    if (!menu) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [menu, onClose]);

  if (!menu) return null;

  const items = MENU_ITEMS[menu.entityType] || [];
  if (items.length === 0) return null;

  return (
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        left: menu.x,
        top: menu.y,
        zIndex: 9999,
        minWidth: 170,
        background: 'rgba(6,9,20,0.97)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 10,
        boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
        overflow: 'hidden',
        animation: 'eocFadeIn 0.12s ease-out',
      }}
    >
      {items.map((item, i) => {
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            onClick={() => { onAction(menu.entityType, menu.entityId, item.id); onClose(); }}
            style={{
              width: '100%',
              padding: '8px 12px',
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'none', border: 'none',
              borderBottom: i < items.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
              color: item.id === 'false_alarm' ? '#EF4444' : '#E2E8F0',
              fontSize: 11, fontFamily: 'monospace', fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.1s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
          >
            <Icon size={13} />
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
