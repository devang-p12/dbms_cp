import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../services/api';

const ATMWithdraw = () => {
    const navigate = useNavigate();
    const [myAccounts, setMyAccounts] = useState([]);
    const [selectedAcc, setSelectedAcc] = useState('');
    const [pin, setPin] = useState('');
    const [amount, setAmount] = useState('');
    const [cardNo, setCardNo] = useState('');
    const [atmId] = useState('ATM-FV-001');
    const [msg, setMsg] = useState({ text: '', type: '' });
    const [loading, setLoading] = useState(false);
    const [receipt, setReceipt] = useState(null);

    const user = JSON.parse(localStorage.getItem('user') || '{}');

    useEffect(() => {
        api.get('/accounts').then(res => {
            setMyAccounts(res.data);
            if (user.role === 'CUSTOMER' && res.data.length >= 1)
                setSelectedAcc(String(res.data[0].acc_num));
        }).catch(() => {});
    }, []);

    const fromAccount = myAccounts.find(a => String(a.acc_num) === selectedAcc);
    const isFlagged = Number(amount) > 50000;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedAcc) return setMsg({ text: 'Please select an account', type: 'danger' });
        if (!pin || pin.length !== 4) return setMsg({ text: 'ATM PIN must be exactly 4 digits', type: 'danger' });
        if (!amount || Number(amount) < 100) return setMsg({ text: 'Minimum withdrawal is ₹100', type: 'danger' });
        if (Number(amount) % 100 !== 0) return setMsg({ text: 'Amount must be in multiples of ₹100', type: 'danger' });
        if (fromAccount && Number(amount) > Number(fromAccount.balance))
            return setMsg({ text: `Insufficient balance. Available: ₹${Number(fromAccount.balance).toLocaleString()}`, type: 'danger' });

        setLoading(true);
        setMsg({ text: '', type: '' });
        try {
            const res = await api.post('/transactions/atm', {
                acc_num: selectedAcc,
                amount: Number(amount),
                card_no: cardNo || 'XXXX',
                atm_id: atmId,
                atm_pin: pin
            });
            setReceipt({
                accNum: selectedAcc,
                holderName: fromAccount?.customer_name,
                amount: Number(amount),
                prevBalance: Number(fromAccount?.balance),
                newBalance: Number(fromAccount?.balance) - Number(amount),
                flagged: res.data.flagged,
                time: new Date().toLocaleString(),
                atmId
            });
        } catch (err) {
            setMsg({ text: err.response?.data?.error || 'ATM transaction failed', type: 'danger' });
        } finally {
            setLoading(false);
        }
    };

    // Receipt screen
    if (receipt) {
        return (
            <>
                <Navbar active="payments" />
                <div className="page-wrapper">
                    <div className="container" style={{ maxWidth: '460px' }}>
                        <div style={{
                            background: 'white', borderRadius: '20px', padding: '40px',
                            boxShadow: '0 8px 40px rgba(0,34,68,0.10)', border: '1px solid #EEF1F4', textAlign: 'center'
                        }}>
                            <div style={{ fontSize: '3.5rem', marginBottom: '12px' }}>{receipt.flagged ? '🚩' : '🏧'}</div>
                            <h2 style={{ color: '#002244' }}>
                                {receipt.flagged ? 'Transaction Flagged' : 'Cash Dispensed!'}
                            </h2>
                            {receipt.flagged && (
                                <div className="bc-alert bc-alert-warning" style={{ marginBottom: '12px', fontSize: '0.85rem' }}>
                                    ⚠️ High-value withdrawal flagged for review. Balance not deducted yet.
                                </div>
                            )}
                            <div style={{
                                background: receipt.flagged ? '#fff4e5' : '#e0f5ff',
                                borderRadius: '12px', padding: '20px', margin: '16px 0',
                                fontSize: '2rem', fontWeight: 800,
                                color: receipt.flagged ? '#DA291C' : '#002244'
                            }}>
                                ₹{receipt.amount.toLocaleString('en-IN')}
                            </div>

                            <div style={{ textAlign: 'left', fontSize: '0.88rem', borderTop: '1px solid #EEF1F4', paddingTop: '16px' }}>
                                {[
                                    ['Account', `#${receipt.accNum}`],
                                    ['Card Holder', receipt.holderName || '—'],
                                    ['ATM ID', receipt.atmId],
                                    ...(!receipt.flagged ? [
                                        ['Previous Balance', `₹${receipt.prevBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`],
                                        ['Remaining Balance', `₹${receipt.newBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`],
                                    ] : []),
                                    ['Date & Time', receipt.time],
                                ].map(([label, val]) => (
                                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f5f7fa' }}>
                                        <span style={{ color: '#546E7A' }}>{label}</span>
                                        <span style={{ fontWeight: 600, color: '#002244' }}>{val}</span>
                                    </div>
                                ))}
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '24px' }}>
                                <button className="bc-btn bc-btn-primary bc-btn-full"
                                    onClick={() => { setReceipt(null); setPin(''); setAmount(''); setCardNo(''); setMsg({ text: '', type: '' }); }}>
                                    New Withdrawal
                                </button>
                                <Link to="/" className="bc-btn bc-btn-outline bc-btn-full">← Back to Dashboard</Link>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Navbar active="payments" />
            <div className="page-wrapper">
                <div className="container" style={{ maxWidth: '580px' }}>
                    <div className="page-header">
                        <div className="breadcrumb-row">
                            <Link to="/">Dashboard</Link> <span>›</span> Payments <span>›</span> ATM Withdrawal
                        </div>
                        <h1>ATM Withdrawal</h1>
                        <div className="subtitle">Simulate cash withdrawal via ATM</div>
                    </div>

                    {msg.text && <div className={`bc-alert bc-alert-${msg.type}`}>
                        {msg.type === 'success' ? '✅ ' : '⚠️ '}{msg.text}
                    </div>}

                    <div className="bc-form-card">
                        <form onSubmit={handleSubmit}>
                            <div className="row g-4">

                                {/* Account */}
                                <div className="col-12">
                                    <label className="form-label">Account *</label>
                                    {user.role === 'CUSTOMER' && myAccounts.length === 1 && fromAccount ? (
                                        <div style={{ background: '#e0f5ff', border: '1px solid #00AEEF', borderRadius: '12px', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <div style={{ fontWeight: 700, color: '#002244' }}>{fromAccount.customer_name || user.username}</div>
                                                <div style={{ fontSize: '0.8rem', color: '#546E7A' }}>ACC #{fromAccount.acc_num}</div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontSize: '0.72rem', color: '#546E7A' }}>Balance</div>
                                                <div style={{ fontWeight: 800, color: '#002244', fontSize: '1.1rem' }}>₹{Number(fromAccount.balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                                            </div>
                                        </div>
                                    ) : (
                                        <select className="form-select" value={selectedAcc}
                                            onChange={e => setSelectedAcc(e.target.value)} required>
                                            <option value="">— Select account —</option>
                                            {myAccounts.map(a => (
                                                <option key={a.acc_num} value={a.acc_num}>
                                                    ACC #{a.acc_num} {a.customer_name ? `· ${a.customer_name}` : ''} — ₹{Number(a.balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                </div>

                                {/* Card last 4 */}
                                <div className="col-md-6">
                                    <label className="form-label">Card Last 4 Digits</label>
                                    <input type="text" className="form-control" maxLength="4" placeholder="1234"
                                        value={cardNo} onChange={e => setCardNo(e.target.value.replace(/\D/g, ''))}
                                        style={{ letterSpacing: '4px', fontWeight: 700, fontSize: '1.1rem' }} />
                                </div>

                                {/* ATM PIN */}
                                <div className="col-md-6">
                                    <label className="form-label">ATM PIN *</label>
                                    <input type="password" className="form-control" required maxLength="4" placeholder="••••"
                                        value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
                                        style={{ letterSpacing: '8px', fontWeight: 700, fontSize: '1.2rem', textAlign: 'center' }} />
                                    <div className="form-text">4-digit PIN</div>
                                </div>

                                {/* Amount */}
                                <div className="col-12">
                                    <label className="form-label">Amount (₹) *</label>
                                    <input type="number" className="form-control form-control-lg" required
                                        min="100" step="100" placeholder="500"
                                        value={amount} onChange={e => setAmount(e.target.value)}
                                        style={{ fontSize: '1.8rem', fontWeight: 700, color: '#002244' }} />
                                    {/* Quick amounts */}
                                    <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                                        {[500, 1000, 2000, 5000, 10000].map(v => (
                                            <button key={v} type="button"
                                                className={`bc-btn bc-btn-sm ${Number(amount) === v ? 'bc-btn-primary' : 'bc-btn-outline'}`}
                                                onClick={() => setAmount(String(v))}>
                                                ₹{v.toLocaleString()}
                                            </button>
                                        ))}
                                    </div>
                                    {fromAccount && amount && (
                                        <div className="form-text" style={{ color: Number(amount) > Number(fromAccount.balance) ? '#DA291C' : isFlagged ? '#E65100' : '#00843D', fontWeight: 600, marginTop: '6px' }}>
                                            {Number(amount) > Number(fromAccount.balance)
                                                ? `⚠️ Exceeds balance by ₹${(Number(amount) - Number(fromAccount.balance)).toLocaleString()}`
                                                : isFlagged
                                                    ? '🚩 Amount > ₹50,000 will be flagged for fraud review'
                                                    : `✓ Remaining: ₹${(Number(fromAccount.balance) - Number(amount)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                                            }
                                        </div>
                                    )}
                                </div>

                                <div className="col-12">
                                    <button type="submit" className="bc-btn bc-btn-primary bc-btn-full bc-btn-lg" disabled={loading}>
                                        {loading ? 'Processing...' : '🏧 Withdraw Cash →'}
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
export default ATMWithdraw;
