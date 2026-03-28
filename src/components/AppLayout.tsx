import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useMock } from '../store/MockProvider';
import { BottomNav } from './BottomNav';

export const AppLayout: React.FC = () => {
    const { role } = useMock();
    const location = useLocation();

    // Hide bottom nav on console routes, auth routes, checkout/success flows, or full-screen detail views
    const isPickupDetail = location.pathname.startsWith('/pickup/') && location.pathname !== '/pickup';
    const isHiddenPath =
        location.pathname.includes('/checkout') ||
        location.pathname.includes('/success') ||
        location.pathname.startsWith('/owner') ||
        location.pathname.startsWith('/organizer') ||
        location.pathname.startsWith('/ops') ||
        location.pathname.startsWith('/login') ||
        location.pathname.startsWith('/signup') ||
        (location.pathname.startsWith('/my/') && location.pathname.length > 4) ||
        isPickupDetail;

    const showNav = !isHiddenPath;

    return (
        <div className={`app-container shadow-2xl overflow-hidden relative antialiased text-text-primary ${showNav ? 'has-bottom-nav' : ''}`}>
            <main className="app-content transition-all duration-300 ease-in-out">
                <Outlet />
            </main>
            {showNav && <BottomNav />}
        </div>
    );
};
