import React, { useMemo, useState } from 'react';
import { Header } from '../components/Header';
import { useMock, type Application } from '../store/MockProvider';

function ymKey(d: Date) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function formatAppLine(app: Application) {
    const dateStr = new Date(app.date).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
    const suffix = app.type === 'rent' ? '대관' : '참여';
    const timePart = app.startTime && app.endTime ? ` · ${app.startTime} ~ ${app.endTime} ${suffix}` : '';
    return `${dateStr}${timePart}`;
}

export const MyReservations: React.FC = () => {
    const { applications, removeApplication } = useMock();
    const [filterYm, setFilterYm] = useState(() => ymKey(new Date()));
    const [cancelTarget, setCancelTarget] = useState<{ id: string; title: string; price: number; cancelFeePercent: number } | null>(null);

    const monthOptions = useMemo(() => {
        const set = new Set<string>();
        applications.forEach((a) => set.add(ymKey(new Date(a.date))));
        set.add(ymKey(new Date()));
        const arr = Array.from(set).sort().reverse();
        return arr.length ? arr : [ymKey(new Date())];
    }, [applications]);

    const filtered = useMemo(
        () => applications.filter((a) => ymKey(new Date(a.date)) === filterYm),
        [applications, filterYm],
    );

    return (
        <div className="animate-fade-in" style={{ minHeight: '100vh', background: 'var(--bg-page)', paddingBottom: '40px' }}>
            <Header title="예약 내역" showBack />

            <div style={{ padding: '16px 20px' }}>
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
                        해당 월에 예약이 없습니다.
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {filtered.map((app) => {
                            const feePct = app.cancelFeePercent ?? 10;
                            return (
                                <div key={app.id} className="card" style={{ padding: '16px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <span style={{ fontSize: '15px', fontWeight: 800 }}>{app.title}</span>
                                        <span className="badge badge-trust">{app.type === 'rent' ? '대관' : '픽업'}</span>
                                    </div>
                                    <p style={{ fontSize: '13px', color: 'var(--gray-600)', marginBottom: '6px' }}>{formatAppLine(app)}</p>
                                    <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--gray-900)', marginBottom: '12px' }}>{app.price.toLocaleString()}원</p>
                                    <button
                                        type="button"
                                        onClick={() => setCancelTarget({ id: app.id, title: app.title, price: app.price, cancelFeePercent: feePct })}
                                        style={{ fontSize: '12px', fontWeight: 700, color: 'var(--status-error)', background: 'none', border: '1px solid var(--status-error)', padding: '6px 12px', borderRadius: 'var(--r-sm)' }}
                                    >
                                        예약 취소
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

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
        </div>
    );
}
