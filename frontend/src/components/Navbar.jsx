import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Navbar = ({ active }) => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const navigate = useNavigate();

    const handleLogout = (e) => {
        e.preventDefault();
        localStorage.clear();
        navigate('/login');
    };

    return (
        <nav className="bc-nav navbar navbar-expand-lg">
            <div className="container">
                <Link className="navbar-brand" to="/">
                    <svg className="brand-eagle" viewBox="0 0 36 36" fill="none">
                        <path d="M18 4C18 4 8 10 8 20C8 26 12 30 18 32C24 30 28 26 28 20C28 10 18 4 18 4Z" fill="#00AEEF" opacity="0.9" />
                        <path d="M18 4L10 14L13 16L11 22L18 20L25 22L23 16L26 14L18 4Z" fill="white" opacity="0.85" />
                    </svg>
                    <span className="brand-text">FinVault<span>.</span></span>
                </Link>
                <div className="collapse navbar-collapse">
                    <ul className="navbar-nav me-auto ps-2">
                        <li className="nav-item"><Link className={`nav-link ${active==='dashboard'?'active':''}`} to="/">Dashboard</Link></li>
                        {['ADMIN', 'EMPLOYEE'].includes(user?.role) && (
                            <li className="nav-item dropdown">
                                <a className={`nav-link dropdown-toggle ${active==='customers'?'active':''}`} href="#" data-bs-toggle="dropdown">Customers</a>
                                <ul className="dropdown-menu">
                                    <li><Link className="dropdown-item" to="/add_customer">➕ Add Customer</Link></li>
                                    <li><Link className="dropdown-item" to="/view_customers">👥 View All</Link></li>
                                </ul>
                            </li>
                        )}
                        <li className="nav-item dropdown">
                            <a className={`nav-link dropdown-toggle ${active==='accounts'?'active':''}`} href="#" data-bs-toggle="dropdown">Accounts</a>
                            <ul className="dropdown-menu">
                                {['ADMIN', 'EMPLOYEE'].includes(user?.role) && (
                                    <li><Link className="dropdown-item" to="/create_account">🏦 Create</Link></li>
                                )}
                                <li><Link className="dropdown-item" to="/view_account">🔍 View</Link></li>
                            </ul>
                        </li>
                        <li className="nav-item dropdown">
                            <a className={`nav-link dropdown-toggle ${active==='payments'?'active':''}`} href="#" data-bs-toggle="dropdown">Payments</a>
                            <ul className="dropdown-menu">
                                <li><Link className="dropdown-item" to="/deposit_withdraw">💰 Deposit / Withdraw</Link></li>
                                <li><Link className="dropdown-item" to="/fund_transfer">🔄 Fund Transfer</Link></li>
                                <li><Link className="dropdown-item" to="/view_transactions">📋 History</Link></li>
                                <li><hr className="dropdown-divider" /></li>
                                <li><Link className="dropdown-item" to="/upi_transfer">📱 UPI Transfer</Link></li>
                                <li><Link className="dropdown-item" to="/atm_withdraw">🏧 ATM Withdrawal</Link></li>
                                <li><Link className="dropdown-item" to="/card_payment">💳 Card Payment</Link></li>
                            </ul>
                        </li>
                        {['ADMIN', 'EMPLOYEE'].includes(user?.role) && (
                            <li className="nav-item dropdown">
                                <a className={`nav-link dropdown-toggle ${active==='people'?'active':''}`} href="#" data-bs-toggle="dropdown">People</a>
                                <ul className="dropdown-menu">
                                     {user?.role === 'ADMIN' && (
                                         <>
                                             <li><Link className="dropdown-item" to="/add_employee">➕ Add Employee</Link></li>
                                             <li><Link className="dropdown-item" to="/view_employees">🪪 Employees</Link></li>
                                             <li><Link className="dropdown-item" to="/view_attendance">📅 Attendance</Link></li>
                                            <li><Link className="dropdown-item" to="/mark_attendance">✏️ Mark Attendance</Link></li>
                                        </>
                                    )}
                                    {user?.role === 'EMPLOYEE' && (
                                        <li><Link className="dropdown-item" to="/view_attendance">📅 My Attendance</Link></li>
                                    )}
                                    <li><Link className="dropdown-item" to="/view_payroll">💳 Payroll</Link></li>
                                </ul>
                            </li>
                        )}
                        {user?.role === 'ADMIN' && (
                            <li className="nav-item dropdown">
                                <a className={`nav-link dropdown-toggle ${active==='admin'?'active':''}`} href="#" data-bs-toggle="dropdown">⚙ Admin</a>
                                <ul className="dropdown-menu">
                                     <li><Link className="dropdown-item" to="/create-user">👤 Create User</Link></li>
                                     <li><hr className="dropdown-divider" /></li>
                                     <li><Link className="dropdown-item" to="/audit_log">🔍 View Audit Log</Link></li>
                                </ul>
                            </li>
                        )}
                    </ul>
                    <ul className="navbar-nav ms-auto align-items-center gap-2">
                        <li className="nav-item" style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>Role: <strong style={{ color: 'white' }}>{user.role} ({user.username})</strong></li>
                        <li className="nav-item"><a className="nav-link" href="#" onClick={handleLogout} style={{ color: 'rgba(255,255,255,0.6)' }}>Sign Out</a></li>
                    </ul>
                </div>
            </div>
        </nav>
    );
};
export default Navbar;
