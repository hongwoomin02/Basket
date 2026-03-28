import React, { useState, useMemo } from 'react';
import { Header } from '../components/Header';
import gymDetailData from '../data/routes/gymDetail.json';
import { useNavigate, useParams } from 'react-router-dom';
import { useMock } from '../store/MockProvider';
import { MapPin, ShieldCheck, Tag, ChevronLeft, ChevronRight } from 'lucide-react';

// --- Date Helpers ---
const MONTH_NAMES = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
const WEEK_LABELS = ['1주', '2주', '3주', '4주', '5주'];

function getWeeksInMonth(year: number, month: number): number {
    const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return Math.ceil((firstDay + daysInMonth) / 7);
}

function getWeekDates(year: number, month: number, weekIdx: number): Date[] {
    // weekIdx is 0-based. Returns 7 dates for Mon-Sun of that week in the month view.
    const firstDayOfMonth = new Date(year, month, 1);
    const firstMonday = new Date(firstDayOfMonth);
    // Align to Monday
    const dayOfWeek = firstDayOfMonth.getDay(); // 0=Sun, 1=Mon...
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
    const { view } = gymDetailData;
    const navigate = useNavigate();
    const { logEvent } = useMock();

    // --- State ---
    const today = new Date();
    const [currentMonth, setCurrentMonth] = useState(today.getMonth()); // 0-indexed
    const [currentYear, setCurrentYear] = useState(today.getFullYear());
    const [selectedWeek, setSelectedWeek] = useState(0); // 0-indexed week in month

    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
    const [headcount, setHeadcount] = useState(10);

    // --- Month nav ---
    const handlePrevMonth = () => {
        setSelectedSlot(null);
        setSelectedWeek(0);
        if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
        else setCurrentMonth(m => m - 1);
    };
    const handleNextMonth = () => {
        setSelectedSlot(null);
        setSelectedWeek(0);
        if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
        else setCurrentMonth(m => m + 1);
    };

    const totalWeeks = getWeeksInMonth(currentYear, currentMonth);
    const weekDates = getWeekDates(currentYear, currentMonth, selectedWeek);

    // --- Grid logic ---
    const TIME_BLOCKS = ['06~09', '09~12', '12~15', '15~18', '18~21', '21~24'];
    const DAY_LABELS = ['월', '화', '수', '목', '금', '토', '일'];

    const getCellStatus = (dayIdx: number, time: string) => {
        const d = weekDates[dayIdx];
        const dow = d.getDay(); // 0=Sun, 6=Sat
        const isWeekend = dow === 0 || dow === 6;

        if (time === '15~18') return { type: 'YOUTH', label: '유소년 수업', tag: '대관불가' };
        if (time === '09~12' && !isWeekend) return { type: 'LESSON', label: '코치 레슨', tag: '수업중' };
        if (time === '06~09' && !isWeekend) return { type: 'LESSON', label: '아침 레슨', tag: '수업중' };
        if (time === '12~15' && !isWeekend) return { type: 'OPEN', price: 120000 };
        if (time === '06~09' && dow === 6) return { type: 'OPEN', price: 120000 };
        return { type: 'REGULAR', label: '장기 대관팀', tag: '예약불가' };
    };

    const toggleSlot = (dayIdx: number, time: string, available: boolean) => {
        if (!available) return;
        const id = `${DAY_LABELS[dayIdx]}-${time}`;
        setSelectedSlot(id === selectedSlot ? null : id);
        logEvent('SELECT_SLOT', { id });
    };

    // --- Pricing ---
    const basePrice = 120000;
    const currentPrice = useMemo(() => {
        if (!selectedSlot) return null;
        let matchedRate = 0;
        const sorted = [...view.pricingPolicy.headcountDiscount].sort((a, b) => a.maxPeople - b.maxPeople);
        for (const rule of sorted) {
            if (headcount <= rule.maxPeople) {
                matchedRate = parseInt(rule.rate.replace('-', '').replace('%', ''), 10);
                break;
            }
        }
        return basePrice * (1 - matchedRate / 100);
    }, [selectedSlot, headcount]);

    const handleHeadcountChange = (delta: number) => {
        setHeadcount(v => Math.max(1, Math.min(30, v + delta)));
    };

    const handleCheckout = () => {
        if (!selectedSlot) return;
        const dash = selectedSlot.indexOf('-');
        const block = dash >= 0 ? selectedSlot.slice(dash + 1) : '';
        const [a, b] = block.split('~');
        const rentStart = a ? `${a.padStart(2, '0')}:00` : '';
        const rentEnd = b ? `${b.padStart(2, '0')}:00` : '';
        const q = new URLSearchParams({
            type: 'rent',
            refId: selectedSlot,
            headcount: String(headcount),
            price: String(currentPrice ?? ''),
            title: view.gym.name,
            ...(rentStart && rentEnd ? { rentStart, rentEnd } : {}),
        });
        navigate(`/checkout?${q.toString()}`);
    };

    return (
        <div className="animate-fade-in" style={{ paddingBottom: '200px', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Header title="대관 현황" showBack />

            {/* Gym Hero */}
            <div style={{ background: 'var(--brand-primary)', color: 'white', padding: '32px 20px' }}>
                <span className="badge" style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', marginBottom: '16px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <ShieldCheck size={12} /> 제휴 코트
                </span>
                <h2 style={{ fontSize: '26px', fontWeight: 900, marginBottom: '8px' }}>에이치 스포츠 센터 반여점</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--gray-300)', fontWeight: 600 }}>
                    <MapPin size={15} /> 부산광역시 해운대구 반여동 ...
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

                {/* Week Selector pills */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '4px' }} className="scrollbar-hide">
                    {Array.from({ length: totalWeeks }, (_, i) => (
                        <button
                            key={i}
                            onClick={() => { setSelectedWeek(i); setSelectedSlot(null); }}
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
                                transition: 'all 0.15s'
                            }}
                        >
                            {MONTH_NAMES[currentMonth].replace('월', '')}월 {WEEK_LABELS[i]}
                        </button>
                    ))}
                </div>

                {/* Legend */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', justifyContent: 'flex-end' }}>
                    <span className="badge" style={{ background: 'var(--brand-light)', color: 'var(--brand-trust)', border: '1px solid #BFDBFE', fontSize: '10px' }}>예약 가능</span>
                    <span className="badge" style={{ background: '#FEF2F2', color: 'var(--status-error)', border: '1px solid #FECACA', fontSize: '10px' }}>이용 중</span>
                </div>

                {/* 2D Weekly Grid */}
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
                        {TIME_BLOCKS.map((time) => (
                            <React.Fragment key={time}>
                                <div className="weekly-cell" style={{ background: 'var(--gray-50)', fontWeight: 800, fontSize: '11px', color: 'var(--gray-600)', alignItems: 'center', justifyContent: 'center' }}>
                                    {time}
                                </div>
                                {time === '15~18' ? (
                                    <div className="weekly-cell weekly-cell-blocked" style={{ gridColumn: 'span 7', alignItems: 'center', justifyContent: 'center' }}>
                                        <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--gray-400)' }}>유소년 수업 시간 (전 코트)</span>
                                    </div>
                                ) : (
                                    DAY_LABELS.map((_, dayIdx) => {
                                        const status = getCellStatus(dayIdx, time);
                                        const slotId = `${DAY_LABELS[dayIdx]}-${time}`;
                                        const isSelected = selectedSlot === slotId;

                                        if (status.type === 'OPEN') {
                                            return (
                                                <div
                                                    key={dayIdx}
                                                    onClick={() => toggleSlot(dayIdx, time, true)}
                                                    className={`weekly-cell weekly-cell-open ${isSelected ? 'selected' : ''}`}
                                                >
                                                    <span className="price">120,000</span>
                                                    <div><span className="tag">예약가능</span></div>
                                                </div>
                                            );
                                        } else if (status.type === 'REGULAR') {
                                            return (
                                                <div key={dayIdx} className="weekly-cell weekly-cell-regular">
                                                    <span className="label" style={{ opacity: 0.7, fontSize: '9px' }}>{status.label}</span>
                                                    <div><span className="tag">{status.tag}</span></div>
                                                </div>
                                            );
                                        } else {
                                            return (
                                                <div key={dayIdx} className="weekly-cell weekly-cell-lesson">
                                                    <span className="label">{status.label}</span>
                                                    <div><span className="tag">{status.tag}</span></div>
                                                </div>
                                            );
                                        }
                                    })
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            </div>

            {/* Discount Policy */}
            <div style={{ padding: '0 16px 24px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 800, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Tag size={16} color="var(--brand-trust)" /> 인원별 대관료 파격 할인
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {view.pricingPolicy.headcountDiscount.map((rule, idx) => (
                        <div key={idx} className="card" style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '14px', fontWeight: 700 }}>
                                {rule.label} <span style={{ color: 'var(--gray-500)', fontWeight: 600 }}>({rule.maxPeople}명 이하)</span>
                            </span>
                            <span className="badge badge-trust">결제 대관료 {rule.rate} 자동할인</span>
                        </div>
                    ))}
                </div>
            </div>

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
                            {currentPrice ? <>{currentPrice.toLocaleString()}원</> : <span style={{ fontSize: '14px', color: 'var(--gray-400)' }}>슬롯을 선택하세요</span>}
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
