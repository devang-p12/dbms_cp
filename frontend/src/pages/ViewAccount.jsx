import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../services/api';

const STATUS_COLOR = {
    active:   { bg: '#e6f9f0', color: '#00843D' },
    inactive: { bg: '#EEF1F4', color: '#546E7A' },
    frozen:   { bg: '#e0f5ff', color: '#00AEEF' },
    closed:   { bg: '#fde8e8', color: '#DA291C' },
};

const ViewAccount = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isCustomer = user.role === 'CUSTOMER';

    const [accounts, setAccounts] = useState([]);       // for customer: all their accounts
    const [selected, setSelected] = useState(null);     // currently viewed account
    const [transactions, setTransactions] = useState([]);

    const [searchNum, setSearchNum] = useState('');     // staff manual search
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [txnLoading, setTxnLoading] = useState(false);

    // ── Customer: auto-load all their accounts on mount ──
    useEffect(() => {
        if (!isCustomer) return;
        setLoading(true);
        api.get('/accounts')
            .then(res => {
                setAccounts(res.data);
                if (res.data.length > 0) loadDetails(res.data[0]);
            })
            .catch(() => setError('Failed to load your accounts.'))
            .finally(() => setLoading(false));
    }, []);

    const loadDetails = async (acc) => {
        setSelected(acc);
        setTxnLoading(true);
        try {
            const res = await api.get('/transactions');
            setTransactions(
                res.data.filter(t => String(t.acc_num) === String(acc.acc_num)).slice(0, 10)
            );
        } catch { setTransactions([]); }
        finally { setTxnLoading(false); }
    };

    // ── Staff manual search ──
    const handleSearch = async () => {
        if (!searchNum) return;
        setLoading(true);
        setError('');
        try {
            const res = await api.get('/accounts');
            const found = res.data.find(a => String(a.acc_num) === String(searchNum));
            if (!found) throw new Error('Account not found');
            loadDetails(found);
        } catch(e) {
            setError(e.message || 'Failed to load');
            setSelected(null);
        } finally { setLoading(false); }
    };

    const sc = selected ? (STATUS_COLOR[selected.status] || STATUS_COLOR.inactive) : null;

    return (
        <>
            <Navbar active="accounts" />
            <div className="page-wrapper">
                <div className="container" style={{ maxWidth: '860px' }}>
                    <div className="page-header">
                        <div className="breadcrumb-row">
                            <Link to="/">Dashboard</Link> <span>›</span> Accounts <span>›</span> {isCustomer ? 'My Account' : 'View'}
                        </div>
                        <h1>{isCustomer ? 'My Accounts' : 'Account Details'}</h1>
                        {isCustomer && <div className="subtitle">Your linked bank accounts and recent activity</div>}
                    </div>

                    {/* ── Staff search bar ── */}
                    {!isCustomer && (
                        <div className="bc-form-card" style={{ marginBottom: '24px' }}>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <input type="number" className="form-control form-control-lg"
                                    placeholder="Enter Account Number"
                                    value={searchNum} onChange={e => setSearchNum(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                                    style={{ flex: 1 }} />
                                <button className="bc-btn bc-btn-primary bc-btn-lg" onClick={handleSearch}>Search →</button>
                            </div>
                        </div>
                    )}

                    {/* ── Customer: account tab selector (if multiple) ── */}
                    {isCustomer && accounts.length > 1 && (
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
                            {accounts.map(acc => (
                                <button key={acc.acc_num}
                                    onClick={() => loadDetails(acc)}
                                    style={{
                                        padding: '8px 20px', borderRadius: '999px', fontWeight: 700, fontSize: '0.85rem',
                                        cursor: 'pointer', transition: 'all 0.15s',
                                        background: selected?.acc_num === acc.acc_num ? '#002244' : 'white',
                                        color:      selected?.acc_num === acc.acc_num ? 'white' : '#002244',
                                        border: `2px solid ${selected?.acc_num === acc.acc_num ? '#002244' : '#EEF1F4'}`,
                                    }}>
                                    #{acc.acc_num} · {acc.acc_type?.charAt(0).toUpperCase() + acc.acc_type?.slice(1)}
                                </button>
                            ))}
                        </div>
                    )}

                    {loading && <div style={{ textAlign: 'center', padding: '60px' }}><div className="bc-spinner">Loading...</div></div>}
                    {error   && <div className="bc-alert bc-alert-danger">⚠️ {error}</div>}

                    {/* ── Account hero card ── */}
                    {selected && !loading && (
                        <>
                            <div className="account-hero-card mb-4">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
                                    <div>
                                        <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)', marginBottom: '6px' }}>Account Number</div>
                                        <div style={{ fontSize: '1.8rem', fontWeight: 700, letterSpacing: '2px' }}>{selected.acc_num}</div>
                                        {selected.vpa && (
                                            <div style={{ marginTop: '6px', fontSize: '0.85rem', color: '#00AEEF', fontWeight: 600 }}>
                                                📱 {selected.vpa}
                                            </div>
                                        )}
                                    </div>
                                    <span style={{ background: sc.bg, color: sc.color, padding: '5px 14px', borderRadius: '20px', fontWeight: 700, fontSize: '0.8rem' }}>
                                        {selected.status?.toUpperCase()}
                                    </span>
                                </div>

                                <div style={{ marginTop: '24px', position: 'relative', zIndex: 1 }}>
                                    <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)', marginBottom: '4px' }}>Available Balance</div>
                                    <div style={{ fontSize: '2.6rem', fontWeight: 800, color: '#00AEEF' }}>
                                        ₹{parseFloat(selected.balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </div>
                                </div>
                            </div>

                            {/* ── Account details grid ── */}
                            <div className="bc-form-card" style={{ marginBottom: '24px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '20px' }}>
                                    {[
                                        { label: 'Account Type',  value: selected.acc_type?.charAt(0).toUpperCase() + selected.acc_type?.slice(1) },
                                        { label: 'Branch ID',     value: `BR-${selected.branch_id}` },
                                        { label: 'Opened On',     value: selected.open_date ? new Date(selected.open_date + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—' },
                                        { label: 'Account Holder',value: selected.customer_name || user.username || '—' },
                                    ].map(item => (
                                        <div key={item.label}>
                                            <div style={{ fontSize: '0.72rem', color: '#9BA8B3', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600, marginBottom: '4px' }}>{item.label}</div>
                                            <div style={{ fontWeight: 700, color: '#002244' }}>{item.value}</div>
                                        </div>
                                    ))}
                                    {selected.vpa && (
                                        <div style={{ gridColumn: 'span 2' }}>
                                            <div style={{ fontSize: '0.72rem', color: '#9BA8B3', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600, marginBottom: '4px' }}>UPI VPA</div>
                                            <code style={{ background: '#e0f5ff', color: '#007BB5', padding: '4px 12px', borderRadius: '8px', fontWeight: 700, fontSize: '1rem' }}>{selected.vpa}</code>
                                        </div>
                                    )}
                                </div>

                                {/* Quick action buttons */}
                                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #EEF1F4' }}>
                                    <Link to={`/deposit_withdraw?acc=${selected.acc_num}`} className="bc-btn bc-btn-primary bc-btn-sm">💰 Deposit / Withdraw</Link>
                                    <Link to="/fund_transfer" className="bc-btn bc-btn-outline bc-btn-sm">🔁 Fund Transfer</Link>
                                    <Link to="/upi_transfer" className="bc-btn bc-btn-outline bc-btn-sm">📱 UPI Transfer</Link>
                                    <Link to="/view_transactions" className="bc-btn bc-btn-outline bc-btn-sm">📋 Full History</Link>
                                </div>
                            </div>

                            {/* ── Recent transactions ── */}
                            {txnLoading ? (
                                <div style={{ textAlign: 'center', padding: '30px', color: '#9BA8B3' }}>Loading transactions...</div>
                            ) : transactions.length > 0 ? (
                                <div className="bc-table-wrap">
                                    <div className="bc-table-toolbar">
                                        <h5>Recent Transactions</h5>
                                        <Link to="/view_transactions" style={{ fontSize: '0.85rem', color: '#00AEEF', fontWeight: 600, textDecoration: 'none' }}>View All →</Link>
                                    </div>
                                    <table className="bc-table">
                                        <thead>
                                            <tr><th>ID</th><th>Type</th><th>Amount</th><th>Status</th><th>Date & Time</th></tr>
                                        </thead>
                                        <tbody>
                                            {transactions.map(t => {
                                                const isCredit = t.type === 'deposit';
                                                return (
                                                    <tr key={t.id}>
                                                        <td style={{ color: '#546E7A', fontWeight: 600 }}>#{t.id}</td>
                                                        <td><span className={`bc-badge bc-badge-${t.type === 'deposit' ? 'success' : t.type === 'upi' ? 'info' : 'warning'}`}>{t.type?.toUpperCase()}</span></td>
                                                        <td style={{ fontWeight: 700, color: isCredit ? '#00843D' : '#DA291C' }}>
                                                            {isCredit ? '+' : '−'} ₹{Number(t.amount).toLocaleString('en-IN')}
                                                        </td>
                                                        <td><span className={`bc-badge ${t.status === 'success' ? 'bc-badge-success' : 'bc-badge-gray'}`}>{t.status}</span></td>
                                                        <td style={{ color: '#546E7A', fontSize: '0.85rem' }}>{new Date(t.timestamp).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '40px', color: '#9BA8B3' }}>
                                    <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📭</div>
                                    <div>No transactions yet for this account.</div>
                                </div>
                            )}
                        </>
                    )}

                    {/* Customer with no account */}
                    {isCustomer && !loading && accounts.length === 0 && !error && (
                        <div style={{ textAlign: 'center', padding: '80px 20px', color: '#9BA8B3' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🏦</div>
                            <div style={{ fontWeight: 600, color: '#002244', fontSize: '1.1rem' }}>No account linked yet</div>
                            <div style={{ marginTop: '6px' }}>Please contact your branch to open an account.</div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};
export default ViewAccount;
