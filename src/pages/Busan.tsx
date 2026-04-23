import React, { useState } from 'react';
import { Header } from '../components/Header';
import busanData from '../data/routes/busan.json';
import { useNavigate } from 'react-router-dom';
import { useMock } from '../store/MockProvider';
import { MapPin, ChevronRight } from 'lucide-react';
import { Map, MapMarker, CustomOverlayMap, useKakaoLoader } from 'react-kakao-maps-sdk';
import { usePlaces, PlaceCardData } from '../hooks/usePlaces';

const KAKAO_KEY = import.meta.env.VITE_KAKAO_MAP_KEY as string | undefined;
// 부산 중심 (서면 근처)
const BUSAN_CENTER = { lat: 35.1796, lng: 129.0756 };

export const Busan: React.FC = () => {
    const { view, page } = busanData;
    const navigate = useNavigate();
    const { logEvent } = useMock();

    const [loading, loadError] = useKakaoLoader({
        appkey: KAKAO_KEY ?? '',
        libraries: [],
    });
    const { places, isLoading: placesLoading } = usePlaces();
    const [activeId, setActiveId] = useState<string | null>(null);

    const placesWithCoord = places.filter(
        (p): p is PlaceCardData & { lat: number; lng: number } => p.lat !== null && p.lng !== null
    );
    const activePlace = placesWithCoord.find((p) => p.id === activeId) ?? null;

    const handleCardClick = (to: string) => {
        logEvent('CLICK_PREVIEW_CARD', { to });
        navigate(to);
    };

    return (
        <div className="animate-fade-in" style={{ minHeight: '100vh', background: 'var(--bg-page)', paddingBottom: '80px' }}>
            <Header title={page.title} showBack />

            <div style={{ padding: '16px 20px 12px', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-light)' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--brand-primary)', marginBottom: '6px' }}>
                    부산에서 바로 찾기
                </h2>
                <p style={{ fontSize: '13px', color: 'var(--gray-500)', fontWeight: 500 }}>
                    지도에서 위치를 확인하고 바로 예약하세요.
                </p>
            </div>

            {/* 카카오 지도 */}
            <div style={{ padding: '12px 16px 0' }}>
                {!KAKAO_KEY ? (
                    <div style={mapPlaceholderStyle}>
                        VITE_KAKAO_MAP_KEY 환경변수가 설정되지 않았습니다.
                    </div>
                ) : loadError ? (
                    <div style={mapPlaceholderStyle}>지도를 불러오지 못했습니다.</div>
                ) : loading || placesLoading ? (
                    <div style={mapPlaceholderStyle}>지도 불러오는 중...</div>
                ) : (
                    <div style={{ position: 'relative' }}>
                        <Map
                            center={BUSAN_CENTER}
                            level={8}
                            style={{ width: '100%', height: '320px', borderRadius: 'var(--r-md)' }}
                        >
                            {placesWithCoord.map((p) => (
                                <MapMarker
                                    key={p.id}
                                    position={{ lat: p.lat, lng: p.lng }}
                                    onClick={() => setActiveId(p.id)}
                                    title={p.name}
                                />
                            ))}
                            {activePlace && (
                                <CustomOverlayMap
                                    position={{ lat: activePlace.lat, lng: activePlace.lng }}
                                    yAnchor={1.4}
                                >
                                    <div
                                        onClick={() => navigate(activePlace.to)}
                                        style={{
                                            background: 'white',
                                            borderRadius: 8,
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                            padding: '10px 12px',
                                            minWidth: 180,
                                            cursor: 'pointer',
                                            border: '1px solid var(--border-light)',
                                        }}
                                    >
                                        <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 2 }}>
                                            {activePlace.name}
                                        </div>
                                        <div style={{ fontSize: 11, color: 'var(--gray-500)' }}>
                                            {activePlace.district} · {activePlace.placeType}
                                        </div>
                                        <div
                                            style={{
                                                fontSize: 11,
                                                fontWeight: 700,
                                                color: 'var(--brand-trust)',
                                                marginTop: 6,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 2,
                                            }}
                                        >
                                            상세 보기 <ChevronRight size={12} />
                                        </div>
                                    </div>
                                </CustomOverlayMap>
                            )}
                        </Map>
                        <div
                            style={{
                                marginTop: 8,
                                fontSize: 11,
                                color: 'var(--gray-500)',
                                fontWeight: 600,
                                textAlign: 'right',
                            }}
                        >
                            마커 {placesWithCoord.length}곳 · 마커를 눌러 상세를 확인하세요
                        </div>
                    </div>
                )}
            </div>

            <div style={{ padding: '16px 16px 24px' }}>
                <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--gray-400)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                            요즘 뜨는 체육관
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--gray-500)', fontWeight: 600 }}>총 {view.rentPreview.count}곳</span>
                    </div>

                    {view.rentPreview.items.map((gym) => (
                        <div
                            key={gym.gymId}
                            onClick={() => handleCardClick(view.rentPreview.to)}
                            className="card"
                            style={{ padding: '16px 18px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '10px' }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <h3 style={{ fontSize: '16px', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--gray-900)', marginBottom: '4px' }}>
                                        {gym.name}
                                    </h3>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--gray-500)' }}>
                                        <MapPin size={14} color="var(--gray-400)" />
                                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{gym.nextSlot}</span>
                                    </div>
                                </div>
                                <span
                                    className={`badge ${gym.badge === '예약가능' ? 'badge-trust' : 'badge-gray'}`}
                                    style={{ whiteSpace: 'nowrap' }}
                                >
                                    {gym.badge}
                                </span>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid var(--border-light)' }}>
                                <span style={{ fontSize: '12px', color: 'var(--gray-500)', fontWeight: 600 }}>자세히 보기</span>
                                <ChevronRight size={16} color="var(--gray-400)" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const mapPlaceholderStyle: React.CSSProperties = {
    width: '100%',
    height: 320,
    borderRadius: 'var(--r-md)',
    background: 'var(--bg-surface)',
    border: '1px dashed var(--border-medium)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--gray-500)',
    fontSize: 13,
    fontWeight: 600,
};
