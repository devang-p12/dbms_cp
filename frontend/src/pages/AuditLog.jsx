import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../services/api';

const formatIP = (ip) => {
    if (!ip) return 'N/A';
    return String(ip).replace('::ffff:', '').replace('::1', '127.0.0.1');
};

const formatTime = (ts) => {
    if (!ts) return 'N/A';
    // Try robust ISO parsing for Safari/older browsers
    const d = new Date(String(ts).replace(' ', 'T') + '+05:30');
    if (isNaN(d.getTime())) return String(ts); // Fallback to raw string if 'Invalid Date'
    return d.toLocaleString('en-IN');
};

const AuditLog = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/audit')
            .then(res => setLogs(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    return (
        <>
            <Navbar active="admin" />
            <div className="page-wrapper">
                <div className="container">
                    <div className="page-header">
                        <div className="breadcrumb-row">
                            <Link to="/">Dashboard</Link> <span>›</span> Admin <span>›</span> Audit Log
                        </div>
                        <h1>System Audit Log</h1>
                        <div className="subtitle">Track user activities, logins, and administrative changes</div>
                    </div>

                    <div className="bc-table-wrap">
                        <div className="bc-table-toolbar">
                            <h5>Recent Activity (Last 100)</h5>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table className="bc-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>User</th>
                                        <th>Action</th>
                                        <th>Details</th>
                                        <th>IP Address</th>
                                        <th>Timestamp</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr><td colSpan="6"><div className="bc-spinner">Loading...</div></td></tr>
                                    ) : logs.length === 0 ? (
                                        <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>No logs found.</td></tr>
                                    ) : logs.map(log => (
                                        <tr key={log.audit_id}>
                                            <td style={{ color: '#546E7A', fontWeight: 600 }}>#{log.audit_id}</td>
                                            <td style={{ fontWeight: 600, color: '#002244' }}>
                                                {log.username || 'System'} <span style={{ fontWeight: 400, color: '#9BA8B3' }}>(ID: {log.user_id || 'N/A'})</span>
                                            </td>
                                            <td>
                                                <span className={`bc-badge ${
                                                    log.action === 'LOGIN' ? 'bc-badge-success' :
                                                    log.action.includes('CREATE') ? 'bc-badge-info' :
                                                    log.action.includes('UPDATE') ? 'bc-badge-warning' :
                                                    'bc-badge-gray'
                                                }`}>
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td style={{ fontSize: '0.85rem', color: '#546E7A', maxWidth: '300px' }}>{log.detail}</td>
                                            <td style={{ fontFamily: 'monospace', fontSize: '0.82rem' }}>
                                                {formatIP(log.ip_addr)}
                                            </td>
                                            <td style={{ color: '#546E7A', fontSize: '0.85rem' }}>
                                                {formatTime(log.timestamp)}
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

export default AuditLog;
