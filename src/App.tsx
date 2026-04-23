import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MockProvider } from './store/MockProvider';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import { AppLayout } from './components/AppLayout';
import { RequireAuth, RequireRole } from './components/RequireAuth';

// Public Pages
import { Home } from './pages/Home';
import { Busan } from './pages/Busan';
import { Gyms } from './pages/Gyms';
import { GymDetail } from './pages/GymDetail';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { OutdoorSpotPage } from './pages/OutdoorSpotPage';
import { AccessDenied } from './pages/AccessDenied';

// Action Pages (로그인 필요)
import { Checkout } from './pages/Checkout';
import { Success } from './pages/Success';
import { MyReservations } from './pages/MyReservations';
import { MyPage } from './pages/MyPage';
import { ProfileEdit } from './pages/ProfileEdit';
import { NotificationSettings } from './pages/NotificationSettings';
import { Terms } from './pages/Terms';

// Console Pages (역할 제한)
import { Owner } from './pages/Owner';
import { OwnerReservations } from './pages/OwnerReservations';
import { OwnerPaymentMethods } from './pages/OwnerPaymentMethods';
import { OwnerSchedule } from './pages/OwnerSchedule';
import { OwnerPricingPolicy } from './pages/OwnerPricingPolicy';
import { OwnerPending } from './pages/OwnerPending';
import { Organizer } from './pages/Organizer';
import { Ops } from './pages/Ops';
import { OpsReviews } from './pages/OpsReviews';

function App() {
    return (
        <AuthProvider>
            <MockProvider>
                <ToastProvider>
                    <BrowserRouter>
                        <Routes>
                            <Route element={<AppLayout />}>
                                {/* ── Public ─────────────────────────────────── */}
                                <Route path="/" element={<Home />} />
                                <Route path="/login" element={<Login />} />
                                <Route path="/signup" element={<Signup />} />
                                <Route path="/busan" element={<Busan />} />
                                <Route path="/gyms" element={<Gyms />} />
                                <Route path="/gyms/:gymId" element={<GymDetail />} />
                                <Route path="/place/outdoor/:id" element={<OutdoorSpotPage />} />
                                <Route path="/access-denied" element={<AccessDenied />} />

                                {/* ── Authenticated (모든 로그인 사용자) ─── */}
                                <Route element={<RequireAuth />}>
                                    <Route path="/checkout" element={<Checkout />} />
                                    <Route path="/success" element={<Success />} />
                                    <Route path="/my" element={<MyPage />} />
                                    <Route path="/my/profile" element={<ProfileEdit />} />
                                    <Route path="/my/notifications" element={<NotificationSettings />} />
                                    <Route path="/my/terms" element={<Terms />} />
                                    <Route path="/my/reservations" element={<MyReservations />} />
                                </Route>

                                {/* ── Owner pending (PENDING_OWNER 만 의미 있으나 모든 로그인 사용자 접근 허용) ── */}
                                <Route element={<RequireAuth />}>
                                    <Route path="/owner/pending" element={<OwnerPending />} />
                                </Route>

                                {/* ── Owner / Admin only ────────────────────── */}
                                <Route element={<RequireRole roles={['OWNER', 'ADMIN']} />}>
                                    <Route path="/owner" element={<Owner />} />
                                    <Route path="/owner/schedule" element={<OwnerSchedule />} />
                                    <Route path="/owner/pricing-policy" element={<OwnerPricingPolicy />} />
                                    <Route path="/owner/payment-methods" element={<OwnerPaymentMethods />} />
                                    <Route path="/owner/reservations" element={<OwnerReservations />} />
                                </Route>

                                {/* ── Organizer ─────────────────────────────── */}
                                <Route element={<RequireRole roles={['ORGANIZER', 'ADMIN']} />}>
                                    <Route path="/organizer" element={<Organizer />} />
                                </Route>

                                {/* ── Admin / OPS only ──────────────────────── */}
                                <Route element={<RequireRole roles={['ADMIN', 'OPS']} />}>
                                    <Route path="/ops" element={<Ops />} />
                                    <Route path="/ops/reviews" element={<OpsReviews />} />
                                </Route>

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
