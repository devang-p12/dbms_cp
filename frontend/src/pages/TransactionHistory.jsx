import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../services/api';

const TransactionHistory = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    useEffect(() => {
        api.get('/transactions')
            .then(res => setTransactions(res.data))
            .finally(() => setLoading(false));
    }, []);

    const filtered = transactions.filter(t => {
        const matchType = filter === 'all' || t.type === filter;
        const matchSearch = String(t.acc_num).includes(search) || String(t.id).includes(search);
        return matchType && matchSearch;
    });

    const typeColors = { deposit: 'success', withdrawal: 'warning', upi: 'info', transfer: 'primary', atm: 'teal', card: 'gray' };
    const totalDeposits = filtered.filter(t => t.is_credit).reduce((s, t) => s + Number(t.amount), 0);
    const totalWithdrawals = filtered.filter(t => !t.is_credit).reduce((s, t) => s + Number(t.amount), 0);

    return (
        <>
            <Navbar active="payments" />
            <div className="page-wrapper">
                <div className="container">
                    <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '12px' }}>
                        <div>
                            <div className="breadcrumb-row"><Link to="/">Dashboard</Link> <span>›</span> Payments <span>›</span> Transaction History</div>
                            <h1>Transaction History</h1>
                            <div className="subtitle">{filtered.length} transactions {filter !== 'all' ? `(${filter})` : ''}</div>
                        </div>
                    </div>

                    {/* Summary cards */}
                    <div className="row g-3 mb-4">
                        <div className="col-sm-4">
                            <div className="stat-card blue" style={{ padding: '16px 20px' }}>
                                <div className="stat-value" style={{ fontSize: '1.4rem' }}>{filtered.length}</div>
                                <div className="stat-label">Total Transactions</div>
                            </div>
                        </div>
                        <div className="col-sm-4">
                            <div className="stat-card teal" style={{ padding: '16px 20px' }}>
                                <div className="stat-value" style={{ fontSize: '1.4rem' }}>₹{totalDeposits.toLocaleString('en-IN')}</div>
                                <div className="stat-label">Total Credits</div>
                            </div>
                        </div>
                        <div className="col-sm-4">
                            <div className="stat-card navy" style={{ padding: '16px 20px' }}>
                                <div className="stat-value" style={{ fontSize: '1.4rem' }}>₹{totalWithdrawals.toLocaleString('en-IN')}</div>
                                <div className="stat-label">Total Debits</div>
                            </div>
                        </div>
                    </div>

                    <div className="bc-table-wrap">
                        <div className="bc-table-toolbar" style={{ flexWrap: 'wrap', gap: '10px' }}>
                            <h5>All Transactions</h5>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                                {['all', 'deposit', 'withdrawal', 'upi', 'atm', 'card'].map(t => (
                                    <button key={t} onClick={() => setFilter(t)}
                                        className={`bc-btn bc-btn-sm ${filter === t ? 'bc-btn-primary' : 'bc-btn-outline'}`}
                                        style={{ textTransform: 'capitalize' }}>
                                        {t === 'all' ? 'All' : t.toUpperCase()}
                                    </button>
                                ))}
                                <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                                    placeholder="Search acc no / txn id…"
                                    style={{ padding: '6px 12px', border: '1px solid #DDE1E7', borderRadius: '8px', fontSize: '0.85rem' }} />
                            </div>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table className="bc-table">
                                <thead>
                                    <tr>
                                        <th>TXN ID</th>
                                        <th>Account</th>
                                        <th>Type</th>
                                        <th>Amount</th>
                                        <th>Status</th>
                                        <th>Date & Time</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr><td colSpan="6"><div className="bc-spinner">Loading...</div></td></tr>
                                    ) : filtered.length === 0 ? (
                                        <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#9BA8B3' }}>No transactions found.</td></tr>
                                    ) : filtered.map(t => (
                                        <tr key={t.id}>
                                            <td style={{ color: '#546E7A', fontWeight: 600, fontSize: '0.82rem' }}>#{t.id}</td>
                                            <td>
                                                <Link to={`/view_account?acc=${t.acc_num}`} style={{ fontWeight: 600, color: '#002244' }}>
                                                    ACC #{t.acc_num}
                                                </Link>
                                            </td>
                                            <td>
                                                <span className={`bc-badge bc-badge-${typeColors[t.type] || 'gray'}`}>
                                                    {t.type?.toUpperCase()}
                                                </span>
                                            </td>
                                            <td style={{ fontWeight: 700, color: t.is_credit ? '#00843D' : '#DA291C', fontSize: '1rem' }}>
                                                {t.is_credit ? '+' : '-'}₹{Number(t.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td>
                                                <span className={`bc-badge bc-badge-${t.status === 'success' ? 'success' : t.status === 'pending' ? 'warning' : 'danger'}`}>
                                                    {t.status}
                                                </span>
                                                {t.flagged && <span className="bc-badge bc-badge-danger" style={{ marginLeft: '4px' }}>🚩 FLAGGED</span>}
                                            </td>
                                            <td style={{ color: '#546E7A', fontSize: '0.85rem' }}>
                                                {new Date(t.timestamp).toLocaleString('en-IN')}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};
export default TransactionHistory;
