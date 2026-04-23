import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { Clock, MailCheck, LogOut } from 'lucide-react';

export const OwnerPending: React.FC = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const handleLogout = () => {
        logout();
        navigate('/login', { replace: true });
    };

    return (
        <div
            className="animate-fade-in"
            style={{
                minHeight: '100vh',
                background: 'var(--bg-page)',
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            <Header title="입점 승인 대기" showBack />

            <div style={{ padding: '32px 20px', flex: 1 }}>
                <div
                    style={{
                        width: 80,
                        height: 80,
                        borderRadius: '50%',
                        background: 'var(--brand-light)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 24px',
                    }}
                >
                    <Clock size={40} color="var(--brand-trust)" />
                </div>

                <h2
                    style={{
                        fontSize: 22,
                        fontWeight: 900,
                        textAlign: 'center',
                        marginBottom: 12,
                        letterSpacing: '-0.02em',
                    }}
                >
                    파트너 승인 대기 중입니다
                </h2>

                <p
                    style={{
                        fontSize: 14,
                        color: 'var(--gray-600)',
                        textAlign: 'center',
                        lineHeight: 1.6,
                        marginBottom: 32,
                    }}
                >
                    가입해 주셔서 감사합니다, {user?.displayName}님.
                    <br />
                    운영팀이 사업자 정보를 검토 중이며,
                    <br />
                    승인 완료 시 안내드릴 예정입니다.
                </p>

                <div
                    className="card"
                    style={{
                        padding: 16,
                        marginBottom: 16,
                        display: 'flex',
                        gap: 12,
                        alignItems: 'flex-start',
                    }}
                >
                    <MailCheck size={20} color="var(--brand-trust)" style={{ flexShrink: 0, marginTop: 2 }} />
                    <div>
                        <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 4 }}>
                            등록된 이메일
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--gray-600)' }}>
                            {user?.email}
                        </div>
                    </div>
                </div>

                <div
                    className="card"
                    style={{
                        padding: 16,
                        marginBottom: 32,
                        background: 'var(--bg-surface)',
                        fontSize: 12,
                        color: 'var(--gray-500)',
                        lineHeight: 1.6,
                    }}
                >
                    <div style={{ fontWeight: 800, color: 'var(--gray-700)', marginBottom: 6 }}>
                        승인까지 보통 1~2 영업일 소요됩니다
                    </div>
                    문의: <a href="mailto:partners@busocourt.kr" style={{ color: 'var(--brand-trust)', fontWeight: 700 }}>partners@busocourt.kr</a>
                </div>

                <button
                    onClick={() => navigate('/', { replace: true })}
                    className="btn btn-primary"
                    style={{ width: '100%', marginBottom: 12 }}
                >
                    홈으로 가기
                </button>

                <button
                    onClick={handleLogout}
                    style={{
                        width: '100%',
                        padding: 14,
                        background: 'transparent',
                        color: 'var(--gray-500)',
                        fontSize: 14,
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                    }}
                >
                    <LogOut size={16} /> 로그아웃
                </button>
            </div>
        </div>
    );
};
