import React from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { useMock } from '../store/MockProvider';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, MessageSquare, Activity, ChevronRight } from 'lucide-react';

export const Ops: React.FC = () => {
    const { mockMode, setMockMode, eventLogs, clearLogs } = useMock();
    const { user } = useAuth();

    return (
        <div className="animate-fade-in" style={{ minHeight: '100vh', background: 'var(--bg-page)', paddingBottom: 40 }}>
            <Header title="운영 콘솔" showBack />

            {/* 운영자 정보 히어로 */}
            <div style={{ padding: '20px', background: 'var(--brand-primary)', color: 'white' }}>
                <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--gray-400)', marginBottom: 4, fontWeight: 800 }}>
                    <ShieldCheck size={12} style={{ verticalAlign: 'middle' }} /> OPS / ADMIN 콘솔
                </p>
                <h2 style={{ fontSize: 18, fontWeight: 900 }}>{user?.displayName ?? '운영자'}</h2>
                <p style={{ fontSize: 12, color: 'var(--gray-300)', marginTop: 4 }}>{user?.email} · {user?.role}</p>
            </div>

            {/* 콘솔 메뉴 */}
            <div style={{ padding: 16 }}>
                <h3 style={{ fontSize: 13, fontWeight: 800, color: 'var(--gray-600)', marginBottom: 10 }}>운영 도구</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <Link
                        to="/ops/reviews"
                        className="card"
                        style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}
                    >
                        <div style={{ width: 40, height: 40, borderRadius: 'var(--r-sm)', background: 'var(--brand-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <MessageSquare size={20} color="var(--brand-trust)" />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 800, fontSize: 14 }}>리뷰 모더레이션</div>
                            <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>야외 체육관 리뷰 숨기기 / 복원</div>
                        </div>
                        <ChevronRight size={16} color="var(--gray-400)" />
                    </Link>
                </div>

                {/* 개발자 디버그 콘솔 */}
                <h3 style={{ fontSize: 13, fontWeight: 800, color: 'var(--gray-600)', margin: '24px 0 10px' }}>개발자 디버그</h3>
                <div className="card" style={{ padding: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, color: 'var(--gray-700)', fontSize: 12, fontWeight: 800 }}>
                        <Activity size={14} /> Mock 환경 모드
                    </div>
                    <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
                        {(['success', 'empty', 'error'] as const).map((mode) => (
                            <button
                                key={mode}
                                onClick={() => setMockMode(mode)}
                                style={{
                                    flex: 1, padding: '8px 0', fontSize: 11, fontWeight: 800, borderRadius: 6,
                                    border: '1px solid',
                                    borderColor: mockMode === mode ? 'var(--brand-trust)' : 'var(--border-light)',
                                    background: mockMode === mode ? 'var(--brand-trust)' : 'var(--bg-surface)',
                                    color: mockMode === mode ? 'white' : 'var(--gray-600)',
                                    cursor: 'pointer',
                                }}
                            >
                                {mode.toUpperCase()}
                            </button>
                        ))}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--gray-700)' }}>이벤트 로그 ({eventLogs.length})</span>
                        <button type="button" onClick={clearLogs} style={{ fontSize: 11, color: 'var(--status-error)', background: 'none', fontWeight: 700 }}>CLEAR</button>
                    </div>
                    <div style={{ maxHeight: 240, overflowY: 'auto', background: 'var(--gray-50)', border: '1px solid var(--border-light)', borderRadius: 6, padding: 10, fontFamily: 'monospace', fontSize: 11 }}>
                        {eventLogs.length === 0 ? (
                            <span style={{ color: 'var(--gray-400)' }}>No events buffered.</span>
                        ) : (
                            eventLogs.map((log, i) => (
                                <div key={i} style={{ marginBottom: 4, color: 'var(--gray-700)' }}>
                                    <span style={{ color: 'var(--gray-400)' }}>{new Date(log.ts).toISOString().slice(11, 19)}</span>{' '}
                                    <b style={{ color: 'var(--brand-trust)' }}>{log.event}</b>{' '}
                                    {log.meta && <span style={{ color: 'var(--gray-500)' }}>{JSON.stringify(log.meta)}</span>}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
