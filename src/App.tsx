import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MockProvider } from './store/MockProvider';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import { AppLayout } from './components/AppLayout';

// Public Pages
import { Home } from './pages/Home';
import { Busan } from './pages/Busan';
import { Gyms } from './pages/Gyms';
import { GymDetail } from './pages/GymDetail';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';

// Action Pages
import { Checkout } from './pages/Checkout';
import { Success } from './pages/Success';

// Console Pages
import { Owner } from './pages/Owner';
import { Organizer } from './pages/Organizer';
import { Ops } from './pages/Ops';
import { MyPage } from './pages/MyPage';
import { ProfileEdit } from './pages/ProfileEdit';
import { OwnerPaymentMethods } from './pages/OwnerPaymentMethods';
import { NotificationSettings } from './pages/NotificationSettings';
import { Terms } from './pages/Terms';
import { MyReservations } from './pages/MyReservations';
import { OwnerReservations } from './pages/OwnerReservations';
import { OutdoorSpotPage } from './pages/OutdoorSpotPage';

function App() {
    return (
        <AuthProvider>
        <MockProvider>
            <ToastProvider>
            <BrowserRouter>
                <Routes>
                    <Route element={<AppLayout />}>
                        <Route path="/" element={<Home />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/signup" element={<Signup />} />

                        <Route path="/busan" element={<Busan />} />
                        <Route path="/gyms" element={<Gyms />} />
                        <Route path="/gyms/:gymId" element={<GymDetail />} />
                        <Route path="/place/outdoor/:id" element={<OutdoorSpotPage />} />
                        <Route path="/checkout" element={<Checkout />} />
                        <Route path="/success" element={<Success />} />

                        <Route path="/owner" element={<Owner />} />
                        <Route path="/owner/schedule" element={<Owner />} />
                        <Route path="/owner/payment-methods" element={<OwnerPaymentMethods />} />
                        <Route path="/owner/reservations" element={<OwnerReservations />} />
                        <Route path="/organizer" element={<Organizer />} />
                        <Route path="/ops" element={<Ops />} />
                        <Route path="/my" element={<MyPage />} />
                        <Route path="/my/profile" element={<ProfileEdit />} />
                        <Route path="/my/notifications" element={<NotificationSettings />} />
                        <Route path="/my/terms" element={<Terms />} />
                        <Route path="/my/reservations" element={<MyReservations />} />

                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Route>
                </Routes>
            </BrowserRouter>
            </ToastProvider>
        </MockProvider>
        </AuthProvider>
    );
}

export default App;
