import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Header } from '../components/Header';
import { useMock } from '../store/MockProvider';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { MapPin, Star } from 'lucide-react';
import { outdoorsApi, OutdoorDetail, ReviewSummary, Review } from '../lib/api';

const DEFAULT_TAGS = ['조명 밝음', '바닥 깨끗', '골대 튼튼', '주차 가능', '혼잡', '야간 이용 가능', '접근성 좋음', '조용함'];

export const OutdoorSpotPage: React.FC = () => {
    const { id } = useParams();
    const { logEvent } = useMock();
    const { showToast } = useToast();
    const { isLoggedIn } = useAuth();

    // ── 서버 상태 ────────────────────────────────────────
    const [detail, setDetail] = useState<OutdoorDetail | null>(null);
    const [summary, setSummary] = useState<ReviewSummary | null>(null);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [formMeta, setFormMeta] = useState<{ availableTags: string[]; photoLimit: number } | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // ── 리뷰 폼 상태 ─────────────────────────────────────
    const [rating, setRating] = useState(0);
    const [tags, setTags] = useState<string[]>([]);
    const [text, setText] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!id) return;
        let cancelled = false;
        setLoading(true);
        setError(null);
        // 4개 병렬 호출. review-form-metadata 는 실패해도 기본 태그로 폴백.
        Promise.all([
            outdoorsApi.detail(id),
            outdoorsApi.reviewSummary(id),
            outdoorsApi.reviews(id),
            outdoorsApi.reviewFormMeta(id).catch(() => ({ availableTags: DEFAULT_TAGS, photoLimit: 5 })),
        ])
            .then(([d, s, r, fm]) => {
                if (cancelled) return;
                setDetail(d);
                setSummary(s);
                setReviews(r.reviews ?? []);
                setFormMeta(fm);
            })
            .catch((e) => {
                if (cancelled) return;
                const status = e?.response?.status;
                setError(status === 404 ? '존재하지 않는 코트입니다.' : '코트 정보를 불러오지 못했습니다.');
            })
            .finally(() => !cancelled && setLoading(false));
        return () => {
            cancelled = true;
        };
    }, [id]);

    const availableTags = useMemo(() => formMeta?.availableTags ?? DEFAULT_TAGS, [formMeta]);

    const toggleTag = (t: string) => {
        logEvent('OUTDOOR_TOGGLE_TAG', { tag: t });
        setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
    };

    const submitReview = async () => {
        if (!id) return;
        if (!isLoggedIn) {
            showToast('로그인 후 작성할 수 있습니다.');
            return;
        }
        if (rating < 1) {
            showToast('별점을 선택해 주세요.');
            return;
        }
        setSubmitting(true);
        try {
            await outdoorsApi.createReview(id, { rating, tags, text: text || undefined });
            logEvent('OUTDOOR_SUBMIT_REVIEW', { rating, tags, text });
            showToast('리뷰가 등록되었습니다.');
            setRating(0);
            setTags([]);
            setText('');
            // 요약/리스트 새로고침
            const [s, r] = await Promise.all([outdoorsApi.reviewSummary(id), outdoorsApi.reviews(id)]);
            setSummary(s);
            setReviews(r.reviews ?? []);
        } catch (e: unknown) {
            const err = e as { response?: { status?: number } };
            if (err?.response?.status === 401) showToast('로그인이 만료되었습니다. 다시 로그인해 주세요.');
            else showToast('리뷰 등록에 실패했습니다.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div style={{ paddingBottom: '120px', minHeight: '100vh', background: 'var(--bg-page)' }}>
                <Header title="야외 농구장 상세" showBack />
                <div style={{ height: 120, margin: 16, borderRadius: 'var(--r-md)', background: 'var(--gray-200)' }} />
                <div style={{ height: 160, margin: 16, borderRadius: 'var(--r-md)', background: 'var(--gray-200)' }} />
            </div>
        );
    }
    if (error || !detail) {
        return (
            <div style={{ minHeight: '100vh', background: 'var(--bg-page)' }}>
                <Header title="야외 농구장 상세" showBack />
                <div style={{ padding: 48, textAlign: 'center' }}>
                    <p style={{ fontWeight: 700, color: 'var(--gray-900)', marginBottom: 16 }}>{error ?? '데이터를 불러오지 못했습니다.'}</p>
                    <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>
                        다시 시도
                    </button>
                </div>
            </div>
        );
    }

    const place = detail.place;

    return (
        <div className="animate-fade-in" style={{ paddingBottom: '120px', minHeight: '100vh', background: 'var(--bg-page)' }}>
            <Header title="야외 농구장 상세" showBack />

            <div style={{ background: 'var(--brand-energy)', color: 'white', padding: '28px 20px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 900, marginBottom: '8px', lineHeight: 1.2 }}>{place.name}</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, opacity: 0.95 }}>
                    <MapPin size={16} /> {place.district}{place.feeType ? ` · ${place.feeType}` : ''}
                </div>
                {place.address && (
                    <p style={{ marginTop: 6, fontSize: 12, opacity: 0.85 }}>{place.address}</p>
                )}
                {place.description && (
                    <p style={{ marginTop: '12px', fontSize: '14px', lineHeight: 1.5, opacity: 0.92 }}>{place.description}</p>
                )}
            </div>

            <div style={{ padding: '20px 16px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 800, marginBottom: '12px', color: 'var(--gray-900)' }}>시설 상태</h3>
                <div className="card" style={{ padding: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px', fontWeight: 600, color: 'var(--gray-700)' }}>
                    <span>바닥: {place.floorStatus || '-'}</span>
                    <span>조명: {place.lightStatus || '-'}</span>
                    <span>골대: {place.rimStatus || '-'}</span>
                    <span>청결: {place.cleanliness || '-'}</span>
                    <span style={{ gridColumn: 'span 2' }}>혼잡도: {place.crowdLevel || '-'}</span>
                </div>
            </div>

            <div style={{ padding: '0 16px 20px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 800, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Star size={18} fill="var(--brand-energy)" color="var(--brand-energy)" />
                    평균 {summary?.averageRating?.toFixed(1) ?? '-'} · 리뷰 {summary?.reviewCount ?? 0}개
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {(summary?.tagSummary ?? []).map((x) => (
                        <span key={x.tag} className="badge badge-gray" style={{ fontSize: '11px' }}>
                            {x.tag} {x.count}
                        </span>
                    ))}
                </div>
            </div>

            <div style={{ padding: '0 16px 24px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 800, marginBottom: '12px' }}>리뷰</h3>
                {reviews.length === 0 ? (
                    <p style={{ color: 'var(--gray-500)', fontWeight: 600, fontSize: '14px' }}>첫 리뷰를 남겨보세요.</p>
                ) : (
                    reviews.map((r) => (
                        <div key={r.id} className="card" style={{ padding: '14px 16px', marginBottom: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                <span style={{ color: 'var(--brand-energy)', fontWeight: 800 }}>{'★'.repeat(r.rating)}</span>
                                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--gray-700)' }}>{r.nickname}</span>
                            </div>
                            <p style={{ fontSize: '14px', color: 'var(--gray-800)' }}>{r.content}</p>
                            {r.tags?.length > 0 && (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
                                    {r.tags.map((t) => (
                                        <span key={t} className="badge badge-gray" style={{ fontSize: 10 }}>{t}</span>
                                    ))}
                                </div>
                            )}
                            {r.visitedAt && <p style={{ fontSize: '11px', color: 'var(--gray-400)', marginTop: '6px' }}>방문 {r.visitedAt}</p>}
                        </div>
                    ))
                )}
            </div>

            <div style={{ padding: '0 16px 32px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 800, marginBottom: '12px' }}>리뷰 작성</h3>
                <div className="card" style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
                        {[1, 2, 3, 4, 5].map((n) => (
                            <button
                                key={n}
                                type="button"
                                onClick={() => {
                                    setRating(n);
                                    logEvent('OUTDOOR_CHANGE_RATING', { n });
                                }}
                                style={{ padding: 4, background: 'none', border: 'none', cursor: 'pointer' }}
                            >
                                <Star size={24} color="var(--brand-energy)" fill={n <= rating ? 'var(--brand-energy)' : 'none'} />
                            </button>
                        ))}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                        {availableTags.slice(0, 8).map((t) => (
                            <button
                                key={t}
                                type="button"
                                onClick={() => toggleTag(t)}
                                className={`filter-chip ${tags.includes(t) ? 'active' : ''}`}
                                style={{ fontSize: '12px' }}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                    <textarea
                        className="input-field"
                        style={{ minHeight: '80px', marginBottom: '12px' }}
                        placeholder="한줄 또는 상세 댓글"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                    />
                    <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ width: '100%', marginBottom: '8px' }}
                        onClick={() => showToast(`사진 첨부는 Phase 3 에서 지원 예정 (최대 ${formMeta?.photoLimit ?? 5}장)`)}
                    >
                        사진 첨부 (최대 {formMeta?.photoLimit ?? 5}장)
                    </button>
                    <button
                        type="button"
                        className="btn btn-energy"
                        style={{ width: '100%' }}
                        onClick={submitReview}
                        disabled={submitting}
                    >
                        {submitting ? '등록 중...' : isLoggedIn ? '리뷰 등록' : '로그인 후 작성'}
                    </button>
                </div>
            </div>
        </div>
    );
};
