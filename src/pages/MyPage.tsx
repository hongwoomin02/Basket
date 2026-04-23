import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMock } from '../store/MockProvider';
import { useAuth } from '../context/AuthContext';
import { Header } from '../components/Header';
import {
    User, Bell, Shield, LogOut, Trash2,
    ChevronRight, Building2, BarChart3, Calendar, Wallet
} from 'lucide-react';

export const MyPage: React.FC = () => {
    const { applications, removeApplication } = useMock();
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    // 실제 권한은 DB에 저장된 user.role 하나로 결정한다. MockProvider.role 은 사용하지 않는다.
    const actualRole = user?.role ?? 'USER';
    const isOwner = actualRole === 'OWNER' || actualRole === 'ADMIN';
    const [cancelTarget, setCancelTarget] = React.useState<{ id: string; title: string; price: number; cancelFeePercent: number } | null>(null);
    const [showOwnerNotice, setShowOwnerNotice] = React.useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleTryOwner = () => {
        setShowOwnerNotice(true);
    };

    const MenuItem: React.FC<{ icon: React.ReactNode; label: string; desc?: string; onClick: () => void; danger?: boolean }> = ({ icon, label, desc, onClick, danger }) => (
        <button
            onClick={onClick}
            style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '14px',
                padding: '16px 20px', background: 'var(--bg-surface)',
                borderBottom: '1px solid var(--border-light)', textAlign: 'left', cursor: 'pointer'
            }}
        >
            <div style={{ color: danger ? 'var(--status-error)' : 'var(--gray-500)' }}>{icon}</div>
            <div style={{ flex: 1 }}>
                <div style={{ fontSize: '15px', fontWeight: 700, color: danger ? 'var(--status-error)' : 'var(--gray-900)' }}>{label}</div>
                {desc && <div style={{ fontSize: '12px', color: 'var(--gray-400)', marginTop: '2px' }}>{desc}</div>}
            </div>
            <ChevronRight size={16} color="var(--gray-300)" />
        </button>
    );

    const SectionTitle: React.FC<{ title: string }> = ({ title }) => (
        <div style={{ padding: '20px 20px 8px', fontSize: '11px', fontWeight: 900, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.05em', background: 'var(--bg-page)' }}>
            {title}
        </div>
    );

    return (
        <div className="animate-fade-in" style={{ paddingBottom: '80px', background: 'var(--bg-page)', minHeight: '100vh' }}>
            {/* Header */}
            <div style={{ padding: '0 20px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-light)' }}>
                <h1 style={{ fontSize: '18px', fontWeight: 900, letterSpacing: '-0.02em', color: 'var(--brand-primary)' }}>마이</h1>
                <span className="badge badge-gray">{actualRole}</span>
            </div>

            {/* Profile Hero */}
            <div style={{ background: 'var(--brand-primary)', color: 'white', padding: '32px 20px 28px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {isOwner ? <Building2 size={28} color="white" /> : <User size={28} color="white" />}
                </div>
                <div>
                    <p style={{ fontSize: '12px', color: 'var(--gray-400)', marginBottom: '4px', fontWeight: 700, textTransform: 'uppercase' }}>
                        {isOwner ? '파트너 계정' : '개인 회원'}
                    </p>
                    <h2 style={{ fontSize: '20px', fontWeight: 900 }}>
                        {user?.displayName ?? '게스트'}
                    </h2>
                    <p style={{ fontSize: '12px', color: 'var(--gray-300)', marginTop: '2px' }}>
                        {user?.email ?? ''}
                    </p>
                </div>
            </div>

            {/* Owner-only: Quick links to console */}
            {isOwner && (
                <>
                    <SectionTitle title="체육관 관리" />
                    <div style={{ borderTop: '1px solid var(--border-light)' }}>
                        <MenuItem
                            icon={<BarChart3 size={20} />}
                            label="파트너 콘솔 (대시보드)"
                            desc="매출, 예약 현황"
                            onClick={() => navigate('/owner')}
                        />
                        <MenuItem
                            icon={<Calendar size={20} />}
                            label="시간표 편집"
                            desc="대관 가능 시간대 등록 및 수정"
                            onClick={() => navigate('/owner/schedule')}
                        />
                        <MenuItem
                            icon={<Wallet size={20} />}
                            label="결제 정보 (송금)"
                            desc="카카오페이 송금 링크 · 계좌번호"
                            onClick={() => navigate('/owner/payment-methods')}
                        />
                    </div>
                </>
            )}

            {/* User-only: booking history */}
            {!isOwner && (
                <>
                    <SectionTitle title="예약 내역" />
                    <div style={{ borderTop: '1px solid var(--border-light)' }}>
                        {applications.length === 0 ? (
                            <div style={{ padding: '24px 20px', fontSize: '14px', color: 'var(--gray-400)', fontWeight: 600, background: 'var(--bg-surface)' }}>
                                아직 예약 내역이 없습니다.
                            </div>
                        ) : (
                            applications.map(app => {
                                const feePct = app.cancelFeePercent ?? 10;
                                const dateStr = new Date(app.date).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
                                const timeLine = app.startTime && app.endTime
                                    ? `${dateStr} · ${app.startTime} ~ ${app.endTime} ${app.type === 'rent' ? '대관' : '참여'}`
                                    : `${dateStr} · ${app.price.toLocaleString()}원`;
                                return (
                                    <div key={app.id} style={{ padding: '16px 20px', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-light)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                            <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--gray-900)' }}>{app.title}</span>
                                            <span className="badge badge-trust">{app.type === 'rent' ? '대관' : '픽업'}</span>
                                        </div>
                                        <div style={{ fontSize: '12px', color: 'var(--gray-500)', marginBottom: '6px', lineHeight: 1.5 }}>{timeLine}</div>
                                        <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--gray-700)', marginBottom: '10px' }}>{app.price.toLocaleString()}원</div>
                                        <button
                                            type="button"
                                            onClick={() => setCancelTarget({ id: app.id, title: app.title, price: app.price, cancelFeePercent: feePct })}
                                            style={{ fontSize: '12px', fontWeight: 700, color: 'var(--status-error)', background: 'none', border: '1px solid var(--status-error)', padding: '6px 12px', borderRadius: 'var(--r-sm)' }}
                                        >
                                            예약 취소
                                        </button>
                                    </div>
                                );
                            })
                        )}
                        {applications.length > 0 && (
                            <button
                                type="button"
                                onClick={() => navigate('/my/reservations')}
                                style={{ width: '100%', padding: '14px', fontSize: '13px', fontWeight: 800, color: 'var(--brand-trust)', background: 'var(--bg-surface)', border: 'none', borderTop: '1px solid var(--border-light)', cursor: 'pointer' }}
                            >
                                월별 전체 예약 내역 보기
                            </button>
                        )}
                    </div>
                </>
            )}

            {/* Role guidance: 실제 권한은 DB에 저장된 user.role 로 결정되며,
                UI에서 임의 전환은 불가능하다. USER 가 OWNER 에 접근하려면 /signup?as=OWNER 로 신규 가입해야 함. */}
            {!isOwner && (
                <>
                    <SectionTitle title="파트너(사장님)" />
                    <div style={{ borderTop: '1px solid var(--border-light)' }}>
                        <button
                            type="button"
                            onClick={handleTryOwner}
                            style={{
                                width: '100%', display: 'flex', alignItems: 'center', gap: '14px',
                                padding: '16px 20px', background: 'var(--bg-surface)',
                                borderBottom: '1px solid var(--border-light)', textAlign: 'left', cursor: 'pointer'
                            }}
                        >
                            <div style={{ color: 'var(--gray-500)' }}><Building2 size={20} /></div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--gray-900)' }}>파트너 콘솔로 전환</div>
                                <div style={{ fontSize: '12px', color: 'var(--gray-400)', marginTop: '2px' }}>체육관 등록·예약 관리</div>
                            </div>
                            <ChevronRight size={16} color="var(--gray-300)" />
                        </button>
                    </div>
                </>
            )}

            {/* Account Settings (목업용) */}
            <SectionTitle title="계정 설정" />
            <div style={{ borderTop: '1px solid var(--border-light)' }}>
                <MenuItem
                    icon={<User size={20} />}
                    label="프로필 수정"
                    desc="이름, 닉네임, 연락처, 키, 포지션, 사진"
                    onClick={() => navigate('/my/profile')}
                />
                <MenuItem
                    icon={<Bell size={20} />}
                    label="알림 설정"
                    desc="예약 확정, 모집 마감 알림"
                    onClick={() => navigate('/my/notifications')}
                />
                <MenuItem
                    icon={<Shield size={20} />}
                    label="이용약관 / 개인정보 처리"
                    onClick={() => navigate('/my/terms')}
                />
            </div>

            {/* Owner 전환 안내 모달: 실제로는 DB role 변경 불가. 별도 OWNER 가입으로 유도. */}
            {showOwnerNotice && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div className="card" style={{ width: '100%', maxWidth: '360px', padding: '24px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 900, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Building2 size={18} color="var(--brand-trust)" /> 파트너 가입이 필요해요
                        </h3>
                        <p style={{ fontSize: '13px', color: 'var(--gray-600)', lineHeight: 1.6, marginBottom: '12px' }}>
                            체육관 운영·예약 관리 기능은 <strong style={{ color: 'var(--brand-trust)' }}>파트너 계정</strong> 전용입니다.
                            현재 개인 계정({user?.email ?? '게스트'})에는 해당 권한이 없습니다.
                        </p>
                        <p style={{ fontSize: '12px', color: 'var(--gray-500)', marginBottom: 20, lineHeight: 1.6 }}>
                            사업자 인증과 함께 새 파트너 계정으로 가입하시면 콘솔이 열립니다. (개인 계정은 그대로 유지됩니다.)
                        </p>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                type="button"
                                className="btn btn-secondary"
                                style={{ flex: 1, background: 'white' }}
                                onClick={() => setShowOwnerNotice(false)}
                            >
                                돌아가기
                            </button>
                            <button
                                type="button"
                                className="btn btn-trust"
                                style={{ flex: 1 }}
                                onClick={() => {
                                    setShowOwnerNotice(false);
                                    logout();
                                    navigate('/signup?as=OWNER');
                                }}
                            >
                                파트너로 가입하기
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Cancel confirm modal */}
            {cancelTarget && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div className="card" style={{ width: '100%', maxWidth: '340px', padding: '24px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '12px' }}>예약 취소</h3>
                        <p style={{ fontSize: '14px', color: 'var(--gray-600)', marginBottom: '8px' }}>{cancelTarget.title}</p>
                        <p style={{ fontSize: '13px', color: 'var(--gray-500)', marginBottom: '16px' }}>
                            취소 수수료 <strong style={{ color: 'var(--brand-primary)' }}>{cancelTarget.cancelFeePercent}%</strong>(체육관 정책)가 적용됩니다.
                        </p>
                        <p style={{ fontSize: '13px', fontWeight: 700, marginBottom: '20px' }}>
                            환불 예정: {Math.round(cancelTarget.price * (1 - cancelTarget.cancelFeePercent / 100)).toLocaleString()}원
                        </p>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setCancelTarget(null)}>돌아가기</button>
                            <button
                                type="button"
                                className="btn"
                                style={{ flex: 1, background: 'var(--status-error)', color: 'white', border: '1px solid var(--status-error)' }}
                                onClick={() => {
                                    removeApplication(cancelTarget.id);
                                    setCancelTarget(null);
                                }}
                            >
                                취소하기
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Logout / Withdraw */}
            <SectionTitle title="계정 관리" />
            <div style={{ borderTop: '1px solid var(--border-light)' }}>
                <MenuItem
                    icon={<LogOut size={20} />}
                    label="로그아웃"
                    onClick={handleLogout}
                />
                <MenuItem
                    icon={<Trash2 size={20} />}
                    label="회원 탈퇴"
                    desc="탈퇴 시 모든 데이터가 삭제됩니다"
                    onClick={() => { }}
                    danger
                />
            </div>
        </div>
    );
};
