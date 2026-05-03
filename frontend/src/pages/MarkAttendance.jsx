import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../services/api';

const STATUSES = [
    { value: 'present',  label: 'Present',  color: '#00843D', bg: '#e6f9f0', icon: '✓' },
    { value: 'absent',   label: 'Absent',   color: '#DA291C', bg: '#fde8e8', icon: '✗' },
    { value: 'half_day', label: 'Half Day', color: '#E65100', bg: '#fff3e0', icon: '½' },
    { value: 'leave',    label: 'Leave',    color: '#7B5EA7', bg: '#f3ecff', icon: '🏖' },
    { value: 'holiday',  label: 'Holiday',  color: '#546E7A', bg: '#EEF1F4', icon: '☀' },
];

const MarkAttendance = () => {
    const [employees, setEmployees] = useState([]);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [todayRecords, setTodayRecords] = useState({});  // emp_id → status
    const [saving, setSaving] = useState({});
    const [msg, setMsg] = useState({ text: '', type: '' });

    useEffect(() => {
        api.get('/employees').then(res => setEmployees(res.data)).catch(() => {});
    }, []);

    // Load existing records for the selected date
    useEffect(() => {
        if (!selectedDate) return;
        api.get(`/attendance`).then(res => {
            const map = {};
            res.data.filter(r => r.date?.split('T')[0] === selectedDate)
                     .forEach(r => { map[r.emp_id] = r.status; });
            setTodayRecords(map);
        }).catch(() => {});
    }, [selectedDate]);

    const mark = async (emp_id, status) => {
        setSaving(s => ({ ...s, [emp_id]: true }));
        try {
            await api.post('/attendance', { emp_id, status, date: selectedDate });
            setTodayRecords(prev => ({ ...prev, [emp_id]: status }));
            setMsg({ text: `Marked ${employees.find(e => e.emp_id === emp_id)?.name} as ${status}`, type: 'success' });
            setTimeout(() => setMsg({ text: '', type: '' }), 2500);
        } catch(e) {
            setMsg({ text: 'Failed to save', type: 'danger' });
        } finally {
            setSaving(s => ({ ...s, [emp_id]: false }));
        }
    };

    const markAll = async (status) => {
        for (const emp of employees) {
            await mark(emp.emp_id, status);
        }
    };

    const markedCount = Object.keys(todayRecords).length;
    const displayDate = selectedDate ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }) : '';

    return (
        <>
            <Navbar active="people" />
            <div className="page-wrapper">
                <div className="container" style={{ maxWidth: '820px' }}>
                    <div className="page-header">
                        <div className="breadcrumb-row">
                            <Link to="/">Dashboard</Link> <span>›</span>
                            <Link to="/view_attendance"> Attendance</Link> <span>›</span> Mark
                        </div>
                        <h1>Mark Attendance</h1>
                        <div className="subtitle">Record attendance for any date — existing records will be updated</div>
                    </div>

                    {msg.text && (
                        <div className={`bc-alert bc-alert-${msg.type}`} style={{ marginBottom: '16px' }}>
                            {msg.type === 'success' ? '✅ ' : '⚠️ '}{msg.text}
                        </div>
                    )}

                    {/* Date picker + quick-mark all */}
                    <div className="bc-form-card" style={{ marginBottom: '20px' }}>
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                            <div style={{ flex: 1, minWidth: '200px' }}>
                                <label className="form-label">Date</label>
                                <input type="date" className="form-control"
                                    value={selectedDate}
                                    max={new Date().toISOString().split('T')[0]}
                                    onChange={e => setSelectedDate(e.target.value)} />
                                {displayDate && <div className="form-text">{displayDate}</div>}
                            </div>
                            <div>
                                <label className="form-label" style={{ display: 'block' }}>Quick Mark All</label>
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                    {STATUSES.map(s => (
                                        <button key={s.value} type="button"
                                            style={{ background: s.bg, color: s.color, border: `1px solid ${s.color}55`, borderRadius: '8px', padding: '6px 14px', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' }}
                                            onClick={() => markAll(s.value)}>
                                            {s.icon} All {s.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Progress bar */}
                        <div style={{ marginTop: '14px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#546E7A', marginBottom: '4px' }}>
                                <span>Marked {markedCount} of {employees.length} employees</span>
                                <span>{employees.length > 0 ? Math.round((markedCount / employees.length) * 100) : 0}%</span>
                            </div>
                            <div style={{ background: '#EEF1F4', borderRadius: '999px', height: '6px' }}>
                                <div style={{ background: 'linear-gradient(90deg, #00843D, #00AEEF)', height: '100%', borderRadius: '999px', width: `${employees.length > 0 ? (markedCount / employees.length) * 100 : 0}%`, transition: 'width 0.3s' }} />
                            </div>
                        </div>
                    </div>

                    {/* Employee attendance cards */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {employees.map(emp => {
                            const current = todayRecords[emp.emp_id];
                            const currentCfg = STATUSES.find(s => s.value === current);
                            const isSaving = saving[emp.emp_id];

                            return (
                                <div key={emp.emp_id} style={{
                                    background: 'white', borderRadius: '14px', padding: '16px 20px',
                                    boxShadow: '0 2px 12px rgba(0,34,68,0.07)', border: `1px solid ${currentCfg ? currentCfg.color + '44' : '#EEF1F4'}`,
                                    display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap'
                                }}>
                                    {/* Avatar */}
                                    <div style={{
                                        width: '42px', height: '42px', borderRadius: '50%',
                                        background: `linear-gradient(135deg, #002244, #00AEEF)`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: 'white', fontWeight: 800, fontSize: '1rem', flexShrink: 0
                                    }}>
                                        {emp.name?.charAt(0)}
                                    </div>

                                    {/* Name */}
                                    <div style={{ flex: '1', minWidth: '140px' }}>
                                        <div style={{ fontWeight: 700, color: '#002244' }}>{emp.name}</div>
                                        <div style={{ fontSize: '0.78rem', color: '#546E7A' }}>{emp.designation}</div>
                                    </div>

                                    {/* Current status chip */}
                                    <div style={{ minWidth: '90px', textAlign: 'center' }}>
                                        {currentCfg ? (
                                            <span style={{ background: currentCfg.bg, color: currentCfg.color, padding: '4px 12px', borderRadius: '20px', fontWeight: 700, fontSize: '0.82rem' }}>
                                                {currentCfg.icon} {currentCfg.label}
                                            </span>
                                        ) : (
                                            <span style={{ color: '#9BA8B3', fontSize: '0.82rem' }}>Not marked</span>
                                        )}
                                    </div>

                                    {/* Status buttons */}
                                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                        {STATUSES.map(s => (
                                            <button key={s.value} type="button"
                                                disabled={isSaving}
                                                onClick={() => mark(emp.emp_id, s.value)}
                                                style={{
                                                    background: current === s.value ? s.color : s.bg,
                                                    color: current === s.value ? 'white' : s.color,
                                                    border: `1px solid ${s.color}55`,
                                                    borderRadius: '8px', padding: '5px 10px',
                                                    fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer',
                                                    opacity: isSaving ? 0.6 : 1,
                                                    transition: 'all 0.15s'
                                                }}>
                                                {s.icon} {s.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                        {employees.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '60px', color: '#9BA8B3' }}>No employees found.</div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};
export default MarkAttendance;
