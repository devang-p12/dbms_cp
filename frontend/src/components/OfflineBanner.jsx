/**
 * OfflineBanner.jsx
 * ─────────────────────────────────────────────────────────────────────────
 * Shows a dismissible amber banner when the app is running in offline /
 * demo mode (backend unreachable).  Listens for the custom browser event
 * 'finvault:offline' dispatched by api.js to auto-appear.
 * ─────────────────────────────────────────────────────────────────────────
 */
import React, { useState, useEffect } from 'react';
import { isOffline } from '../services/sessionStore';

const OfflineBanner = () => {
    const [visible, setVisible] = useState(isOffline());

    useEffect(() => {
        const show = () => setVisible(true);
        window.addEventListener('finvault:offline', show);
        return () => window.removeEventListener('finvault:offline', show);
    }, []);

    if (!visible) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 9999,
            background: 'linear-gradient(90deg, #f59e0b, #d97706)',
            color: 'white',
            padding: '10px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            fontSize: '0.87rem',
            fontWeight: 600,
            boxShadow: '0 2px 12px rgba(217,119,6,0.35)',
        }}>
            <span style={{ fontSize: '1.1rem' }}>🔌</span>
            <span>
                <strong>Demo Mode</strong> — Backend not connected. All data is stored in your browser session and resets on tab close.
            </span>
            <span style={{
                marginLeft: '8px',
                background: 'rgba(255,255,255,0.25)',
                borderRadius: '6px',
                padding: '2px 10px',
                fontSize: '0.78rem',
                fontWeight: 700,
                letterSpacing: '0.5px',
            }}>OFFLINE</span>
            <button
                onClick={() => setVisible(false)}
                style={{
                    marginLeft: 'auto',
                    background: 'none',
                    border: 'none',
                    color: 'white',
                    fontSize: '1.3rem',
                    cursor: 'pointer',
                    lineHeight: 1,
                    padding: '0 4px',
                }}
                title="Dismiss"
            >×</button>
        </div>
    );
};

export default OfflineBanner;
