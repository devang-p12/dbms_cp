import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../services/api';

const CreateUser = () => {
    const [msg, setMsg] = useState({ text: '', type: '' });
    const [loading, setLoading] = useState(false);
    const [showPass, setShowPass] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const fd = new FormData(e.target);
        const data = Object.fromEntries(fd.entries());

        try {
            await api.post('/users', data);
            setMsg({ text: 'User created successfully!', type: 'success' });
            e.target.reset();
        } catch (err) {
            setMsg({ text: err.response?.data?.error || 'Failed to create user', type: 'danger' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Navbar active="admin" />
            <div className="page-wrapper">
                <div className="container" style={{ maxWidth: '600px' }}>
                    <div className="page-header">
                        <div className="breadcrumb-row">
                            <Link to="/">Dashboard</Link> <span>›</span> Admin <span>›</span> Create User
                        </div>
                        <h1>System User Management</h1>
                        <div className="subtitle">Create internal administrative or staff accounts</div>
                    </div>

                    {msg.text && <div className={`bc-alert bc-alert-${msg.type}`}>{msg.type === 'success' ? '✅ ' : '⚠️ '}{msg.text}</div>}

                    <div className="bc-form-card">
                        <form onSubmit={handleSubmit}>
                            <div className="mb-4">
                                <label className="form-label">Username *</label>
                                <input type="text" name="username" className="form-control" required placeholder="e.g. admin_backup" />
                                <div className="form-text">Unique identifier for system login</div>
                            </div>

                            <div className="mb-4">
                                <label className="form-label">Password *</label>
                                <div style={{ position: 'relative' }}>
                                    <input type={showPass ? 'text' : 'password'} name="password" className="form-control" required placeholder="••••••••" minLength="6" />
                                    <button type="button" onClick={() => setShowPass(!showPass)}
                                        style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#546E7A' }}>
                                        {showPass ? '🙈' : '👁️'}
                                    </button>
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="form-label">System Role *</label>
                                <select name="role" className="form-select" required>
                                    <option value="">Select Role</option>
                                    <option value="ADMIN">ADMIN (Full System Access)</option>
                                    <option value="EMPLOYEE">EMPLOYEE (Staff Access)</option>
                                    <option value="CUSTOMER">CUSTOMER (Standard User)</option>
                                </select>
                            </div>

                            <div className="mb-4">
                                <label className="form-label">Entity ID (Optional)</label>
                                <input type="number" name="entity_id" className="form-control" placeholder="e.g. 101" />
                                <div className="form-text">Associate with an existing Employee or Customer ID</div>
                            </div>

                            <button type="submit" className="bc-btn bc-btn-primary bc-btn-full" disabled={loading}>
                                {loading ? 'Creating User...' : 'Create System User →'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
};

export default CreateUser;
