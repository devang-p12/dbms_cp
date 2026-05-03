import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../services/api';

const DepositWithdraw = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isCustomer = user.role === 'CUSTOMER';

    const [myAccounts, setMyAccounts] = useState([]);
    const [accNum, setAccNum] = useState(searchParams.get('acc') || '');
    const [accData, setAccData] = useState(null);
    const [txnType, setTxnType] = useState('deposit');
    const [amount, setAmount] = useState('');
    const [msg, setMsg] = useState({ text: '', type: '' });
    const [loading, setLoading] = useState(false);
    const [receipt, setReceipt] = useState(null);
    const [allAccounts, setAllAccounts] = useState([]);

    useEffect(() => {
        api.get('/accounts').then(res => {
            setAllAccounts(res.data);
            setMyAccounts(res.data);
            // For customers: auto-select their first account
            if (isCustomer && res.data.length >= 1) {
                const firstAcc = res.data[0];
                setAccNum(String(firstAcc.acc_num));
                setAccData(firstAcc);
            } else if (searchParams.get('acc')) {
                // Pre-fill from URL param (e.g. from ViewCustomers "Deposit" button)
                const preAcc = res.data.find(a => String(a.acc_num) === searchParams.get('acc'));
                if (preAcc) { setAccNum(String(preAcc.acc_num)); setAccData(preAcc); }
            }
        }).catch(() => {});
    }, []);

    const handleAccSelect = (num) => {
        setAccNum(num);
        const acc = allAccounts.find(a => String(a.acc_num) === String(num));
        setAccData(acc || null);
        setMsg({ text: '', type: '' });
    };

    const handleAccBlur = () => {
        const acc = allAccounts.find(a => String(a.acc_num) === String(accNum));
        setAccData(acc || null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!accData) return setMsg({ text: 'Please select a valid account', type: 'danger' });
        if (!amount || Number(amount) <= 0) return setMsg({ text: 'Enter a valid amount', type: 'danger' });
        if (txnType === 'withdraw' && Number(amount) > Number(accData.balance))
            return setMsg({ text: `Insufficient balance. Available: ₹${Number(accData.balance).toLocaleString()}`, type: 'danger' });

        setLoading(true);
        setMsg({ text: '', type: '' });
        try {
            await api.post(`/transactions/${txnType}`, { acc_num: accNum, amount: Number(amount) });
            const newBalance = txnType === 'deposit'
                ? Number(accData.balance) + Number(amount)
                : Number(accData.balance) - Number(amount);
            setReceipt({
                txnType, amount: Number(amount), accNum,
                customerName: accData.customer_name,
                prevBalance: Number(accData.balance),
                newBalance,
                time: new Date().toLocaleString()
            });
            setAccData({ ...accData, balance: newBalance });
            setAmount('');
        } catch (err) {
            setMsg({ text: err.response?.data?.error || 'Transaction failed', type: 'danger' });
        } finally {
            setLoading(false);
        }
    };

    // ── Receipt ─────────────────────────────────────────────────────────────
    if (receipt) {
        const isDeposit = receipt.txnType === 'deposit';
        return (
            <>
                <Navbar active="payments" />
                <div className="page-wrapper">
                    <div className="container" style={{ maxWidth: '460px' }}>
                        <div style={{
                            background: 'white', borderRadius: '20px', padding: '40px',
                            boxShadow: '0 8px 40px rgba(0,34,68,0.10)', border: '1px solid #EEF1F4', textAlign: 'center'
                        }}>
                            <div style={{ fontSize: '3.5rem', marginBottom: '12px' }}>{isDeposit ? '💰' : '🏧'}</div>
                            <h2 style={{ color: '#002244' }}>{isDeposit ? 'Deposit Successful!' : 'Withdrawal Successful!'}</h2>
                            <div style={{
                                background: isDeposit ? '#e6f9f0' : '#e0f5ff',
                                borderRadius: '12px', padding: '20px', margin: '16px 0',
                                fontSize: '2rem', fontWeight: 800,
                                color: isDeposit ? '#00843D' : '#002244'
                            }}>
                                {isDeposit ? '+' : '-'} ₹{receipt.amount.toLocaleString('en-IN')}
                            </div>

                            <div style={{ textAlign: 'left', fontSize: '0.88rem', borderTop: '1px solid #EEF1F4', paddingTop: '16px' }}>
                                {[
                                    ['Account', `#${receipt.accNum}`],
                                    ['Customer', receipt.customerName || '—'],
                                    ['Previous Balance', `₹${receipt.prevBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`],
                                    ['New Balance', `₹${receipt.newBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`],
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
                                    onClick={() => { setReceipt(null); setAmount(''); setMsg({ text: '', type: '' }); }}>
                                    New Transaction
                                </button>
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
                <div className="container" style={{ maxWidth: '580px' }}>
                    <div className="page-header">
                        <div className="breadcrumb-row">
                            <Link to="/">Dashboard</Link> <span>›</span> Payments <span>›</span> Deposit / Withdraw
                        </div>
                        <h1>Deposit / Withdraw</h1>
                        <div className="subtitle">Credit or debit a FinVault account</div>
                    </div>

                    {msg.text && <div className={`bc-alert bc-alert-${msg.type}`}>
                        {msg.type === 'success' ? '✅ ' : '⚠️ '}{msg.text}
                    </div>}

                    <div className="bc-form-card">
                        <form onSubmit={handleSubmit}>
                            <div className="row g-4">

                                {/* Transaction type toggle */}
                                <div className="col-12">
                                    <label className="form-label">Transaction Type *</label>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        {[['deposit', '💰 Deposit'], ['withdraw', '🏧 Withdraw']].map(([val, label]) => (
                                            <button key={val} type="button"
                                                className={`bc-btn bc-btn-full ${txnType === val ? 'bc-btn-primary' : 'bc-btn-outline'}`}
                                                onClick={() => { setTxnType(val); setMsg({ text: '', type: '' }); }}>
                                                {label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Account selector */}
                                <div className="col-12">
                                    <label className="form-label">Account *</label>

                                    {isCustomer ? (
                                        /* CUSTOMER — dropdown of their own accounts */
                                        myAccounts.length === 1 && accData ? (
                                            <div style={{ background: '#e0f5ff', border: '1px solid #00AEEF', borderRadius: '12px', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                    <div style={{ fontWeight: 700, color: '#002244' }}>{accData.customer_name || user.username}</div>
                                                    <div style={{ fontSize: '0.8rem', color: '#546E7A', textTransform: 'capitalize' }}>ACC #{accData.acc_num} · {accData.acc_type}</div>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ fontSize: '0.72rem', color: '#546E7A' }}>Balance</div>
                                                    <div style={{ fontWeight: 800, color: '#002244', fontSize: '1.1rem' }}>₹{Number(accData.balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                                                </div>
                                            </div>
                                        ) : (
                                            <select className="form-select" value={accNum}
                                                onChange={e => handleAccSelect(e.target.value)} required>
                                                <option value="">— Select your account —</option>
                                                {myAccounts.map(a => (
                                                    <option key={a.acc_num} value={a.acc_num}>
                                                        ACC #{a.acc_num} — ₹{Number(a.balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                    </option>
                                                ))}
                                            </select>
                                        )
                                    ) : (
                                        /* STAFF — type or select from all accounts */
                                        <>
                                            <select className="form-select" value={accNum}
                                                onChange={e => handleAccSelect(e.target.value)}>
                                                <option value="">— Select account or type below —</option>
                                                {allAccounts.map(a => (
                                                    <option key={a.acc_num} value={a.acc_num}>
                                                        ACC #{a.acc_num} {a.customer_name ? `· ${a.customer_name}` : ''} — ₹{Number(a.balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                    </option>
                                                ))}
                                            </select>
                                            <div className="form-text" style={{ marginTop: '6px' }}>Or type account number directly:</div>
                                            <input type="number" className="form-control" style={{ marginTop: '6px' }}
                                                placeholder="Account Number"
                                                value={accNum} onChange={e => { setAccNum(e.target.value); setAccData(null); }}
                                                onBlur={handleAccBlur} />
                                        </>
                                    )}

                                    {/* Account info card for staff after lookup */}
                                    {!isCustomer && accData && (
                                        <div style={{ marginTop: '8px', background: '#e0f5ff', border: '1px solid #00AEEF', borderRadius: '10px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between' }}>
                                            <div>
                                                <div style={{ fontWeight: 700, color: '#002244' }}>{accData.customer_name || 'Account Holder'}</div>
                                                <div style={{ fontSize: '0.8rem', color: '#546E7A', textTransform: 'capitalize' }}>{accData.acc_type} · {accData.status}</div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontSize: '0.75rem', color: '#546E7A' }}>Balance</div>
                                                <div style={{ fontWeight: 800, color: '#002244' }}>₹{Number(accData.balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                                            </div>
                                        </div>
                                    )}
                                    {!isCustomer && accNum && !accData && <div style={{ color: '#DA291C', fontSize: '0.85rem', marginTop: '4px' }}>Account not found</div>}
                                </div>

                                {/* Amount */}
                                <div className="col-12">
                                    <label className="form-label">Amount (₹) *</label>
                                    <input type="number" className="form-control form-control-lg" required
                                        min="1" step="0.01" placeholder="0.00"
                                        value={amount} onChange={e => setAmount(e.target.value)}
                                        style={{ fontSize: '1.8rem', fontWeight: 700, color: '#002244' }} />
                                    {accData && amount > 0 && (
                                        <div className="form-text" style={{
                                            color: txnType === 'withdraw' && Number(amount) > Number(accData.balance) ? '#DA291C' : '#00843D',
                                            fontWeight: 600
                                        }}>
                                            {txnType === 'withdraw' && Number(amount) > Number(accData.balance)
                                                ? `⚠️ Exceeds balance by ₹${(Number(amount) - Number(accData.balance)).toLocaleString()}`
                                                : `✓ Balance after: ₹${(txnType === 'deposit'
                                                    ? Number(accData.balance) + Number(amount)
                                                    : Number(accData.balance) - Number(amount)
                                                ).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                                            }
                                        </div>
                                    )}
                                </div>

                                <div className="col-12">
                                    <button type="submit" className="bc-btn bc-btn-primary bc-btn-full bc-btn-lg" disabled={loading}>
                                        {loading ? 'Processing...' : txnType === 'deposit' ? '💰 Confirm Deposit →' : '🏧 Confirm Withdrawal →'}
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
export default DepositWithdraw;
