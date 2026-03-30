import React, { useMemo, useState } from 'react';
import { Header } from '../components/Header';
import gymsData from '../data/routes/gyms.json';
import homeData from '../data/routes/home.json';
import { useNavigate } from 'react-router-dom';
import { SlidersHorizontal, Star } from 'lucide-react';

type GymRow = {
    gymId: string;
    name: string;
    address: string;
    available: boolean;
    distanceKm?: number;
    courts: number;
    badges: string[];
    priceHint?: string;
    to: string;
};

type PlaceRow = {
    id: string;
    name: string;
    district: string;
    placeType: string;
    reservable: boolean;
    shortDescription: string;
    rating?: number;
    badges: string[];
    to: string;
};

type ListItem = {
    id: string;
    kind: 'gym' | 'place';
    name: string;
    district: string;
    placeType: string;
    address?: string;
    reservable: boolean;
    priceHint?: string;
    distanceKm?: number;
    courts?: number;
    badges: string[];
    shortDescription?: string;
    rating?: number;
    to: string;
};

export const Gyms: React.FC = () => {
    const { view } = gymsData;
    const homeView = homeData.view as typeof homeData.view & { places?: PlaceRow[] };
    const navigate = useNavigate();

    const [districtOpt, setDistrictOpt] = useState(view.filters.district.options[0]);
    const [availOpt, setAvailOpt] = useState(view.filters.availability.options[0]);
    const [showFilters, setShowFilters] = useState(false);

    const allItems = useMemo<ListItem[]>(() => {
        const gyms = (view.list as GymRow[]).map((g) => ({
            id: g.gymId,
            kind: 'gym' as const,
            name: g.name,
            district: g.address.includes('해운대구')
                ? '해운대구'
                : g.address.includes('수영구')
                    ? '수영구'
                    : g.address.includes('동래구')
                        ? '동래구'
                        : g.address.includes('연제구')
                            ? '연제구'
                            : '기타',
            placeType: '실내 체육관',
            address: g.address,
            reservable: g.available,
            priceHint: g.priceHint,
            distanceKm: g.distanceKm,
            courts: g.courts,
            badges: g.badges,
            to: g.to,
        }));

        const places = (homeView.places ?? []).map((p) => ({
            id: p.id,
            kind: 'place' as const,
            name: p.name,
            district: p.district,
            placeType: p.placeType,
            reservable: p.reservable,
            shortDescription: p.shortDescription,
            rating: p.rating,
            badges: p.badges,
            to: p.to,
        }));

        return [...gyms, ...places];
    }, [view.list, homeView.places]);

    const filteredItems = useMemo(() => {
        return allItems.filter((item) => {
            if (districtOpt !== '전체' && item.district !== districtOpt) return false;
            if (availOpt === '예약가능' && !item.reservable) return false;
            if (availOpt === '일부마감' && item.reservable) return false;
            return true;
        });
    }, [allItems, districtOpt, availOpt]);

    return (
        <div className="animate-fade-in" style={{ paddingBottom: '80px', background: 'var(--bg-page)', minHeight: '100vh' }}>
            <Header title="단독 대관 찾기" showBack />

            {/* Smart Filter Header */}
            <div style={{ position: 'sticky', top: '56px', zIndex: 10, background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: '8px', overflowX: 'auto' }} className="scrollbar-hide">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`filter-chip ${showFilters ? 'active' : ''}`}
                            style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                            <SlidersHorizontal size={14} /> 필터 상세
                        </button>
                        <button className="filter-chip active">{districtOpt}</button>
                        <button className="filter-chip" style={{ background: 'var(--bg-page)' }}>{availOpt}</button>
                    </div>
                </div>

                {/* Expanded Filter Drawer */}
                {showFilters && (
                    <div className="animate-slide-up" style={{ padding: '16px', background: 'var(--bg-surface)', borderTop: '1px solid var(--border-light)' }}>
                        <h4 style={{ fontSize: '12px', fontWeight: 600, color: 'var(--gray-500)', marginBottom: '8px', textTransform: 'uppercase' }}>지역구 선택</h4>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                            {view.filters.district.options.map(opt => (
                                <button
                                    key={opt}
                                    onClick={() => setDistrictOpt(opt)}
                                    className={`filter-chip ${districtOpt === opt ? 'active' : ''}`}
                                    style={{ padding: '6px 12px', fontSize: '13px' }}
                                >
                                    {opt}
                                </button>
                            ))}
                        </div>

                        <h4 style={{ fontSize: '12px', fontWeight: 600, color: 'var(--gray-500)', marginBottom: '8px', textTransform: 'uppercase' }}>상태 필터</h4>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {view.filters.availability.options.map(opt => (
                                <button
                                    key={opt}
                                    onClick={() => setAvailOpt(opt)}
                                    className={`filter-chip ${availOpt === opt ? 'active' : ''}`}
                                    style={{ padding: '6px 12px', fontSize: '13px' }}
                                >
                                    {opt}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* List */}
            <div style={{ padding: '16px' }}>
                <h2 style={{ fontSize: '16px', fontWeight: 900, color: 'var(--gray-900)', marginBottom: '10px' }}>전체 체육관 · 장소</h2>
                <p style={{ fontSize: '12px', color: 'var(--gray-500)', marginBottom: '14px', fontWeight: 600 }}>
                    실내 체육관과 야외 장소를 한 번에 탐색하세요.
                </p>

                {filteredItems.length === 0 ? (
                    <div className="card" style={{ padding: '24px', textAlign: 'center' }}>
                        <p style={{ fontSize: '14px', color: 'var(--gray-600)', fontWeight: 600 }}>조건에 맞는 장소가 없습니다.</p>
                    </div>
                ) : (
                    filteredItems.map((item) => (
                        <div
                            key={item.id}
                            onClick={() => navigate(item.to)}
                            className="card"
                            style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '12px', padding: '20px', marginBottom: '10px' }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <h3 style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '4px' }}>{item.name}</h3>
                                    <p style={{ fontSize: '13px', color: 'var(--gray-500)', fontWeight: 500 }}>
                                        {item.kind === 'gym' ? item.address : `${item.district} · ${item.placeType}`}
                                    </p>
                                </div>
                                {typeof item.rating === 'number' ? (
                                    <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--brand-energy)', display: 'flex', alignItems: 'center', gap: '2px' }}>
                                        <Star size={14} fill="currentColor" /> {item.rating}
                                    </span>
                                ) : (
                                    <span className="badge badge-black">{item.courts ?? 1}개 코트</span>
                                )}
                            </div>

                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                                {item.distanceKm != null && <span className="badge badge-trust" style={{ fontSize: '11px' }}>내 주변 {item.distanceKm}km</span>}
                                {item.badges.map((b) => (
                                    <span key={b} className="badge badge-gray">{b}</span>
                                ))}
                            </div>

                            {item.kind === 'place' && item.shortDescription && (
                                <p style={{ fontSize: '13px', color: 'var(--gray-600)', lineHeight: 1.4 }}>{item.shortDescription}</p>
                            )}

                            {item.kind === 'gym' && item.priceHint && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid var(--border-light)' }}>
                                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--gray-500)' }}>시간당 예상가</span>
                                    <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--brand-primary)' }}>{item.priceHint}</span>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
