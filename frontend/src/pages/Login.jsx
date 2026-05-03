import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { enableOffline, mockLogin, isOffline } from '../services/sessionStore';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [info, setInfo] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await api.post('/login', { username, password });
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    // Quick demo login (forces offline / session-storage mode)
    const handleDemoLogin = (demoUsername, demoPassword) => {
        setError('');
        try {
            enableOffline();
            mockLogin({ username: demoUsername, password: demoPassword });
            window.dispatchEvent(new CustomEvent('finvault:offline'));
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.error || 'Demo login failed');
        }
    };

    const fillDemo = (user, pass) => {
        setUsername(user);
        setPassword(pass);
    };

    return (
        <div style={{ padding: 0, background: 'none' }}>
            <style>
                {`
                body { padding:0; background:none; font-family:'Inter',sans-serif; }
                .login-right h2 { font-family:'Space Grotesk',sans-serif; color:#002244; }
                .role-hint { display:flex; gap:.5rem; margin-bottom:1.2rem; flex-wrap:wrap; }
                .role-pill { font-size:.72rem; padding:.3em .75em; border-radius:20px; border:1px solid #dde; cursor:pointer; font-weight:600; transition:all .15s; color:#546E7A; background:#f0f4f8; }
                .role-pill.active-customer  { background:#e0f2fe; border-color:#0090C8; color:#0070a0; }
                .role-pill.active-employee  { background:#f3e8ff; border-color:#7c3aed; color:#5b21b6; }
                .role-pill.active-admin     { background:#fef3c7; border-color:#d97706; color:#92400e; }
                .info-msg { background:#e0f2fe; border:1px solid #0090C844; border-radius:8px; color:#0070a0; padding:.7rem 1rem; font-size:.82rem; margin-bottom:1rem; }
                `}
            </style>
            
            <div className="login-page">
                {/* Left branding panel */}
                <div className="login-left">
                    <div style={{ maxWidth: '420px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '52px' }}>
                            <svg width="44" height="44" viewBox="0 0 36 36" fill="none">
                                <path d="M18 4C18 4 8 10 8 20C8 26 12 30 18 32C24 30 28 26 28 20C28 10 18 4 18 4Z" fill="#00AEEF" opacity="0.9" />
                                <path d="M18 4L10 14L13 16L11 22L18 20L25 22L23 16L26 14L18 4Z" fill="white" opacity="0.85" />
                            </svg>
                            <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '1.8rem', fontWeight: 700, color: 'white', letterSpacing: '0.5px' }}>
                                FinVault<span style={{ color: '#00AEEF' }}>.</span>
                            </span>
                        </div>

                        <div style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#00AEEF', marginBottom: '16px' }}>
                            Banking & HCM Management System
                        </div>
                        <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '3rem', fontWeight: 700, lineHeight: 1.1, marginBottom: '20px' }}>
                            Manage your<br /><span style={{ color: '#00AEEF' }}>finances</span><br />with confidence.
                        </h1>
                        <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.95rem', lineHeight: 1.7, maxWidth: '360px' }}>
                            A complete role-based banking management platform — secure, audited, and concurrency-safe.
                        </p>

                        <div style={{ marginTop: '48px', paddingTop: '32px', borderTop: '1px solid rgba(255,255,255,0.12)' }}>
                            <div style={{ display: 'flex', gap: '32px' }}>
                                <div>
                                    <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'white' }}>16</div>
                                    <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)' }}>Database Tables</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'white' }}>3</div>
                                    <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)' }}>User Roles</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'white' }}>100%</div>
                                    <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)' }}>BCrypt Secured</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right form panel */}
                <div className="login-right">
                    <div style={{ maxWidth: '380px', width: '100%' }}>
                        <h2 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '6px' }}>Welcome back</h2>
                        <p style={{ color: '#546E7A', fontSize: '0.9rem', marginBottom: '20px' }}>Sign in to your FinVault account</p>

                        {/* Role hints */}
                        <div className="role-hint" id="roleHints">
                            <span className="role-pill active-customer" onClick={() => fillDemo('arjun.sharma', 'password123')}>👤 Customer</span>
                            <span className="role-pill active-employee" onClick={() => fillDemo('kavya.nair', 'password123')}>🧑‍💼 Employee</span>
                            <span className="role-pill active-admin" onClick={() => fillDemo('admin', 'password123')}>⚙ Admin</span>
                        </div>

                        {/* Alert box for error/success/info messages */}
                        <div id="alertBox">
                            {error && <div className="bc-alert bc-alert-danger" style={{ marginBottom: '1rem' }}>⚠ {error}</div>}
                            {info && <div className="bc-alert bc-alert-success" style={{ marginBottom: '1rem' }}>ℹ {info}</div>}
                        </div>

                        <form onSubmit={handleLogin} id="loginForm">
                            <div style={{ marginBottom: '20px' }}>
                                <label className="form-label">Username</label>
                                <input type="text" name="username" className="form-control"
                                    placeholder="Enter username" required value={username} onChange={e => setUsername(e.target.value)}
                                    style={{ height: '48px', fontSize: '1rem' }} />
                            </div>
                            <div style={{ marginBottom: '28px' }}>
                                <label className="form-label">Password</label>
                                <input type="password" name="password" className="form-control"
                                    placeholder="••••••••" required value={password} onChange={e => setPassword(e.target.value)}
                                    style={{ height: '48px', fontSize: '1rem' }} />
                            </div>

                            <button type="submit" disabled={loading} className="bc-btn bc-btn-primary bc-btn-full bc-btn-lg"
                                style={{ marginBottom: '16px' }}>
                                {loading ? 'Signing in…' : 'Sign In →'}
                            </button>

                            <p style={{ fontSize: '0.78rem', color: '#9BA8B3', textAlign: 'center', lineHeight: 1.5 }}>
                                Click a role above to auto-fill demo credentials.
                            </p>
                        </form>

                        {/* ── Demo / Offline Mode ── */}
                        <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #EEF1F4' }}>
                            <p style={{ fontSize: '0.78rem', color: '#9BA8B3', textAlign: 'center', marginBottom: '12px' }}>
                                🔌 Backend unavailable? Use <strong>Demo Mode</strong> — runs entirely in your browser.
                            </p>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
                                <button
                                    type="button"
                                    onClick={() => handleDemoLogin('arjun.sharma', 'password123')}
                                    style={{ fontSize: '0.75rem', padding: '6px 14px', borderRadius: '20px', border: '1.5px solid #0090C8', background: '#e0f2fe', color: '#0070a0', cursor: 'pointer', fontWeight: 600 }}
                                >👤 Demo Customer</button>
                                <button
                                    type="button"
                                    onClick={() => handleDemoLogin('kavya.nair', 'password123')}
                                    style={{ fontSize: '0.75rem', padding: '6px 14px', borderRadius: '20px', border: '1.5px solid #7c3aed', background: '#f3e8ff', color: '#5b21b6', cursor: 'pointer', fontWeight: 600 }}
                                >🧑‍💼 Demo Employee</button>
                                <button
                                    type="button"
                                    onClick={() => handleDemoLogin('admin', 'password123')}
                                    style={{ fontSize: '0.75rem', padding: '6px 14px', borderRadius: '20px', border: '1.5px solid #d97706', background: '#fef3c7', color: '#92400e', cursor: 'pointer', fontWeight: 600 }}
                                >⚙ Demo Admin</button>
                            </div>
                        </div>
                    </div>

                    <div style={{ marginTop: 'auto', paddingTop: '32px' }}>
                        <p style={{ fontSize: '0.75rem', color: '#9BA8B3' }}>
                            © 2024 FinVault Banking Management System — College Project
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
