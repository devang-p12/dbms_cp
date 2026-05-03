import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../services/api';

const COMMON_MERCHANTS = ['Amazon', 'Flipkart', 'Swiggy', 'Zomato', 'BigBasket', 'Uber', 'Ola', 'Myntra'];

const CardPayment = () => {
    const navigate = useNavigate();
    const [myAccounts, setMyAccounts] = useState([]);
    const [selectedAcc, setSelectedAcc] = useState('');
    const [cardLast4, setCardLast4] = useState('');
    const [merchant, setMerchant] = useState('');
    const [amount, setAmount] = useState('');
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedAcc) return setMsg({ text: 'Please select an account', type: 'danger' });
        if (!amount || Number(amount) <= 0) return setMsg({ text: 'Enter a valid amount', type: 'danger' });
        if (fromAccount && Number(amount) > Number(fromAccount.balance))
            return setMsg({ text: `Insufficient balance. Available: ₹${Number(fromAccount.balance).toLocaleString()}`, type: 'danger' });

        setLoading(true);
        setMsg({ text: '', type: '' });
        try {
            await api.post('/transactions/card', {
                acc_num: selectedAcc,
                amount: Number(amount),
                merch_id: merchant || 'MERCHANT',
                card_last4: cardLast4 || '0000'
            });
            setReceipt({
                accNum: selectedAcc,
                holderName: fromAccount?.customer_name,
                amount: Number(amount),
                merchant: merchant || 'MERCHANT',
                cardLast4: cardLast4,
                prevBalance: Number(fromAccount?.balance),
                newBalance: Number(fromAccount?.balance) - Number(amount),
                time: new Date().toLocaleString()
            });
        } catch (err) {
            setMsg({ text: err.response?.data?.error || 'Card payment failed', type: 'danger' });
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
                            <div style={{ fontSize: '3.5rem', marginBottom: '12px' }}>💳</div>
                            <h2 style={{ color: '#002244' }}>Payment Successful!</h2>
                            <div style={{ background: '#e6f9f0', borderRadius: '12px', padding: '20px', margin: '16px 0', fontSize: '2rem', fontWeight: 800, color: '#00843D' }}>
                                ₹{receipt.amount.toLocaleString('en-IN')}
                            </div>

                            {/* Merchant chip */}
                            <div style={{ background: '#f5f7fa', borderRadius: '10px', padding: '10px 20px', marginBottom: '16px', display: 'inline-block' }}>
                                <span style={{ color: '#546E7A', fontSize: '0.8rem' }}>Paid to</span>
                                <span style={{ fontWeight: 700, color: '#002244', marginLeft: '8px', fontSize: '1rem' }}>{receipt.merchant}</span>
                            </div>

                            <div style={{ textAlign: 'left', fontSize: '0.88rem', borderTop: '1px solid #EEF1F4', paddingTop: '16px' }}>
                                {[
                                    ['Account', `#${receipt.accNum}`],
                                    ['Card Holder', receipt.holderName || '—'],
                                    ...(receipt.cardLast4 ? [['Card', `**** **** **** ${receipt.cardLast4}`]] : []),
                                    ['Previous Balance', `₹${receipt.prevBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`],
                                    ['Remaining Balance', `₹${receipt.newBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`],
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
                                    onClick={() => { setReceipt(null); setAmount(''); setMerchant(''); setCardLast4(''); setMsg({ text: '', type: '' }); }}>
                                    New Payment
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
                            <Link to="/">Dashboard</Link> <span>›</span> Payments <span>›</span> Card Payment
                        </div>
                        <h1>Card Payment</h1>
                        <div className="subtitle">Process a POS / online card transaction</div>
                    </div>

                    {msg.text && <div className={`bc-alert bc-alert-${msg.type}`}>
                        {msg.type === 'success' ? '✅ ' : '⚠️ '}{msg.text}
                    </div>}

                    <div className="bc-form-card">
                        <form onSubmit={handleSubmit}>
                            <div className="row g-4">

                                {/* Account */}
                                <div className="col-12">
                                    <label className="form-label">Linked Account *</label>
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
                                    <label className="form-label">Card Last 4 Digits <span style={{ color: '#9BA8B3', fontWeight: 400 }}>(optional)</span></label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ color: '#9BA8B3', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>**** ****</span>
                                        <input type="text" className="form-control" maxLength="4" placeholder="e.g. 5678"
                                            value={cardLast4} onChange={e => setCardLast4(e.target.value.replace(/\D/g, ''))}
                                            style={{ letterSpacing: '4px', fontWeight: 700, fontSize: '1.1rem' }} />
                                    </div>
                                    <div className="form-text">For receipt only — not validated. Enter any 4 digits.</div>
                                </div>

                                {/* Merchant */}
                                <div className="col-md-6">
                                    <label className="form-label">Merchant / Payee</label>
                                    <input type="text" className="form-control" placeholder="e.g. Amazon"
                                        value={merchant} onChange={e => setMerchant(e.target.value)} list="merchantList" />
                                    <datalist id="merchantList">
                                        {COMMON_MERCHANTS.map(m => <option key={m} value={m} />)}
                                    </datalist>
                                    <div className="form-text">Start typing or pick a common merchant</div>
                                </div>

                                {/* Amount */}
                                <div className="col-12">
                                    <label className="form-label">Amount (₹) *</label>
                                    <input type="number" className="form-control form-control-lg" required
                                        min="1" step="0.01" placeholder="0.00"
                                        value={amount} onChange={e => setAmount(e.target.value)}
                                        style={{ fontSize: '1.8rem', fontWeight: 700, color: '#002244' }} />
                                    {fromAccount && amount > 0 && (
                                        <div className="form-text" style={{ color: Number(amount) > Number(fromAccount.balance) ? '#DA291C' : '#00843D', fontWeight: 600 }}>
                                            {Number(amount) > Number(fromAccount.balance)
                                                ? `⚠️ Exceeds balance by ₹${(Number(amount) - Number(fromAccount.balance)).toLocaleString()}`
                                                : `✓ Remaining: ₹${(Number(fromAccount.balance) - Number(amount)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                                            }
                                        </div>
                                    )}
                                </div>

                                <div className="col-12">
                                    <button type="submit" className="bc-btn bc-btn-primary bc-btn-full bc-btn-lg" disabled={loading}>
                                        {loading ? 'Processing...' : '💳 Pay Now →'}
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
export default CardPayment;
