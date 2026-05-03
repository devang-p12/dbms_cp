import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../services/api';

const UPITransfer = () => {
    const navigate = useNavigate();
    const [vpaList, setVpaList] = useState([]);
    const [myAccounts, setMyAccounts] = useState([]);
    const [selectedFromAcc, setSelectedFromAcc] = useState('');
    const [search, setSearch] = useState('');
    const [selectedVpa, setSelectedVpa] = useState('');
    const [selectedRecipient, setSelectedRecipient] = useState(null);
    const [showDropdown, setShowDropdown] = useState(false);
    const [amount, setAmount] = useState('');
    const [msg, setMsg] = useState({ text: '', type: '' });
    const [loading, setLoading] = useState(false);
    const [receipt, setReceipt] = useState(null);
    const dropdownRef = useRef(null);
    const inputRef = useRef(null);

    const user = JSON.parse(localStorage.getItem('user') || '{}');

    useEffect(() => {
        api.get('/accounts/vpa').then(res => setVpaList(res.data)).catch(() => {});
        api.get('/accounts').then(res => {
            const all = res.data;
            setMyAccounts(all);
            // For CUSTOMER role: auto-select their primary account
            if (user.role === 'CUSTOMER') {
                if (all.length >= 1) setSelectedFromAcc(String(all[0].acc_num));
            } else if (all.length === 1) {
                setSelectedFromAcc(String(all[0].acc_num));
            }
        }).catch(() => {});

        const handleOutsideClick = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target) &&
                inputRef.current && !inputRef.current.contains(e.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleOutsideClick);
        return () => document.removeEventListener('mousedown', handleOutsideClick);
    }, []);

    const fromAccount = myAccounts.find(a => String(a.acc_num) === selectedFromAcc);

    const filtered = vpaList.filter(v =>
        // exclude own account
        String(v.acc_num) !== selectedFromAcc &&
        (
            v.vpa?.toLowerCase().includes(search.toLowerCase()) ||
            v.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
            String(v.acc_num).includes(search)
        )
    );

    const handleSelect = (v) => {
        setSelectedVpa(v.vpa);
        setSelectedRecipient(v);
        setSearch(`${v.customer_name} — ${v.vpa}`);
        setShowDropdown(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedFromAcc) return setMsg({ text: 'Please select your account', type: 'danger' });
        if (!selectedVpa) return setMsg({ text: 'Please select a recipient VPA', type: 'danger' });
        if (!amount || Number(amount) <= 0) return setMsg({ text: 'Enter a valid amount', type: 'danger' });
        if (fromAccount && Number(amount) > Number(fromAccount.balance))
            return setMsg({ text: `Insufficient balance. Available: ₹${Number(fromAccount.balance).toLocaleString()}`, type: 'danger' });

        setLoading(true);
        setMsg({ text: '', type: '' });
        try {
            const res = await api.post('/transactions/upi', {
                acc_num: selectedFromAcc,
                amount: Number(amount),
                vpa: selectedVpa
            });
            setReceipt({
                amount: Number(amount),
                fromAcc: selectedFromAcc,
                fromName: fromAccount?.customer_name,
                toVpa: selectedVpa,
                toName: selectedRecipient?.customer_name,
                toAcc: selectedRecipient?.acc_num,
                prevBalance: Number(fromAccount?.balance),
                newBalance: Number(fromAccount?.balance) - Number(amount),
                time: new Date().toLocaleString(),
                ref: res.data.ref || `UPI${Date.now()}`
            });
        } catch (err) {
            setMsg({ text: err.response?.data?.error || 'UPI Transfer failed', type: 'danger' });
        } finally {
            setLoading(false);
        }
    };

    // Receipt
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
                            <div style={{ fontSize: '3.5rem', marginBottom: '12px' }}>📱</div>
                            <h2 style={{ color: '#002244' }}>UPI Transfer Sent!</h2>
                            <div style={{ background: '#e0f5ff', borderRadius: '12px', padding: '20px', margin: '20px 0', fontSize: '2rem', fontWeight: 800, color: '#00843D' }}>
                                ₹{receipt.amount.toLocaleString('en-IN')}
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '20px' }}>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.72rem', color: '#546E7A', textTransform: 'uppercase' }}>From</div>
                                    <div style={{ fontWeight: 700, color: '#002244' }}>ACC #{receipt.fromAcc}</div>
                                    <div style={{ fontSize: '0.78rem', color: '#9BA8B3' }}>{receipt.fromName || '—'}</div>
                                </div>
                                <div style={{ fontSize: '1.5rem', color: '#00AEEF' }}>→</div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.72rem', color: '#546E7A', textTransform: 'uppercase' }}>To</div>
                                    <div style={{ fontWeight: 700, color: '#002244' }}>{receipt.toName || 'Recipient'}</div>
                                    <div style={{ fontSize: '0.78rem', color: '#00AEEF' }}>{receipt.toVpa}</div>
                                </div>
                            </div>

                            <div style={{ textAlign: 'left', fontSize: '0.88rem', borderTop: '1px solid #EEF1F4', paddingTop: '16px' }}>
                                {[
                                    ['Ref No.', receipt.ref],
                                    ['Previous Balance', `₹${receipt.prevBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`],
                                    ['New Balance', `₹${receipt.newBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`],
                                    ['Date & Time', receipt.time],
                                ].map(([label, val]) => (
                                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f5f7fa' }}>
                                        <span style={{ color: '#546E7A' }}>{label}</span>
                                        <span style={{ fontWeight: 600, color: '#002244', fontFamily: label === 'Ref No.' ? 'monospace' : 'inherit' }}>{val}</span>
                                    </div>
                                ))}
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '24px' }}>
                                <button className="bc-btn bc-btn-primary bc-btn-full"
                                    onClick={() => { setReceipt(null); setAmount(''); setSearch(''); setSelectedVpa(''); setSelectedRecipient(null); }}>
                                    New Transfer
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
                <div className="container" style={{ maxWidth: '620px' }}>
                    <div className="page-header">
                        <div className="breadcrumb-row">
                            <Link to="/">Dashboard</Link> <span>›</span> Payments <span>›</span> UPI Transfer
                        </div>
                        <h1>UPI Transfer</h1>
                        <div className="subtitle">Send money instantly to any FinVault account via VPA</div>
                    </div>

                    {msg.text && <div className={`bc-alert bc-alert-${msg.type}`}>⚠️ {msg.text}</div>}

                    <div className="bc-form-card">
                        <form onSubmit={handleSubmit}>
                            <div className="row g-4">

                                {/* FROM — auto for customers, dropdown for staff */}
                                <div className="col-12">
                                    <label className="form-label">From Account *</label>
                                    {user.role === 'CUSTOMER' ? (
                                        /* CUSTOMER: read-only, auto-set */
                                        myAccounts.length > 1 ? (
                                            <select className="form-select" value={selectedFromAcc}
                                                onChange={e => setSelectedFromAcc(e.target.value)} required>
                                                {myAccounts.map(a => (
                                                    <option key={a.acc_num} value={a.acc_num}>
                                                        ACC #{a.acc_num} — ₹{Number(a.balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                    </option>
                                                ))}
                                            </select>
                                        ) : fromAccount ? (
                                            <div style={{ background: '#e0f5ff', border: '1px solid #00AEEF', borderRadius: '12px', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                    <div style={{ fontWeight: 700, color: '#002244' }}>{fromAccount.customer_name || user.username}</div>
                                                    <div style={{ fontSize: '0.8rem', color: '#546E7A' }}>ACC #{fromAccount.acc_num} · {fromAccount.vpa}</div>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ fontSize: '0.72rem', color: '#546E7A' }}>Balance</div>
                                                    <div style={{ fontWeight: 800, color: '#002244', fontSize: '1.1rem' }}>₹{Number(fromAccount.balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                                                </div>
                                            </div>
                                        ) : <div className="form-text" style={{ color: '#DA291C' }}>No active account linked to your profile.</div>
                                    ) : (
                                        /* ADMIN/EMPLOYEE: pick from all accounts */
                                        <select className="form-select" value={selectedFromAcc}
                                            onChange={e => setSelectedFromAcc(e.target.value)} required>
                                            <option value="">— Select source account —</option>
                                            {myAccounts.map(a => (
                                                <option key={a.acc_num} value={a.acc_num}>
                                                    ACC #{a.acc_num} {a.customer_name ? `· ${a.customer_name}` : ''} — ₹{Number(a.balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                </div>{/* end From Account col-12 */}

                                {/* Recipient VPA */}
                                <div className="col-12">
                                    <label className="form-label">Recipient UPI VPA *</label>

                                    {/* Search input */}
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        className="form-control"
                                        placeholder="Click to browse or type to search…"
                                        value={search}
                                        onChange={e => {
                                            setSearch(e.target.value);
                                            setSelectedVpa('');
                                            setSelectedRecipient(null);
                                            setShowDropdown(true);
                                        }}
                                        onFocus={() => setShowDropdown(true)}
                                        autoComplete="off"
                                    />

                                    {/* Dropdown list — uses ref, no onBlur clash */}
                                    {showDropdown && (
                                        <div ref={dropdownRef} style={{
                                            background: 'white', border: '1px solid #dde1e7', borderRadius: '10px',
                                            boxShadow: '0 8px 24px rgba(0,0,0,0.12)', maxHeight: '240px', overflowY: 'auto',
                                            marginTop: '4px'
                                        }}>
                                            {(search.length === 0
                                                ? vpaList.filter(v => String(v.acc_num) !== selectedFromAcc)
                                                : filtered
                                            ).map(v => (
                                                <div key={v.acc_num}
                                                    onMouseDown={(e) => {
                                                        e.preventDefault(); // prevent input blur
                                                        handleSelect(v);
                                                    }}
                                                    style={{
                                                        padding: '10px 16px', cursor: 'pointer',
                                                        borderBottom: '1px solid #f0f2f5',
                                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                                    }}
                                                    onMouseEnter={e => e.currentTarget.style.background = '#f5f7fa'}
                                                    onMouseLeave={e => e.currentTarget.style.background = 'white'}
                                                >
                                                    <div>
                                                        <strong style={{ color: '#002244' }}>{v.customer_name || 'Unknown'}</strong>
                                                        <div style={{ fontSize: '0.78rem', color: '#9BA8B3' }}>ACC #{v.acc_num}</div>
                                                    </div>
                                                    <span style={{ fontSize: '0.85rem', color: '#00AEEF', fontWeight: 600 }}>{v.vpa}</span>
                                                </div>
                                            ))}
                                            {search.length > 0 && filtered.length === 0 && (
                                                <div style={{ padding: '16px', color: '#9BA8B3', textAlign: 'center', fontSize: '0.88rem' }}>No matching VPAs found</div>
                                            )}
                                        </div>
                                    )}

                                    {/* Selected recipient chip */}
                                    {selectedRecipient && (
                                        <div style={{ marginTop: '8px', background: '#e6f9f0', border: '1px solid #00843D', borderRadius: '10px', padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <div style={{ fontWeight: 700, color: '#002244' }}>{selectedRecipient.customer_name}</div>
                                                <div style={{ fontSize: '0.78rem', color: '#546E7A' }}>ACC #{selectedRecipient.acc_num}</div>
                                            </div>
                                            <span style={{ color: '#00843D', fontWeight: 700, fontSize: '0.88rem' }}>{selectedRecipient.vpa}</span>
                                        </div>
                                    )}
                                    <div className="form-text">VPAs look like <code>acc1@finvault</code> — click the box to browse all</div>
                                </div>

                                {/* Amount */}
                                <div className="col-12">
                                    <label className="form-label">Amount (₹) *</label>
                                    <input type="number" className="form-control form-control-lg" required min="1" step="0.01" placeholder="0.00"
                                        value={amount} onChange={e => setAmount(e.target.value)}
                                        style={{ fontSize: '1.8rem', fontWeight: 700, color: '#002244' }} />
                                    {fromAccount && amount > 0 && (
                                        <div className="form-text" style={{ color: Number(amount) > Number(fromAccount.balance) ? '#DA291C' : '#00843D', fontWeight: 600 }}>
                                            {Number(amount) > Number(fromAccount.balance)
                                                ? `⚠️ Exceeds balance by ₹${(Number(amount) - Number(fromAccount.balance)).toLocaleString()}`
                                                : `✓ Balance after: ₹${(Number(fromAccount.balance) - Number(amount)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
                                        </div>
                                    )}
                                </div>

                                <div className="col-12">
                                    <button type="submit" className="bc-btn bc-btn-primary bc-btn-full bc-btn-lg" disabled={loading || !selectedVpa}>
                                        {loading ? 'Processing...' : '📱 Send Money via UPI →'}
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
export default UPITransfer;
