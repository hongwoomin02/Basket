import React, { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import outdoorData from '../data/routes/outdoorDetail.json';
import { Header } from '../components/Header';
import { useMock } from '../store/MockProvider';
import { useToast } from '../context/ToastContext';
import { MapPin, Star } from 'lucide-react';

const NAME_BY_PLACE: Record<string, { name?: string; district?: string }> = {
    out1: { name: '광안리 해수욕장 인근 농구장', district: '수영구' },
    out2: { name: '동래구 체육공원 농구코트', district: '동래구' },
    out3: { name: '연제구 청소년 농구장', district: '연제구' },
};

/**
 * PRD_V2 / FRONT_PROMPT_V3 야외 상세 — 기존 BusoCourt 카드·타이포 유지
 */
export const OutdoorSpotPage: React.FC = () => {
    const { id } = useParams();
    const { logEvent } = useMock();
    const { showToast } = useToast();

    const place = useMemo(() => {
        const p = { ...outdoorData.view.place };
        const ov = id ? NAME_BY_PLACE[id] : undefined;
        if (ov?.name) p.name = ov.name;
        if (ov?.district) p.district = ov.district;
        return p;
    }, [id]);

    const [rating, setRating] = useState(0);
    const [tags, setTags] = useState<string[]>([]);
    const [text, setText] = useState('');

    const reviews = [...outdoorData.view.reviews];

    const toggleTag = (t: string) => {
        logEvent('OUTDOOR_TOGGLE_TAG', { tag: t });
        setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
    };

    const submitReview = () => {
        if (rating < 1) {
            showToast('별점을 선택해 주세요.');
            return;
        }
        logEvent('OUTDOOR_SUBMIT_REVIEW', { rating, tags, text });
        showToast('리뷰가 등록되었습니다. (목업)');
        setRating(0);
        setTags([]);
        setText('');
    };

    return (
        <div className="animate-fade-in" style={{ paddingBottom: '120px', minHeight: '100vh', background: 'var(--bg-page)' }}>
            <Header title="야외 농구장 상세" showBack />

            <div style={{ background: 'var(--brand-energy)', color: 'white', padding: '28px 20px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 900, marginBottom: '8px', lineHeight: 1.2 }}>{place.name}</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, opacity: 0.95 }}>
                    <MapPin size={16} /> {place.district} · {place.feeType}
                </div>
                <p style={{ marginTop: '12px', fontSize: '14px', lineHeight: 1.5, opacity: 0.92 }}>{place.description}</p>
            </div>

            <div style={{ padding: '20px 16px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 800, marginBottom: '12px', color: 'var(--gray-900)' }}>시설 상태</h3>
                <div className="card" style={{ padding: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px', fontWeight: 600, color: 'var(--gray-700)' }}>
                    <span>바닥: {place.floorStatus}</span>
                    <span>조명: {place.lightStatus}</span>
                    <span>골대: {place.rimStatus}</span>
                    <span>청결: {place.cleanliness}</span>
                    <span style={{ gridColumn: 'span 2' }}>혼잡도: {place.crowdLevel}</span>
                </div>
            </div>

            <div style={{ padding: '0 16px 20px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 800, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Star size={18} fill="var(--brand-energy)" color="var(--brand-energy)" />
                    평균 {outdoorData.view.ratingSummary.averageRating} · 리뷰 {outdoorData.view.ratingSummary.reviewCount}개
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {outdoorData.view.ratingSummary.tagSummary.map((x) => (
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
                            <p style={{ fontSize: '11px', color: 'var(--gray-400)', marginTop: '6px' }}>방문 {r.visitedAt}</p>
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
                        {outdoorData.view.reviewForm.availableTags.slice(0, 8).map((t) => (
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
                    <button type="button" className="btn btn-secondary" style={{ width: '100%', marginBottom: '8px' }} onClick={() => showToast('사진 첨부 목업')}>
                        사진 첨부 (최대 {outdoorData.view.reviewForm.photoLimit}장)
                    </button>
                    <button type="button" className="btn btn-energy" style={{ width: '100%' }} onClick={submitReview}>
                        리뷰 등록
                    </button>
                </div>
            </div>
        </div>
    );
};
