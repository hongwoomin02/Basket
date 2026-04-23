import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Header } from '../components/Header';
import { useToast } from '../context/ToastContext';
import { adminApi, AdminReviewRow } from '../lib/api';
import { Eye, EyeOff, Image as ImageIcon, Search, Star, AlertCircle, X, ChevronDown, ChevronUp } from 'lucide-react';

type StatusFilter = 'ALL' | 'VISIBLE' | 'HIDDEN';

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
    VISIBLE: { label: '노출', className: 'badge badge-trust' },
    HIDDEN: { label: '숨김', className: 'badge badge-gray' },
};

export const OpsReviews: React.FC = () => {
    const { showToast } = useToast();
    const [status, setStatus] = useState<StatusFilter>('ALL');
    const [query, setQuery] = useState('');
    const [rows, setRows] = useState<AdminReviewRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [mutatingId, setMutatingId] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [photoModal, setPhotoModal] = useState<{ reviewId: string; loading: boolean; urls: string[] } | null>(null);

    const load = useCallback(async (s: StatusFilter) => {
        setLoading(true);
        setError(false);
        try {
            const d = await adminApi.reviews(s === 'ALL' ? undefined : { status: s });
            setRows(d.reviewRows ?? []);
        } catch {
            setError(true);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(status); }, [status, load]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return rows;
        return rows.filter((r) =>
            r.placeName.toLowerCase().includes(q) ||
            r.nickname.toLowerCase().includes(q) ||
            r.content.toLowerCase().includes(q)
        );
    }, [rows, query]);

    const handleAction = async (row: AdminReviewRow, action: 'hide' | 'restore') => {
        setMutatingId(row.id);
        try {
            if (action === 'hide') await adminApi.hideReview(row.id);
            else await adminApi.restoreReview(row.id);
            showToast(action === 'hide' ? '리뷰를 숨겼습니다.' : '리뷰를 복원했습니다.');
            await load(status);
        } catch (e: unknown) {
            const err = e as { response?: { data?: { error?: { message?: string } } } };
            showToast(err?.response?.data?.error?.message ?? '처리에 실패했습니다.');
        } finally {
            setMutatingId(null);
        }
    };

    const openPhotos = async (reviewId: string) => {
        setPhotoModal({ reviewId, loading: true, urls: [] });
        try {
            const d = await adminApi.reviewPhotos(reviewId);
            setPhotoModal({ reviewId, loading: false, urls: d.photos.map((p) => p.url) });
        } catch {
            setPhotoModal({ reviewId, loading: false, urls: [] });
            showToast('사진을 불러오지 못했습니다.');
        }
    };

    return (
        <div className="animate-fade-in" style={{ minHeight: '100vh', background: 'var(--bg-page)', paddingBottom: 80 }}>
            <Header title="리뷰 모더레이션" showBack />

            {/* 필터 + 검색 */}
            <div style={{ padding: '12px 16px', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', gap: 8 }}>
                    {(['ALL', 'VISIBLE', 'HIDDEN'] as StatusFilter[]).map((s) => (
                        <button
                            key={s}
                            type="button"
                            onClick={() => setStatus(s)}
                            style={{
                                flex: 1, padding: '8px 14px', borderRadius: 20, fontSize: 12, fontWeight: 800,
                                border: '1px solid', cursor: 'pointer',
                                borderColor: status === s ? 'var(--brand-trust)' : 'var(--border-light)',
                                background: status === s ? 'var(--brand-trust)' : 'var(--bg-surface)',
                                color: status === s ? 'white' : 'var(--gray-600)',
                            }}
                        >
                            {s === 'ALL' ? '전체' : STATUS_LABEL[s]?.label}
                        </button>
                    ))}
                </div>
                <div style={{ position: 'relative' }}>
                    <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
                    <input className="input-field" placeholder="장소명 / 닉네임 / 본문 검색" style={{ paddingLeft: 34 }} value={query} onChange={(e) => setQuery(e.target.value)} />
                </div>
            </div>

            <div style={{ padding: 16 }}>
                {loading && (
                    <>
                        {[0, 1, 2].map((i) => <div key={i} style={{ height: 140, background: 'var(--gray-200)', borderRadius: 'var(--r-md)', marginBottom: 10 }} />)}
                    </>
                )}

                {!loading && error && (
                    <div className="card" style={{ padding: 24, textAlign: 'center' }}>
                        <AlertCircle size={36} color="var(--status-error)" style={{ margin: '0 auto 10px' }} />
                        <p style={{ fontWeight: 700, marginBottom: 12 }}>리뷰 목록을 불러오지 못했습니다.</p>
                        <button type="button" className="btn btn-primary" onClick={() => load(status)}>다시 시도</button>
                    </div>
                )}

                {!loading && !error && filtered.length === 0 && (
                    <div className="card" style={{ padding: 28, textAlign: 'center', color: 'var(--gray-500)' }}>
                        <p style={{ fontWeight: 700, marginBottom: 4 }}>조건에 맞는 리뷰가 없습니다.</p>
                    </div>
                )}

                {!loading && !error && filtered.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {filtered.map((r) => {
                            const st = STATUS_LABEL[r.status] ?? { label: r.status, className: 'badge badge-gray' };
                            const isExpanded = expandedId === r.id;
                            const isLong = r.content.length > 100;
                            const displayContent = isExpanded || !isLong ? r.content : r.content.slice(0, 100) + '...';
                            return (
                                <div key={r.id} className="card" style={{ padding: 16, opacity: r.status === 'HIDDEN' ? 0.7 : 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <p style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 2 }}>{r.placeName}</p>
                                            <h3 style={{ fontSize: 14, fontWeight: 800, marginBottom: 4 }}>{r.nickname}</h3>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--brand-energy)', fontWeight: 800 }}>
                                                <Star size={13} fill="currentColor" /> {r.rating.toFixed(1)}
                                            </div>
                                        </div>
                                        <span className={st.className}>{st.label}</span>
                                    </div>

                                    {r.tags && r.tags.length > 0 && (
                                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
                                            {r.tags.map((t) => (
                                                <span key={t} style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', background: 'var(--gray-100)', color: 'var(--gray-600)', borderRadius: 8 }}>#{t}</span>
                                            ))}
                                        </div>
                                    )}

                                    <p style={{ fontSize: 13, color: 'var(--gray-700)', lineHeight: 1.6, marginBottom: 8 }}>
                                        {displayContent}
                                        {isLong && (
                                            <button type="button" onClick={() => setExpandedId(isExpanded ? null : r.id)} style={{ marginLeft: 6, fontSize: 12, color: 'var(--brand-trust)', background: 'none', fontWeight: 700 }}>
                                                {isExpanded ? <>접기 <ChevronUp size={12} style={{ verticalAlign: 'middle' }} /></> : <>더 보기 <ChevronDown size={12} style={{ verticalAlign: 'middle' }} /></>}
                                            </button>
                                        )}
                                    </p>

                                    <p style={{ fontSize: 11, color: 'var(--gray-400)', marginBottom: 10 }}>
                                        {new Date(r.createdAt).toLocaleString('ko-KR')}
                                    </p>

                                    <div style={{ display: 'flex', gap: 6 }}>
                                        {r.hasPhoto && (
                                            <button type="button" className="btn btn-secondary" style={{ height: 36, fontSize: 12, background: 'white' }} onClick={() => openPhotos(r.id)}>
                                                <ImageIcon size={13} /> 사진 보기
                                            </button>
                                        )}
                                        {r.status === 'VISIBLE' ? (
                                            <button type="button" className="btn" style={{ flex: 1, height: 36, fontSize: 12, background: 'var(--status-error)', color: 'white' }} disabled={mutatingId === r.id} onClick={() => handleAction(r, 'hide')}>
                                                <EyeOff size={13} /> {mutatingId === r.id ? '처리 중...' : '숨기기'}
                                            </button>
                                        ) : (
                                            <button type="button" className="btn btn-trust" style={{ flex: 1, height: 36, fontSize: 12 }} disabled={mutatingId === r.id} onClick={() => handleAction(r, 'restore')}>
                                                <Eye size={13} /> {mutatingId === r.id ? '처리 중...' : '복원'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* 사진 모달 */}
            {photoModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                    <button type="button" onClick={() => setPhotoModal(null)} style={{ position: 'absolute', top: 16, right: 16, color: 'white', background: 'none' }}>
                        <X size={28} />
                    </button>
                    <div style={{ width: '100%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {photoModal.loading ? (
                            <p style={{ color: 'white', textAlign: 'center' }}>사진 불러오는 중...</p>
                        ) : photoModal.urls.length === 0 ? (
                            <p style={{ color: 'white', textAlign: 'center' }}>사진이 없습니다.</p>
                        ) : photoModal.urls.map((url, i) => (
                            <img key={i} src={url} alt={`리뷰 사진 ${i + 1}`} style={{ width: '100%', borderRadius: 8 }} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
