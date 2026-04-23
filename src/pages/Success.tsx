import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, ExternalLink, CalendarCheck, AlertCircle } from 'lucide-react';
import { useMock } from '../store/MockProvider';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import {
    reservationsApi,
    gymsApi,
    ReservationDetail,
    TimelineItem,
    PaymentMethods,
} from '../lib/api';

const STATUS_META: Record<string, { label: string; color: string; desc: string }> = {
    AWAITING_TRANSFER: { label: '송금 대기', color: 'var(--brand-energy)', desc: '아래 계좌로 송금 후 [송금 완료] 버튼을 눌러주세요.' },
    TRANSFER_SUBMITTED: { label: '송금 확인 중', color: 'var(--brand-trust)', desc: '운영자가 송금 내역을 확인하고 있습니다.' },
    OWNER_VERIFIED: { label: '운영자 확인', color: 'var(--brand-trust)', desc: '예약이 곧 확정됩니다.' },
    CONFIRMED: { label: '예약 확정', color: 'var(--status-success)', desc: '예약이 확정되었습니다. 수고하셨습니다!' },
    CANCELLED: { label: '취소됨', color: 'var(--status-error)', desc: '이 예약은 취소되었습니다.' },
};

export const Success: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { logEvent } = useMock();
    const { showToast } = useToast();
    const { user } = useAuth();

    const reservationId = searchParams.get('reservationId');
    const gymId = searchParams.get('gymId');

    const [reservation, setReservation] = useState<ReservationDetail | null>(null);
    const [timeline, setTimeline] = useState<TimelineItem[]>([]);
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethods | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // 송금 완료 처리 폼 상태
    const [payerName, setPayerName] = useState(user?.displayName ?? '');
    const [transferMethod, setTransferMethod] = useState<'KAKAO' | 'BANK'>('BANK');
    const [submittingTransfer, setSubmittingTransfer] = useState(false);

    const reload = useCallback(async () => {
        if (!reservationId) return;
        const [r, t] = await Promise.all([
            reservationsApi.get(reservationId),
            reservationsApi.timeline(reservationId),
        ]);
        setReservation(r);
        setTimeline(t.statusTimeline ?? []);
    }, [reservationId]);

    useEffect(() => {
        if (!reservationId) {
            setError('예약 정보가 없습니다.');
            setLoading(false);
            return;
        }
        let cancelled = false;
        setLoading(true);
        setError(null);

        (async () => {
            try {
                const tasks: Promise<unknown>[] = [
                    reservationsApi.get(reservationId),
                    reservationsApi.timeline(reservationId),
                ];
                // 체육관 결제수단은 실패해도 페이지 자체는 보여줘야 함
                if (gymId) {
                    tasks.push(gymsApi.paymentMethods(gymId).catch(() => null));
                }
                const [r, t, pm] = await Promise.all(tasks);
                if (cancelled) return;
                setReservation(r as ReservationDetail);
                setTimeline((t as { statusTimeline: TimelineItem[] }).statusTimeline ?? []);
                if (gymId) setPaymentMethods(pm as PaymentMethods | null);
            } catch (e: unknown) {
                if (cancelled) return;
                const err = e as { response?: { status?: number } };
                if (err?.response?.status === 404) setError('예약을 찾을 수 없습니다.');
                else setError('예약 정보를 불러오지 못했습니다.');
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [reservationId, gymId]);

    // 기본 송금 수단 선택: visibleMethods 존재 시 첫 번째
    useEffect(() => {
        if (!paymentMethods) return;
        const visible = paymentMethods.visibleMethods ?? [];
        if (visible.includes('KAKAO')) setTransferMethod('KAKAO');
        else setTransferMethod('BANK');
    }, [paymentMethods]);

    const handleTransferDone = async () => {
        if (!reservationId) return;
        if (payerName.trim().length < 2) {
            showToast('송금자 이름을 2자 이상 입력해 주세요.');
            return;
        }
        setSubmittingTransfer(true);
        try {
            await reservationsApi.transferDone(reservationId, { payerName: payerName.trim() });
            logEvent('TRANSFER_DONE', { reservationId });
            showToast('송금 완료 처리되었습니다.');
            await reload();
        } catch (e: unknown) {
            const err = e as { response?: { status?: number; data?: { error?: { code?: string; message?: string } } } };
            if (err?.response?.data?.error?.code === 'INVALID_RESERVATION_STATE') {
                showToast('이미 송금 완료 처리되었습니다.');
                await reload();
            } else {
                showToast('송금 완료 처리에 실패했습니다.');
            }
        } finally {
            setSubmittingTransfer(false);
        }
    };

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', background: 'var(--bg-page)', padding: 40 }}>
                <div style={{ height: 80, borderRadius: 'var(--r-md)', background: 'var(--gray-200)', marginBottom: 16 }} />
                <div style={{ height: 160, borderRadius: 'var(--r-md)', background: 'var(--gray-200)' }} />
            </div>
        );
    }
    if (error || !reservation) {
        return (
            <div style={{ minHeight: '100vh', background: 'var(--bg-page)', padding: '40px 16px', textAlign: 'center' }}>
                <AlertCircle size={48} color="var(--status-error)" style={{ margin: '40px auto 16px' }} />
                <p style={{ fontWeight: 700, color: 'var(--gray-900)', marginBottom: 16 }}>{error ?? '예약을 찾을 수 없습니다.'}</p>
                <button type="button" className="btn btn-primary" onClick={() => navigate('/')}>홈으로</button>
            </div>
        );
    }

    const meta = STATUS_META[reservation.status] ?? { label: reservation.status, color: 'var(--gray-500)', desc: '' };
    const isAwaiting = reservation.status === 'AWAITING_TRANSFER';

    return (
        <div className="animate-fade-in" style={{ minHeight: '100vh', background: 'var(--bg-page)', padding: '40px 16px 24px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ textAlign: 'center', marginTop: 20, marginBottom: 24 }}>
                <CheckCircle size={56} color={meta.color} style={{ margin: '0 auto 12px' }} />
                <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--gray-900)', marginBottom: 8 }}>{meta.label}</h1>
                <p style={{ fontSize: 13, color: 'var(--gray-500)', fontWeight: 500 }}>{meta.desc}</p>
            </div>

            {/* 영수증 */}
            <div className="card" style={{ padding: 20, marginBottom: 12 }}>
                <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--gray-400)', marginBottom: 8, fontWeight: 700 }}>예약 영수증</p>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{reservation.gymName}</h3>
                <p style={{ fontSize: 13, color: 'var(--gray-600)', fontWeight: 600 }}>{reservation.date} · {reservation.time} · {reservation.peopleCount}명</p>
                <div className="divider" style={{ margin: '16px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 14, color: 'var(--gray-600)', fontWeight: 600 }}>송금 금액</span>
                    <span style={{ fontSize: 22, fontWeight: 900, color: 'var(--brand-primary)' }}>{reservation.finalPrice.toLocaleString()} 원</span>
                </div>
            </div>

            {/* 타임라인 */}
            {timeline.length > 0 && (
                <div className="card" style={{ padding: 16, marginBottom: 12 }}>
                    <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--gray-400)', marginBottom: 12, fontWeight: 700 }}>진행 상태</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {timeline.map((t) => (
                            <div key={t.key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ width: 10, height: 10, borderRadius: '50%', background: t.doneAt ? 'var(--status-success)' : 'var(--gray-300)' }} />
                                <span style={{ fontSize: 13, fontWeight: 700, color: t.doneAt ? 'var(--gray-900)' : 'var(--gray-500)' }}>{t.label}</span>
                                {t.doneAt && <span style={{ fontSize: 11, color: 'var(--gray-400)', marginLeft: 'auto' }}>{new Date(t.doneAt).toLocaleString('ko-KR')}</span>}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 송금 안내 + 완료 버튼 (AWAITING_TRANSFER 상태만) */}
            {isAwaiting && (
                <div className="card" style={{ padding: 20, marginBottom: 12 }}>
                    <h4 style={{ fontSize: 14, fontWeight: 800, marginBottom: 12 }}>송금 방법</h4>
                    {paymentMethods ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {paymentMethods.visibleMethods?.includes('KAKAO') && paymentMethods.kakaoPayLink && (
                                <div style={{ padding: 14, borderRadius: 'var(--r-sm)', background: transferMethod === 'KAKAO' ? 'var(--brand-light)' : 'var(--bg-page)', border: '1px solid var(--border-light)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                        <strong style={{ fontSize: 13 }}>카카오페이 송금</strong>
                                        <button type="button" onClick={() => setTransferMethod('KAKAO')} className={transferMethod === 'KAKAO' ? 'badge badge-trust' : 'badge badge-gray'} style={{ border: 'none', cursor: 'pointer', fontSize: 10 }}>선택</button>
                                    </div>
                                    <a href={paymentMethods.kakaoPayLink} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: 'var(--brand-trust)' }}>
                                        송금 링크 열기 <ExternalLink size={14} />
                                    </a>
                                </div>
                            )}
                            {paymentMethods.visibleMethods?.includes('BANK') && paymentMethods.bankName && (
                                <div style={{ padding: 14, borderRadius: 'var(--r-sm)', background: transferMethod === 'BANK' ? 'var(--brand-light)' : 'var(--bg-page)', border: '1px solid var(--border-light)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                        <strong style={{ fontSize: 13 }}>계좌 이체</strong>
                                        <button type="button" onClick={() => setTransferMethod('BANK')} className={transferMethod === 'BANK' ? 'badge badge-trust' : 'badge badge-gray'} style={{ border: 'none', cursor: 'pointer', fontSize: 10 }}>선택</button>
                                    </div>
                                    <p style={{ fontSize: 15, fontWeight: 800 }}>{paymentMethods.bankName} {paymentMethods.accountNumber}</p>
                                    <p style={{ fontSize: 12, color: 'var(--gray-500)' }}>예금주 {paymentMethods.accountHolder}</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <p style={{ fontSize: 13, color: 'var(--gray-500)' }}>운영자가 등록한 계좌 정보가 없습니다. 운영자에게 직접 문의해 주세요.</p>
                    )}

                    <div style={{ marginTop: 16 }}>
                        <label className="input-label">송금자 이름</label>
                        <input
                            type="text"
                            className="input-field"
                            placeholder="실제 송금한 사람의 이름"
                            value={payerName}
                            onChange={(e) => setPayerName(e.target.value)}
                            disabled={submittingTransfer}
                        />
                    </div>
                    <button
                        type="button"
                        className="btn btn-trust"
                        style={{ width: '100%', marginTop: 12, height: 48 }}
                        onClick={handleTransferDone}
                        disabled={submittingTransfer}
                    >
                        {submittingTransfer ? '처리 중...' : '송금 완료했습니다'}
                    </button>
                </div>
            )}

            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 16 }}>
                <button
                    onClick={() => navigate('/my/reservations')}
                    className="btn btn-secondary"
                    style={{ background: 'white' }}
                >
                    <CalendarCheck size={18} /> 내 예약 내역 확인
                </button>
                <button
                    onClick={() => navigate('/')}
                    className="btn btn-primary"
                    style={{ background: 'transparent', border: 'none', color: 'var(--gray-500)', boxShadow: 'none' }}
                >
                    홈으로 돌아가기
                </button>
            </div>
        </div>
    );
};
