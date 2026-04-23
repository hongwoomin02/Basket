import React, { useEffect, useState } from 'react';
import { Header } from '../components/Header';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMock } from '../store/MockProvider';
import { useAuth } from '../context/AuthContext';
import { reservationsApi } from '../lib/api';

/**
 * Checkout — 예약 "생성" 화면
 * - 이전 페이지(GymDetail)에서 URL 파라미터로 슬롯 정보를 받는다.
 * - 사용자 실명/연락처/팀명/인원을 받아 POST /reservations 로 예약을 만든다.
 * - 성공 시 /success 로 이동하며 reservationId 전달.
 * - 계좌/카카오페이 안내와 송금 완료 처리는 /success 에서 수행 (백엔드 상태머신 AWAITING_TRANSFER → TRANSFER_SUBMITTED).
 */
export const Checkout: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { logEvent } = useMock();
    const { user } = useAuth();

    // 이전 화면(GymDetail)에서 넘긴 슬롯 정보
    const gymId = searchParams.get('gymId');
    const slotId = searchParams.get('slotId');
    const date = searchParams.get('date');
    const rentStart = searchParams.get('rentStart') || '';
    const rentEnd = searchParams.get('rentEnd') || '';
    const price = searchParams.get('price') || '0';
    const title = decodeURIComponent(searchParams.get('title') || '결제 상품');
    const headcountParam = parseInt(searchParams.get('headcount') || '1', 10);

    // 폼 상태
    const [bookerName, setBookerName] = useState(user?.displayName ?? '');
    const [phone, setPhone] = useState(user?.phone ?? '');
    const [teamName, setTeamName] = useState('');
    const [memo, setMemo] = useState('');
    const [headcount, setHeadcount] = useState(headcountParam);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    // AuthContext 가 늦게 채워질 때 대비
    useEffect(() => {
        if (user) {
            if (!bookerName) setBookerName(user.displayName);
            if (!phone && user.phone) setPhone(user.phone);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    // 슬롯 정보 누락 가드
    const missingSlot = !gymId || !slotId;

    const normalizedPhone = phone.replace(/-/g, '');
    const isPhoneValid = /^[0-9]{10,11}$/.test(normalizedPhone);
    const formValid = bookerName.trim().length >= 2 && isPhoneValid && teamName.trim().length >= 1 && headcount >= 1;

    const handleSubmit = async () => {
        if (!formValid || !gymId || !slotId) return;
        setIsSubmitting(true);
        setErrorMsg('');
        logEvent('SUBMIT_RESERVATION', { gymId, slotId, headcount });
        try {
            const res = await reservationsApi.create({
                gymId,
                slotId,
                teamName: teamName.trim(),
                bookerName: bookerName.trim(),
                phone: normalizedPhone,
                peopleCount: headcount,
                memo: memo.trim() || undefined,
                // 중복 제출/재시도 보호용 idempotency key
                idempotencyKey: crypto.randomUUID(),
            });
            logEvent('RESERVATION_CREATED', {
                reservationId: res.reservationId,
                finalPrice: res.pricingSnapshot.finalPrice,
            });
            const q = new URLSearchParams({
                reservationId: res.reservationId,
                title: encodeURIComponent(title),
            });
            if (gymId) q.set('gymId', gymId);
            navigate(`/success?${q.toString()}`, { replace: true });
        } catch (e: unknown) {
            const err = e as { response?: { status?: number; data?: { error?: { code?: string; message?: string } } } };
            const status = err?.response?.status;
            const code = err?.response?.data?.error?.code;
            const msg = err?.response?.data?.error?.message;
            if (status === 401) setErrorMsg('로그인이 만료되었습니다. 다시 로그인해 주세요.');
            else if (code === 'SLOT_NOT_RESERVABLE') setErrorMsg('이 슬롯은 이미 예약되었거나 예약 불가 상태입니다.');
            else if (code === 'DUPLICATE_RESERVATION') setErrorMsg('같은 시간에 이미 예약이 있습니다.');
            else setErrorMsg(msg ?? '예약 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.');
            logEvent('RESERVATION_FAIL', { status, code });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (missingSlot) {
        return (
            <div style={{ minHeight: '100vh', background: 'var(--bg-page)' }}>
                <Header title="예약 생성" showBack />
                <div style={{ padding: 48, textAlign: 'center' }}>
                    <p style={{ fontWeight: 700, color: 'var(--gray-900)', marginBottom: 16 }}>
                        슬롯 정보가 없습니다. 체육관 상세에서 다시 진입해 주세요.
                    </p>
                    <button type="button" className="btn btn-primary" onClick={() => navigate('/')}>홈으로</button>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in" style={{ paddingBottom: '140px', background: 'var(--bg-page)', minHeight: '100vh' }}>
            <Header title="예약 생성" showBack />

            <div style={{ background: 'var(--brand-primary)', color: 'white', padding: '32px 20px', marginBottom: '16px' }}>
                <span className="badge" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', marginBottom: '16px' }}>단독 대관</span>
                <h2 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.3, marginBottom: '24px' }}>{title}</h2>

                <div style={{ background: 'rgba(255,255,255,0.1)', padding: '16px', borderRadius: 'var(--r-sm)' }}>
                    {date && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                            <span style={{ fontSize: '13px', opacity: 0.8, fontWeight: 600 }}>일시</span>
                            <span style={{ fontSize: '13px', fontWeight: 700 }}>{date} {rentStart}~{rentEnd}</span>
                        </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '13px', opacity: 0.8, fontWeight: 600 }}>입실 인원</span>
                        <span style={{ fontSize: '13px', fontWeight: 700 }}>{headcount}명</span>
                    </div>
                    <div className="divider" style={{ background: 'rgba(255,255,255,0.2)', margin: '12px 0' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '14px', fontWeight: 700 }}>예상 송금 금액</span>
                        <span style={{ fontSize: '24px', fontWeight: 900 }}>
                            {parseInt(price, 10).toLocaleString()} <span style={{ fontSize: '16px' }}>₩</span>
                        </span>
                    </div>
                    <p style={{ fontSize: 11, opacity: 0.7, marginTop: 8 }}>
                        ※ 최종 금액은 서버가 정한 정책대로 재계산됩니다 (할인 자동 적용).
                    </p>
                </div>
            </div>

            <div style={{ padding: '0 20px', marginBottom: '20px' }}>
                <div className="card" style={{ padding: '24px 20px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--gray-900)', marginBottom: '16px' }}>예약자 정보</h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div>
                            <label className="input-label">실명</label>
                            <input
                                type="text"
                                className="input-field"
                                placeholder="예약자 이름"
                                value={bookerName}
                                onChange={(e) => setBookerName(e.target.value)}
                                disabled={isSubmitting}
                            />
                        </div>
                        <div>
                            <label className="input-label">연락처 (- 제외)</label>
                            <input
                                type="tel"
                                className="input-field"
                                placeholder="01012345678"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                disabled={isSubmitting}
                                style={{ borderColor: phone.length > 0 && !isPhoneValid ? 'var(--status-error)' : 'var(--border-medium)' }}
                            />
                            {phone.length > 0 && !isPhoneValid && (
                                <span style={{ fontSize: '12px', color: 'var(--status-error)', fontWeight: 600, marginTop: '4px', display: 'block' }}>
                                    정확한 휴대폰 번호를 입력하세요.
                                </span>
                            )}
                        </div>
                        <div>
                            <label className="input-label">팀/단체명</label>
                            <input
                                type="text"
                                className="input-field"
                                placeholder="예: 해운대 농구클럽"
                                value={teamName}
                                onChange={(e) => setTeamName(e.target.value)}
                                disabled={isSubmitting}
                            />
                        </div>
                        <div>
                            <label className="input-label">입실 인원</label>
                            <div style={{ display: 'inline-flex', alignItems: 'center', border: '1px solid var(--border-medium)', borderRadius: 'var(--r-sm)', height: 40, overflow: 'hidden' }}>
                                <button type="button" onClick={() => setHeadcount((v) => Math.max(1, v - 1))} disabled={isSubmitting} style={{ width: 40, height: '100%', fontWeight: 700, fontSize: 18, background: 'var(--bg-page)' }}>-</button>
                                <span style={{ width: 60, textAlign: 'center', fontWeight: 800 }}>{headcount}명</span>
                                <button type="button" onClick={() => setHeadcount((v) => Math.min(30, v + 1))} disabled={isSubmitting} style={{ width: 40, height: '100%', fontWeight: 900, fontSize: 18, background: 'var(--brand-primary)', color: 'white' }}>+</button>
                            </div>
                        </div>
                        <div>
                            <label className="input-label">메모 (선택)</label>
                            <textarea
                                className="input-field"
                                placeholder="특이사항이 있으면 남겨주세요"
                                value={memo}
                                onChange={(e) => setMemo(e.target.value)}
                                disabled={isSubmitting}
                                style={{ minHeight: 60 }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {errorMsg && (
                <div style={{ margin: '0 20px 16px', color: 'var(--status-error)', fontSize: 13, fontWeight: 700, padding: 12, background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 'var(--r-sm)' }}>
                    {errorMsg}
                </div>
            )}

            <div className="floating-bar">
                <button
                    onClick={handleSubmit}
                    disabled={!formValid || isSubmitting}
                    className="btn btn-trust"
                    style={{ width: '100%', height: '56px', fontSize: '16px' }}
                >
                    {isSubmitting ? '예약 요청 중...' : '예약 요청 (송금 대기 생성)'}
                </button>
            </div>
        </div>
    );
};
