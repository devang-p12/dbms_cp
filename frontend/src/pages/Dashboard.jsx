import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import Navbar from '../components/Navbar';

const Dashboard = () => {
    const [data, setData] = useState({ stats: null, recentTransactions: [] });
    const [auditLog, setAuditLog] = useState([]);
    const [auditLoaded, setAuditLoaded] = useState(false);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isAdmin = user.role === 'ADMIN';
    const isEmployee = user.role === 'EMPLOYEE';

    useEffect(() => {
        api.get('/dashboard')
            .then(res => setData(res.data))
            .catch(err => {
                if (err.response?.status === 401 || err.response?.status === 403) {
                    localStorage.clear();
                    navigate('/login');
                }
            })
            .finally(() => setLoading(false));
    }, []);

    const loadAuditLog = async () => {
        try {
            const res = await api.get('/audit');
            setAuditLog(res.data);
            setAuditLoaded(true);
        } catch (err) {
            console.error('Audit load failed', err);
        }
    };

    return (
        <>
            <Navbar active="dashboard" />
            <div className="page-wrapper">
                <div className="container">
                    {/* Header */}
                    <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '12px' }}>
                        <div>
                            <div className="breadcrumb-row">🏠 Home <span>›</span> Dashboard</div>
                            <h1>Overview</h1>
                            <div className="subtitle">{new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
                        </div>
                        {(isAdmin || isEmployee) && (
                            <Link to="/add_customer" className="bc-btn bc-btn-primary">+ New Customer</Link>
                        )}
                    </div>

                    {/* Stat Cards */}
                    <div className="row g-4 mb-4">
                        {(isAdmin || isEmployee) ? (
                            <>
                                <div className="col-sm-6 col-xl-3">
                                    <div className="stat-card blue">
                                        <div className="stat-icon">👥</div>
                                        <div className="stat-value">{data.stats?.totalCustomers ?? '—'}</div>
                                        <div className="stat-label">Total Customers</div>
                                    </div>
                                </div>
                                <div className="col-sm-6 col-xl-3">
                                    <div className="stat-card navy">
                                        <div className="stat-icon">🏦</div>
                                        <div className="stat-value">{data.stats?.totalAccounts ?? '—'}</div>
                                        <div className="stat-label">Total Accounts</div>
                                    </div>
                                </div>
                                <div className="col-sm-6 col-xl-3">
                                    <div className="stat-card teal">
                                        <div className="stat-icon">💳</div>
                                        <div className="stat-value">{data.stats ? '₹' + Number(data.stats.totalBalance).toLocaleString('en-IN') : '—'}</div>
                                        <div className="stat-label">Total Balance (AUM)</div>
                                    </div>
                                </div>
                                <div className="col-sm-6 col-xl-3">
                                    <div className="stat-card green">
                                        <div className="stat-icon">🪪</div>
                                        <div className="stat-value">{data.stats?.totalEmployees ?? '—'}</div>
                                        <div className="stat-label">Employees</div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="col-sm-6 col-xl-4">
                                    <div className="stat-card navy">
                                        <div className="stat-icon">🏦</div>
                                        <div className="stat-value">{data.stats?.totalAccounts ?? '—'}</div>
                                        <div className="stat-label">My Accounts</div>
                                    </div>
                                </div>
                                <div className="col-sm-6 col-xl-4">
                                    <div className="stat-card teal">
                                        <div className="stat-icon">💰</div>
                                        <div className="stat-value">{data.stats ? '₹' + Number(data.stats.totalBalance).toLocaleString('en-IN') : '—'}</div>
                                        <div className="stat-label">Total Balance</div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Quick Actions + Recent Transactions */}
                    <div className="row g-4">
                        {/* Quick Actions — role-based */}
                        <div className="col-lg-4">
                            <div className="bc-card" style={{ height: '100%' }}>
                                <div className="bc-card-header"><h5>Quick Actions</h5></div>
                                <div className="bc-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {(isAdmin || isEmployee) && (
                                        <>
                                            <Link to="/add_customer" className="bc-btn bc-btn-outline-blue" style={{ width: '100%', justifyContent: 'flex-start' }}>➕ Add New Customer</Link>
                                            <Link to="/create_account" className="bc-btn bc-btn-outline-blue" style={{ width: '100%', justifyContent: 'flex-start' }}>🏦 Open New Account</Link>
                                        </>
                                    )}
                                    <Link to="/deposit_withdraw" className="bc-btn bc-btn-outline-blue" style={{ width: '100%', justifyContent: 'flex-start' }}>💰 Deposit / Withdraw</Link>
                                    <Link to="/upi_transfer" className="bc-btn bc-btn-outline-blue" style={{ width: '100%', justifyContent: 'flex-start' }}>📱 UPI Transfer</Link>
                                    <Link to="/atm_withdraw" className="bc-btn bc-btn-outline-blue" style={{ width: '100%', justifyContent: 'flex-start' }}>🏧 ATM Withdrawal</Link>
                                    <Link to="/view_account" className="bc-btn bc-btn-outline-blue" style={{ width: '100%', justifyContent: 'flex-start' }}>🔍 View Account</Link>
                                    {isAdmin && (
                                        <Link to="/mark_attendance" className="bc-btn bc-btn-outline-blue" style={{ width: '100%', justifyContent: 'flex-start' }}>📅 Mark Attendance</Link>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Recent Transactions */}
                        <div className="col-lg-8">
                            <div className="bc-table-wrap">
                                <div className="bc-table-toolbar">
                                    <h5>Recent Transactions</h5>
                                    <Link to="/view_transactions" className="bc-btn bc-btn-outline bc-btn-sm">View All</Link>
                                </div>
                                <table className="bc-table">
                                    <thead>
                                        <tr><th>ID</th><th>Account</th><th>Type</th><th>Amount</th><th>Status</th><th>Time</th></tr>
                                    </thead>
                                    <tbody>
                                        {loading ? (
                                            <tr><td colSpan="6"><div className="bc-spinner"></div></td></tr>
                                        ) : data.recentTransactions?.length > 0 ? (
                                            data.recentTransactions.map(t => (
                                                <tr key={t.id}>
                                                    <td>#{t.id}</td>
                                                    <td>{t.acc_num}</td>
                                                    <td><span className={`bc-badge bc-badge-${t.type === 'upi' ? 'info' : t.type === 'transfer' ? 'primary' : t.is_credit ? 'success' : 'warning'}`}>{t.type?.toUpperCase()}</span></td>
                                                    <td style={{ color: t.is_credit ? '#00843D' : '#DA291C', fontWeight: 600 }}>₹{Number(t.amount).toLocaleString()}</td>
                                                    <td><span className={`bc-badge bc-badge-${t.status === 'success' ? 'success' : t.status === 'pending' ? 'warning' : 'gray'}`}>{t.status}</span></td>
                                                    <td>{new Date(t.timestamp).toLocaleString()}</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px', color: '#9BA8B3' }}>No transactions yet.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Audit Log — Admin only, loads on demand */}
                        {isAdmin && (
                            <div className="col-12 mt-2" id="auditSection">
                                <div className="bc-table-wrap">
                                    <div className="bc-table-toolbar">
                                        <h5>📋 Audit Log</h5>
                                        <button onClick={loadAuditLog} className="bc-btn bc-btn-outline bc-btn-sm">Refresh</button>
                                    </div>
                                    <table className="bc-table">
                                        <thead>
                                            <tr><th>ID</th><th>User</th><th>Action</th><th>Detail</th><th>IP</th><th>Time</th></tr>
                                        </thead>
                                        <tbody>
                                            {!auditLoaded ? (
                                                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#9BA8B3' }}>Click Refresh to load audit log.</td></tr>
                                            ) : auditLog.length > 0 ? auditLog.map(l => (
                                                <tr key={l.audit_id}>
                                                    <td style={{ color: '#546E7A', fontSize: '.8rem' }}>#{l.audit_id}</td>
                                                    <td style={{ fontWeight: 600 }}>{l.username}</td>
                                                    <td><span className="bc-badge bc-badge-info" style={{ fontSize: '.75rem' }}>{l.action}</span></td>
                                                    <td style={{ color: '#9BA8B3', fontSize: '.8rem', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.detail}</td>
                                                    <td style={{ color: '#64748b', fontSize: '.8rem' }}>
                                                        {l.ip_addr ? l.ip_addr.replace('::ffff:', '').replace('::1', '127.0.0.1') : 'N/A'}
                                                    </td>
                                                    <td style={{ color: '#546E7A', fontSize: '.8rem' }}>
                                                        {l.timestamp ? (!isNaN(new Date(String(l.timestamp).replace(' ', 'T') + '+05:30').getTime()) ? new Date(String(l.timestamp).replace(' ', 'T') + '+05:30').toLocaleString('en-IN') : String(l.timestamp)) : 'N/A'}
                                                    </td>
                                                </tr>
                                            )) : (
                                                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px', color: '#9BA8B3' }}>No audit entries found.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <footer className="bc-footer">
                <div className="container">© 2024 FinVault Banking Management System</div>
            </footer>
        </>
    );
};
export default Dashboard;
