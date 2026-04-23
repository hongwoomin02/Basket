import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Header } from '../components/Header';
import { useToast } from '../context/ToastContext';
import { useMock } from '../store/MockProvider';
import { ownerApi, OwnerReservationRow } from '../lib/api';
import {
    CheckCircle2, Clock, X, Phone, Users, AlertCircle, RefreshCw,
} from 'lucide-react';

type FilterKey = 'ALL' | 'AWAITING_TRANSFER' | 'TRANSFER_SUBMITTED' | 'OWNER_VERIFIED' | 'CONFIRMED' | 'CANCELLED';

const FILTER_META: { key: FilterKey; label: string }[] = [
    { key: 'ALL', label: '전체' },
    { key: 'AWAITING_TRANSFER', label: '송금 대기' },
    { key: 'TRANSFER_SUBMITTED', label: '송금 확인 필요' },
    { key: 'OWNER_VERIFIED', label: '확정 대기' },
    { key: 'CONFIRMED', label: '확정' },
    { key: 'CANCELLED', label: '취소' },
];

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
    AWAITING_TRANSFER: { label: '송금 대기', className: 'badge badge-gray' },
    TRANSFER_SUBMITTED: { label: '송금 확인 필요', className: 'badge badge-energy' },
    OWNER_VERIFIED: { label: '확정 대기', className: 'badge badge-trust' },
    CONFIRMED: { label: '확정', className: 'badge badge-black' },
    CANCELLED: { label: '취소됨', className: 'badge badge-gray' },
};

/** 현재 상태에서 OWNER가 취할 수 있는 액션 */
function actionsFor(status: string): Array<'mark-checked' | 'mark-confirmed' | 'mark-cancelled'> {
    switch (status) {
        case 'AWAITING_TRANSFER':
            return ['mark-cancelled']; // 송금이 아직이라 확인 불가, 취소만 가능
        case 'TRANSFER_SUBMITTED':
            return ['mark-checked', 'mark-cancelled'];
        case 'OWNER_VERIFIED':
            return ['mark-confirmed', 'mark-cancelled'];
        case 'CONFIRMED':
            return ['mark-cancelled'];
        default:
            return [];
    }
}

const ACTION_LABEL: Record<string, string> = {
    'mark-checked': '송금 확인',
    'mark-confirmed': '예약 확정',
    'mark-cancelled': '예약 취소',
};

export const OwnerReservations: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const { showToast } = useToast();
    const { logEvent } = useMock();

    // URL 파라미터와 동기화 (딥링크 지원)
    const initialFilter = (searchParams.get('status') as FilterKey) || 'ALL';
    const [filter, setFilter] = useState<FilterKey>(
        FILTER_META.some((f) => f.key === initialFilter) ? initialFilter : 'ALL'
    );

    const [rows, setRows] = useState<OwnerReservationRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorKind, setErrorKind] = useState<null | 'NO_GYM' | 'GENERIC'>(null);
    const [mutatingId, setMutatingId] = useState<string | null>(null);
    const [confirmCancel, setConfirmCancel] = useState<OwnerReservationRow | null>(null);

    const load = useCallback(async (f: FilterKey) => {
        setLoading(true);
        setErrorKind(null);
        try {
            const params = f === 'ALL' ? undefined : { status: f };
            const d = await ownerApi.reservations(params);
            setRows(d.rows ?? []);
        } catch (e: unknown) {
            const err = e as { response?: { status?: number; data?: { error?: { code?: string } } } };
            if (err?.response?.data?.error?.code === 'NO_GYM' || err?.response?.status === 404) setErrorKind('NO_GYM');
            else setErrorKind('GENERIC');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load(filter);
    }, [filter, load]);

    const handleFilterChange = (f: FilterKey) => {
        setFilter(f);
        // 딥링크: URL 쿼리도 함께 업데이트
        if (f === 'ALL') setSearchParams({});
        else setSearchParams({ status: f });
    };

    const performAction = async (row: OwnerReservationRow, action: 'mark-checked' | 'mark-confirmed' | 'mark-cancelled') => {
        setMutatingId(row.id);
        try {
            if (action === 'mark-checked') await ownerApi.markChecked(row.id);
            else if (action === 'mark-confirmed') await ownerApi.markConfirmed(row.id);
            else await ownerApi.markCancelled(row.id);
            logEvent('OWNER_STATE_TRANSITION', { reservationId: row.id, action });
            showToast(`${ACTION_LABEL[action]} 처리되었습니다.`);
            await load(filter);
        } catch (e: unknown) {
            const err = e as { response?: { status?: number; data?: { error?: { code?: string; message?: string } } } };
            const code = err?.response?.data?.error?.code;
            if (code === 'INVALID_RESERVATION_STATE') {
                showToast('이미 상태가 변경되었습니다. 새로고침합니다.');
                await load(filter);
            } else if (err?.response?.status === 404) {
                showToast('예약을 찾을 수 없습니다.');
                await load(filter);
            } else {
                showToast(err?.response?.data?.error?.message ?? '처리에 실패했습니다.');
            }
        } finally {
            setMutatingId(null);
            setConfirmCancel(null);
        }
    };

    const counts = useMemo(() => {
        const c: Record<string, number> = {};
        rows.forEach((r) => { c[r.status] = (c[r.status] ?? 0) + 1; });
        return c;
    }, [rows]);

    return (
        <div className="animate-fade-in" style={{ minHeight: '100vh', background: 'var(--bg-page)', paddingBottom: 80 }}>
            <Header title="예약 관리" showBack />

            {/* 필터 바 */}
            <div style={{ padding: '12px 16px', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-light)', overflowX: 'auto' }} className="scrollbar-hide">
                <div style={{ display: 'flex', gap: 8, minWidth: 'max-content' }}>
                    {FILTER_META.map((f) => (
                        <button
                            key={f.key}
                            type="button"
                            onClick={() => handleFilterChange(f.key)}
                            style={{
                                flexShrink: 0, padding: '8px 14px', borderRadius: 20, fontSize: 12, fontWeight: 800, whiteSpace: 'nowrap',
                                border: '1px solid', cursor: 'pointer',
                                borderColor: filter === f.key ? 'var(--brand-trust)' : 'var(--border-light)',
                                background: filter === f.key ? 'var(--brand-trust)' : 'var(--bg-surface)',
                                color: filter === f.key ? 'white' : 'var(--gray-600)',
                            }}
                        >
                            {f.label}
                            {filter === 'ALL' && counts[f.key] !== undefined && ` (${counts[f.key]})`}
                        </button>
                    ))}
                </div>
            </div>

            <div style={{ padding: 16 }}>
                {/* 로딩 */}
                {loading && (
                    <>
                        {[0, 1, 2].map((i) => (
                            <div key={i} style={{ height: 120, background: 'var(--gray-200)', borderRadius: 'var(--r-md)', marginBottom: 10 }} />
                        ))}
                    </>
                )}

                {/* 에러: NO_GYM */}
                {!loading && errorKind === 'NO_GYM' && (
                    <div className="card" style={{ padding: 28, textAlign: 'center' }}>
                        <p style={{ fontWeight: 700, color: 'var(--gray-900)', marginBottom: 12 }}>
                            아직 등록된 체육관이 없어 예약을 관리할 수 없습니다.
                        </p>
                        <p style={{ fontSize: 12, color: 'var(--gray-500)' }}>운영팀에 체육관 등록을 문의해 주세요.</p>
                    </div>
                )}

                {/* 에러: GENERIC */}
                {!loading && errorKind === 'GENERIC' && (
                    <div className="card" style={{ padding: 24, textAlign: 'center' }}>
                        <AlertCircle size={36} color="var(--status-error)" style={{ margin: '0 auto 10px' }} />
                        <p style={{ fontWeight: 700, marginBottom: 14 }}>예약 목록을 불러오지 못했습니다.</p>
                        <button type="button" className="btn btn-primary" onClick={() => load(filter)}>다시 시도</button>
                    </div>
                )}

                {/* 빈 상태 */}
                {!loading && !errorKind && rows.length === 0 && (
                    <div className="card" style={{ padding: 28, textAlign: 'center', color: 'var(--gray-500)' }}>
                        <Clock size={28} color="var(--gray-400)" style={{ margin: '0 auto 10px' }} />
                        <p style={{ fontWeight: 700, marginBottom: 4 }}>해당 내역이 없습니다.</p>
                        <p style={{ fontSize: 12 }}>다른 필터를 선택해 보세요.</p>
                    </div>
                )}

                {/* 리스트 */}
                {!loading && !errorKind && rows.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {rows.map((r) => {
                            const meta = STATUS_BADGE[r.status] ?? { label: r.status, className: 'badge badge-gray' };
                            const actions = actionsFor(r.status);
                            const isMutating = mutatingId === r.id;
                            return (
                                <div key={r.id} className="card" style={{ padding: 16 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <h3 style={{ fontSize: 15, fontWeight: 900, color: 'var(--gray-900)', marginBottom: 4 }}>
                                                {r.teamName} · {r.bookerName}
                                            </h3>
                                            <p style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 2 }}>{r.gymName}</p>
                                            <p style={{ fontSize: 13, color: 'var(--gray-700)', fontWeight: 600 }}>
                                                {r.date} · {r.time}
                                            </p>
                                        </div>
                                        <span className={meta.className}>{meta.label}</span>
                                    </div>

                                    <div style={{ display: 'flex', gap: 14, padding: '8px 0', borderTop: '1px solid var(--border-light)', borderBottom: '1px solid var(--border-light)', margin: '10px 0', fontSize: 12, color: 'var(--gray-600)', fontWeight: 600 }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Users size={13} /> {r.headcount}명</span>
                                        <a href={`tel:${r.phone}`} style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--brand-trust)', textDecoration: 'none' }}>
                                            <Phone size={13} /> {r.phone}
                                        </a>
                                        <span style={{ marginLeft: 'auto', fontWeight: 800, color: 'var(--gray-900)' }}>
                                            {r.finalPrice.toLocaleString()}원 {r.discountApplied && <span className="badge badge-trust" style={{ marginLeft: 4, fontSize: 10 }}>할인</span>}
                                        </span>
                                    </div>

                                    {actions.length === 0 && (
                                        <p style={{ fontSize: 12, color: 'var(--gray-500)', margin: '4px 0' }}>이 상태에서는 가능한 작업이 없습니다.</p>
                                    )}

                                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                        {actions.includes('mark-checked') && (
                                            <button type="button" className="btn btn-trust" style={{ flex: 1, height: 40, fontSize: 13 }} disabled={isMutating} onClick={() => performAction(r, 'mark-checked')}>
                                                <CheckCircle2 size={14} /> 송금 확인
                                            </button>
                                        )}
                                        {actions.includes('mark-confirmed') && (
                                            <button type="button" className="btn btn-primary" style={{ flex: 1, height: 40, fontSize: 13 }} disabled={isMutating} onClick={() => performAction(r, 'mark-confirmed')}>
                                                <CheckCircle2 size={14} /> 예약 확정
                                            </button>
                                        )}
                                        {actions.includes('mark-cancelled') && (
                                            <button type="button" className="btn btn-secondary" style={{ flex: actions.length > 1 ? '0 0 96px' : 1, height: 40, fontSize: 13, background: 'white', borderColor: 'var(--status-error)', color: 'var(--status-error)' }} disabled={isMutating} onClick={() => setConfirmCancel(r)}>
                                                <X size={14} /> 취소
                                            </button>
                                        )}
                                    </div>

                                    {r.status === 'AWAITING_TRANSFER' && (
                                        <p style={{ fontSize: 11, color: 'var(--gray-500)', marginTop: 8, lineHeight: 1.5 }}>
                                            고객이 아직 송금 완료 처리를 하지 않았습니다. 송금이 확인되면 "송금 확인 필요" 상태로 바뀝니다.
                                        </p>
                                    )}
                                </div>
                            );
                        })}

                        <button type="button" onClick={() => load(filter)} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 12, fontSize: 12, fontWeight: 700, color: 'var(--gray-500)', background: 'none', margin: '4px auto 0' }}>
                            <RefreshCw size={12} /> 새로고침
                        </button>
                    </div>
                )}
            </div>

            {/* 취소 확인 모달 */}
            {confirmCancel && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                    <div className="card" style={{ width: '100%', maxWidth: 360, padding: 24 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 900, marginBottom: 10 }}>예약을 취소하시겠습니까?</h3>
                        <p style={{ fontSize: 13, color: 'var(--gray-600)', lineHeight: 1.6, marginBottom: 8 }}>
                            {confirmCancel.teamName} · {confirmCancel.bookerName}<br />
                            {confirmCancel.date} · {confirmCancel.time}
                        </p>
                        <p style={{ fontSize: 12, color: 'var(--status-error)', marginBottom: 20 }}>
                            취소 후에는 되돌릴 수 없으며, 고객에게 환불 안내를 별도로 해주셔야 합니다.
                        </p>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button type="button" className="btn btn-secondary" style={{ flex: 1, background: 'white' }} disabled={!!mutatingId} onClick={() => setConfirmCancel(null)}>
                                돌아가기
                            </button>
                            <button type="button" className="btn" style={{ flex: 1, background: 'var(--status-error)', color: 'white' }} disabled={!!mutatingId} onClick={() => performAction(confirmCancel, 'mark-cancelled')}>
                                {mutatingId ? '처리 중...' : '취소하기'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
