import React from 'react';
import Navbar from '../components/Navbar';

export const Placeholder = ({ title }) => (
    <>
        <Navbar />
        <div className="page-wrapper">
            <div className="container" style={{ maxWidth: '760px' }}>
                <div className="page-header">
                    <h1>{title}</h1>
                </div>
                <div className="bc-form-card" style={{ textAlign: 'center', padding: '60px' }}>
                    <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🛠️</div>
                    <h4>Module under integration</h4>
                    <p style={{ color: '#546E7A' }}>This frontend page is visible but API integration is pending full implementation.</p>
                </div>
            </div>
        </div>
    </>
);
