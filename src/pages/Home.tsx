import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMock } from '../store/MockProvider';
import { useToast } from '../context/ToastContext';
import { usePlaces } from '../hooks/usePlaces';
import { placesApi, HomeMapSummary } from '../lib/api';
import {
    MapPin,
    MessageCircle,
    Map,
    Trophy,
    Star,
    ImagePlus,
    Send,
    Search,
    SlidersHorizontal,
    List,
    MapPinned,
} from 'lucide-react';

// ── 정적 UI 구성 (이전 home.json 에서 이관; 데이터가 아니라 "UI 카피/옵션") ──
const EXPLORE_TITLE = '부산 실내·야외 농구 공간';
const EXPLORE_SUBTITLE = '지도·목록·문의 가능한 체육관과 야외 코트를 한 번에 확인하세요.';
const SEARCH_PLACEHOLDER = '체육관명, 지역, 설명으로 검색';
const NEARBY_RADIUS_KM = 10;
const DEFAULT_QUICK_FILTERS: QuickFilter[] = [
    { key: 'district', label: '지역', selected: '전체', options: ['전체', '해운대구', '수영구', '금정구', '남구', '부산진구', '동래구'] },
    { key: 'placeType', label: '종류', selected: '전체', options: ['전체', '실내 체육관', '야외 농구장'] },
    { key: 'reservable', label: '예약', selected: '전체', options: ['전체', '예약 가능만'] },
    { key: 'discountable', label: '할인', selected: '전체', options: ['전체', '할인 가능만'] },
];
const FEATURED_CARDS = [
    { id: 'feat1', title: '부산 전역 농구 공간 탐색', description: '지도와 목록을 나란히 확인하며 가장 가까운 코트를 찾아보세요.' },
];

const BUSAN_LAT_MIN = 35.05;
const BUSAN_LAT_MAX = 35.25;
const BUSAN_LNG_MIN = 128.9;
const BUSAN_LNG_MAX = 129.25;

type QuickFilter = { key: string; label: string; selected: string; options: string[] };

function pinPosition(lat: number, lng: number) {
    const x = ((lng - BUSAN_LNG_MIN) / (BUSAN_LNG_MAX - BUSAN_LNG_MIN)) * 100;
    const y = 100 - ((lat - BUSAN_LAT_MIN) / (BUSAN_LAT_MAX - BUSAN_LAT_MIN)) * 100;
    return { left: `${Math.max(5, Math.min(90, x))}%`, top: `${Math.max(10, Math.min(85, y))}%` };
}

/** 검색창 + 퀵필터 공통 (장소 카드·문의 체육관·야외 핀 동일 규칙) */
function matchesHomeFiltersCore(
    item: { district: string; placeType: string; reservable: boolean; discountable: boolean; searchBlob: string },
    search: string,
    filters: QuickFilter[]
): boolean {
    const q = search.trim().toLowerCase();
    if (q && !item.searchBlob.toLowerCase().includes(q)) return false;
    const d = filters.find((f) => f.key === 'district')?.selected;
    if (d && d !== '전체' && item.district !== d) return false;
    const pt = filters.find((f) => f.key === 'placeType')?.selected;
    if (pt && pt !== '전체' && item.placeType !== pt) return false;
    const rs = filters.find((f) => f.key === 'reservable')?.selected;
    if (rs === '예약 가능만' && !item.reservable) return false;
    const disc = filters.find((f) => f.key === 'discountable')?.selected;
    if (disc === '할인 가능만' && !item.discountable) return false;
    return true;
}

type InquiryGymRow = {
    gymId: string;
    name: string;
    address: string;
    available: boolean;
    distanceKm: number;
    to: string;
    priceHint?: string;
    district?: string;
    placeType?: string;
    discountable?: boolean;
};
type PlaceRow = {
    id: string;
    routeType: string;
    name: string;
    district: string;
    placeType: string;
    reservable: boolean;
    discountable: boolean;
    shortDescription: string;
    rating?: number;
    badges: string[];
    to: string;
};

export const Home: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { role, mockMode, logEvent } = useMock();
    const { showToast } = useToast();

    // ── 서버 상태 ────────────────────────────────────────
    const { places: placeCards, isLoading: placesLoading, error: placesError } = usePlaces();
    const [mapSummary, setMapSummary] = useState<HomeMapSummary | null>(null);
    const [mapError, setMapError] = useState<string | null>(null);
    useEffect(() => {
        placesApi
            .homeMapSummary()
            .then((d) => setMapSummary(d))
            .catch(() => setMapError('지도 데이터를 불러오지 못했습니다.'));
    }, []);

    // ── UI 상태 ──────────────────────────────────────────
    const [search, setSearch] = useState('');
    const [filters, setFilters] = useState<QuickFilter[]>(() =>
        JSON.parse(JSON.stringify(DEFAULT_QUICK_FILTERS))
    );
    const [mapUiMode, setMapUiMode] = useState<'list' | 'map'>('list');
    const [mapExpanded, setMapExpanded] = useState(false);
    /** details 대신 사용 — 모바일에서 드롭다운이 가려지는 문제 방지 */
    const [openFilterKey, setOpenFilterKey] = useState<string | null>(null);

    const [reviewModal, setReviewModal] = useState<{ placeId: string; placeName: string } | null>(null);
    const [reviewStars, setReviewStars] = useState(0);
    const [reviewText, setReviewText] = useState('');

    // ── API 응답 → 기존 JSX가 기대하는 뷰 모델 ───────────
    const places: PlaceRow[] = useMemo(
        () =>
            placeCards.map((p) => ({
                id: p.id,
                routeType: p.routeType,
                name: p.name,
                district: p.district,
                placeType: p.placeType,
                reservable: p.reservable,
                discountable: p.discountable,
                shortDescription: p.shortDescription,
                rating: p.rating ?? undefined,
                badges: p.badges,
                to: p.to,
            })),
        [placeCards]
    );

    const inquiryGyms: InquiryGymRow[] = useMemo(
        () =>
            placeCards
                .filter((p) => p.routeType === 'gym')
                .map((p) => ({
                    gymId: p.id,
                    name: p.name,
                    address: p.address,
                    available: true, // 예약 가능 여부는 세부 API 연동 이후에 치환 (Phase 3)
                    distanceKm: 0,
                    to: p.to,
                    district: p.district,
                    placeType: p.placeType,
                    discountable: p.discountable,
                })),
        [placeCards]
    );

    type MapExt = {
        title: string;
        pins: { gymId: string; name: string; lat: number; lng: number; available: boolean; pinType?: string }[];
        centerLabel?: string;
        markerCount?: number;
        legend?: { type: string; label: string }[];
        outdoorPins?: { placeId: string; name: string; lat: number; lng: number; district?: string }[];
    };
    const mapSummaryView: MapExt = useMemo(() => {
        const gymPins = (mapSummary?.pins ?? [])
            .filter((pin) => pin.kind === 'GYM')
            .map((pin) => ({
                gymId: pin.placeId,
                name: pin.name,
                lat: pin.lat,
                lng: pin.lng,
                available: true,
                pinType: 'indoor' as const,
            }));
        const outdoorPins = (mapSummary?.pins ?? [])
            .filter((pin) => pin.kind === 'OUTDOOR')
            .map((pin) => ({
                placeId: pin.placeId,
                name: pin.name,
                lat: pin.lat,
                lng: pin.lng,
                district: '',
            }));
        return {
            title: '부산 대관 지도',
            pins: gymPins,
            centerLabel: mapSummary?.centerLabel,
            markerCount: mapSummary?.markerCount,
            legend: mapSummary?.legend,
            outdoorPins,
        };
    }, [mapSummary]);

    // 야외 랭킹은 현재 API 가 rating 을 제공하지 않으므로 Phase 3 에서 reviewSummary 연동 후 복원.
    const outdoorRanking: Array<{ placeId: string; name: string; rank: number; rating: number; address?: string; reviews?: { text: string; rating: number }[] }> = [];
    const nearbyRadiusKm = NEARBY_RADIUS_KM;
    const featured = FEATURED_CARDS;

    const loading = placesLoading;
    const isError = !!placesError;
    const jsonEmpty = placeCards.length === 0;
    const reload = () => window.location.reload();

    const effectiveError = isError || mockMode === 'error';

    const filteredPlaces = useMemo(
        () =>
            places.filter((p) =>
                matchesHomeFiltersCore(
                    {
                        district: p.district,
                        placeType: p.placeType,
                        reservable: p.reservable,
                        discountable: p.discountable,
                        searchBlob: `${p.name} ${p.district} ${p.shortDescription}`,
                    },
                    search,
                    filters
                )
            ),
        [places, search, filters]
    );

    const normalizedInquiryGyms = useMemo(
        () =>
            inquiryGyms.map((g) => ({
                ...g,
                district: g.district ?? '',
                placeType: g.placeType ?? '실내 체육관',
                reservable: g.available,
                discountable: g.discountable ?? false,
                // 검색어(구/군/이름/주소)에 대해 문의 체육관도 같은 규칙으로 필터링
                searchBlob: `${g.name} ${g.address} ${g.district ?? ''} ${g.placeType ?? ''}`,
            })),
        [inquiryGyms]
    );

    const filteredInquiryGyms = useMemo(
        () => normalizedInquiryGyms.filter((g) => matchesHomeFiltersCore(g, search, filters)),
        [normalizedInquiryGyms, search, filters]
    );

    const displayGymPins = useMemo(() => {
        const pt = filters.find((f) => f.key === 'placeType')?.selected;
        if (pt === '야외 농구장') return [];
        const allowed = new Set(filteredInquiryGyms.map((g) => g.gymId));
        return mapSummaryView.pins.filter((p) => allowed.has(p.gymId));
    }, [filteredInquiryGyms, mapSummaryView.pins, filters]);

    const displayOutdoorPins = useMemo(() => {
        const raw = mapSummaryView.outdoorPins ?? [];
        return raw.filter((pin) =>
            matchesHomeFiltersCore(
                {
                    district: pin.district ?? '',
                    placeType: '야외 농구장',
                    reservable: false,
                    discountable: false,
                    searchBlob: `${pin.name} ${pin.district ?? ''}`,
                },
                search,
                filters
            )
        );
    }, [mapSummaryView.outdoorPins, search, filters]);

    const mapVisibleCount = displayGymPins.length + displayOutdoorPins.length;
    const rentableGymCount = filteredInquiryGyms.filter((g) => g.reservable).length;

    const showListEmpty = (jsonEmpty || filteredPlaces.length === 0) && places.length > 0;

    useEffect(() => {
        if (searchParams.get('tab') === 'places') {
            document.getElementById('home-places')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [searchParams]);

    const applyFilter = (key: string, option: string) => {
        setFilters((prev) => prev.map((f) => (f.key === key ? { ...f, selected: option } : f)));
        setOpenFilterKey(null);
        logEvent('HOME_APPLY_FILTERS', { key, option });
        window.requestAnimationFrame(() => {
            document.getElementById('home-results')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
    };

    const resetFilters = () => {
        setOpenFilterKey(null);
        setFilters(JSON.parse(JSON.stringify(DEFAULT_QUICK_FILTERS)));
        setSearch('');
        logEvent('HOME_FILTER_RESET', {});
        showToast('필터를 초기화했습니다.');
        window.requestAnimationFrame(() => {
            document.getElementById('home-results')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
    };

    if (loading) {
        return (
            <div style={{ paddingBottom: '90px', background: 'var(--bg-surface)', minHeight: '100vh' }}>
                <div style={{ padding: '0 20px', height: '64px', borderBottom: '1px solid var(--border-light)' }} />
                <div style={{ height: '120px', margin: '20px', borderRadius: 'var(--r-md)', background: 'var(--gray-200)' }} />
                <div style={{ height: '48px', margin: '0 20px 16px', borderRadius: 'var(--r-md)', background: 'var(--gray-200)' }} />
                <div style={{ height: '180px', margin: '0 20px', borderRadius: 'var(--r-md)', background: 'var(--gray-200)' }} />
            </div>
        );
    }

    if (effectiveError) {
        return (
            <div style={{ padding: '48px 24px', textAlign: 'center', minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
                <p style={{ fontSize: '16px', fontWeight: 700, color: 'var(--gray-900)' }}>장소 정보를 표시할 수 없습니다.</p>
                <button type="button" className="btn btn-primary" onClick={() => reload()}>
                    다시 시도
                </button>
            </div>
        );
    }

    return (
        <div className="animate-fade-in" style={{ paddingBottom: '90px', background: 'var(--bg-surface)', minHeight: '100vh' }}>

            <div style={{ padding: '0 20px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)' }}>
                <h1 style={{ fontSize: '20px', fontWeight: 900, letterSpacing: '-0.04em', color: 'var(--brand-primary)', textTransform: 'uppercase' }}>
                    BusoCourt <span style={{ color: 'var(--brand-energy)' }}>PRO</span>
                </h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                        type="button"
                        aria-label="검색"
                        onClick={() => {
                            logEvent('HOME_SEARCH_SUBMIT', { search });
                            if (!search.trim()) {
                                showToast('검색어를 입력해 주세요.');
                                return;
                            }
                            showToast(`"${search}"(으)로 필터링했습니다.`);
                            document.getElementById('home-results')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }}
                        style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--r-sm)', border: '1px solid var(--border-light)', background: 'var(--bg-surface)' }}
                    >
                        <Search size={20} color="var(--gray-600)" />
                    </button>
                    <button
                        type="button"
                        aria-label="필터"
                        onClick={() => {
                            logEvent('HOME_APPLY_FILTERS', {});
                            document.getElementById('home-filter-bar')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            showToast('아래 필터에서 조건을 고르세요.');
                        }}
                        style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--r-sm)', border: '1px solid var(--border-light)', background: 'var(--bg-surface)' }}
                    >
                        <SlidersHorizontal size={20} color="var(--gray-600)" />
                    </button>
                    <span className="badge badge-gray">{role}</span>
                </div>
            </div>

            <div style={{ padding: '16px 20px 8px', background: 'var(--bg-page)' }}>
                <h2 style={{ fontSize: '17px', fontWeight: 900, color: 'var(--gray-900)', letterSpacing: '-0.02em' }}>{EXPLORE_TITLE}</h2>
                <p style={{ fontSize: '13px', color: 'var(--gray-500)', fontWeight: 600, marginTop: '6px', lineHeight: 1.45 }}>{EXPLORE_SUBTITLE}</p>
            </div>

            <div style={{ padding: '12px 20px', background: 'var(--bg-page)' }}>
                    <input
                        className="input-field"
                        placeholder={SEARCH_PLACEHOLDER}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                logEvent('HOME_SEARCH_SUBMIT', { search });
                                document.getElementById('home-results')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }
                        }}
                        style={{ height: '48px' }}
                    />
                </div>

            {filters.length > 0 && (
                <div
                    id="home-filter-bar"
                    style={{
                        padding: '0 20px 12px',
                        background: 'var(--bg-page)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        width: '100%',
                        boxSizing: 'border-box',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            alignItems: 'center',
                            gap: '8px',
                            rowGap: '10px',
                            width: '100%',
                        }}
                    >
                        {filters.map((f) => (
                            <button
                                key={f.key}
                                type="button"
                                className={`filter-chip ${openFilterKey === f.key ? 'active' : ''}`}
                                onClick={() => {
                                    setOpenFilterKey((k) => {
                                        const next = k === f.key ? null : f.key;
                                        if (next) {
                                            window.requestAnimationFrame(() =>
                                                document.getElementById('home-filter-bar')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
                                            );
                                        }
                                        return next;
                                    });
                                }}
                                style={{ fontWeight: 700 }}
                            >
                                {f.label}: {f.selected}
                            </button>
                        ))}
                        <button type="button" className="filter-chip" onClick={resetFilters} style={{ borderStyle: 'dashed', fontWeight: 700 }}>
                            초기화
                        </button>
                    </div>

                    {openFilterKey &&
                        (() => {
                            const f = filters.find((x) => x.key === openFilterKey);
                            if (!f) return null;
                            return (
                                <div
                                    className="card"
                                    style={{
                                        width: '100%',
                                        padding: '14px 16px',
                                        border: '2px solid var(--brand-primary)',
                                        boxSizing: 'border-box',
                                    }}
                                >
                                    <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--gray-500)', marginBottom: '12px', letterSpacing: '0.02em' }}>
                                        {f.label} 선택 후 아래 목록이 바뀝니다
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                        {f.options.map((opt) => (
                                            <button
                                                key={opt}
                                                type="button"
                                                className={opt === f.selected ? 'filter-chip active' : 'filter-chip'}
                                                onClick={() => applyFilter(f.key, opt)}
                                            >
                                                {opt}
                                                {opt === f.selected ? ' ✓' : ''}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            );
                        })()}
                </div>
            )}

            {featured.length > 0 && (
                <div style={{ padding: '0 20px 16px', background: 'var(--bg-page)' }}>
                    <div style={{ padding: '18px', borderRadius: 'var(--r-md)', background: 'var(--brand-primary)', color: 'white' }}>
                        <div style={{ fontSize: '11px', fontWeight: 800, opacity: 0.75, letterSpacing: '0.06em' }}>추천</div>
                        <div style={{ fontSize: '16px', fontWeight: 900, marginTop: '8px' }}>{featured[0].title}</div>
                        <p style={{ fontSize: '13px', opacity: 0.9, marginTop: '6px', lineHeight: 1.4 }}>{featured[0].description}</p>
                        <p style={{ fontSize: '11px', fontWeight: 700, opacity: 0.85, marginTop: '10px' }}>
                            현재 필터 · 문의 리스트 {filteredInquiryGyms.length}곳 · 지도 표시 {mapVisibleCount}곳 · 예약가능 {rentableGymCount}곳
                        </p>
                    </div>
                </div>
            )}

            {places.length > 0 && (
                <>
                    <div id="home-results" style={{ padding: '16px 20px 4px', background: 'var(--bg-page)', scrollMarginTop: '72px' }}>
                        <h2 style={{ fontSize: '16px', fontWeight: 900, color: 'var(--gray-900)', letterSpacing: '-0.02em' }}>검색·필터 결과</h2>
                        <p style={{ fontSize: '12px', color: 'var(--gray-500)', fontWeight: 600, marginTop: '4px' }}>
                            검색어와 위 칩 필터가 장소 카드·지도·문의 체육관에 동시에 적용됩니다.
                        </p>
                    </div>
                    <div style={{ padding: '12px 20px 8px', background: 'var(--bg-page)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--gray-900)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <MapPinned size={18} /> 부산 지도 프리뷰
                            </h3>
                            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--gray-500)' }}>
                                {mapSummaryView.centerLabel ?? '부산'} · 지도 {mapVisibleCount}곳
                                {mapSummaryView.markerCount != null ? ` (전체 ${mapSummaryView.markerCount})` : ''}
                            </span>
                        </div>
                        <div
                            onClick={() => navigate('/gyms')}
                            style={{
                                position: 'relative',
                                width: '100%',
                                height: mapExpanded ? 260 : 180,
                                background: 'linear-gradient(180deg, var(--gray-100) 0%, var(--gray-200) 100%)',
                                borderRadius: 'var(--r-md)',
                                border: '1px solid var(--border-light)',
                                cursor: 'pointer',
                                overflow: 'hidden',
                                transition: 'height 0.25s ease',
                            }}
                        >
                            {displayGymPins.map((pin) => {
                                const pos = pinPosition(pin.lat, pin.lng);
                                const isOutdoor = pin.pinType === 'outdoor';
                                return (
                                    <div
                                        key={pin.gymId}
                                        title={pin.name}
                                        style={{
                                            position: 'absolute',
                                            left: pos.left,
                                            top: pos.top,
                                            width: '18px',
                                            height: '18px',
                                            borderRadius: '50%',
                                            background: isOutdoor ? 'var(--brand-energy)' : pin.available ? 'var(--status-success)' : 'var(--status-error)',
                                            border: '2px solid white',
                                            boxShadow: 'var(--shadow-md)',
                                            transform: 'translate(-50%, -50%)',
                                        }}
                                    />
                                );
                            })}
                            {displayOutdoorPins.map((pin) => {
                                const pos = pinPosition(pin.lat, pin.lng);
                                return (
                                    <div
                                        key={pin.placeId}
                                        title={pin.name}
                                        style={{
                                            position: 'absolute',
                                            left: pos.left,
                                            top: pos.top,
                                            width: '16px',
                                            height: '16px',
                                            borderRadius: '50%',
                                            background: 'var(--brand-energy)',
                                            border: '2px solid white',
                                            boxShadow: 'var(--shadow-md)',
                                            transform: 'translate(-50%, -50%)',
                                        }}
                                    />
                                );
                            })}
                            <div style={{ position: 'absolute', bottom: '8px', left: '12px', right: '12px', display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', fontSize: '11px', fontWeight: 700 }}>
                                {mapSummaryView.legend?.map((L) => (
                                    <span key={L.type} style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--gray-700)' }}>
                                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: L.type === 'outdoor' ? 'var(--brand-energy)' : 'var(--status-success)' }} />
                                        {L.label}
                                    </span>
                                ))}
                                {!mapSummaryView.legend?.length && (
                                    <>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--status-success)' }} /> 대관가능
                                        </span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--status-error)' }} /> 마감/불가
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setMapUiMode('list');
                                    setMapExpanded(false);
                                    logEvent('HOME_TOGGLE_MAP_MODE', { mode: 'list' });
                                    document.getElementById('home-results')?.scrollIntoView({ behavior: 'smooth' });
                                }}
                                className={`filter-chip ${mapUiMode === 'list' ? 'active' : ''}`}
                                style={{ flex: 1, justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '6px', padding: '10px' }}
                            >
                                <List size={16} /> 목록 보기
                            </button>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setMapUiMode('map');
                                    setMapExpanded(true);
                                    logEvent('HOME_TOGGLE_MAP_MODE', { mode: 'map' });
                                }}
                                className={`filter-chip ${mapUiMode === 'map' ? 'active' : ''}`}
                                style={{ flex: 1, justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '6px', padding: '10px' }}
                            >
                                <Map size={16} /> 지도 보기
                            </button>
                        </div>
                        <p style={{ fontSize: '12px', color: 'var(--gray-500)', marginTop: '8px', fontWeight: 500 }}>지도 탭하면 체육관 목록으로 이동</p>
                    </div>

                </>
            )}

            <div className="divider" style={{ margin: 0 }} />

            {inquiryGyms.length > 0 && (
                <div id={places.length === 0 ? 'home-results' : undefined} style={{ padding: '24px 20px', background: 'var(--bg-page)', scrollMarginTop: places.length === 0 ? '72px' : undefined }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--gray-900)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <MessageCircle size={18} /> 지금 문의하기 좋은 체육관
                        </h3>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--gray-500)' }}>
                            필터 {filteredInquiryGyms.length}/{inquiryGyms.length} · {nearbyRadiusKm}km
                        </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {filteredInquiryGyms.length === 0 ? (
                            <div className="card" style={{ padding: '24px', textAlign: 'center' }}>
                                <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--gray-600)', marginBottom: '12px' }}>
                                    조건에 맞는 체육관이 없습니다.
                                </p>
                                <button type="button" className="btn btn-secondary" style={{ width: '100%' }} onClick={resetFilters}>
                                    필터 초기화
                                </button>
                            </div>
                        ) : (
                            filteredInquiryGyms.map((gym) => (
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
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(gym.to);
                                        }}
                                        className="btn btn-primary"
                                        style={{ width: '100%', height: '44px', fontSize: '14px', marginTop: '4px' }}
                                    >
                                        문의·예약하기
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            <div className="divider" style={{ margin: 0 }} />

            {displayGymPins.length > 0 && places.length === 0 && (
                <div style={{ padding: '0 20px 24px', background: 'var(--bg-page)' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--gray-900)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                        <Map size={18} /> {mapSummaryView.title}
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
                        {displayGymPins.map((pin: { gymId: string; name: string; lat: number; lng: number; available: boolean }) => {
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
                    </div>
                </div>
            )}

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
                                        &quot;{place.reviews[0].text}&quot;
                                    </p>
                                )}
                                <button
                                    type="button"
                                    onClick={() => navigate(`/place/outdoor/${place.placeId}`)}
                                    style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: 'var(--brand-trust)', marginTop: '4px', background: 'none', border: 'none', cursor: 'pointer' }}
                                >
                                    <MapPin size={14} /> 상세·리뷰 보기
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setReviewModal({ placeId: place.placeId, placeName: place.name })}
                                    style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: 'var(--brand-trust)', marginTop: '2px', background: 'none', border: 'none', cursor: 'pointer' }}
                                >
                                    <Star size={14} /> 리뷰 작성
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {reviewModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                    <div style={{ width: '100%', maxWidth: 'var(--max-w)', maxHeight: '90vh', overflow: 'auto', background: 'var(--bg-surface)', borderTopLeftRadius: '20px', borderTopRightRadius: '20px', padding: '24px 20px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 900, marginBottom: '4px' }}>리뷰 작성</h3>
                        <p style={{ fontSize: '13px', color: 'var(--gray-500)', marginBottom: '20px' }}>{reviewModal.placeName}</p>
                        <div style={{ marginBottom: '16px' }}>
                            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--gray-700)' }}>별점</span>
                            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                {[1, 2, 3, 4, 5].map((n) => (
                                    <button key={n} type="button" onClick={() => setReviewStars(n)} style={{ padding: '4px', background: 'none', border: 'none', cursor: 'pointer' }}>
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
};
