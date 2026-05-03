import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../services/api';

const AddEmployee = () => {
    const navigate = useNavigate();
    const [msg, setMsg] = useState({ text: '', type: '' });
    const [createdEmployee, setCreatedEmployee] = useState(null);
    const [showPass, setShowPass] = useState(false);
    const [branches, setBranches] = useState([]);
    const [loadingBranches, setLoadingBranches] = useState(true);

    useEffect(() => {
        // We'll need a route to fetch branches, or we can use a hardcoded list if the API doesn't exist yet.
        // Based on the schema, bank_branch table exists.
        api.get('/accounts/branches') // Assuming this route exists to fetch branches
            .then(res => setBranches(res.data))
            .catch(() => {
                // Fallback to hardcoded branches if API fails
                setBranches([
                    { branch_id: 1, city: 'Mumbai' },
                    { branch_id: 2, city: 'Delhi' },
                    { branch_id: 3, city: 'Bangalore' }
                ]);
            })
            .finally(() => setLoadingBranches(false));
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const data = Object.fromEntries(fd.entries());

        // Validations
        if (!data.username || data.username.length < 4) {
            return setMsg({ text: 'Username must be at least 4 characters', type: 'danger' });
        }
        if (!data.password || data.password.length < 6) {
            return setMsg({ text: 'Password must be at least 6 characters', type: 'danger' });
        }
        if (!data.branch_id) {
            return setMsg({ text: 'Please select a branch', type: 'danger' });
        }

        try {
            const res = await api.post('/employees', data);
            setCreatedEmployee({ ...res.data, username: data.username, password: data.password, name: data.name });
        } catch (err) {
            setMsg({ text: err.response?.data?.error || 'Registration failed', type: 'danger' });
        }
    };

    if (createdEmployee) {
        return (
            <>
                <Navbar active="people" />
                <div className="page-wrapper">
                    <div className="container" style={{ maxWidth: '520px' }}>
                        <div style={{
                            background: 'white', borderRadius: '20px', padding: '50px 40px',
                            textAlign: 'center', boxShadow: '0 8px 40px rgba(0,34,68,0.10)',
                            border: '1px solid #EEF1F4'
                        }}>
                            <div style={{ fontSize: '4rem', marginBottom: '16px' }}>✅</div>
                            <h2 style={{ color: '#002244', marginBottom: '8px' }}>Employee Registered!</h2>
                            <p style={{ color: '#546E7A', marginBottom: '20px' }}>
                                Employee ID: <strong style={{ color: '#002244', fontSize: '1.2rem' }}>#{createdEmployee.emp_id}</strong>
                            </p>

                            <div style={{
                                background: '#f0f9ff', border: '1px dashed #00AEEF', borderRadius: '14px',
                                padding: '20px', marginBottom: '24px', textAlign: 'left'
                            }}>
                                <div style={{ fontWeight: 700, color: '#002244', marginBottom: '12px', fontSize: '0.9rem' }}>
                                    🔑 Login Credentials
                                </div>
                                {[
                                    ['Username', createdEmployee.username],
                                    ['Password', createdEmployee.password],
                                ].map(([k, v]) => (
                                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e0f0fb' }}>
                                        <span style={{ color: '#546E7A', fontSize: '0.85rem' }}>{k}</span>
                                        <span style={{ fontWeight: 700, color: '#002244', fontFamily: 'monospace', fontSize: '0.95rem' }}>{v}</span>
                                    </div>
                                ))}
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <Link to="/view_employees" className="bc-btn bc-btn-primary bc-btn-full">
                                    🪪 View Employee Registry
                                </Link>
                                <button className="bc-btn bc-btn-outline bc-btn-full"
                                    onClick={() => { setCreatedEmployee(null); setMsg({ text: '', type: '' }); }}>
                                    ➕ Add Another Employee
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Navbar active="people" />
            <div className="page-wrapper">
                <div className="container" style={{ maxWidth: '760px' }}>
                    <div className="page-header">
                        <div className="breadcrumb-row">
                            <Link to="/">Dashboard</Link> <span>›</span> People <span>›</span> Add Employee
                        </div>
                        <h1>Add New Employee</h1>
                        <div className="subtitle">Register internal staff and set their system credentials</div>
                    </div>

                    {msg.text && <div className={`bc-alert bc-alert-${msg.type}`}>{msg.type === 'success' ? '✅ ' : '⚠️ '}{msg.text}</div>}

                    <form onSubmit={handleSubmit}>
                        <div className="bc-form-card" style={{ marginBottom: '20px' }}>
                            <h4 style={{ color: '#002244', marginBottom: '20px', fontWeight: 700, fontSize: '1rem' }}>
                                👤 Employee Profile
                            </h4>
                            <div className="row g-4">
                                <div className="col-md-8">
                                    <label className="form-label">Full Name *</label>
                                    <input type="text" name="name" className="form-control" required placeholder="e.g. Priya Patel" />
                                </div>
                                <div className="col-md-4">
                                    <label className="form-label">Gender *</label>
                                    <select name="gender" className="form-select" required>
                                        <option value="">Select</option>
                                        <option>Male</option><option>Female</option><option>Other</option>
                                    </select>
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label">Designation</label>
                                    <input type="text" name="designation" className="form-control" placeholder="e.g. Branch Manager" />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label">Salary (Monthly) *</label>
                                    <input type="number" name="salary" className="form-control" required placeholder="e.g. 45000" />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label">Assigned Branch *</label>
                                    <select name="branch_id" className="form-select" required>
                                        <option value="">Select Branch</option>
                                        {branches.map(b => (
                                            <option key={b.branch_id} value={b.branch_id}>{b.city} (ID: {b.branch_id})</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label">Join Date</label>
                                    <input type="date" name="join_date" className="form-control" defaultValue={new Date().toISOString().split('T')[0]} />
                                </div>
                            </div>
                        </div>

                        <div className="bc-form-card" style={{ marginBottom: '20px' }}>
                            <h4 style={{ color: '#002244', marginBottom: '8px', fontWeight: 700, fontSize: '1rem' }}>
                                🔑 Login Credentials
                            </h4>
                            <p style={{ color: '#546E7A', fontSize: '0.85rem', marginBottom: '20px' }}>
                                Credentials for the employee to access the system.
                            </p>
                            <div className="row g-4">
                                <div className="col-md-6">
                                    <label className="form-label">Username *</label>
                                    <input type="text" name="username" className="form-control" required
                                        placeholder="e.g. priya.manager" minLength="4" />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label">Password *</label>
                                    <div style={{ position: 'relative' }}>
                                        <input type={showPass ? 'text' : 'password'} name="password" className="form-control"
                                            required placeholder="••••••••" minLength="6"
                                            style={{ paddingRight: '48px' }} />
                                        <button type="button" onClick={() => setShowPass(p => !p)}
                                            style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#546E7A' }}>
                                            {showPass ? '🙈' : '👁️'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button type="submit" className="bc-btn bc-btn-primary">Register Employee →</button>
                            <Link to="/view_employees" className="bc-btn bc-btn-outline ms-auto">Cancel</Link>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
};

export default AddEmployee;
