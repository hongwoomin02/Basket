import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { reservationsApi, ReservationSummary } from '../lib/api';
import { useToast } from '../context/ToastContext';

const STATUS_META: Record<string, { label: string; className: string }> = {
    AWAITING_TRANSFER: { label: '송금 대기', className: 'badge badge-gray' },
    TRANSFER_SUBMITTED: { label: '송금 확인 중', className: 'badge badge-trust' },
    OWNER_VERIFIED: { label: '운영자 확인', className: 'badge badge-trust' },
    CONFIRMED: { label: '예약 확정', className: 'badge badge-trust' },
    CANCELLED: { label: '취소됨', className: 'badge badge-gray' },
};

function ymKey(dateStr: string) {
    // dateStr: "2026-04-22"
    return dateStr.slice(0, 7);
}

export const MyReservations: React.FC = () => {
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [reservations, setReservations] = useState<ReservationSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filterYm, setFilterYm] = useState('');

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);
        reservationsApi
            .myList()
            .then((r) => {
                if (cancelled) return;
                const list = r.reservations ?? [];
                setReservations(list);
                // 기본 필터: 가장 최근 예약의 월, 없으면 이번 달
                if (list.length > 0) {
                    setFilterYm(ymKey(list[0].date));
                } else {
                    const now = new Date();
                    setFilterYm(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
                }
            })
            .catch((e: unknown) => {
                if (cancelled) return;
                const err = e as { response?: { status?: number } };
                if (err?.response?.status === 401) setError('로그인이 만료되었습니다.');
                else setError('예약 내역을 불러오지 못했습니다.');
            })
            .finally(() => !cancelled && setLoading(false));
        return () => {
            cancelled = true;
        };
    }, []);

    const monthOptions = useMemo(() => {
        const set = new Set<string>();
        reservations.forEach((a) => set.add(ymKey(a.date)));
        if (filterYm) set.add(filterYm);
        return Array.from(set).sort().reverse();
    }, [reservations, filterYm]);

    const filtered = useMemo(
        () => reservations.filter((r) => ymKey(r.date) === filterYm),
        [reservations, filterYm],
    );

    return (
        <div className="animate-fade-in" style={{ minHeight: '100vh', background: 'var(--bg-page)', paddingBottom: '40px' }}>
            <Header title="예약 내역" showBack />

            <div style={{ padding: '16px 20px' }}>
                {loading ? (
                    <>
                        <div style={{ height: 48, background: 'var(--gray-200)', borderRadius: 'var(--r-md)', marginBottom: 16 }} />
                        <div style={{ height: 120, background: 'var(--gray-200)', borderRadius: 'var(--r-md)', marginBottom: 10 }} />
                        <div style={{ height: 120, background: 'var(--gray-200)', borderRadius: 'var(--r-md)' }} />
                    </>
                ) : error ? (
                    <div className="card" style={{ padding: 24, textAlign: 'center' }}>
                        <p style={{ fontWeight: 700, color: 'var(--gray-900)', marginBottom: 12 }}>{error}</p>
                        <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>다시 시도</button>
                    </div>
                ) : (
                    <>
                        <label className="input-label">월별 보기</label>
                        <select
                            className="input-field"
                            value={filterYm}
                            onChange={(e) => setFilterYm(e.target.value)}
                            style={{ marginBottom: '16px' }}
                        >
                            {monthOptions.map((ym) => {
                                const [y, m] = ym.split('-');
                                return (
                                    <option key={ym} value={ym}>
                                        {y}년 {parseInt(m, 10)}월
                                    </option>
                                );
                            })}
                        </select>

                        {filtered.length === 0 ? (
                            <div className="card" style={{ padding: '24px', textAlign: 'center', color: 'var(--gray-500)', fontWeight: 600 }}>
                                <p style={{ marginBottom: 12 }}>해당 월에 예약이 없습니다.</p>
                                <button type="button" className="btn btn-primary" onClick={() => navigate('/')}>체육관 찾으러 가기</button>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {filtered.map((r) => {
                                    const meta = STATUS_META[r.status] ?? { label: r.status, className: 'badge badge-gray' };
                                    return (
                                        <div
                                            key={r.id}
                                            className="card"
                                            style={{ padding: '16px', cursor: 'pointer' }}
                                            onClick={() => {
                                                const q = new URLSearchParams({ reservationId: r.id, gymId: r.gymPlaceId, title: encodeURIComponent(r.gymName) });
                                                navigate(`/success?${q.toString()}`);
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                <span style={{ fontSize: '15px', fontWeight: 800 }}>{r.gymName}</span>
                                                <span className={meta.className}>{meta.label}</span>
                                            </div>
                                            <p style={{ fontSize: '13px', color: 'var(--gray-600)', marginBottom: '6px' }}>
                                                {r.date} · {r.time}
                                            </p>
                                            <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--gray-900)' }}>
                                                {r.finalPrice.toLocaleString()}원
                                            </p>
                                            {r.status === 'AWAITING_TRANSFER' && (
                                                <button
                                                    type="button"
                                                    className="btn btn-trust"
                                                    style={{ width: '100%', marginTop: 10, height: 40, fontSize: 13 }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        const q = new URLSearchParams({ reservationId: r.id, gymId: r.gymPlaceId, title: encodeURIComponent(r.gymName) });
                                                        navigate(`/success?${q.toString()}`);
                                                    }}
                                                >
                                                    송금 안내 / 완료 처리
                                                </button>
                                            )}
                                            {(r.status === 'TRANSFER_SUBMITTED' || r.status === 'OWNER_VERIFIED') && (
                                                <p style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 8 }}>
                                                    운영자의 확인을 기다리고 있습니다.
                                                </p>
                                            )}
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    showToast('예약 취소는 체육관 운영자에게 문의해 주세요.');
                                                }}
                                                style={{ fontSize: '12px', fontWeight: 700, color: 'var(--gray-500)', background: 'none', border: 'none', padding: '6px 0', marginTop: 8, textAlign: 'left', cursor: 'pointer' }}
                                            >
                                                예약 취소 문의
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};
