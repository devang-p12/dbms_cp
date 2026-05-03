import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../services/api';

const ViewCustomers = () => {
    const [customers, setCustomers] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        Promise.all([api.get('/customers'), api.get('/accounts')])
            .then(([custRes, accRes]) => {
                setCustomers(custRes.data);
                setAccounts(accRes.data);
            })
            .finally(() => setLoading(false));
    }, []);

    const getCustomerAccounts = (cust_id) =>
        accounts.filter(a => String(a.cust_id) === String(cust_id));

    const getTotalBalance = (cust_id) =>
        getCustomerAccounts(cust_id).reduce((sum, a) => sum + Number(a.balance), 0);

    const filtered = customers.filter(c =>
        [c.name, c.pan_no, c.phone_no, c.mail_id].join(' ').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <>
            <Navbar active="customers" />
            <div className="page-wrapper">
                <div className="container">
                    <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '12px' }}>
                        <div>
                            <div className="breadcrumb-row"><Link to="/">Dashboard</Link> <span>›</span> Customers</div>
                            <h1>All Customers</h1>
                            <div className="subtitle">{customers.length} customer{customers.length !== 1 ? 's' : ''} registered</div>
                        </div>
                        <Link to="/add_customer" className="bc-btn bc-btn-primary">+ Add Customer</Link>
                    </div>

                    <div className="bc-table-wrap">
                        <div className="bc-table-toolbar">
                            <h5>Customer Registry</h5>
                            <div className="bc-search">
                                <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, PAN, phone, email…" />
                            </div>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table className="bc-table">
                                <thead>
                                    <tr><th>ID</th><th>Name</th><th>Contact</th><th>PAN</th><th>Accounts</th><th>Total Balance</th><th>Actions</th></tr>
                                </thead>
                                <tbody>
                                    {loading ? <tr><td colSpan="7"><div className="bc-spinner">Loading...</div></td></tr> :
                                        filtered.length === 0 ? <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#9BA8B3' }}>No customers found.</td></tr> :
                                        filtered.map(c => {
                                            const custAccs = getCustomerAccounts(c.cust_id);
                                            return (
                                                <tr key={c.cust_id}>
                                                    <td style={{ color: '#546E7A', fontSize: '0.82rem', fontWeight: 600 }}>#{c.cust_id}</td>
                                                    <td>
                                                        <div style={{ fontWeight: 700, color: '#002244' }}>{c.name}</div>
                                                        <div style={{ fontSize: '0.78rem', color: '#9BA8B3' }}>{c.gender}</div>
                                                    </td>
                                                    <td>
                                                        <div style={{ fontSize: '0.85rem' }}>{c.phone_no || '—'}</div>
                                                        <div style={{ fontSize: '0.78rem', color: '#9BA8B3' }}>{c.mail_id || '—'}</div>
                                                    </td>
                                                    <td><code style={{ background: '#EEF1F4', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>{c.pan_no || '—'}</code></td>
                                                    <td>
                                                        <span className="bc-badge bc-badge-info">{custAccs.length} acct{custAccs.length !== 1 ? 's' : ''}</span>
                                                    </td>
                                                    <td style={{ fontWeight: 700, color: '#002244' }}>
                                                        ₹{getTotalBalance(c.cust_id).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                    </td>
                                                    <td>
                                                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                                            {custAccs.map(a => (
                                                                <button key={a.acc_num}
                                                                    className="bc-btn bc-btn-outline bc-btn-sm"
                                                                    onClick={() => navigate(`/view_account?acc=${a.acc_num}`)}>
                                                                    ACC #{a.acc_num}
                                                                </button>
                                                            ))}
                                                            <button className="bc-btn bc-btn-primary bc-btn-sm"
                                                                onClick={() => navigate(`/create_account?cust_id=${c.cust_id}`)}>
                                                                + Account
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    }
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};
export default ViewCustomers;
