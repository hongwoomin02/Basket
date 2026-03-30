import React, { useMemo, useState } from 'react';
import { Header } from '../components/Header';
import { useMock } from '../store/MockProvider';
import { CheckCircle2, Clock, Image as ImageIcon } from 'lucide-react';
import { useToast } from '../context/ToastContext';

function formatMoney(n: number) {
    return n.toLocaleString('ko-KR');
}

function formatAppLine(app: { date: string; startTime?: string; endTime?: string }) {
    const dateStr = new Date(app.date).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
    const timePart = app.startTime && app.endTime ? ` · ${app.startTime} ~ ${app.endTime}` : '';
    return `${dateStr}${timePart}`;
}

export const OwnerReservations: React.FC = () => {
    const { applications, confirmApplication } = useMock();
    const { showToast } = useToast();
    const [tab, setTab] = useState<'pending' | 'confirmed'>('pending');

    const rentApps = useMemo(() => applications.filter((a) => a.type === 'rent'), [applications]);

    const filtered = useMemo(() => {
        if (tab === 'confirmed') return rentApps.filter((a) => a.transferStatus === 'CONFIRMED');
        return rentApps.filter((a) => a.transferStatus !== 'CONFIRMED');
    }, [rentApps, tab]);

    return (
        <div className="animate-fade-in" style={{ minHeight: '100vh', background: 'var(--bg-page)', paddingBottom: '80px' }}>
            <Header title="예약 확인" showBack />

            <div style={{ padding: '16px 20px 12px', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-light)' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        type="button"
                        className={`filter-chip ${tab === 'pending' ? 'active' : ''}`}
                        onClick={() => setTab('pending')}
                        style={{ flex: 1 }}
                    >
                        <Clock size={14} /> 송금 확인 대기
                    </button>
                    <button
                        type="button"
                        className={`filter-chip ${tab === 'confirmed' ? 'active' : ''}`}
                        onClick={() => setTab('confirmed')}
                        style={{ flex: 1 }}
                    >
                        <CheckCircle2 size={14} /> 확정 완료
                    </button>
                </div>
            </div>

            <div style={{ padding: '16px 20px' }}>
                {filtered.length === 0 ? (
                    <div className="card" style={{ padding: '24px', textAlign: 'center' }}>
                        <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--gray-600)' }}>해당 내역이 없습니다.</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {filtered.map((app) => {
                            const hasProof = !!app.proofFileName;
                            const isConfirmed = app.transferStatus === 'CONFIRMED';
                            const canConfirm = hasProof && !isConfirmed;

                            return (
                                <div key={app.id} className="card" style={{ padding: '16px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <h3 style={{ fontSize: '16px', fontWeight: 900, marginBottom: '6px', color: 'var(--gray-900)' }}>
                                                {app.title}
                                            </h3>
                                            <p style={{ fontSize: '12px', color: 'var(--gray-500)', marginBottom: '10px' }}>
                                                {formatAppLine(app)}
                                            </p>
                                            <p style={{ fontSize: '13px', fontWeight: 800, color: 'var(--brand-primary)' }}>
                                                {formatMoney(app.price)}원
                                            </p>
                                        </div>

                                        <div style={{ textAlign: 'right' }}>
                                            <div className={`badge ${isConfirmed ? 'badge-trust' : 'badge-gray'}`}>
                                                {isConfirmed ? '예약 확정' : hasProof ? '송금 확인 대기' : '증빙 없음'}
                                            </div>
                                            {hasProof && (
                                                <p style={{ fontSize: '11px', color: 'var(--gray-500)', fontWeight: 700, marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                                                    <ImageIcon size={14} /> {app.proofFileName}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                                        <button
                                            type="button"
                                            className="btn btn-trust"
                                            disabled={!canConfirm}
                                            style={{ flex: 1, opacity: canConfirm ? 1 : 0.6 }}
                                            onClick={() => {
                                                if (!canConfirm) return;
                                                confirmApplication(app.id);
                                                showToast('송금 확인 후 예약이 확정되었습니다. (목업)');
                                            }}
                                        >
                                            송금 확인 후 예약 확정
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-secondary"
                                            style={{ width: '120px' }}
                                            onClick={() => showToast('증빙 스크린샷은 목업 파일명만 표시됩니다.')}
                                        >
                                            보기
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

