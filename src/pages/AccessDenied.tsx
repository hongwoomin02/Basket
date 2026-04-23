import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Header } from '../components/Header';
import { ShieldOff, Building2, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ROLE_LABEL: Record<string, string> = {
    OWNER: '체육관 사장님(파트너)',
    ADMIN: '운영 관리자',
    OPS: '운영팀',
    ORGANIZER: '모임 주최자',
};

/**
 * RequireRole 에서 권한 부족으로 튕겨나온 사용자에게 안내하는 페이지.
 * - `requiredRole` 쿼리 파라미터로 "무슨 권한이 필요했는지" 를 받아 안내 문구를 구성한다.
 * - `from` 쿼리 파라미터로 "어느 경로에 가려고 했는지" 를 기록 (선택).
 * - OWNER 권한이 필요한 경우, 현재 로그인한 사용자의 역할을 보여주고 /signup?as=OWNER 재가입 경로를 제공.
 */
export const AccessDenied: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { user, logout } = useAuth();

    const requiredRole = searchParams.get('requiredRole') ?? 'OWNER';
    const from = searchParams.get('from') ?? '';
    const requiredLabel = ROLE_LABEL[requiredRole] ?? requiredRole;

    const handleOwnerSignup = () => {
        // 기존 USER 세션을 유지한 채 다른 이메일로 OWNER 가입하는 흐름.
        // 같은 계정의 권한 승격은 (MVP 스코프 밖) 어드민 승인이 필요함을 안내.
        logout();
        navigate('/signup?as=OWNER', { replace: true });
    };

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-page)' }}>
            <Header title="접근 권한 필요" showBack />

            <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--brand-light)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                    <ShieldOff size={36} color="var(--status-error)" />
                </div>
                <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--gray-900)', marginBottom: 8 }}>
                    현재 접근 권한이 없습니다
                </h1>
                <p style={{ fontSize: 14, color: 'var(--gray-600)', fontWeight: 600, lineHeight: 1.6, marginBottom: 8 }}>
                    요청하신 페이지({from || '파트너 콘솔'})는 <strong style={{ color: 'var(--brand-trust)' }}>{requiredLabel}</strong> 계정만 이용할 수 있습니다.
                </p>
                {user && (
                    <p style={{ fontSize: 13, color: 'var(--gray-500)', fontWeight: 600 }}>
                        현재 로그인: <strong>{user.email}</strong> · 역할 <span className="badge badge-gray" style={{ marginLeft: 4 }}>{user.role}</span>
                    </p>
                )}
            </div>

            {requiredRole === 'OWNER' && (
                <div style={{ padding: '0 20px' }}>
                    <div className="card" style={{ padding: 20, marginBottom: 16 }}>
                        <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Building2 size={18} color="var(--brand-trust)" /> 파트너(사장님) 계정이 필요해요
                        </h3>
                        <p style={{ fontSize: 13, color: 'var(--gray-600)', lineHeight: 1.6 }}>
                            체육관을 등록·운영하려면 별도의 파트너 계정으로 가입해야 합니다.
                            사업자 인증이 완료된 후에 대시보드·예약 관리·결제 정보 메뉴가 열립니다.
                        </p>
                        <p style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 10, lineHeight: 1.6 }}>
                            ※ 개인 계정은 그대로 유지되며, 기존 예약에는 영향이 없습니다. 이용자/사장님 모드를 서로 오갈 수 있습니다.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="btn btn-trust"
                        style={{ width: '100%', height: 52, marginBottom: 10 }}
                        onClick={handleOwnerSignup}
                    >
                        <Building2 size={18} /> 파트너로 신규 가입하기
                    </button>
                    <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ width: '100%', height: 48, background: 'white' }}
                        onClick={() => navigate('/')}
                    >
                        <User size={16} /> 개인 회원으로 계속 이용
                    </button>
                </div>
            )}

            {requiredRole !== 'OWNER' && (
                <div style={{ padding: '0 20px' }}>
                    <div className="card" style={{ padding: 20, marginBottom: 16 }}>
                        <p style={{ fontSize: 13, color: 'var(--gray-600)', lineHeight: 1.6 }}>
                            {requiredLabel} 권한은 운영팀에 의해 부여됩니다. 접근이 필요하다면 관리자에게 문의해 주세요.
                        </p>
                    </div>
                    <button
                        type="button"
                        className="btn btn-primary"
                        style={{ width: '100%', height: 48 }}
                        onClick={() => navigate('/')}
                    >
                        홈으로 돌아가기
                    </button>
                </div>
            )}
        </div>
    );
};
