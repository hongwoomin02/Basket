import React, { useState } from 'react';
import homeData from '../data/routes/home.json';
import { useNavigate } from 'react-router-dom';
import { useMock } from '../store/MockProvider';
import { Compass, CalendarDays, Key, MapPin, MessageCircle, Map, Trophy, Star, ImagePlus, Send } from 'lucide-react';

// 부산 위도·경도 대략 범위 (정규화용)
const BUSAN_LAT_MIN = 35.05;
const BUSAN_LAT_MAX = 35.25;
const BUSAN_LNG_MIN = 128.9;
const BUSAN_LNG_MAX = 129.25;

function pinPosition(lat: number, lng: number) {
    const x = ((lng - BUSAN_LNG_MIN) / (BUSAN_LNG_MAX - BUSAN_LNG_MIN)) * 100;
    const y = 100 - ((lat - BUSAN_LAT_MIN) / (BUSAN_LAT_MAX - BUSAN_LAT_MIN)) * 100;
    return { left: `${Math.max(5, Math.min(90, x))}%`, top: `${Math.max(10, Math.min(85, y))}%` };
}

export const Home: React.FC = () => {
    const { view } = homeData;
    const navigate = useNavigate();
    const { role } = useMock();
    const [reviewModal, setReviewModal] = useState<{ placeId: string; placeName: string } | null>(null);
    const [reviewStars, setReviewStars] = useState(0);
    const [reviewText, setReviewText] = useState('');

    const inquiryGyms = view.inquiryGyms ?? [];
    const mapSummary = view.mapSummary ?? { title: '부산 대관 지도', pins: [] };
    const outdoorRanking = view.outdoorRanking ?? [];
    const nearbyRadiusKm = view.nearbyRadiusKm ?? 10;

    return (
        <div className="animate-fade-in" style={{ paddingBottom: '90px', background: 'var(--bg-surface)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

            {/* Header / Logo Area */}
            <div style={{ padding: '0 20px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)' }}>
                <h1 style={{ fontSize: '20px', fontWeight: 900, letterSpacing: '-0.04em', color: 'var(--brand-primary)', textTransform: 'uppercase' }}>
                    BusoCourt <span style={{ color: 'var(--brand-energy)' }}>PRO</span>
                </h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="badge badge-gray">{role}</span>
                </div>
            </div>

            {/* HERO SECTION (Sports Dynamic Vibe) */}
            <div style={{ padding: '40px 20px', background: 'var(--bg-surface)' }}>
                <h2 style={{ fontSize: '36px', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.04em', color: 'var(--brand-primary)', marginBottom: '16px', textTransform: 'uppercase' }}>
                    Dominate <br />The Court.
                </h2>
                <p style={{ fontSize: '15px', color: 'var(--gray-600)', fontWeight: 500, marginBottom: '32px' }}>
                    문자 대기 없이 실시간으로 비어있는 체육관을 확인하고 즉시 결제하세요.
                </p>

                {/* Primary Actions (Grid) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div onClick={() => navigate('/gyms')} style={{ background: 'var(--brand-primary)', color: 'white', padding: '24px 16px', borderRadius: 'var(--r-md)', cursor: 'pointer', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
                        <Key size={24} color="rgba(255,255,255,0.8)" style={{ marginBottom: '16px' }} />
                        <span style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.02em' }}>단독 대관</span>
                        <span style={{ fontSize: '12px', opacity: 0.7, fontWeight: 500, marginTop: '4px' }}>실시간 타임라인</span>
                    </div>

                    <div onClick={() => navigate('/pickup')} style={{ background: 'var(--brand-energy)', color: 'white', padding: '24px 16px', borderRadius: 'var(--r-md)', cursor: 'pointer', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
                        <Compass size={24} color="rgba(255,255,255,0.8)" style={{ marginBottom: '16px' }} />
                        <span style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.02em' }}>픽업 게임</span>
                        <span style={{ fontSize: '12px', opacity: 0.9, fontWeight: 600, marginTop: '4px' }}>현재 24건 모집중</span>
                    </div>
                </div>
            </div>

            <div className="divider" style={{ margin: 0 }} />

            {/* R1: 대관 문의 추천 (지금 문의하기 좋은 체육관) */}
            {inquiryGyms.length > 0 && (
                <div style={{ padding: '24px 20px', background: 'var(--bg-page)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--gray-900)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <MessageCircle size={18} /> 지금 문의하기 좋은 체육관
                        </h3>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--gray-500)' }}>내 주변 {nearbyRadiusKm}km 이내</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {inquiryGyms.map((gym: { gymId: string; name: string; address: string; available: boolean; distanceKm: number; to: string; priceHint?: string }) => (
                            <div
                                key={gym.gymId}
                                onClick={() => navigate(gym.to)}
                                className="card"
                                style={{ padding: '16px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '8px' }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{ flex: 1 }}>
                                        <h4 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--gray-900)', marginBottom: '4px' }}>{gym.name}</h4>
                                        <p style={{ fontSize: '12px', color: 'var(--gray-500)' }}>{gym.address}</p>
                                    </div>
                                    <span className={`badge ${gym.available ? 'badge-trust' : 'badge-gray'}`}>
                                        {gym.available ? '대관가능' : '일부마감'}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--brand-trust)' }}>내 주변 {gym.distanceKm}km</span>
                                    {gym.priceHint && <span style={{ fontSize: '12px', color: 'var(--gray-500)' }}>{gym.priceHint}</span>}
                                </div>
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); navigate(gym.to); }}
                                    className="btn btn-primary"
                                    style={{ width: '100%', height: '44px', fontSize: '14px', marginTop: '4px' }}
                                >
                                    문의·예약하기
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* R2: 부산 대관 지도 요약 */}
            {mapSummary.pins && mapSummary.pins.length > 0 && (
                <div style={{ padding: '0 20px 24px', background: 'var(--bg-page)' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--gray-900)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                        <Map size={18} /> {mapSummary.title}
                    </h3>
                    <div
                        onClick={() => navigate('/gyms')}
                        style={{
                            position: 'relative',
                            width: '100%',
                            height: '180px',
                            background: 'linear-gradient(180deg, var(--gray-100) 0%, var(--gray-200) 100%)',
                            borderRadius: 'var(--r-md)',
                            border: '1px solid var(--border-light)',
                            cursor: 'pointer',
                            overflow: 'hidden',
                        }}
                    >
                        {mapSummary.pins.map((pin: { gymId: string; name: string; lat: number; lng: number; available: boolean }) => {
                            const pos = pinPosition(pin.lat, pin.lng);
                            return (
                                <div
                                    key={pin.gymId}
                                    title={pin.name}
                                    style={{
                                        position: 'absolute',
                                        left: pos.left,
                                        top: pos.top,
                                        width: '20px',
                                        height: '20px',
                                        borderRadius: '50%',
                                        background: pin.available ? 'var(--status-success)' : 'var(--status-error)',
                                        border: '2px solid white',
                                        boxShadow: 'var(--shadow-md)',
                                        transform: 'translate(-50%, -50%)',
                                    }}
                                />
                            );
                        })}
                        <div style={{ position: 'absolute', bottom: '8px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '12px', fontSize: '11px', fontWeight: 700 }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--status-success)' }} /> 대관가능
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--status-error)' }} /> 마감/불가
                            </span>
                        </div>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--gray-500)', marginTop: '8px', fontWeight: 500 }}>탭하면 체육관 목록으로 이동</p>
                </div>
            )}

            {/* LIVE FEED: 실시간 추천 코트 */}
            <div style={{ padding: '24px 20px', background: 'var(--bg-page)', flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--gray-900)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <CalendarDays size={18} /> 실시간 추천 코트
                    </h3>
                    <button onClick={() => navigate('/gyms')} style={{ fontSize: '13px', fontWeight: 600, color: 'var(--brand-trust)' }}>전체보기</button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {(view.quickActions ?? []).slice(0, 3).map((item: { id: string; label: string; to: string }, idx: number) => (
                        <div key={item.id || idx} onClick={() => navigate(item.to)} className="card" style={{ padding: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{ width: '48px', height: '48px', background: 'var(--gray-200)', borderRadius: 'var(--r-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <MapPin size={20} color="var(--gray-500)" />
                            </div>
                            <div style={{ flex: 1 }}>
                                <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--gray-900)' }}>{item.label}</h4>
                                <p style={{ fontSize: '12px', color: 'var(--gray-500)' }}>가장 빠른 예약: 오늘 20:00</p>
                            </div>
                            <span className="badge badge-trust">예약가능</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* R4: 야외 코트 순위 + 리뷰 */}
            {outdoorRanking.length > 0 && (
                <div style={{ padding: '24px 20px', background: 'var(--bg-surface)', borderTop: '1px solid var(--border-light)' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--gray-900)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px' }}>
                        <Trophy size={18} /> 부산 야외 코트 순위
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {outdoorRanking.map((place: { placeId: string; name: string; rank: number; rating: number; address?: string; reviews?: { text: string; rating: number }[] }) => (
                            <div key={place.placeId} className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--brand-energy)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 900 }}>
                                        {place.rank}
                                    </span>
                                    <div style={{ flex: 1 }}>
                                        <h4 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--gray-900)' }}>{place.name}</h4>
                                        {place.address && <p style={{ fontSize: '12px', color: 'var(--gray-500)' }}>{place.address}</p>}
                                    </div>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '2px', fontSize: '14px', fontWeight: 800, color: 'var(--brand-energy)' }}>
                                        <Star size={16} fill="currentColor" /> {place.rating}
                                    </span>
                                </div>
                                {place.reviews && place.reviews[0] && (
                                    <p style={{ fontSize: '13px', color: 'var(--gray-600)', fontStyle: 'italic', paddingLeft: '38px', borderLeft: '2px solid var(--gray-200)' }}>
                                        "{place.reviews[0].text}"
                                    </p>
                                )}
                                <button
                                    type="button"
                                    onClick={() => setReviewModal({ placeId: place.placeId, placeName: place.name })}
                                    style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: 'var(--brand-trust)', marginTop: '4px' }}
                                >
                                    <Star size={14} /> 리뷰 작성
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 리뷰 작성 모달 (별점 + 사진 + 텍스트 목업) */}
            {reviewModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                    <div style={{ width: '100%', maxWidth: 'var(--max-w)', maxHeight: '90vh', overflow: 'auto', background: 'var(--bg-surface)', borderTopLeftRadius: '20px', borderTopRightRadius: '20px', padding: '24px 20px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 900, marginBottom: '4px' }}>리뷰 작성</h3>
                        <p style={{ fontSize: '13px', color: 'var(--gray-500)', marginBottom: '20px' }}>{reviewModal.placeName}</p>
                        <div style={{ marginBottom: '16px' }}>
                            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--gray-700)' }}>별점</span>
                            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                {[1, 2, 3, 4, 5].map((n) => (
                                    <button
                                        key={n}
                                        type="button"
                                        onClick={() => setReviewStars(n)}
                                        style={{ padding: '4px', background: 'none', border: 'none', cursor: 'pointer' }}
                                    >
                                        <Star size={28} color="var(--brand-energy)" fill={n <= reviewStars ? 'var(--brand-energy)' : 'none'} />
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div style={{ marginBottom: '16px' }}>
                            <label className="input-label">사진 첨부</label>
                            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', height: '80px', border: '1px dashed var(--border-medium)', borderRadius: 'var(--r-md)', cursor: 'pointer', background: 'var(--gray-50)' }}>
                                <ImagePlus size={24} color="var(--gray-400)" />
                                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--gray-500)' }}>사진 추가</span>
                                <input type="file" accept="image/*" multiple style={{ display: 'none' }} />
                            </label>
                        </div>
                        <div style={{ marginBottom: '20px' }}>
                            <label className="input-label">한줄 리뷰</label>
                            <textarea
                                placeholder="코트 상태, 분위기 등을 자유롭게 적어주세요."
                                value={reviewText}
                                onChange={(e) => setReviewText(e.target.value)}
                                style={{ width: '100%', minHeight: '80px', padding: '12px 16px', border: '1px solid var(--border-medium)', borderRadius: 'var(--r-md)', fontSize: '14px', fontFamily: 'inherit', resize: 'vertical' }}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => { setReviewModal(null); setReviewStars(0); setReviewText(''); }}>취소</button>
                            <button type="button" className="btn btn-trust" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }} onClick={() => { setReviewModal(null); setReviewStars(0); setReviewText(''); }}>
                                <Send size={16} /> 등록
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
