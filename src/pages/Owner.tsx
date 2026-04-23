import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { useMock } from '../store/MockProvider';
import { ownerApi, OwnerDashboard, OwnedGymBrief } from '../lib/api';
import {
    TrendingUp, Activity, Tag, AlertCircle, Building2,
    ChevronRight, CalendarCheck, Clock, Wallet,
    Mail, MessageSquare, Copy, X, Check, Calendar, DollarSign,
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

/**
 * Owner 콘솔
 * - /owner : 대시보드 (ownerApi.dashboard)
 * - /owner/schedule : 시간표 편집 (Phase 5 연동 예정, 현재는 안내만)
 *
 * 사용자 관점 커버리지:
 *   ① 체육관 미보유 (NO_GYM)    ② 1개 보유   ③ 다중 보유 (드롭다운)
 *   ④ 네트워크 에러   ⑤ 로딩   ⑥ KPI 클릭 → 예약 필터 이동
 *   ⑦ 최근 예약 0건   ⑧ 최근 예약 카드 클릭 → 예약 관리 이동
 */

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
    AWAITING_TRANSFER: { label: '송금 대기', className: 'badge badge-gray' },
    TRANSFER_SUBMITTED: { label: '송금 확인 중', className: 'badge badge-trust' },
    OWNER_VERIFIED: { label: '운영자 확인', className: 'badge badge-trust' },
    CONFIRMED: { label: '확정', className: 'badge badge-black' },
    CANCELLED: { label: '취소됨', className: 'badge badge-gray' },
};

// KPI 라벨 → 예약 필터 라우트로 deep-link 매핑
const KPI_TO_FILTER: Record<string, string | null> = {
    '송금 대기': 'AWAITING_TRANSFER',
    '예약 확정': 'CONFIRMED',
    '할인 적용 예약': null, // 상태필터 아님 → 필터 없이 이동
};

const KPI_ICON: Record<string, React.ReactNode> = {
    '송금 대기': <Clock size={14} />,
    '예약 확정': <TrendingUp size={14} />,
    '할인 적용 예약': <Tag size={14} />,
};

export const Owner: React.FC = () => {
    const navigate = useNavigate();
    const { logEvent } = useMock();

    const { showToast } = useToast();
    const [dashboard, setDashboard] = useState<OwnerDashboard | null>(null);
    const [selectedGymId, setSelectedGymId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [errorKind, setErrorKind] = useState<null | 'NO_GYM' | 'GENERIC'>(null);
    const [contactOpen, setContactOpen] = useState(false);
    const [copiedKey, setCopiedKey] = useState<string | null>(null);

    const PARTNER_EMAIL = 'partner@basket.kr';
    const PARTNER_KAKAO = 'https://open.kakao.com/o/basket-partner';

    const copyToClipboard = async (text: string, key: string) => {
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
            } else {
                // fallback — 클립보드 API 차단 환경
                const ta = document.createElement('textarea');
                ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
                document.body.appendChild(ta); ta.select();
                document.execCommand('copy');
                document.body.removeChild(ta);
            }
            setCopiedKey(key);
            showToast('복사되었습니다.');
            setTimeout(() => setCopiedKey(null), 1500);
        } catch {
            showToast('복사에 실패했습니다. 직접 선택해 주세요.');
        }
    };

    const loadDashboard = useCallback(async (gymId: string | null) => {
        setLoading(true);
        setErrorKind(null);
        try {
            const d = await ownerApi.dashboard(gymId ? { gym_id: gymId } : undefined);
            setDashboard(d);
            // 최초 로드 시 선택 gymId가 없었다면 현재 로드된 체육관으로 고정
            setSelectedGymId((prev) => prev ?? d.ownerGymProfile.gymPlaceId);
        } catch (e: unknown) {
            const err = e as { response?: { status?: number; data?: { error?: { code?: string } } } };
            if (err?.response?.status === 404 || err?.response?.data?.error?.code === 'NO_GYM') {
                setErrorKind('NO_GYM');
            } else {
                setErrorKind('GENERIC');
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadDashboard(null);
    }, [loadDashboard]);

    const handleSwitchGym = (gymId: string) => {
        logEvent('OWNER_SWITCH_GYM', { gymId });
        setSelectedGymId(gymId);
        loadDashboard(gymId);
    };

    const handleKpiClick = (label: string) => {
        const statusParam = KPI_TO_FILTER[label];
        if (statusParam) navigate(`/owner/reservations?status=${statusParam}`);
        else navigate('/owner/reservations');
    };

    // ── 화면: /owner (대시보드) ────────────────────────────────
    return (
        <div className="animate-fade-in" style={{ paddingBottom: 80, background: 'var(--bg-page)', minHeight: '100vh' }}>
            <Header title="파트너 콘솔" showBack />

            {/* 로딩 */}
            {loading && (
                <div style={{ padding: 20 }}>
                    <div style={{ height: 100, background: 'var(--gray-200)', borderRadius: 'var(--r-md)', marginBottom: 12 }} />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
                        {[0, 1, 2].map((i) => <div key={i} style={{ height: 74, background: 'var(--gray-200)', borderRadius: 'var(--r-md)' }} />)}
                    </div>
                    <div style={{ height: 120, background: 'var(--gray-200)', borderRadius: 'var(--r-md)' }} />
                </div>
            )}

            {/* 에러: NO_GYM 온보딩 */}
            {!loading && errorKind === 'NO_GYM' && (
                <div style={{ padding: '40px 20px' }}>
                    <div className="card" style={{ padding: 28, textAlign: 'center' }}>
                        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--brand-light)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                            <Building2 size={36} color="var(--brand-trust)" />
                        </div>
                        <h2 style={{ fontSize: 18, fontWeight: 900, marginBottom: 8 }}>아직 등록된 체육관이 없어요</h2>
                        <p style={{ fontSize: 13, color: 'var(--gray-600)', lineHeight: 1.6, marginBottom: 20 }}>
                            파트너 콘솔은 등록·승인 완료된 체육관이 있어야 사용할 수 있습니다.
                            체육관 등록을 원하신다면 운영팀에 문의해 주세요.
                        </p>
                        <button type="button" className="btn btn-trust" style={{ width: '100%', marginBottom: 8 }} onClick={() => setContactOpen(true)}>
                            운영팀에 체육관 등록 문의
                        </button>
                        <button type="button" className="btn btn-secondary" style={{ width: '100%', background: 'white' }} onClick={() => navigate('/')}>
                            홈으로 돌아가기
                        </button>
                    </div>
                </div>
            )}

            {/* 연락처 모달 (라우팅 미관여 — window.open('mailto',_blank) 버그 회피) */}
            {contactOpen && (
                <div
                    role="dialog"
                    aria-modal="true"
                    onClick={() => setContactOpen(false)}
                    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
                >
                    <div onClick={(e) => e.stopPropagation()} className="card" style={{ width: '100%', maxWidth: 380, padding: 24, position: 'relative' }}>
                        <button type="button" onClick={() => setContactOpen(false)} style={{ position: 'absolute', top: 12, right: 12, background: 'none', color: 'var(--gray-500)' }} aria-label="닫기">
                            <X size={20} />
                        </button>
                        <h3 style={{ fontSize: 17, fontWeight: 900, marginBottom: 6 }}>체육관 등록 문의</h3>
                        <p style={{ fontSize: 12, color: 'var(--gray-600)', marginBottom: 18, lineHeight: 1.6 }}>
                            아래 연락처로 사업자 정보, 체육관 주소, 운영 시간, 담당자 이름·연락처를 보내주시면 영업일 기준 1~2일 내 답변드립니다.
                        </p>

                        {/* 이메일 */}
                        <div style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--r-md)', padding: 12, marginBottom: 10 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: 'var(--gray-500)', marginBottom: 6 }}>
                                <Mail size={12} /> 이메일
                            </div>
                            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--gray-900)', marginBottom: 8, wordBreak: 'break-all' }}>
                                {PARTNER_EMAIL}
                            </div>
                            <div style={{ display: 'flex', gap: 6 }}>
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    style={{ flex: 1, height: 36, fontSize: 12, background: 'white' }}
                                    onClick={() => copyToClipboard(PARTNER_EMAIL, 'email')}
                                >
                                    {copiedKey === 'email' ? <><Check size={13} /> 복사됨</> : <><Copy size={13} /> 주소 복사</>}
                                </button>
                                <a
                                    href={`mailto:${PARTNER_EMAIL}?subject=${encodeURIComponent('[Basket] 체육관 등록 문의')}`}
                                    className="btn btn-trust"
                                    style={{ flex: 1, height: 36, fontSize: 12, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4, textDecoration: 'none' }}
                                >
                                    <Mail size={13} /> 메일로 열기
                                </a>
                            </div>
                        </div>

                        {/* 카카오 오픈채팅 */}
                        <div style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--r-md)', padding: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: 'var(--gray-500)', marginBottom: 6 }}>
                                <MessageSquare size={12} /> 카카오톡 오픈채팅
                            </div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--gray-900)', marginBottom: 8, wordBreak: 'break-all' }}>
                                {PARTNER_KAKAO}
                            </div>
                            <div style={{ display: 'flex', gap: 6 }}>
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    style={{ flex: 1, height: 36, fontSize: 12, background: 'white' }}
                                    onClick={() => copyToClipboard(PARTNER_KAKAO, 'kakao')}
                                >
                                    {copiedKey === 'kakao' ? <><Check size={13} /> 복사됨</> : <><Copy size={13} /> 링크 복사</>}
                                </button>
                                <a
                                    href={PARTNER_KAKAO}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-trust"
                                    style={{ flex: 1, height: 36, fontSize: 12, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4, textDecoration: 'none' }}
                                >
                                    <MessageSquare size={13} /> 채팅 열기
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 에러: GENERIC */}
            {!loading && errorKind === 'GENERIC' && (
                <div style={{ padding: '40px 20px' }}>
                    <div className="card" style={{ padding: 24, textAlign: 'center' }}>
                        <AlertCircle size={40} color="var(--status-error)" style={{ margin: '0 auto 12px' }} />
                        <p style={{ fontWeight: 700, marginBottom: 16 }}>대시보드를 불러오지 못했습니다.</p>
                        <button type="button" className="btn btn-primary" onClick={() => loadDashboard(selectedGymId)}>다시 시도</button>
                    </div>
                </div>
            )}

            {/* 정상 */}
            {!loading && !errorKind && dashboard && (
                <>
                    {/* Hero */}
                    <div style={{ padding: '28px 20px', background: 'var(--brand-primary)', color: 'white' }}>
                        <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--gray-400)', marginBottom: 6, fontWeight: 800 }}>체육관 운영 대시보드</p>
                        <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 4 }}>{dashboard.ownerGymProfile.name}</h2>
                        <p style={{ fontSize: 13, color: 'var(--gray-300)' }}>{dashboard.ownerGymProfile.district}</p>
                    </div>

                    {/* 체육관 선택 (다중 보유 시) */}
                    {dashboard.ownedGyms && dashboard.ownedGyms.length > 1 && (
                        <div style={{ padding: '12px 16px', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-light)' }}>
                            <label className="input-label" style={{ fontSize: 11 }}>운영 체육관 전환</label>
                            <select
                                className="input-field"
                                value={selectedGymId ?? dashboard.ownerGymProfile.gymPlaceId}
                                onChange={(e) => handleSwitchGym(e.target.value)}
                            >
                                {dashboard.ownedGyms.map((g: OwnedGymBrief) => (
                                    <option key={g.gymPlaceId} value={g.gymPlaceId}>
                                        {g.name} ({g.district})
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* KPI Cards (서버 kpis 를 그대로 렌더링) */}
                    <div style={{ padding: 16, display: 'grid', gridTemplateColumns: dashboard.kpis.length === 3 ? '1fr 1fr 1fr' : '1fr 1fr', gap: 10 }}>
                        {dashboard.kpis.map((kpi) => (
                            <button
                                key={kpi.label}
                                type="button"
                                className="card"
                                onClick={() => handleKpiClick(kpi.label)}
                                style={{ padding: 14, textAlign: 'left', cursor: 'pointer' }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: 'var(--gray-500)', marginBottom: 8 }}>
                                    {KPI_ICON[kpi.label] ?? <Activity size={14} />} {kpi.label}
                                </div>
                                <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--gray-900)' }}>{kpi.value}</div>
                            </button>
                        ))}
                    </div>

                    {/* 빠른 액션 */}
                    <div style={{ padding: '0 16px 8px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <button type="button" className="btn btn-trust" style={{ height: 46, fontSize: 13 }} onClick={() => navigate('/owner/reservations')}>
                            <CalendarCheck size={16} /> 예약 관리
                        </button>
                        <button type="button" className="btn btn-secondary" style={{ height: 46, fontSize: 13, background: 'white' }} onClick={() => navigate('/owner/schedule')}>
                            <Calendar size={16} /> 시간표 편집
                        </button>
                        <button type="button" className="btn btn-secondary" style={{ height: 46, fontSize: 13, background: 'white' }} onClick={() => navigate('/owner/pricing-policy')}>
                            <DollarSign size={16} /> 가격 정책
                        </button>
                        <button type="button" className="btn btn-secondary" style={{ height: 46, fontSize: 13, background: 'white' }} onClick={() => navigate('/owner/payment-methods')}>
                            <Wallet size={16} /> 결제 정보
                        </button>
                    </div>

                    {/* 최근 예약 */}
                    <div style={{ padding: 20 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                            <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--gray-700)' }}>최근 예약 접수</h3>
                            <button type="button" onClick={() => navigate('/owner/reservations')} style={{ fontSize: 12, fontWeight: 700, color: 'var(--brand-trust)', background: 'none' }}>
                                전체 보기 <ChevronRight size={12} style={{ verticalAlign: 'middle' }} />
                            </button>
                        </div>

                        {dashboard.recentReservations.length === 0 ? (
                            <div className="card" style={{ padding: 24, textAlign: 'center', color: 'var(--gray-500)' }}>
                                아직 접수된 예약이 없습니다.
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {dashboard.recentReservations.map((r) => {
                                    const meta = STATUS_BADGE[r.status] ?? { label: r.status, className: 'badge badge-gray' };
                                    return (
                                        <button
                                            key={r.id}
                                            type="button"
                                            className="card"
                                            onClick={() => navigate('/owner/reservations')}
                                            style={{ padding: 14, textAlign: 'left', cursor: 'pointer' }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                                <span style={{ fontSize: 14, fontWeight: 800 }}>{r.bookerName}</span>
                                                <span className={meta.className}>{meta.label}</span>
                                            </div>
                                            <div style={{ fontSize: 12, color: 'var(--gray-600)', fontWeight: 600 }}>{r.time}</div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};
