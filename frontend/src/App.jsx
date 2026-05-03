import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import OfflineBanner from './components/OfflineBanner';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AddCustomer from './pages/AddCustomer';
import ViewCustomers from './pages/ViewCustomers';
import CreateAccount from './pages/CreateAccount';
import ViewAccount from './pages/ViewAccount';
import DepositWithdraw from './pages/DepositWithdraw';
import UPITransfer from './pages/UPITransfer';
import ATMWithdraw from './pages/ATMWithdraw';
import CardPayment from './pages/CardPayment';
import ViewEmployees from './pages/ViewEmployees';
import ViewPayroll from './pages/ViewPayroll';
import MarkAttendance from './pages/MarkAttendance';
import TransactionHistory from './pages/TransactionHistory';
import FundTransfer from './pages/FundTransfer';
import ViewAttendance from './pages/ViewAttendance';
import AddEmployee from './pages/AddEmployee';
import CreateUser from './pages/CreateUser';
import AuditLog from './pages/AuditLog';

const RoleRoute = ({ children, roles }) => {
    const token = localStorage.getItem('token');
    if (!token) return <Navigate to="/login" />;
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (roles && !roles.includes(user.role)) return <Navigate to="/" />;
    return children;
};

function App() {
    return (
        <Router>
            <OfflineBanner />
            <div className="app-container">
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/" element={<RoleRoute><Dashboard /></RoleRoute>} />
                    <Route path="/add_customer" element={<RoleRoute roles={['ADMIN', 'EMPLOYEE']}><AddCustomer /></RoleRoute>} />
                    <Route path="/view_customers" element={<RoleRoute roles={['ADMIN', 'EMPLOYEE']}><ViewCustomers /></RoleRoute>} />
                    <Route path="/create_account" element={<RoleRoute roles={['ADMIN', 'EMPLOYEE']}><CreateAccount /></RoleRoute>} />
                    <Route path="/view_account" element={<RoleRoute><ViewAccount /></RoleRoute>} />
                    <Route path="/deposit_withdraw" element={<RoleRoute><DepositWithdraw /></RoleRoute>} />
                    
                    {/* Placeholders for the rest to be visible */}
                    <Route path="/view_transactions" element={<RoleRoute><TransactionHistory /></RoleRoute>} />
                    <Route path="/fund_transfer" element={<RoleRoute><FundTransfer /></RoleRoute>} />
                    <Route path="/upi_transfer" element={<RoleRoute><UPITransfer /></RoleRoute>} />
                    <Route path="/atm_withdraw" element={<RoleRoute><ATMWithdraw /></RoleRoute>} />
                    <Route path="/card_payment" element={<RoleRoute><CardPayment /></RoleRoute>} />
                    <Route path="/view_employees" element={<RoleRoute roles={['ADMIN']}><ViewEmployees /></RoleRoute>} />
                    <Route path="/add_employee" element={<RoleRoute roles={['ADMIN']}><AddEmployee /></RoleRoute>} />
                    <Route path="/mark_attendance" element={<RoleRoute roles={['ADMIN']}><MarkAttendance /></RoleRoute>} />
                    <Route path="/view_payroll" element={<RoleRoute roles={['ADMIN', 'EMPLOYEE']}><ViewPayroll /></RoleRoute>} />
                    <Route path="/view_attendance" element={<RoleRoute roles={['ADMIN', 'EMPLOYEE']}><ViewAttendance /></RoleRoute>} />
                    <Route path="/view_attendance/:empId" element={<RoleRoute roles={['ADMIN']}><ViewAttendance /></RoleRoute>} />
                    <Route path="/create-user" element={<RoleRoute roles={['ADMIN']}><CreateUser /></RoleRoute>} />
                    <Route path="/audit_log" element={<RoleRoute roles={['ADMIN']}><AuditLog /></RoleRoute>} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;
