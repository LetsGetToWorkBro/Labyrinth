/**
 * WidgetRearrange — iPhone-style edit-mode widget reorder & hide system.
 *
 * Usage on HomePage:
 *   const { editMode, order, hidden, ... } = useWidgetLayout(defaultOrder);
 *   <WidgetRearrangeContainer ...>
 *     {orderedWidgetDefs.map(def => (
 *       <WidgetSlot key={def.id} id={def.id} ...>{def.render()}</WidgetSlot>
 *     ))}
 *   </WidgetRearrangeContainer>
 *
 * State persists to localStorage under `lbjj_widget_layout` as
 *   { order: string[], hidden: string[] }
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const STORAGE_KEY = 'lbjj_widget_layout';
const LONG_PRESS_MS = 3000;

export interface WidgetDef {
  id: string;
  label: string;
  icon?: React.ReactNode;
  render: () => React.ReactNode;
  available?: boolean;
}

interface LayoutState {
  order: string[];
  hidden: string[];
}

function readLayout(): LayoutState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { order: [], hidden: [] };
    const parsed = JSON.parse(raw);
    return {
      order: Array.isArray(parsed?.order) ? parsed.order : [],
      hidden: Array.isArray(parsed?.hidden) ? parsed.hidden : [],
    };
  } catch {
    return { order: [], hidden: [] };
  }
}

function writeLayout(state: LayoutState) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* storage full */ }
}

export function useWidgetLayout(defaults: WidgetDef[]) {
  const [state, setState] = useState<LayoutState>(() => readLayout());
  const [editMode, setEditMode] = useState(false);

  useEffect(() => { writeLayout(state); }, [state]);

  // Reconcile order: every defined widget appears exactly once, preferring stored order, appending new ones at the end.
  const orderedIds = useMemo(() => {
    const allIds = defaults.map(d => d.id);
    const stored = state.order.filter(id => allIds.includes(id));
    const missing = allIds.filter(id => !stored.includes(id));
    return [...stored, ...missing];
  }, [defaults, state.order]);

  const visibleDefs = useMemo(() => {
    const byId = new Map(defaults.map(d => [d.id, d] as const));
    return orderedIds
      .map(id => byId.get(id))
      .filter((d): d is WidgetDef => !!d && d.available !== false && !state.hidden.includes(d.id));
  }, [defaults, orderedIds, state.hidden]);

  const hiddenDefs = useMemo(() => {
    const byId = new Map(defaults.map(d => [d.id, d] as const));
    return state.hidden
      .map(id => byId.get(id))
      .filter((d): d is WidgetDef => !!d && d.available !== false);
  }, [defaults, state.hidden]);

  const hide = useCallback((id: string) => {
    setState(prev => ({
      order: prev.order.length ? prev.order : defaults.map(d => d.id),
      hidden: prev.hidden.includes(id) ? prev.hidden : [...prev.hidden, id],
    }));
  }, [defaults]);

  const show = useCallback((id: string) => {
    setState(prev => ({ ...prev, hidden: prev.hidden.filter(h => h !== id) }));
  }, []);

  const moveBefore = useCallback((draggedId: string, targetId: string, position: 'above' | 'below') => {
    setState(prev => {
      const base = prev.order.length ? prev.order : defaults.map(d => d.id);
      const allIds = defaults.map(d => d.id);
      let next = base.filter(id => allIds.includes(id));
      for (const id of allIds) if (!next.includes(id)) next.push(id);
      next = next.filter(id => id !== draggedId);
      const targetIdx = next.indexOf(targetId);
      if (targetIdx === -1) {
        next.push(draggedId);
      } else {
        const insertIdx = position === 'above' ? targetIdx : targetIdx + 1;
        next.splice(insertIdx, 0, draggedId);
      }
      return { ...prev, order: next };
    });
  }, [defaults]);

  return {
    editMode,
    setEditMode,
    visibleDefs,
    hiddenDefs,
    hide,
    show,
    moveBefore,
  };
}

/* ──────────────── Container ──────────────── */

interface ContainerProps {
  editMode: boolean;
  onExitEdit: () => void;
  onEnterEdit: () => void;
  children: React.ReactNode;
  hiddenDefs: WidgetDef[];
  onShow: (id: string) => void;
}

/** Wraps the list of widgets. Long-press to enter edit mode, shows Done button + hidden tray. */
export function WidgetRearrangeContainer({
  editMode,
  onExitEdit,
  onEnterEdit,
  children,
  hiddenDefs,
  onShow,
}: ContainerProps) {
  // Long-press detection — 3s hold anywhere inside the widget list
  const pressTimer = useRef<number | null>(null);
  const pressStart = useRef<{ x: number; y: number } | null>(null);

  const startPress = useCallback((clientX: number, clientY: number) => {
    if (editMode) return;
    pressStart.current = { x: clientX, y: clientY };
    if (pressTimer.current) window.clearTimeout(pressTimer.current);
    pressTimer.current = window.setTimeout(() => {
      try { if ('vibrate' in navigator) navigator.vibrate?.(35); } catch { /* no-op */ }
      onEnterEdit();
      pressTimer.current = null;
    }, LONG_PRESS_MS);
  }, [editMode, onEnterEdit]);

  const cancelPress = useCallback(() => {
    if (pressTimer.current) { window.clearTimeout(pressTimer.current); pressTimer.current = null; }
    pressStart.current = null;
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!pressStart.current) return;
    const t = e.touches[0];
    const dx = Math.abs(t.clientX - pressStart.current.x);
    const dy = Math.abs(t.clientY - pressStart.current.y);
    if (dx > 10 || dy > 10) cancelPress();
  }, [cancelPress]);

  return (
    <>
      {editMode && <div className="widget-edit-backdrop" aria-hidden />}
      {editMode && createPortal(
        <button
          type="button"
          className="widget-done-btn"
          onClick={onExitEdit}
          aria-label="Exit edit mode"
        >
          Done
        </button>,
        document.body
      )}
      <div
        onTouchStart={e => startPress(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchEnd={cancelPress}
        onTouchCancel={cancelPress}
        onTouchMove={onTouchMove}
        onMouseDown={e => startPress(e.clientX, e.clientY)}
        onMouseUp={cancelPress}
        onMouseLeave={cancelPress}
        style={{ position: 'relative', zIndex: editMode ? 10 : 'auto' }}
      >
        {children}
      </div>
      {editMode && hiddenDefs.length > 0 && (
        <div className="widget-hidden-tray">
          <div className="widget-hidden-tray-title">Hidden widgets</div>
          <div style={{ display: 'flex', flexWrap: 'wrap' }}>
            {hiddenDefs.map(def => (
              <button
                key={def.id}
                type="button"
                className="widget-hidden-chip"
                onClick={() => onShow(def.id)}
                aria-label={`Restore ${def.label} widget`}
              >
                <span className="plus-orb" aria-hidden>+</span>
                {def.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

/* ──────────────── Slot ──────────────── */

interface SlotProps {
  id: string;
  label: string;
  editMode: boolean;
  onHide: (id: string) => void;
  onDropOn: (draggedId: string, targetId: string, position: 'above' | 'below') => void;
  children: React.ReactNode;
}

/** Individual widget wrapper — handles wiggle, hide badge, drag/drop indicators. */
export function WidgetSlot({ id, label, editMode, onHide, onDropOn, children }: SlotProps) {
  const [dropIndicator, setDropIndicator] = useState<'above' | 'below' | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = useCallback((e: React.DragEvent) => {
    if (!editMode) { e.preventDefault(); return; }
    e.dataTransfer.setData('application/x-lbj-widget', id);
    e.dataTransfer.effectAllowed = 'move';
    setIsDragging(true);
  }, [editMode, id]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    setDropIndicator(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (!editMode) return;
    const dragged = e.dataTransfer.types.includes('application/x-lbj-widget');
    if (!dragged) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    setDropIndicator(e.clientY < midY ? 'above' : 'below');
  }, [editMode]);

  const handleDragLeave = useCallback(() => {
    setDropIndicator(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    if (!editMode) return;
    const draggedId = e.dataTransfer.getData('application/x-lbj-widget');
    const pos = dropIndicator || 'below';
    setDropIndicator(null);
    if (draggedId && draggedId !== id) {
      onDropOn(draggedId, id, pos);
    }
  }, [dropIndicator, editMode, id, onDropOn]);

  const classes = [
    'widget-rearrange-wrap',
    editMode ? 'widget-editing' : '',
    isDragging ? 'is-dragging' : '',
    dropIndicator === 'above' ? 'drop-above' : '',
    dropIndicator === 'below' ? 'drop-below' : '',
  ].filter(Boolean).join(' ');

  return (
    <div
      className={classes}
      draggable={editMode}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      data-widget-id={id}
    >
      {editMode && (
        <button
          type="button"
          className="widget-hide-badge"
          onClick={(ev) => { ev.stopPropagation(); onHide(id); }}
          aria-label={`Hide ${label} widget`}
        >
          ✕
        </button>
      )}
      {children}
    </div>
  );
}

/* ──────────────── Customize button ──────────────── */

export function WidgetCustomizeButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      className="widget-customize-btn"
      onClick={onClick}
      aria-label="Customize home widgets"
      title="Customize widgets"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <line x1="4" y1="6" x2="13" y2="6" />
        <line x1="17" y1="6" x2="20" y2="6" />
        <line x1="4" y1="12" x2="7" y2="12" />
        <line x1="11" y1="12" x2="20" y2="12" />
        <line x1="4" y1="18" x2="15" y2="18" />
        <line x1="19" y1="18" x2="20" y2="18" />
        <circle cx="15" cy="6" r="2" />
        <circle cx="9" cy="12" r="2" />
        <circle cx="17" cy="18" r="2" />
      </svg>
    </button>
  );
}
