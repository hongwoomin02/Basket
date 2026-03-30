import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { BottomNav } from './BottomNav';

export const AppLayout: React.FC = () => {
    const location = useLocation();

    // Hide bottom nav on console routes, auth routes, checkout/success flows, or full-screen detail views
    const isOutdoorDetail = location.pathname.startsWith('/place/');
    const isHiddenPath =
        location.pathname.includes('/checkout') ||
        location.pathname.includes('/success') ||
        (location.pathname.startsWith('/owner') && !location.pathname.startsWith('/owner/reservations')) ||
        location.pathname.startsWith('/organizer') ||
        location.pathname.startsWith('/ops') ||
        location.pathname.startsWith('/login') ||
        location.pathname.startsWith('/signup') ||
        (location.pathname.startsWith('/my/') && !location.pathname.startsWith('/my/reservations')) ||
        isOutdoorDetail;

    const showNav = !isHiddenPath;

    return (
        <div className={`app-container shadow-2xl overflow-x-hidden relative antialiased text-text-primary ${showNav ? 'has-bottom-nav' : ''}`}>
            <main className="app-content transition-all duration-300 ease-in-out">
                <Outlet />
            </main>
            {showNav && <BottomNav />}
        </div>
    );
};
