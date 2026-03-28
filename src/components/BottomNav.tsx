import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMock } from '../store/MockProvider';
import { Search, Map, LayoutGrid, User } from 'lucide-react';

export const BottomNav: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { role } = useMock();

    const navItems = [
        { id: 'NAV_HOME', to: '/', icon: Search, label: '탐색' },
        { id: 'NAV_GYMS', to: '/gyms', icon: Map, label: '체육관' },
        { id: 'NAV_PICKUP', to: '/pickup', icon: LayoutGrid, label: '픽업' },
        { id: 'NAV_MY', to: '/my', icon: User, label: '마이' },
    ];

    return (
        <nav className="bottom-nav">
            {navItems.map((item) => {
                const Icon = item.icon;
                let isActive = false;
                if (item.id === 'NAV_HOME') {
                    isActive = location.pathname === '/';
                } else {
                    isActive = location.pathname.startsWith(item.to);
                }

                return (
                    <button
                        key={item.id}
                        onClick={() => navigate(item.to)}
                        className={`bottom-nav-item ${isActive ? 'active' : ''}`}
                        style={{
                            background: 'transparent', outline: 'none', border: 'none',
                            height: '100%', cursor: 'pointer', flex: 1,
                            display: 'flex', flexDirection: 'column', alignItems: 'center',
                            justifyContent: 'center', gap: '4px',
                        }}
                    >
                        <Icon
                            size={22}
                            strokeWidth={isActive ? 2.5 : 1.5}
                            color={isActive ? 'var(--brand-primary)' : 'var(--gray-400)'}
                        />
                        <span style={{
                            fontSize: '10px', fontWeight: isActive ? 900 : 600,
                            color: isActive ? 'var(--brand-primary)' : 'var(--gray-400)',
                            letterSpacing: '0.02em'
                        }}>
                            {item.label}
                        </span>
                    </button>
                );
            })}
        </nav>
    );
};
