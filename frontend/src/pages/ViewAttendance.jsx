import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../services/api';

const STATUS_CONFIG = {
    present:  { label: 'Present',  color: '#00843D', bg: '#e6f9f0', icon: '✓' },
    absent:   { label: 'Absent',   color: '#DA291C', bg: '#fde8e8', icon: '✗' },
    half_day: { label: 'Half Day', color: '#E65100', bg: '#fff3e0', icon: '½' },
    leave:    { label: 'Leave',    color: '#7B5EA7', bg: '#f3ecff', icon: '🏖' },
    holiday:  { label: 'Holiday',  color: '#546E7A', bg: '#EEF1F4', icon: '☀' },
};

const ViewAttendance = () => {
    const { empId } = useParams();                         // set only for admin drill-down
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isAdmin = user.role === 'ADMIN';

    const [employees, setEmployees] = useState([]);        // admin employee list
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedEmp, setSelectedEmp] = useState(null);
    const [activeCell, setActiveCell] = useState(null);    // dateStr being edited
    const [savingCell, setSavingCell] = useState(false);
    const [cellMsg, setCellMsg] = useState({ text: '', type: '' });
    const [viewMonth, setViewMonth] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });

    // Load employee list for admin
    useEffect(() => {
        if (isAdmin) {
            api.get('/employees').then(res => setEmployees(res.data)).catch(() => {});
        }
    }, []);

    // Load attendance when empId or employee is selected
    useEffect(() => {
        const targetId = empId || (isAdmin ? null : user.entity_id);
        if (!targetId && isAdmin) return;   // admin hasn't selected yet
        loadAttendance(targetId);
        if (isAdmin && empId) {
            setSelectedEmp(null);           // will fill from employees once loaded
        }
    }, [empId]);

    // When employees list loads and we have an empId, set the name
    useEffect(() => {
        if (empId && employees.length > 0) {
            const e = employees.find(emp => String(emp.emp_id) === String(empId));
            if (e) setSelectedEmp(e);
        }
    }, [employees, empId]);

    const loadAttendance = async (id) => {
        setLoading(true);
        try {
            const url = id ? `/attendance?emp_id=${id}` : '/attendance';
            const res = await api.get(url);
            setRecords(res.data);
        } catch(e) {
            setRecords([]);
        } finally {
            setLoading(false);
        }
    };

    const markCell = async (dateStr, status) => {
        if (!empId) return;
        setSavingCell(true);
        try {
            await api.post('/attendance', { emp_id: empId, date: dateStr, status });
            // Update local records
            setRecords(prev => {
                const existing = prev.findIndex(r => r.date?.split('T')[0] === dateStr);
                const newRec = { ...( existing >= 0 ? prev[existing] : { emp_id: empId, date: dateStr }), status };
                if (existing >= 0) { const updated = [...prev]; updated[existing] = newRec; return updated; }
                return [...prev, newRec];
            });
            setCellMsg({ text: `Marked ${dateStr} as ${status}`, type: 'success' });
            setTimeout(() => setCellMsg({ text: '', type: '' }), 2000);
        } catch(e) {
            setCellMsg({ text: 'Failed to save', type: 'danger' });
        } finally {
            setSavingCell(false);
            setActiveCell(null);
        }
    };

    // Filter to selected month
    const [year, month] = viewMonth.split('-').map(Number);
    const monthRecords = records.filter(r => {
        const d = new Date(r.date + 'T00:00:00');
        return d.getFullYear() === year && d.getMonth() + 1 === month;
    });

    // Build full calendar for the month
    const daysInMonth = new Date(year, month, 0).getDate();
    const firstDayOfWeek = new Date(year, month - 1, 1).getDay(); // 0=Sun

    const recordMap = {};
    monthRecords.forEach(r => { recordMap[r.date.split('T')[0]] = r; });

    // Summary stats from full records
    const statsFull = Object.entries(STATUS_CONFIG).map(([key, cfg]) => ({
        key, ...cfg,
        count: records.filter(r => r.status === key).length
    }));

    const presentPct = records.length > 0
        ? Math.round((records.filter(r => r.status === 'present').length / records.length) * 100)
        : 0;

    const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long', year: 'numeric' });

    // ── Admin: show employee list if no empId ──────────────────────────────
    if (isAdmin && !empId) {
        return (
            <>
                <Navbar active="people" />
                <div className="page-wrapper">
                    <div className="container" style={{ maxWidth: '700px' }}>
                        <div className="page-header">
                            <div className="breadcrumb-row">
                                <Link to="/">Dashboard</Link> <span>›</span> People <span>›</span> Attendance
                            </div>
                            <h1>Attendance</h1>
                            <div className="subtitle">Select an employee to view their full attendance record</div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {employees.map(emp => (
                                <div key={emp.emp_id}
                                    onClick={() => navigate(`/view_attendance/${emp.emp_id}`)}
                                    style={{
                                        background: 'white', borderRadius: '14px', padding: '18px 22px',
                                        boxShadow: '0 2px 12px rgba(0,34,68,0.07)', border: '1px solid #EEF1F4',
                                        cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        transition: 'box-shadow 0.2s'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,34,68,0.14)'}
                                    onMouseLeave={e => e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,34,68,0.07)'}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                        <div style={{
                                            width: '44px', height: '44px', borderRadius: '50%',
                                            background: 'linear-gradient(135deg, #002244, #00AEEF)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: 'white', fontWeight: 800, fontSize: '1rem'
                                        }}>
                                            {emp.name?.charAt(0)}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 700, color: '#002244' }}>{emp.name}</div>
                                            <div style={{ fontSize: '0.82rem', color: '#546E7A' }}>{emp.designation} · EMP#{emp.emp_id}</div>
                                        </div>
                                    </div>
                                    <div style={{ color: '#00AEEF', fontWeight: 600, fontSize: '0.9rem' }}>
                                        View Attendance →
                                    </div>
                                </div>
                            ))}
                            {employees.length === 0 && (
                                <div style={{ textAlign: 'center', padding: '60px', color: '#9BA8B3' }}>No employees found.</div>
                            )}
                        </div>
                    </div>
                </div>
            </>
        );
    }

    // ── Attendance calendar view (employee self / admin drill-down) ─────────
    const empName = selectedEmp?.name || records[0]?.name || (isAdmin ? `EMP#${empId}` : user.username);
    const empDesig = selectedEmp?.designation || records[0]?.designation || '';

    return (
        <>
            <Navbar active="people" />
            <div className="page-wrapper">
                <div className="container" style={{ maxWidth: '820px' }}>
                    <div className="page-header">
                        <div className="breadcrumb-row">
                            <Link to="/">Dashboard</Link> <span>›</span>
                            {isAdmin ? <><Link to="/view_attendance"> Attendance</Link> <span>›</span> {empName}</> : ' My Attendance'}
                        </div>
                        <h1>{isAdmin ? `${empName}'s Attendance` : 'My Attendance'}</h1>
                        {empDesig && <div className="subtitle">{empDesig}</div>}
                    </div>

                    {cellMsg.text && <div className={`bc-alert bc-alert-${cellMsg.type}`} style={{ marginBottom: '12px' }}>{cellMsg.type === 'success' ? '✅ ' : '⚠️ '}{cellMsg.text}</div>}
                    {/* Summary stats */}
                    {!loading && records.length > 0 && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', marginBottom: '24px' }}>
                            {/* Attendance rate */}
                            <div style={{ background: 'white', borderRadius: '14px', padding: '16px', boxShadow: '0 2px 12px rgba(0,34,68,0.07)', textAlign: 'center', gridColumn: 'span 1', border: '1px solid #EEF1F4' }}>
                                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: presentPct >= 80 ? '#00843D' : '#DA291C' }}>{presentPct}%</div>
                                <div style={{ fontSize: '0.75rem', color: '#546E7A', marginTop: '2px' }}>Attendance Rate</div>
                            </div>
                            {statsFull.filter(s => s.count > 0).map(s => (
                                <div key={s.key} style={{ background: s.bg, borderRadius: '14px', padding: '16px', textAlign: 'center', border: `1px solid ${s.color}22` }}>
                                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: s.color }}>{s.count}</div>
                                    <div style={{ fontSize: '0.75rem', color: '#546E7A', marginTop: '2px' }}>{s.label}</div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Month picker */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <button className="bc-btn bc-btn-outline bc-btn-sm" onClick={() => {
                                const d = new Date(year, month - 2);
                                setViewMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
                            }}>‹ Prev</button>
                            <strong style={{ color: '#002244', minWidth: '130px', textAlign: 'center' }}>{monthName}</strong>
                            <button className="bc-btn bc-btn-outline bc-btn-sm" onClick={() => {
                                const d = new Date(year, month);
                                setViewMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
                            }}>Next ›</button>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <input type="month" className="form-control" style={{ width: 'auto' }}
                                value={viewMonth} onChange={e => setViewMonth(e.target.value)} />
                            {isAdmin && empId && (
                                <Link to="/mark_attendance" className="bc-btn bc-btn-primary bc-btn-sm">✏️ Mark Attendance</Link>
                            )}
                        </div>
                    </div>

                    {/* Calendar grid */}
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '60px' }}><div className="bc-spinner">Loading...</div></div>
                    ) : (
                        <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 16px rgba(0,34,68,0.07)', border: '1px solid #EEF1F4' }}>
                            {/* Day-of-week headers */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: '8px' }}>
                                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                                    <div key={d} style={{ textAlign: 'center', fontSize: '0.72rem', fontWeight: 700, color: '#9BA8B3', padding: '6px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{d}</div>
                                ))}
                            </div>
                            {/* Day cells */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
                                {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                                    <div key={`empty-${i}`} />
                                ))}
                                {Array.from({ length: daysInMonth }).map((_, i) => {
                                    const day = i + 1;
                                    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                    const rec = recordMap[dateStr];
                                    const cfg = rec ? STATUS_CONFIG[rec.status] : null;
                                    const isToday = dateStr === new Date().toISOString().split('T')[0];
                                    const isCellActive = activeCell === dateStr;
                                    const isFuture = dateStr > new Date().toISOString().split('T')[0];

                                    return (
                                        <div key={dateStr} style={{ position: 'relative' }}>
                                            <div
                                                title={isAdmin && empId && !isFuture ? `Click to mark ${dateStr}` : (cfg ? cfg.label : 'No record')}
                                                onClick={() => {
                                                    if (isAdmin && empId && !isFuture) {
                                                        setActiveCell(isCellActive ? null : dateStr);
                                                    }
                                                }}
                                                style={{
                                                    borderRadius: '10px', padding: '8px 4px', textAlign: 'center',
                                                    background: isCellActive ? '#002244' : (cfg ? cfg.bg : '#f9fafb'),
                                                    border: isCellActive ? '2px solid #002244' : isToday ? '2px solid #00AEEF' : `1px solid ${cfg ? cfg.color + '33' : '#EEF1F4'}`,
                                                    minHeight: '56px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px',
                                                    cursor: isAdmin && empId && !isFuture ? 'pointer' : 'default',
                                                    transition: 'all 0.15s',
                                                    opacity: isFuture ? 0.35 : 1,
                                                }}>
                                                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: isCellActive ? 'white' : isToday ? '#00AEEF' : '#546E7A' }}>{day}</div>
                                                {cfg && !isCellActive && <div style={{ fontSize: '0.9rem', color: cfg.color }}>{cfg.icon}</div>}
                                                {cfg && !isCellActive && <div style={{ fontSize: '0.55rem', color: cfg.color, fontWeight: 600, letterSpacing: '0.3px', textTransform: 'uppercase' }}>{cfg.label}</div>}
                                                {isCellActive && <div style={{ fontSize: '0.65rem', color: 'white', fontWeight: 600 }}>Pick ↓</div>}
                                            </div>

                                            {/* Inline status picker popup */}
                                            {isCellActive && (
                                                <div style={{
                                                    position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
                                                    background: 'white', borderRadius: '12px', padding: '8px',
                                                    boxShadow: '0 8px 32px rgba(0,34,68,0.18)', border: '1px solid #EEF1F4',
                                                    zIndex: 100, minWidth: '120px', marginTop: '4px'
                                                }}>
                                                    {Object.entries(STATUS_CONFIG).map(([key, scfg]) => (
                                                        <button key={key}
                                                            disabled={savingCell}
                                                            onClick={e => { e.stopPropagation(); markCell(dateStr, key); }}
                                                            style={{
                                                                display: 'flex', alignItems: 'center', gap: '6px', width: '100%',
                                                                background: rec?.status === key ? scfg.bg : 'transparent',
                                                                border: 'none', borderRadius: '8px', padding: '6px 8px',
                                                                cursor: 'pointer', color: scfg.color, fontWeight: 600,
                                                                fontSize: '0.8rem', marginBottom: '2px'
                                                            }}>
                                                            <span>{scfg.icon}</span> {scfg.label}
                                                            {rec?.status === key && <span style={{ marginLeft: 'auto', fontSize: '0.65rem' }}>✓</span>}
                                                        </button>
                                                    ))}
                                                    <button onClick={e => { e.stopPropagation(); setActiveCell(null); }}
                                                        style={{ width: '100%', background: 'none', border: 'none', color: '#9BA8B3', fontSize: '0.75rem', padding: '4px', cursor: 'pointer', borderTop: '1px solid #EEF1F4', marginTop: '2px' }}>
                                                        Cancel
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Legend */}
                            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #EEF1F4' }}>
                                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                                    <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.78rem' }}>
                                        <div style={{ width: '14px', height: '14px', borderRadius: '4px', background: cfg.bg, border: `1px solid ${cfg.color}55` }} />
                                        <span style={{ color: '#546E7A' }}>{cfg.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Detailed log table */}
                    {!loading && monthRecords.length > 0 && (
                        <div className="bc-table-wrap" style={{ marginTop: '24px' }}>
                            <div className="bc-table-toolbar">
                                <h5>Daily Log — {monthName}</h5>
                                <span style={{ fontSize: '0.85rem', color: '#546E7A' }}>{monthRecords.length} records</span>
                            </div>
                            <table className="bc-table">
                                <thead><tr><th>Date</th><th>Day</th><th>Status</th></tr></thead>
                                <tbody>
                                    {[...monthRecords].sort((a, b) => new Date(a.date) - new Date(b.date)).map(r => {
                                        const cfg = STATUS_CONFIG[r.status] || {};
                                        const d = new Date(r.date + 'T00:00:00');
                                        return (
                                            <tr key={r.attendance_id}>
                                                <td style={{ fontWeight: 600, color: '#002244' }}>{d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                                                <td style={{ color: '#546E7A' }}>{d.toLocaleString('default', { weekday: 'long' })}</td>
                                                <td>
                                                    <span style={{ background: cfg.bg, color: cfg.color, padding: '3px 12px', borderRadius: '20px', fontWeight: 600, fontSize: '0.82rem' }}>
                                                        {cfg.icon} {cfg.label}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {!loading && isAdmin && (
                        <div style={{ marginTop: '16px' }}>
                            <Link to="/view_attendance" className="bc-btn bc-btn-outline">← All Employees</Link>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};
export default ViewAttendance;
