import React, { useEffect, useMemo, useState } from 'react';
import { Header } from '../components/Header';
import { useNavigate, useParams } from 'react-router-dom';
import { useMock } from '../store/MockProvider';
import { useToast } from '../context/ToastContext';
import { MapPin, ShieldCheck, Tag, ChevronLeft, ChevronRight, Info } from 'lucide-react';
import { gymsApi, GymDetail as GymDetailDto, PricingPolicy, CalendarData, CalendarSlot } from '../lib/api';

// --- Date Helpers ---
const MONTH_NAMES = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
const WEEK_LABELS = ['1주', '2주', '3주', '4주', '5주', '6주'];
const DAY_LABELS = ['월', '화', '수', '목', '금', '토', '일'];
// 서버의 운영 시간(09:00~22:00) 기준 1시간 단위 슬롯
const HOUR_SLOTS = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];

function toYYYYMM(year: number, month: number): string {
    return `${year}-${String(month + 1).padStart(2, '0')}`;
}
function toYYYYMMDD(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}
function getWeeksInMonth(year: number, month: number): number {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return Math.ceil((firstDay + daysInMonth) / 7);
}
function getWeekDates(year: number, month: number, weekIdx: number): Date[] {
    const firstDayOfMonth = new Date(year, month, 1);
    const firstMonday = new Date(firstDayOfMonth);
    const dayOfWeek = firstDayOfMonth.getDay();
    const offsetToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    firstMonday.setDate(firstMonday.getDate() + offsetToMonday + weekIdx * 7);
    return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(firstMonday);
        d.setDate(d.getDate() + i);
        return d;
    });
}

export const GymDetail: React.FC = () => {
    const { gymId } = useParams();
    const navigate = useNavigate();
    const { logEvent } = useMock();
    const { showToast } = useToast();

    // ── 서버 상태 ────────────────────────────────────────
    const [gymData, setGymData] = useState<GymDetailDto | null>(null);
    const [pricing, setPricing] = useState<PricingPolicy | null>(null);
    const [calendar, setCalendar] = useState<CalendarData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // ── UI 상태 ──────────────────────────────────────────
    const today = new Date();
    const [currentMonth, setCurrentMonth] = useState(today.getMonth());
    const [currentYear, setCurrentYear] = useState(today.getFullYear());
    const [selectedWeek, setSelectedWeek] = useState(0);
    const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
    const [headcount, setHeadcount] = useState(10);
    const [pricingDetailOpen, setPricingDetailOpen] = useState(false);

    // 최초 로드: gym detail + pricing policy + calendar 병렬 호출
    useEffect(() => {
        if (!gymId) return;
        let cancelled = false;
        setLoading(true);
        setError(null);
        const monthStr = toYYYYMM(currentYear, currentMonth);
        Promise.all([
            gymsApi.detail(gymId),
            gymsApi.pricingPolicy(gymId),
            gymsApi.calendar(gymId, monthStr),
        ])
            .then(([d, p, c]) => {
                if (cancelled) return;
                setGymData(d);
                setPricing(p);
                setCalendar(c);
            })
            .catch((e) => {
                if (cancelled) return;
                const status = e?.response?.status;
                if (status === 404) setError('존재하지 않는 체육관입니다.');
                else setError('체육관 정보를 불러오지 못했습니다.');
            })
            .finally(() => !cancelled && setLoading(false));
        return () => {
            cancelled = true;
        };
        // currentYear/currentMonth 의존은 별도 effect 에서 달력만 재요청하기 위해 제외
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gymId]);

    // 월 변경 시 달력만 재요청 (불필요한 detail/pricing 재호출 방지)
    useEffect(() => {
        if (!gymId || !gymData) return;
        let cancelled = false;
        const monthStr = toYYYYMM(currentYear, currentMonth);
        gymsApi
            .calendar(gymId, monthStr)
            .then((c) => !cancelled && setCalendar(c))
            .catch(() => !cancelled && showToast('달력을 불러오지 못했습니다.'));
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentYear, currentMonth]);

    // 슬롯 빠른 조회용 맵: "YYYY-MM-DD|HH:MM" → slot
    const slotMap = useMemo(() => {
        const m = new Map<string, CalendarSlot>();
        (calendar?.slots ?? []).forEach((s) => {
            m.set(`${s.date}|${s.startTime}`, s);
        });
        return m;
    }, [calendar]);

    const handlePrevMonth = () => {
        setSelectedSlotId(null);
        setSelectedWeek(0);
        if (currentMonth === 0) {
            setCurrentMonth(11);
            setCurrentYear((y) => y - 1);
        } else setCurrentMonth((m) => m - 1);
    };
    const handleNextMonth = () => {
        setSelectedSlotId(null);
        setSelectedWeek(0);
        if (currentMonth === 11) {
            setCurrentMonth(0);
            setCurrentYear((y) => y + 1);
        } else setCurrentMonth((m) => m + 1);
    };

    const totalWeeks = getWeeksInMonth(currentYear, currentMonth);
    const weekDates = getWeekDates(currentYear, currentMonth, selectedWeek);

    const toggleSlot = (slot: CalendarSlot) => {
        if (slot.status !== 'AVAILABLE') return;
        setSelectedSlotId((prev) => (prev === slot.id ? null : slot.id));
        logEvent('SELECT_SLOT', { slotId: slot.id, date: slot.date, time: slot.startTime });
    };

    const selectedSlot = useMemo<CalendarSlot | null>(
        () => (selectedSlotId ? (calendar?.slots ?? []).find((s) => s.id === selectedSlotId) ?? null : null),
        [selectedSlotId, calendar]
    );

    // 가격 계산: 서버 pricing 정책을 그대로 사용
    const currentPrice = useMemo(() => {
        if (!selectedSlot || !pricing) return null;
        const base = selectedSlot.price ?? pricing.baseHourlyPrice;
        // 서버 할인 규칙: headcount >= discountPersonThreshold 면 할인 적용
        const threshold = pricing.discountPersonThreshold ?? 0;
        const ratePercent = pricing.discountRatePercent ?? 0;
        const fixed = pricing.discountFixedAmount ?? 0;
        const eligible = threshold > 0 && headcount >= threshold;
        let final = base;
        if (eligible) {
            final = Math.max(0, Math.round(base * (1 - ratePercent / 100) - fixed));
        }
        return final;
    }, [selectedSlot, pricing, headcount]);

    const handleHeadcountChange = (delta: number) => {
        setHeadcount((v) => Math.max(1, Math.min(30, v + delta)));
    };

    const handleCheckout = () => {
        if (!selectedSlot || !gymId || !gymData) return;
        const q = new URLSearchParams({
            type: 'rent',
            gymId,
            slotId: selectedSlot.id,
            date: selectedSlot.date,
            rentStart: selectedSlot.startTime,
            rentEnd: selectedSlot.endTime,
            headcount: String(headcount),
            price: String(currentPrice ?? ''),
            title: gymData.place.name,
        });
        navigate(`/checkout?${q.toString()}`);
    };

    if (loading) {
        return (
            <div style={{ paddingBottom: '200px', minHeight: '100vh' }}>
                <Header title="대관 현황" showBack />
                <div style={{ height: 120, margin: 16, borderRadius: 'var(--r-md)', background: 'var(--gray-200)' }} />
                <div style={{ height: 200, margin: 16, borderRadius: 'var(--r-md)', background: 'var(--gray-200)' }} />
            </div>
        );
    }
    if (error || !gymData || !pricing) {
        return (
            <div style={{ minHeight: '100vh' }}>
                <Header title="대관 현황" showBack />
                <div style={{ padding: 48, textAlign: 'center' }}>
                    <p style={{ fontWeight: 700, color: 'var(--gray-900)', marginBottom: 16 }}>{error ?? '데이터를 불러오지 못했습니다.'}</p>
                    <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>
                        다시 시도
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in" style={{ paddingBottom: '200px', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Header title="대관 현황" showBack />

            {/* Gym Hero */}
            <div style={{ background: 'var(--brand-primary)', color: 'white', padding: '32px 20px' }}>
                <span className="badge" style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', marginBottom: '16px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <ShieldCheck size={12} /> 제휴 코트
                </span>
                <h2 style={{ fontSize: '26px', fontWeight: 900, marginBottom: '8px' }}>{gymData.place.name}</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--gray-300)', fontWeight: 600 }}>
                    <MapPin size={15} /> {gymData.place.address}
                </div>
                <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 12, color: 'rgba(255,255,255,0.85)', fontWeight: 700 }}>
                    <span>코트 {gymData.gymProfile.courtCount}면</span>
                    <span>·</span>
                    <span>운영시간 {gymData.gymProfile.hours}</span>
                    {gymData.gymProfile.parking && <><span>·</span><span>주차 가능</span></>}
                </div>
            </div>

            {/* Date Picker & Grid */}
            <div style={{ padding: '20px 16px', flex: 1 }}>
                {/* Month Selector */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <button
                        onClick={handlePrevMonth}
                        style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-surface)', border: '1px solid var(--border-light)', borderRadius: 'var(--r-sm)' }}
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <h3 style={{ fontSize: '20px', fontWeight: 900, color: 'var(--gray-900)', letterSpacing: '-0.03em' }}>
                        {currentYear}년 {MONTH_NAMES[currentMonth]}
                    </h3>
                    <button
                        onClick={handleNextMonth}
                        style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-surface)', border: '1px solid var(--border-light)', borderRadius: 'var(--r-sm)' }}
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>

                {/* Week Selector */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '4px' }} className="scrollbar-hide">
                    {Array.from({ length: totalWeeks }, (_, i) => (
                        <button
                            key={i}
                            onClick={() => { setSelectedWeek(i); setSelectedSlotId(null); }}
                            style={{
                                flexShrink: 0,
                                padding: '8px 16px',
                                fontSize: '13px',
                                fontWeight: 800,
                                borderRadius: '20px',
                                border: '1px solid',
                                borderColor: selectedWeek === i ? 'var(--brand-trust)' : 'var(--border-light)',
                                background: selectedWeek === i ? 'var(--brand-trust)' : 'var(--bg-surface)',
                                color: selectedWeek === i ? 'white' : 'var(--gray-600)',
                                cursor: 'pointer',
                                transition: 'all 0.15s',
                            }}
                        >
                            {MONTH_NAMES[currentMonth].replace('월', '')}월 {WEEK_LABELS[i] ?? `${i + 1}주`}
                        </button>
                    ))}
                </div>

                {/* Legend */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                    {(calendar?.legend ?? []).map((L) => {
                        const bg = L.status === 'AVAILABLE' ? 'var(--brand-light)'
                            : L.status === 'CLASS' ? '#FEF3C7'
                                : L.status === 'REGULAR' ? '#FEE2E2'
                                    : 'var(--gray-100)';
                        const fg = L.status === 'AVAILABLE' ? 'var(--brand-trust)'
                            : L.status === 'CLASS' ? '#92400E'
                                : L.status === 'REGULAR' ? '#991B1B'
                                    : 'var(--gray-500)';
                        return (
                            <span key={L.status} className="badge" style={{ background: bg, color: fg, border: '1px solid currentColor', fontSize: '10px' }}>
                                {L.label}
                            </span>
                        );
                    })}
                </div>

                {/* 2D Weekly Grid - 1시간 단위 */}
                <div className="weekly-container scrollbar-hide">
                    <div className="weekly-grid">
                        {/* Header row */}
                        <div className="weekly-header" style={{ borderTopLeftRadius: 'var(--r-md)' }}>시간</div>
                        {DAY_LABELS.map((label, i) => (
                            <div key={label} className="weekly-header">
                                <span style={{ display: 'block' }}>{label}</span>
                                <span style={{ fontSize: '9px', color: 'var(--gray-400)', fontWeight: 500 }}>
                                    {weekDates[i].getMonth() + 1}/{weekDates[i].getDate()}
                                </span>
                            </div>
                        ))}

                        {/* Body rows */}
                        {HOUR_SLOTS.map((hour) => {
                            const hh = String(hour).padStart(2, '0');
                            const hhNext = String(hour + 1).padStart(2, '0');
                            const timeLabel = `${hh}~${hhNext}`;
                            return (
                                <React.Fragment key={hour}>
                                    <div className="weekly-cell" style={{ background: 'var(--gray-50)', fontWeight: 800, fontSize: '11px', color: 'var(--gray-600)', alignItems: 'center', justifyContent: 'center' }}>
                                        {timeLabel}
                                    </div>
                                    {DAY_LABELS.map((_, dayIdx) => {
                                        const dateStr = toYYYYMMDD(weekDates[dayIdx]);
                                        const startTime = `${hh}:00`;
                                        const slot = slotMap.get(`${dateStr}|${startTime}`);
                                        if (!slot) {
                                            return (
                                                <div key={dayIdx} className="weekly-cell weekly-cell-regular">
                                                    <span className="label" style={{ opacity: 0.6, fontSize: 9 }}>운영외</span>
                                                </div>
                                            );
                                        }
                                        const isSelected = selectedSlotId === slot.id;
                                        if (slot.status === 'AVAILABLE') {
                                            return (
                                                <div
                                                    key={dayIdx}
                                                    onClick={() => toggleSlot(slot)}
                                                    className={`weekly-cell weekly-cell-open ${isSelected ? 'selected' : ''}`}
                                                >
                                                    <span className="price">{(slot.price ?? 0).toLocaleString()}</span>
                                                    <div><span className="tag">예약가능</span></div>
                                                </div>
                                            );
                                        }
                                        const statusLabelMap: Record<string, { label: string; tag: string; cls: string }> = {
                                            CLASS: { label: '수업', tag: '수업중', cls: 'weekly-cell-lesson' },
                                            REGULAR: { label: '정기대관', tag: '예약불가', cls: 'weekly-cell-regular' },
                                            CLOSED: { label: '마감', tag: '마감', cls: 'weekly-cell-regular' },
                                        };
                                        const meta = statusLabelMap[slot.status] ?? statusLabelMap.CLOSED;
                                        return (
                                            <div
                                                key={dayIdx}
                                                role="button"
                                                tabIndex={0}
                                                onClick={() => { showToast('이 시간은 예약할 수 없습니다.'); logEvent('GYM_SLOT_BLOCKED_TAP', { slotId: slot.id, status: slot.status }); }}
                                                onKeyDown={(e) => e.key === 'Enter' && showToast('이 시간은 예약할 수 없습니다.')}
                                                className={`weekly-cell ${meta.cls}`}
                                            >
                                                <span className="label">{meta.label}</span>
                                                <div><span className="tag">{meta.tag}</span></div>
                                            </div>
                                        );
                                    })}
                                </React.Fragment>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Pricing Policy */}
            <div style={{ padding: '0 16px 24px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 800, marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', flexWrap: 'wrap' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Tag size={16} color="var(--brand-trust)" /> 가격 및 할인 안내
                    </span>
                    <button
                        type="button"
                        onClick={() => { setPricingDetailOpen(true); logEvent('GYM_PRICING_DETAIL_OPEN', {}); }}
                        style={{ fontSize: '12px', fontWeight: 800, color: 'var(--brand-trust)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                        <Info size={14} /> 상세 보기
                    </button>
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div className="card" style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '14px', fontWeight: 700 }}>평일 기본 요금</span>
                        <span className="badge badge-trust">{pricing.baseHourlyPrice.toLocaleString()}원 / 시간</span>
                    </div>
                    <div className="card" style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '14px', fontWeight: 700 }}>주말 요금</span>
                        <span className="badge badge-gray">{pricing.weekendHourlyPrice.toLocaleString()}원 / 시간</span>
                    </div>
                    {(pricing.discountPersonThreshold ?? 0) > 0 && (
                        <div className="card" style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '14px', fontWeight: 700 }}>
                                {pricing.discountPersonThreshold}명 이상 단체할인
                            </span>
                            <span className="badge badge-trust">
                                {pricing.discountRatePercent ? `${pricing.discountRatePercent}% 자동할인` : ''}
                                {(pricing.discountFixedAmount ?? 0) > 0 ? ` -${pricing.discountFixedAmount?.toLocaleString()}원` : ''}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {pricingDetailOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 220, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => setPricingDetailOpen(false)}>
                    <div style={{ width: '100%', maxWidth: 'var(--max-w)', background: 'var(--bg-surface)', borderTopLeftRadius: '20px', borderTopRightRadius: '20px', padding: '24px 20px', maxHeight: '75vh', overflow: 'auto' }} onClick={(e) => e.stopPropagation()}>
                        <h3 style={{ fontSize: '18px', fontWeight: 900, marginBottom: '8px' }}>가격·할인 정책</h3>
                        <ul style={{ paddingLeft: '18px', fontSize: '14px', color: 'var(--gray-800)', lineHeight: 1.7 }}>
                            <li>평일 기본: {pricing.baseHourlyPrice.toLocaleString()}원 / 시간</li>
                            <li>주말: {pricing.weekendHourlyPrice.toLocaleString()}원 / 시간</li>
                            {(pricing.discountPersonThreshold ?? 0) > 0 && (
                                <li>
                                    {pricing.discountPersonThreshold}명 이상 방문 시 {pricing.discountRatePercent}% 자동 할인
                                    {pricing.sameDayOnly ? ' (당일 결제 한정)' : ''}
                                </li>
                            )}
                        </ul>
                        <button type="button" className="btn btn-secondary" style={{ width: '100%', marginTop: '20px' }} onClick={() => setPricingDetailOpen(false)}>
                            닫기
                        </button>
                    </div>
                </div>
            )}

            {/* Floating summary + checkout bar */}
            <div className="floating-bar" style={{ flexDirection: 'column', gap: '12px', borderTopLeftRadius: '20px', borderTopRightRadius: '20px' }}>
                <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--gray-500)', display: 'block', marginBottom: '8px' }}>방문할 입실 인원</span>
                        <div style={{ display: 'inline-flex', alignItems: 'center', border: '1px solid var(--border-medium)', borderRadius: 'var(--r-sm)', height: '40px', overflow: 'hidden' }}>
                            <button onClick={() => handleHeadcountChange(-1)} style={{ width: '40px', height: '100%', fontWeight: 700, fontSize: '18px', background: 'var(--bg-page)' }}>-</button>
                            <span style={{ width: '52px', textAlign: 'center', fontWeight: 800, fontSize: '14px' }}>{headcount}명</span>
                            <button onClick={() => handleHeadcountChange(1)} style={{ width: '40px', height: '100%', fontWeight: 900, fontSize: '18px', background: 'var(--brand-primary)', color: 'white' }}>+</button>
                        </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--gray-500)', display: 'block', marginBottom: '4px' }}>결제 총액 (할인적용가)</span>
                        <span style={{ fontSize: '26px', fontWeight: 900, color: 'var(--brand-trust)', letterSpacing: '-0.02em' }}>
                            {currentPrice !== null ? <>{currentPrice.toLocaleString()}원</> : <span style={{ fontSize: '14px', color: 'var(--gray-400)' }}>슬롯을 선택하세요</span>}
                        </span>
                    </div>
                </div>
                <button
                    onClick={handleCheckout}
                    disabled={!selectedSlot}
                    className="btn btn-trust"
                    style={{ width: '100%', height: '52px', fontSize: '16px' }}
                >
                    이 조건으로 결제안내 가기
                </button>
            </div>
        </div>
    );
};
