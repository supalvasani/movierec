import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

let addToastGlobal = null;

export const toast = {
    success: (msg) => addToastGlobal?.({ msg, type: 'success' }),
    info: (msg) => addToastGlobal?.({ msg, type: 'info' }),
    error: (msg) => addToastGlobal?.({ msg, type: 'error' }),
};

const COLORS = {
    success: { bg: '#10b981', border: 'rgba(16,185,129,0.3)' },
    info:    { bg: '#6366f1', border: 'rgba(99,102,241,0.3)' },
    error:   { bg: '#ef4444', border: 'rgba(239,68,68,0.3)'  },
};

const ToastItem = ({ id, msg, type, onRemove }) => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        requestAnimationFrame(() => setVisible(true));
        const t = setTimeout(() => {
            setVisible(false);
            setTimeout(() => onRemove(id), 300);
        }, 3200);
        return () => clearTimeout(t);
    }, [id, onRemove]);

    const c = COLORS[type] || COLORS.info;

    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                background: '#18181b',
                border: `1px solid ${c.border}`,
                borderLeft: `3px solid ${c.bg}`,
                borderRadius: 8,
                padding: '12px 16px',
                fontSize: 13,
                fontWeight: 500,
                color: '#f4f4f5',
                boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                transform: visible ? 'translateY(0)' : 'translateY(16px)',
                opacity: visible ? 1 : 0,
                transition: 'transform 0.3s cubic-bezier(0.16,1,0.3,1), opacity 0.3s ease',
                cursor: 'pointer',
                userSelect: 'none',
            }}
            onClick={() => {
                setVisible(false);
                setTimeout(() => onRemove(id), 300);
            }}
        >
            <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: c.bg, flexShrink: 0,
            }} />
            {msg}
        </div>
    );
};

const ToastContainer = () => {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback(({ msg, type }) => {
        const id = Date.now() + Math.random();
        setToasts((prev) => [...prev.slice(-4), { id, msg, type }]);
    }, []);

    useEffect(() => {
        addToastGlobal = addToast;
        return () => { addToastGlobal = null; };
    }, [addToast]);

    const remove = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    if (toasts.length === 0) return null;

    return createPortal(
        <div style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
        }}>
            {toasts.map((t) => (
                <ToastItem key={t.id} {...t} onRemove={remove} />
            ))}
        </div>,
        document.body
    );
};

export default ToastContainer;
