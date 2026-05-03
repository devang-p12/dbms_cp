import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../services/api';

const AddCustomer = () => {
    const navigate = useNavigate();
    const [msg, setMsg] = useState({ text: '', type: '' });
    const [createdCustomer, setCreatedCustomer] = useState(null);
    const [showPass, setShowPass] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const data = Object.fromEntries(fd.entries());

        // Validations
        if (data.pan_no && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(data.pan_no.toUpperCase())) {
            return setMsg({ text: 'Invalid PAN format. Expected: ABCDE1234F', type: 'danger' });
        }
        if (data.phone_no && !/^\d{10}$/.test(data.phone_no)) {
            return setMsg({ text: 'Phone number must be exactly 10 digits', type: 'danger' });
        }
        if (!data.username || data.username.length < 4) {
            return setMsg({ text: 'Username must be at least 4 characters', type: 'danger' });
        }
        if (!data.password || data.password.length < 6) {
            return setMsg({ text: 'Password must be at least 6 characters', type: 'danger' });
        }

        try {
            const res = await api.post('/customers', { ...data, pan_no: data.pan_no?.toUpperCase() });
            setCreatedCustomer({ ...res.data, username: data.username, password: data.password });
        } catch (err) {
            setMsg({ text: err.response?.data?.error || 'Registration failed', type: 'danger' });
        }
    };

    // ── Success screen ──────────────────────────────────────────────────────
    if (createdCustomer) {
        return (
            <>
                <Navbar active="customers" />
                <div className="page-wrapper">
                    <div className="container" style={{ maxWidth: '520px' }}>
                        <div style={{
                            background: 'white', borderRadius: '20px', padding: '50px 40px',
                            textAlign: 'center', boxShadow: '0 8px 40px rgba(0,34,68,0.10)',
                            border: '1px solid #EEF1F4'
                        }}>
                            <div style={{ fontSize: '4rem', marginBottom: '16px' }}>✅</div>
                            <h2 style={{ color: '#002244', marginBottom: '8px' }}>Customer Registered!</h2>
                            <p style={{ color: '#546E7A', marginBottom: '20px' }}>
                                Customer ID: <strong style={{ color: '#002244', fontSize: '1.2rem' }}>#{createdCustomer.id}</strong>
                            </p>

                            {/* Login credentials */}
                            <div style={{
                                background: '#f0f9ff', border: '1px dashed #00AEEF', borderRadius: '14px',
                                padding: '20px', marginBottom: '24px', textAlign: 'left'
                            }}>
                                <div style={{ fontWeight: 700, color: '#002244', marginBottom: '12px', fontSize: '0.9rem' }}>
                                    🔑 Login Credentials (share with customer)
                                </div>
                                {[
                                    ['Username', createdCustomer.username],
                                    ['Password', createdCustomer.password],
                                ].map(([k, v]) => (
                                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e0f0fb' }}>
                                        <span style={{ color: '#546E7A', fontSize: '0.85rem' }}>{k}</span>
                                        <span style={{ fontWeight: 700, color: '#002244', fontFamily: 'monospace', fontSize: '0.95rem' }}>{v}</span>
                                    </div>
                                ))}
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <button className="bc-btn bc-btn-primary bc-btn-full"
                                    onClick={() => navigate(`/create_account?cust_id=${createdCustomer.id}`)}>
                                    🏦 Open Account for this Customer →
                                </button>
                                <button className="bc-btn bc-btn-outline bc-btn-full"
                                    onClick={() => { setCreatedCustomer(null); setMsg({ text: '', type: '' }); }}>
                                    ➕ Register Another Customer
                                </button>
                                <Link to="/view_customers" className="bc-btn bc-btn-outline bc-btn-full">
                                    👥 View All Customers
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    // ── Form ────────────────────────────────────────────────────────────────
    return (
        <>
            <Navbar active="customers" />
            <div className="page-wrapper">
                <div className="container" style={{ maxWidth: '760px' }}>
                    <div className="page-header">
                        <div className="breadcrumb-row">
                            <Link to="/">Dashboard</Link> <span>›</span> <Link to="/view_customers">Customers</Link> <span>›</span> Add
                        </div>
                        <h1>Add New Customer</h1>
                        <div className="subtitle">Register customer details and set their login credentials</div>
                    </div>

                    {msg.text && <div className={`bc-alert bc-alert-${msg.type}`}>{msg.type === 'success' ? '✅ ' : '⚠️ '}{msg.text}</div>}

                    <form onSubmit={handleSubmit}>
                        {/* ── Section 1: Personal Info ─────────────────────── */}
                        <div className="bc-form-card" style={{ marginBottom: '20px' }}>
                            <h4 style={{ color: '#002244', marginBottom: '20px', fontWeight: 700, fontSize: '1rem' }}>
                                👤 Personal Information
                            </h4>
                            <div className="row g-4">
                                <div className="col-md-8">
                                    <label className="form-label">Full Name *</label>
                                    <input type="text" name="name" className="form-control" required placeholder="e.g. Rahul Sharma" />
                                </div>
                                <div className="col-md-4">
                                    <label className="form-label">Gender *</label>
                                    <select name="gender" className="form-select" required>
                                        <option value="">Select</option>
                                        <option>Male</option><option>Female</option><option>Other</option>
                                    </select>
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label">Date of Birth</label>
                                    <input type="date" name="dob" className="form-control" max={new Date().toISOString().split('T')[0]} />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label">PAN Number</label>
                                    <input type="text" name="pan_no" className="form-control" placeholder="ABCDE1234F" maxLength="10"
                                        style={{ textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 600 }}
                                        onChange={e => e.target.value = e.target.value.toUpperCase()} />
                                    <div className="form-text">Format: 5 letters + 4 digits + 1 letter</div>
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label">Email Address</label>
                                    <input type="email" name="mail_id" className="form-control" placeholder="rahul@email.com" />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label">Phone Number *</label>
                                    <input type="tel" name="phone_no" className="form-control" required placeholder="9876543210" maxLength="10" pattern="\d{10}" />
                                    <div className="form-text">10 digits, no spaces</div>
                                </div>
                                <div className="col-12">
                                    <label className="form-label">Address</label>
                                    <textarea name="address" className="form-control" rows="2" placeholder="123, MG Road, Mumbai — 400001"></textarea>
                                </div>
                            </div>
                        </div>

                        {/* ── Section 2: Login Credentials ─────────────────── */}
                        <div className="bc-form-card" style={{ marginBottom: '20px' }}>
                            <h4 style={{ color: '#002244', marginBottom: '8px', fontWeight: 700, fontSize: '1rem' }}>
                                🔑 Login Credentials
                            </h4>
                            <p style={{ color: '#546E7A', fontSize: '0.85rem', marginBottom: '20px' }}>
                                Leave blank to auto-generate credentials.
                            </p>
                            <div className="row g-4">
                                <div className="col-md-6">
                                    <label className="form-label">Username</label>
                                    <input type="text" name="username" className="form-control"
                                        placeholder="e.g. rahul2025" minLength="4"
                                        style={{ letterSpacing: '0.5px' }} />
                                    <div className="form-text">Min 4 characters, optional</div>
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label">Password</label>
                                    <div style={{ position: 'relative' }}>
                                        <input type={showPass ? 'text' : 'password'} name="password" className="form-control"
                                            placeholder="Set a custom password" minLength="6"
                                            style={{ paddingRight: '48px' }} />
                                        <button type="button" onClick={() => setShowPass(p => !p)}
                                            style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#546E7A', fontSize: '1rem' }}>
                                            {showPass ? '🙈' : '👁️'}
                                        </button>
                                    </div>
                                    <div className="form-text">Min 6 characters</div>
                                </div>
                            </div>
                        </div>

                        {/* ── Actions ───────────────────────────────────────── */}
                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                            <button type="submit" className="bc-btn bc-btn-primary">Register Customer →</button>
                            <button type="reset" className="bc-btn bc-btn-outline" onClick={() => setMsg({ text: '', type: '' })}>Clear Form</button>
                            <Link to="/view_customers" className="bc-btn bc-btn-outline ms-auto">View All Customers</Link>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
};
export default AddCustomer;
