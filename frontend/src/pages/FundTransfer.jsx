import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../services/api';

const FundTransfer = () => {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isCustomer = user.role === 'CUSTOMER';

    const [allAccounts, setAllAccounts] = useState([]);
    const [myAccounts, setMyAccounts] = useState([]);
    const [destAccounts, setDestAccounts] = useState([]);

    // FROM account
    const [fromAcc, setFromAcc] = useState('');
    const [fromData, setFromData] = useState(null);
    // TO account
    const [toAcc, setToAcc] = useState('');
    const [toData, setToData] = useState(null);

    const [amount, setAmount] = useState('');
    const [msg, setMsg] = useState({ text: '', type: '' });
    const [loading, setLoading] = useState(false);
    const [receipt, setReceipt] = useState(null);

    useEffect(() => {
        api.get('/accounts').then(res => {
            setAllAccounts(res.data);
            setMyAccounts(res.data);
            if (!isCustomer) {
                setDestAccounts(res.data);
            }
            // Auto-select for customers
            if (isCustomer && res.data.length >= 1) {
                setFromAcc(String(res.data[0].acc_num));
                setFromData(res.data[0]);
            }
        }).catch(() => {});

        if (isCustomer) {
            api.get('/accounts/vpa').then(res => {
                setDestAccounts(res.data);
            }).catch(() => {});
        }
    }, [isCustomer]);

    const handleFromSelect = (val) => {
        setFromAcc(val);
        if (!val) setFromData(null);
        else setFromData((isCustomer ? myAccounts : allAccounts).find(a => String(a.acc_num) === String(val)) || null);
        setMsg({ text: '', type: '' });
    };

    const handleToSelect = (val) => {
        setToAcc(val);
        if (!val) setToData(null);
        else setToData(destAccounts.find(a => String(a.acc_num) === String(val)) || null);
        setMsg({ text: '', type: '' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!fromData) return setMsg({ text: 'Source account not found', type: 'danger' });
        if (!toData) return setMsg({ text: 'Destination account not found', type: 'danger' });
        if (String(fromAcc) === String(toAcc)) return setMsg({ text: 'Source and destination cannot be the same', type: 'danger' });
        if (!amount || Number(amount) <= 0) return setMsg({ text: 'Enter a valid amount', type: 'danger' });
        if (Number(amount) > Number(fromData.balance)) return setMsg({ text: `Insufficient balance. Available: ₹${Number(fromData.balance).toLocaleString()}`, type: 'danger' });

        setLoading(true);
        setMsg({ text: '', type: '' });
        try {
            await api.post('/transactions/transfer', { from_acc: fromAcc, to_acc: toAcc, amount: Number(amount) });
            setReceipt({
                fromAcc, toAcc,
                fromName: fromData.customer_name,
                toName: toData.customer_name,
                amount: Number(amount),
                prevBalance: Number(fromData.balance),
                newBalance: Number(fromData.balance) - Number(amount),
                time: new Date().toLocaleString()
            });
        } catch (err) {
            setMsg({ text: err.response?.data?.error || 'Transfer failed', type: 'danger' });
        } finally {
            setLoading(false);
        }
    };

    const reset = () => {
        setReceipt(null); setToAcc(''); setToData(null); setAmount(''); setMsg({ text: '', type: '' });
        if (!isCustomer) { setFromAcc(''); setFromData(null); }
    };

    // ── Receipt ──────────────────────────────────────────────────────────────
    if (receipt) {
        return (
            <>
                <Navbar active="payments" />
                <div className="page-wrapper">
                    <div className="container" style={{ maxWidth: '480px' }}>
                        <div style={{ background: 'white', borderRadius: '20px', padding: '40px', boxShadow: '0 8px 40px rgba(0,34,68,0.10)', border: '1px solid #EEF1F4', textAlign: 'center' }}>
                            <div style={{ fontSize: '3.5rem', marginBottom: '12px' }}>🔄</div>
                            <h2 style={{ color: '#002244' }}>Transfer Successful!</h2>
                            <div style={{ background: '#e0f5ff', borderRadius: '12px', padding: '20px', margin: '20px 0', fontSize: '2rem', fontWeight: 800, color: '#002244' }}>
                                ₹{receipt.amount.toLocaleString('en-IN')}
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '20px' }}>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.72rem', color: '#546E7A' }}>FROM</div>
                                    <div style={{ fontWeight: 700, color: '#002244' }}>ACC #{receipt.fromAcc}</div>
                                    <div style={{ fontSize: '0.78rem', color: '#9BA8B3' }}>{receipt.fromName || '—'}</div>
                                </div>
                                <div style={{ fontSize: '1.5rem', color: '#00AEEF' }}>→</div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.72rem', color: '#546E7A' }}>TO</div>
                                    <div style={{ fontWeight: 700, color: '#002244' }}>ACC #{receipt.toAcc}</div>
                                    <div style={{ fontSize: '0.78rem', color: '#9BA8B3' }}>{receipt.toName || '—'}</div>
                                </div>
                            </div>

                            <div style={{ textAlign: 'left', fontSize: '0.88rem', borderTop: '1px solid #EEF1F4', paddingTop: '16px' }}>
                                {[
                                    ['Previous Balance', `₹${receipt.prevBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`],
                                    ['Your New Balance', `₹${receipt.newBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`],
                                    ['Date & Time', receipt.time],
                                ].map(([label, val]) => (
                                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f5f7fa' }}>
                                        <span style={{ color: '#546E7A' }}>{label}</span>
                                        <span style={{ fontWeight: 600, color: '#002244' }}>{val}</span>
                                    </div>
                                ))}
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '24px' }}>
                                <button className="bc-btn bc-btn-primary bc-btn-full" onClick={reset}>New Transfer</button>
                                <Link to="/" className="bc-btn bc-btn-outline bc-btn-full">← Back to Dashboard</Link>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    // ── Form ─────────────────────────────────────────────────────────────────
    return (
        <>
            <Navbar active="payments" />
            <div className="page-wrapper">
                <div className="container" style={{ maxWidth: '620px' }}>
                    <div className="page-header">
                        <div className="breadcrumb-row">
                            <Link to="/">Dashboard</Link> <span>›</span> Payments <span>›</span> Fund Transfer
                        </div>
                        <h1>Fund Transfer</h1>
                        <div className="subtitle">Transfer money between FinVault accounts</div>
                    </div>

                    {msg.text && <div className={`bc-alert bc-alert-${msg.type}`}>⚠️ {msg.text}</div>}

                    <div className="bc-form-card">
                        <form onSubmit={handleSubmit}>
                            <div className="row g-4">

                                {/* FROM account */}
                                <div className="col-12">
                                    <label className="form-label">From Account *</label>

                                    {isCustomer ? (
                                        /* Customer: read-only card (1 acc) or dropdown (multiple) */
                                        myAccounts.length === 1 && fromData ? (
                                            <div style={{ background: '#e0f5ff', border: '1px solid #00AEEF', borderRadius: '12px', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                    <div style={{ fontWeight: 700, color: '#002244' }}>{fromData.customer_name || user.username}</div>
                                                    <div style={{ fontSize: '0.8rem', color: '#546E7A' }}>ACC #{fromData.acc_num} · {fromData.vpa}</div>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ fontSize: '0.72rem', color: '#546E7A' }}>Balance</div>
                                                    <div style={{ fontWeight: 800, color: '#002244', fontSize: '1.1rem' }}>₹{Number(fromData.balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                                                </div>
                                            </div>
                                        ) : (
                                            <select className="form-select" value={fromAcc}
                                                onChange={e => handleFromSelect(e.target.value)} required>
                                                <option value="">— Select your account —</option>
                                                {myAccounts.map(a => (
                                                    <option key={a.acc_num} value={a.acc_num}>
                                                        ACC #{a.acc_num} — ₹{Number(a.balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                    </option>
                                                ))}
                                            </select>
                                        )
                                    ) : (
                                        /* Staff: dropdown of all accounts */
                                        <>
                                            <select className="form-select" value={fromAcc}
                                                onChange={e => handleFromSelect(e.target.value)}>
                                                <option value="">— Select source account —</option>
                                                {allAccounts.map(a => (
                                                    <option key={a.acc_num} value={a.acc_num}>
                                                        ACC #{a.acc_num} {a.customer_name ? `· ${a.customer_name}` : ''} — ₹{Number(a.balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                    </option>
                                                ))}
                                            </select>
                                            {fromData && (
                                                <div style={{ marginTop: '8px', background: '#e0f5ff', border: '1px solid #00AEEF', borderRadius: '10px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between' }}>
                                                    <div>
                                                        <div style={{ fontWeight: 700, color: '#002244' }}>{fromData.customer_name || '—'}</div>
                                                        <div style={{ fontSize: '0.8rem', color: '#546E7A', textTransform: 'capitalize' }}>{fromData.acc_type} · {fromData.status}</div>
                                                    </div>
                                                    <div style={{ textAlign: 'right' }}>
                                                        <div style={{ fontSize: '0.75rem', color: '#546E7A' }}>Balance</div>
                                                        <div style={{ fontWeight: 800, color: '#002244' }}>₹{Number(fromData.balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>

                                <div className="col-12" style={{ textAlign: 'center', fontSize: '1.5rem', margin: '-8px 0', color: '#00AEEF' }}>⬇</div>

                                {/* TO account — dropdown for all roles */}
                                <div className="col-12">
                                    <label className="form-label">To Account *</label>
                                    <select className="form-select" value={toAcc}
                                        onChange={e => handleToSelect(e.target.value)} required>
                                        <option value="">— Select destination account —</option>
                                        {destAccounts.filter(a => String(a.acc_num) !== String(fromAcc)).map(a => (
                                            <option key={a.acc_num} value={a.acc_num}>
                                                ACC #{a.acc_num} {a.customer_name ? `· ${a.customer_name}` : ''} — {a.vpa || ''}
                                            </option>
                                        ))}
                                    </select>
                                    {toData && (
                                        <div style={{ marginTop: '8px', background: '#e6f9f0', border: '1px solid #00843D', borderRadius: '10px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between' }}>
                                            <div>
                                                <div style={{ fontWeight: 700, color: '#002244' }}>{toData.customer_name || '—'}</div>
                                                <div style={{ fontSize: '0.8rem', color: '#546E7A', textTransform: 'capitalize' }}>{toData.acc_type} · {toData.status}</div>
                                            </div>
                                            <div style={{ fontSize: '0.8rem', color: '#00AEEF', fontWeight: 600 }}>
                                                {toData.vpa || ''}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Amount */}
                                <div className="col-12">
                                    <label className="form-label">Amount (₹) *</label>
                                    <input type="number" className="form-control form-control-lg" required
                                        min="1" step="0.01" placeholder="0.00" value={amount}
                                        onChange={e => setAmount(e.target.value)}
                                        style={{ fontSize: '1.8rem', fontWeight: 700, color: '#002244' }} />
                                    {fromData && amount > 0 && (
                                        <div className="form-text" style={{ color: Number(amount) > Number(fromData.balance) ? '#DA291C' : '#00843D', fontWeight: 600 }}>
                                            {Number(amount) > Number(fromData.balance)
                                                ? `⚠️ Exceeds balance by ₹${(Number(amount) - Number(fromData.balance)).toLocaleString()}`
                                                : `✓ Balance after: ₹${(Number(fromData.balance) - Number(amount)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                                            }
                                        </div>
                                    )}
                                </div>

                                <div className="col-12">
                                    <button type="submit" className="bc-btn bc-btn-primary bc-btn-full bc-btn-lg" disabled={loading}>
                                        {loading ? 'Processing...' : 'Confirm Transfer →'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
};
export default FundTransfer;
