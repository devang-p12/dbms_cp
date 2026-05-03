import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../services/api';

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const ViewPayroll = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isEmployee = user.role === 'EMPLOYEE';
    const isAdmin = user.role === 'ADMIN';

    const [payrolls, setPayrolls] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // ── Generate Payroll state (admin only) ──
    const now = new Date();
    const [genMonth, setGenMonth] = useState(now.getMonth() + 1);
    const [genYear, setGenYear] = useState(now.getFullYear());
    const [preview, setPreview] = useState(null);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [genMsg, setGenMsg] = useState({ text: '', type: '' });

    const loadPayrolls = useCallback(() => {
        setLoading(true);
        api.get('/payroll')
            .then(res => setPayrolls(res.data))
            .catch(() => setError('Failed to load payroll data.'))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => { loadPayrolls(); }, []);

    const handlePreview = async () => {
        setPreviewLoading(true);
        setGenMsg({ text: '', type: '' });
        try {
            const res = await api.post('/payroll/preview', { month: genMonth, year: genYear });
            setPreview(res.data);
        } catch(e) {
            setGenMsg({ text: e.response?.data?.error || 'Preview failed', type: 'danger' });
        } finally {
            setPreviewLoading(false);
        }
    };

    const handleGenerate = async () => {
        setGenerating(true);
        setGenMsg({ text: '', type: '' });
        try {
            const res = await api.post('/payroll/generate', { month: genMonth, year: genYear });
            setGenMsg({ text: res.data.message, type: 'success' });
            setPreview(null);
            loadPayrolls();
        } catch(e) {
            setGenMsg({ text: e.response?.data?.error || 'Generation failed', type: 'danger' });
        } finally {
            setGenerating(false);
        }
    };

    const totalEarned = payrolls.reduce((sum, p) => sum + Number(p.net_salary), 0);
    const latestRecord = payrolls[0];

    return (
        <>
            <Navbar active="people" />
            <div className="page-wrapper">
                <div className="container">
                    <div className="page-header">
                        <div className="breadcrumb-row">
                            <Link to="/">Dashboard</Link> <span>›</span> People <span>›</span> Payroll
                        </div>
                        <h1>{isEmployee ? 'My Payroll' : 'Payroll Records'}</h1>
                        <div className="subtitle">
                            {isEmployee ? 'Your salary disbursement history' : 'All employee salary disbursements'}
                        </div>
                    </div>

                    {error && <div className="bc-alert bc-alert-danger">⚠️ {error}</div>}

                    {/* ── Generate Payroll Panel (Admin only) ───────────────── */}
                    {isAdmin && (
                        <div style={{
                            background: 'white', borderRadius: '16px', padding: '24px 28px',
                            boxShadow: '0 2px 16px rgba(0,34,68,0.08)', border: '1px solid #EEF1F4',
                            marginBottom: '28px'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                                <div>
                                    <h5 style={{ color: '#002244', fontWeight: 800, margin: 0 }}>⚙️ Generate Payroll</h5>
                                    <div style={{ fontSize: '0.82rem', color: '#546E7A', marginTop: '4px' }}>
                                        Calculates net salary from attendance (Present=1, Half Day=0.5, Holiday=1, Absent/Leave=0)
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                                <div>
                                    <label className="form-label">Month</label>
                                    <select className="form-select" style={{ width: '140px' }}
                                        value={genMonth} onChange={e => { setGenMonth(Number(e.target.value)); setPreview(null); }}>
                                        {MONTH_NAMES.map((m, i) => (
                                            <option key={i+1} value={i+1}>{m}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="form-label">Year</label>
                                    <select className="form-select" style={{ width: '100px' }}
                                        value={genYear} onChange={e => { setGenYear(Number(e.target.value)); setPreview(null); }}>
                                        {[now.getFullYear() - 1, now.getFullYear()].map(y => (
                                            <option key={y} value={y}>{y}</option>
                                        ))}
                                    </select>
                                </div>
                                <button className="bc-btn bc-btn-outline" onClick={handlePreview} disabled={previewLoading}>
                                    {previewLoading ? 'Calculating...' : '🔍 Preview'}
                                </button>
                                {preview && (
                                    <button className="bc-btn bc-btn-primary" onClick={handleGenerate} disabled={generating}>
                                        {generating ? 'Saving...' : `💾 Confirm & Generate for ${MONTH_NAMES[genMonth-1]} ${genYear}`}
                                    </button>
                                )}
                            </div>

                            {genMsg.text && (
                                <div className={`bc-alert bc-alert-${genMsg.type}`} style={{ marginTop: '14px', marginBottom: 0 }}>
                                    {genMsg.type === 'success' ? '✅ ' : '⚠️ '}{genMsg.text}
                                </div>
                            )}

                            {/* ── Preview table ── */}
                            {preview && (
                                <div style={{ marginTop: '20px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                        <strong style={{ color: '#002244' }}>
                                            Preview — {MONTH_NAMES[genMonth-1]} {genYear}
                                            <span style={{ fontWeight: 400, color: '#546E7A', fontSize: '0.85rem', marginLeft: '8px' }}>
                                                ({preview.workDays} working days this month)
                                            </span>
                                        </strong>
                                        <button style={{ background: 'none', border: 'none', color: '#9BA8B3', cursor: 'pointer', fontSize: '1.1rem' }}
                                            onClick={() => setPreview(null)}>✕</button>
                                    </div>
                                    <div style={{ overflowX: 'auto' }}>
                                        <table className="bc-table" style={{ fontSize: '0.85rem' }}>
                                            <thead>
                                                <tr>
                                                    <th>Employee</th>
                                                    <th>Base Salary</th>
                                                    <th style={{ color: '#00843D' }}>Present</th>
                                                    <th style={{ color: '#E65100' }}>Half Day</th>
                                                    <th style={{ color: '#DA291C' }}>Absent</th>
                                                    <th style={{ color: '#7B5EA7' }}>Leave</th>
                                                    <th style={{ color: '#546E7A' }}>Holiday</th>
                                                    <th>Earned Days</th>
                                                    <th>Net Salary</th>
                                                    <th>Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {preview.preview.map(emp => (
                                                    <tr key={emp.emp_id}>
                                                        <td>
                                                            <div style={{ fontWeight: 700, color: '#002244' }}>{emp.name}</div>
                                                            <div style={{ fontSize: '0.75rem', color: '#546E7A' }}>{emp.designation}</div>
                                                        </td>
                                                        <td style={{ color: '#546E7A' }}>₹{Number(emp.base_salary).toLocaleString('en-IN')}</td>
                                                        <td><span style={{ color: '#00843D', fontWeight: 700 }}>{emp.presentDays}</span></td>
                                                        <td><span style={{ color: '#E65100', fontWeight: 700 }}>{emp.halfDays}</span></td>
                                                        <td><span style={{ color: '#DA291C', fontWeight: 700 }}>{emp.absentDays}</span></td>
                                                        <td><span style={{ color: '#7B5EA7', fontWeight: 700 }}>{emp.leaveDays}</span></td>
                                                        <td><span style={{ color: '#546E7A', fontWeight: 700 }}>{emp.holidayDays}</span></td>
                                                        <td>
                                                            <span style={{ fontWeight: 700 }}>{emp.earnedDays}</span>
                                                            <span style={{ color: '#9BA8B3', fontSize: '0.75rem' }}> / {emp.workDays}</span>
                                                        </td>
                                                        <td style={{ fontWeight: 800, color: '#00843D', fontSize: '1rem' }}>
                                                            ₹{Number(emp.netSalary).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                        </td>
                                                        <td>
                                                            {emp.alreadyGenerated
                                                                ? <span style={{ background: '#fff3e0', color: '#E65100', padding: '3px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600 }}>Will Update</span>
                                                                : <span style={{ background: '#e6f9f0', color: '#00843D', padding: '3px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600 }}>New</span>
                                                            }
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Employee personal summary cards ───────────────────── */}
                    {isEmployee && !loading && latestRecord && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' }}>
                            {[
                                { icon: '👤', label: 'Employee',          value: latestRecord.name,        sub: latestRecord.designation, color: '#002244' },
                                { icon: '💰', label: 'Latest Salary',     value: `₹${Number(latestRecord.net_salary).toLocaleString('en-IN')}`, sub: `${latestRecord.month}/${latestRecord.year}`, color: '#00843D' },
                                { icon: '📅', label: 'Last Paid On',      value: new Date(latestRecord.paid_on + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }), sub: 'Most recent payment', color: '#002244' },
                                { icon: '📊', label: 'Total Paid (All Time)', value: `₹${totalEarned.toLocaleString('en-IN')}`, sub: `Across ${payrolls.length} payslip${payrolls.length !== 1 ? 's' : ''}`, color: '#00AEEF' },
                            ].map(card => (
                                <div key={card.label} style={{ background: 'white', borderRadius: '16px', padding: '20px 22px', boxShadow: '0 2px 16px rgba(0,34,68,0.07)', border: '1px solid #EEF1F4' }}>
                                    <div style={{ fontSize: '1.5rem', marginBottom: '6px' }}>{card.icon}</div>
                                    <div style={{ fontSize: '0.75rem', color: '#9BA8B3', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>{card.label}</div>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: card.color, marginBottom: '2px' }}>{card.value}</div>
                                    <div style={{ fontSize: '0.78rem', color: '#546E7A' }}>{card.sub}</div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ── Payroll list ─────────────────────────────────────── */}
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '60px' }}><div className="bc-spinner">Loading...</div></div>
                    ) : payrolls.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '60px', color: '#9BA8B3' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>📭</div>
                            <div style={{ fontWeight: 600 }}>No payroll records yet. Generate payroll above.</div>
                        </div>
                    ) : isEmployee ? (
                        /* Employee payslip cards */
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {payrolls.map(p => (
                                <div key={p.payroll_id} style={{ background: 'white', borderRadius: '16px', padding: '24px 28px', boxShadow: '0 2px 16px rgba(0,34,68,0.07)', border: '1px solid #EEF1F4', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, #002244, #00AEEF)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '1rem' }}>
                                            {String(p.month).padStart(2, '0')}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 700, color: '#002244', fontSize: '1rem' }}>
                                                {new Date(p.year, p.month - 1).toLocaleString('default', { month: 'long' })} {p.year}
                                            </div>
                                            <div style={{ fontSize: '0.8rem', color: '#9BA8B3' }}>Payslip #{p.payroll_id} · {p.designation}</div>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontWeight: 800, fontSize: '1.3rem', color: '#00843D' }}>₹{Number(p.net_salary).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                                        <div style={{ fontSize: '0.78rem', color: '#546E7A', marginTop: '2px' }}>
                                            Paid on {new Date(p.paid_on + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        /* Admin full table */
                        <div className="bc-table-wrap">
                            <div className="bc-table-toolbar">
                                <h5>All Payroll Records</h5>
                                <span style={{ fontSize: '0.85rem', color: '#546E7A' }}>{payrolls.length} records</span>
                            </div>
                            <div style={{ overflowX: 'auto' }}>
                                <table className="bc-table">
                                    <thead>
                                        <tr><th>ID</th><th>Employee Name</th><th>Designation</th><th>Month/Year</th><th>Net Salary</th><th>Paid On</th></tr>
                                    </thead>
                                    <tbody>
                                        {payrolls.map(p => (
                                            <tr key={p.payroll_id}>
                                                <td style={{ color: '#546E7A', fontWeight: 600 }}>#{p.payroll_id}</td>
                                                <td style={{ fontWeight: 600, color: '#002244' }}>{p.name}</td>
                                                <td><span className="bc-badge bc-badge-gray">{p.designation}</span></td>
                                                <td>{MONTH_NAMES[p.month - 1]} {p.year}</td>
                                                <td style={{ fontWeight: 700, color: '#00843D' }}>₹{Number(p.net_salary).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                                <td>{new Date(p.paid_on + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};
export default ViewPayroll;
