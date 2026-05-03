import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../services/api';

const CreateAccount = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [accType, setAccType] = useState('savings');
    const [msg, setMsg] = useState({ text: '', type: '' });
    const [branches, setBranches] = useState([]);
    const [custId, setCustId] = useState(searchParams.get('cust_id') || '');
    const [custName, setCustName] = useState('');
    const [ownershipType, setOwnershipType] = useState('primary');
    const [jointCustId, setJointCustId] = useState('');
    const [jointCustName, setJointCustName] = useState('');
    const [newAcc, setNewAcc] = useState(null);

    useEffect(() => {
        api.get('/accounts/branches').then(res => setBranches(res.data)).catch(() => {});
        if (searchParams.get('cust_id')) lookupCustomer(searchParams.get('cust_id'));
    }, []);

    const lookupCustomer = async (id, isJoint = false) => {
        if (!id) return isJoint ? setJointCustName('') : setCustName('');
        try {
            const res = await api.get('/customers');
            const c = res.data.find(x => String(x.cust_id) === String(id));
            const name = c ? c.name : '⚠️ Customer not found';
            isJoint ? setJointCustName(name) : setCustName(name);
        } catch { isJoint ? setJointCustName('') : setCustName(''); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.target).entries());
        try {
            const res = await api.post('/accounts', { ...data, cust_id: custId });
            setNewAcc(res.data);
        } catch (err) {
            setMsg({ text: err.response?.data?.error || 'Account creation failed', type: 'danger' });
        }
    };

    // Success screen
    if (newAcc) {
        return (
            <>
                <Navbar active="accounts" />
                <div className="page-wrapper">
                    <div className="container" style={{ maxWidth: '500px' }}>
                        <div style={{ background: 'white', borderRadius: '20px', padding: '50px 40px', textAlign: 'center', boxShadow: '0 8px 40px rgba(0,34,68,0.10)', border: '1px solid #EEF1F4' }}>
                            <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🏦</div>
                            <h2 style={{ color: '#002244', marginBottom: '8px' }}>Account Opened!</h2>
                            <div style={{ background: '#e0f7fa', borderRadius: '12px', padding: '20px', margin: '20px 0' }}>
                                <div style={{ color: '#546E7A', fontSize: '0.85rem' }}>Account Number</div>
                                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#002244', letterSpacing: '3px' }}>#{newAcc.acc_num}</div>
                                <div style={{ marginTop: '10px', color: '#546E7A', fontSize: '0.85rem' }}>UPI VPA</div>
                                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#00AEEF' }}>
                                    <code>{newAcc.vpa}</code>
                                </div>
                            </div>
                            <p style={{ color: '#546E7A', fontSize: '0.85rem' }}>For customer: <strong>{custName}</strong></p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
                                <button className="bc-btn bc-btn-primary bc-btn-full" onClick={() => navigate(`/deposit_withdraw?acc=${newAcc.acc_num}`)}>💰 Make First Deposit →</button>
                                <button className="bc-btn bc-btn-outline bc-btn-full" onClick={() => navigate(`/view_account?acc=${newAcc.acc_num}`)}>🔍 View Account</button>
                                <button className="bc-btn bc-btn-outline bc-btn-full" onClick={() => { setNewAcc(null); setMsg({ text: '', type: '' }); }}>Open Another Account</button>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Navbar active="accounts" />
            <div className="page-wrapper">
                <div className="container" style={{ maxWidth: '760px' }}>
                    <div className="page-header">
                        <div className="breadcrumb-row">
                            <Link to="/">Dashboard</Link> <span>›</span> Accounts <span>›</span> Create
                        </div>
                        <h1>Open New Account</h1>
                        <div className="subtitle">Create a savings or current account and link it to a customer</div>
                    </div>

                    <div id="alertBox">
                        {msg.text && <div className={`bc-alert bc-alert-${msg.type}`}>
                            {msg.type === 'success' ? '✅ ' : '⚠️ '} {msg.text}
                        </div>}
                    </div>

                    <div className="bc-form-card">
                        <form onSubmit={handleSubmit}>
                            <div className="section-label">Account Details</div>
                            <div className="row g-4">
                                <div className="col-md-6">
                                    <label className="form-label">Customer ID *</label>
                                    <input type="number" name="cust_id" className="form-control" required
                                        value={custId} onChange={e => setCustId(e.target.value)}
                                        onBlur={e => lookupCustomer(e.target.value)} placeholder="e.g. 1" />
                                    {custName && (
                                        <div className="form-text" style={{ color: custName.includes('⚠️') ? '#DA291C' : '#00843D', fontWeight: 600 }}>{custName}</div>
                                    )}
                                    <div className="form-text">Don't know the ID? <Link to="/view_customers" style={{ color: '#0090C8' }}>Browse customers</Link></div>
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label">Branch *</label>
                                    <select name="branch_id" className="form-select" required>
                                        <option value="">Select Branch</option>
                                        {branches.map(b => (
                                            <option key={b.branch_id} value={b.branch_id}>
                                                {b.city} — Branch {String(b.branch_id).padStart(3, '0')} ({b.ifs_code})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label">Opening Balance (₹) *</label>
                                    <input type="number" name="balance" className="form-control" required min="0" step="0.01" placeholder="1000.00" />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label">Ownership Type</label>
                                    <select name="ownership_type" className="form-select" value={ownershipType} onChange={e => setOwnershipType(e.target.value)}>
                                        <option value="primary">Primary</option>
                                        <option value="joint">Joint</option>
                                    </select>
                                </div>
                                {ownershipType === 'joint' && (
                                    <div className="col-md-6">
                                        <label className="form-label">Joint Customer ID *</label>
                                        <input type="number" name="joint_cust_id" className="form-control" required
                                            value={jointCustId} onChange={e => setJointCustId(e.target.value)}
                                            onBlur={e => lookupCustomer(e.target.value, true)} placeholder="e.g. 2" />
                                        {jointCustName && (
                                            <div className="form-text" style={{ color: jointCustName.includes('⚠️') ? '#DA291C' : '#00843D', fontWeight: 600 }}>{jointCustName}</div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="divider"></div>
                            <div className="section-label">Account Type</div>

                            <div className="bc-radio-group mb-4">
                                <div className="bc-radio-option">
                                    <input type="radio" name="acc_type" value="savings" id="typeSavings" required checked={accType === 'savings'} onChange={() => setAccType('savings')} />
                                    <label htmlFor="typeSavings">🏦 Savings Account</label>
                                </div>
                                <div className="bc-radio-option">
                                    <input type="radio" name="acc_type" value="current" id="typeCurrent" checked={accType === 'current'} onChange={() => setAccType('current')} />
                                    <label htmlFor="typeCurrent">🏢 Current Account</label>
                                </div>
                            </div>

                            {accType === 'savings' && (
                                <div id="savingsFields">
                                    <div className="subtype-section">
                                        <h6>Savings Account Details</h6>
                                        <div className="row g-3">
                                            <div className="col-md-4">
                                                <label className="form-label">Interest Rate (%)</label>
                                                <input type="number" name="interest_rate" className="form-control" step="0.01" placeholder="4.00" />
                                            </div>
                                            <div className="col-md-4">
                                                <label className="form-label">Min Balance (₹)</label>
                                                <input type="number" name="min_balance" className="form-control" step="0.01" placeholder="500.00" />
                                            </div>
                                            <div className="col-md-4">
                                                <label className="form-label">Daily Limit (₹)</label>
                                                <input type="number" name="daily_limit" className="form-control" step="0.01" placeholder="25000.00" />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label">Nominee Name</label>
                                                <input type="text" name="nominee" className="form-control" placeholder="e.g. Priya Sharma" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {accType === 'current' && (
                                <div id="currentFields">
                                    <div className="subtype-section">
                                        <h6>Current Account Details</h6>
                                        <div className="row g-3">
                                            <div className="col-md-4">
                                                <label className="form-label">Overdraft Limit (₹)</label>
                                                <input type="number" name="overdraft_limit" className="form-control" step="0.01" placeholder="50000.00" />
                                            </div>
                                            <div className="col-md-4">
                                                <label className="form-label">Business Ref No</label>
                                                <input type="text" name="business_refno" className="form-control" placeholder="BUS-2024-001" />
                                            </div>
                                            <div className="col-md-4">
                                                <label className="form-label">Monthly Quota</label>
                                                <input type="number" name="month_t_quota" className="form-control" placeholder="50" />
                                            </div>
                                            <div className="col-md-4">
                                                <label className="form-label">Transfer Fee Rate (%)</label>
                                                <input type="number" name="transf_fee_rate" className="form-control" step="0.01" placeholder="0.50" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', paddingTop: '20px', borderTop: '1px solid #EEF1F4', marginTop: '20px' }}>
                                <button type="submit" className="bc-btn bc-btn-primary">Open Account →</button>
                                <button type="reset" className="bc-btn bc-btn-outline" onClick={() => setAccType('savings')}>Clear</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
};
export default CreateAccount;
