import React, { useState } from 'react';
import { Header } from '../components/Header';
import gymsData from '../data/routes/gyms.json';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, SlidersHorizontal } from 'lucide-react';

export const Gyms: React.FC = () => {
    const { view } = gymsData;
    const navigate = useNavigate();

    const [districtOpt, setDistrictOpt] = useState(view.filters.district.options[0]);
    const [availOpt, setAvailOpt] = useState(view.filters.availability.options[0]);
    const [showFilters, setShowFilters] = useState(false);

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
                {view.list.map((gym) => (
                    <div
                        key={gym.gymId}
                        onClick={() => navigate(gym.to)}
                        className="card"
                        style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '12px', padding: '20px' }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <h3 style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '4px' }}>{gym.name}</h3>
                                <p style={{ fontSize: '13px', color: 'var(--gray-500)', fontWeight: 500 }}>{gym.address}</p>
                            </div>
                            <span className="badge badge-black">{gym.courts}개 코트</span>
                        </div>

                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                            {gym.distanceKm != null && (
                                <span className="badge badge-trust" style={{ fontSize: '11px' }}>내 주변 {gym.distanceKm}km</span>
                            )}
                            {gym.badges.map((b: string) => (
                                <span key={b} className="badge badge-gray">{b}</span>
                            ))}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid var(--border-light)' }}>
                            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--gray-500)' }}>시간당 예상가</span>
                            <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--brand-primary)' }}>{gym.priceHint} <span style={{ fontSize: '14px', color: 'var(--gray-400)' }}>~</span></span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
