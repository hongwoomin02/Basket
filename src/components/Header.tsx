import React, { useState } from 'react';
import { useMock } from '../store/MockProvider';
import { ArrowLeft, Menu, LogIn } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface HeaderProps {
    title: string;
    showBack?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ title, showBack = false }) => {
    const { role } = useMock();
    const navigate = useNavigate();
    const location = useLocation();

    const isLoggedIn = role !== 'GUEST';

    return (
        <header className="app-header">
            <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                {showBack ? (
                    <button onClick={() => navigate(-1)} style={{ padding: '8px', marginLeft: '-8px' }}>
                        <ArrowLeft size={24} strokeWidth={2} color="var(--gray-900)" />
                    </button>
                ) : (
                    <div style={{ width: '32px' }}></div>
                )}
            </div>

            <h1 className="header-title" style={{ flex: 2, textAlign: 'center' }}>
                {title}
            </h1>

            <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                    onClick={() => navigate(isLoggedIn ? '/my' : '/login')}
                    style={{ padding: '4px 8px', fontSize: '12px', fontWeight: 600, color: 'var(--brand-primary)', border: '1px solid var(--brand-primary)', borderRadius: 'var(--r-sm)', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                    <LogIn size={14} /> {isLoggedIn ? '마이' : '계정'}
                </button>
            </div>
        </header>
    );
};
