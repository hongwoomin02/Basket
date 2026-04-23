import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const FullPageLoader: React.FC = () => (
    <div
        style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-page)',
            color: 'var(--gray-500)',
            fontWeight: 700,
        }}
    >
        로그인 상태 확인 중...
    </div>
);

/**
 * 인증된 사용자만 접근 가능.
 * 미로그인 시 /login 으로 리다이렉트하며, 원래 가려던 경로를 location.state.from 으로 전달한다.
 */
export const RequireAuth: React.FC = () => {
    const { isLoggedIn, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) return <FullPageLoader />;
    if (!isLoggedIn) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }
    return <Outlet />;
};

interface RequireRoleProps {
    roles: Array<'USER' | 'OWNER' | 'ADMIN' | 'ORGANIZER' | 'OPS'>;
}

/**
 * 특정 역할만 접근 가능. 미로그인은 /login, 권한 부족은 /access-denied 로 리다이렉트.
 * 주의: 프론트 가드는 UX 용이며 최종 권한 검증은 백엔드(JWT + require_role)가 수행한다.
 */
export const RequireRole: React.FC<RequireRoleProps> = ({ roles }) => {
    const { user, isLoggedIn, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) return <FullPageLoader />;
    if (!isLoggedIn) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }
    if (!user || !roles.includes(user.role)) {
        // 어떤 role이 필요했는지와 어느 경로에서 왔는지 쿼리로 전달해 안내 페이지에서 사용
        const requiredRole = roles[0] ?? 'OWNER';
        const from = encodeURIComponent(location.pathname);
        return <Navigate to={`/access-denied?requiredRole=${requiredRole}&from=${from}`} replace />;
    }
    return <Outlet />;
};
