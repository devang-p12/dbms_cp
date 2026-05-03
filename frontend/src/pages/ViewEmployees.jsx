import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../services/api';

const ViewEmployees = () => {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/employees')
            .then(res => setEmployees(res.data))
            .finally(() => setLoading(false));
    }, []);

    return (
        <>
            <Navbar active="people" />
            <div className="page-wrapper">
                <div className="container">
                    <div className="page-header">
                        <div className="breadcrumb-row">
                            <Link to="/">Dashboard</Link> <span>›</span> People <span>›</span> View Employees
                        </div>
                        <h1>Employee Registry</h1>
                        <div className="subtitle">List of internal staff and members</div>
                    </div>

                    <div className="bc-table-wrap">
                        <div className="bc-table-toolbar">
                            <h5>All Employees</h5>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table className="bc-table">
                                <thead><tr><th>ID</th><th>Name</th><th>Gender</th><th>Designation</th><th>Salary</th><th>Branch ID</th></tr></thead>
                                <tbody>
                                    {loading ? <tr><td colSpan="6"><div className="bc-spinner">Loading...</div></td></tr> :
                                        employees.length === 0 ? <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>No employees found.</td></tr> :
                                        employees.map(e => (
                                            <tr key={e.emp_id}>
                                                <td style={{ color: '#546E7A', fontWeight: 600 }}>{e.emp_id}</td>
                                                <td style={{ fontWeight: 600, color: '#002244' }}>{e.name}</td>
                                                <td><span className={`bc-badge ${e.gender === 'Male' ? 'bc-badge-info' : 'bc-badge-teal'}`}>{e.gender}</span></td>
                                                <td style={{ color: '#546E7A' }}>{e.designation}</td>
                                                <td>₹{(Number(e.salary)||0).toLocaleString()}</td>
                                                <td><span className="bc-badge bc-badge-gray">BR-{e.branch_id}</span></td>
                                            </tr>
                                        ))
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
export default ViewEmployees;
