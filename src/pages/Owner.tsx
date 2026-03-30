import React, { useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import ownerData from '../data/routes/owner.json';
import { useMock } from '../store/MockProvider';
import { TrendingUp, Activity, Plus, ToggleLeft, ToggleRight, Edit3, ChevronLeft, ChevronRight } from 'lucide-react';

const TIME_BLOCKS = ['06~09', '09~12', '12~15', '15~18', '18~21', '21~24'];
const DAY_LABELS = ['월', '화', '수', '목', '금', '토', '일'];
const MONTH_NAMES = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

function getWeeksInMonth(year: number, month: number): number {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return Math.ceil((firstDay + daysInMonth) / 7);
}

function getWeekDates(year: number, month: number, weekIdx: number): Date[] {
    const firstDayOfMonth = new Date(year, month, 1);
    const dayOfWeek = firstDayOfMonth.getDay();
    const offsetToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const firstMonday = new Date(firstDayOfMonth);
    firstMonday.setDate(firstDayOfMonth.getDate() + offsetToMonday + weekIdx * 7);
    return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(firstMonday);
        d.setDate(firstMonday.getDate() + i);
        return d;
    });
}

type SlotStatus = 'OPEN' | 'CLOSED' | 'LESSON' | 'REGULAR';

interface Slot {
    id: string;
    day: string;
    time: string;
    status: SlotStatus;
    label?: string;
    price?: number;
}

const INITIAL_SLOTS: Slot[] = DAY_LABELS.flatMap(day =>
    TIME_BLOCKS.map(time => ({
        id: `${day}-${time}`,
        day,
        time,
        status: time === '15~18' ? 'LESSON' :
            time === '09~12' && !['토', '일'].includes(day) ? 'LESSON' :
                time === '06~09' && day !== '토' ? 'LESSON' :
                    time === '12~15' && !['토', '일'].includes(day) ? 'OPEN' : 'REGULAR',
        label: (time === '15~18' || (time === '09~12' && !['토', '일'].includes(day))) ? '코치 레슨' :
            (time === '06~09' && day !== '토') ? '아침 레슨' : undefined,
        price: 120000
    }))
);

export const Owner: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const isScheduleOnly = location.pathname === '/owner/schedule';
    const { logEvent } = useMock();
    const [slots, setSlots] = useState<Slot[]>(INITIAL_SLOTS);
    const [activeTab, setActiveTab] = useState<'overview' | 'add'>('overview');
    const [editingSlot, setEditingSlot] = useState<Slot | null>(null);

    const today = new Date();
    const [scheduleYear, setScheduleYear] = useState(today.getFullYear());
    const [scheduleMonth, setScheduleMonth] = useState(today.getMonth());
    const [scheduleWeekIdx, setScheduleWeekIdx] = useState(0);

    const totalWeeks = useMemo(() => getWeeksInMonth(scheduleYear, scheduleMonth), [scheduleYear, scheduleMonth]);
    const weekDates = useMemo(() => getWeekDates(scheduleYear, scheduleMonth, scheduleWeekIdx), [scheduleYear, scheduleMonth, scheduleWeekIdx]);
    const weekRangeLabel = useMemo(() => {
        if (weekDates.length < 2) return '';
        const start = weekDates[0];
        const end = weekDates[6];
        return `${start.getMonth() + 1}/${start.getDate()} ~ ${end.getMonth() + 1}/${end.getDate()}`;
    }, [weekDates]);

    // KPIs
    const openSlots = slots.filter(s => s.status === 'OPEN').length;
    const totalSlots = slots.length;
    const utilisationRate = Math.round((1 - openSlots / totalSlots) * 100);

    const toggleSlotStatus = (id: string) => {
        setSlots(prev => prev.map(s => {
            if (s.id !== id) return s;
            const next: SlotStatus = s.status === 'OPEN' ? 'CLOSED' : 'OPEN';
            logEvent('OWNER_TOGGLE_SLOT', { id, to: next });
            return { ...s, status: next };
        }));
    };

    const updateSlot = (updated: Slot) => {
        setSlots(prev => prev.map(s => s.id === updated.id ? updated : s));
        setEditingSlot(null);
    };

    const statusStyle = (status: SlotStatus) => {
        if (status === 'OPEN') return { bg: 'var(--brand-light)', color: 'var(--brand-trust)', label: '판매중' };
        if (status === 'CLOSED') return { bg: 'var(--gray-100)', color: 'var(--gray-500)', label: '차단됨' };
        if (status === 'LESSON') return { bg: '#E5E7EB', color: 'var(--gray-700)', label: '수업' };
        return { bg: '#FEF2F2', color: 'var(--status-error)', label: '정기대관' };
    };

    const scheduleSection = (
                <div style={{ padding: '20px' }}>
                    <p style={{ fontSize: '12px', color: 'var(--gray-500)', marginBottom: '16px', fontWeight: 600 }}>슬롯을 클릭해서 상태 변경하거나, ✏️ 버튼으로 상세 편집하세요.</p>

                    {/* 년/월 선택 */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', padding: '12px 16px', background: 'var(--gray-50)', borderRadius: 'var(--r-md)', border: '1px solid var(--border-light)' }}>
                        <button type="button" onClick={() => { if (scheduleMonth === 0) { setScheduleMonth(11); setScheduleYear((y) => y - 1); } else setScheduleMonth((m) => m - 1); }} style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-surface)', border: '1px solid var(--border-light)', borderRadius: 'var(--r-sm)' }}>
                            <ChevronLeft size={18} />
                        </button>
                        <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--gray-900)' }}>{scheduleYear}년 {MONTH_NAMES[scheduleMonth]}</span>
                        <button type="button" onClick={() => { if (scheduleMonth === 11) { setScheduleMonth(0); setScheduleYear((y) => y + 1); } else setScheduleMonth((m) => m + 1); }} style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-surface)', border: '1px solid var(--border-light)', borderRadius: 'var(--r-sm)' }}>
                            <ChevronRight size={18} />
                        </button>
                    </div>

                    {/* 주차 선택 (몇월 며칠 ~ 며칠) */}
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '4px' }} className="scrollbar-hide">
                        {Array.from({ length: totalWeeks }, (_, i) => {
                            const wds = getWeekDates(scheduleYear, scheduleMonth, i);
                            const start = wds[0];
                            const end = wds[6];
                            const range = `${start.getMonth() + 1}/${start.getDate()} ~ ${end.getMonth() + 1}/${end.getDate()}`;
                            return (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={() => setScheduleWeekIdx(i)}
                                    style={{
                                        flexShrink: 0, padding: '10px 14px', fontSize: '12px', fontWeight: 800, whiteSpace: 'nowrap',
                                        borderRadius: '20px', border: '1px solid', cursor: 'pointer',
                                        borderColor: scheduleWeekIdx === i ? 'var(--brand-trust)' : 'var(--border-light)',
                                        background: scheduleWeekIdx === i ? 'var(--brand-trust)' : 'var(--bg-surface)',
                                        color: scheduleWeekIdx === i ? 'white' : 'var(--gray-600)',
                                    }}
                                >
                                    {i + 1}주 ({range})
                                </button>
                            );
                        })}
                    </div>

                    <p style={{ fontSize: '11px', color: 'var(--gray-500)', marginBottom: '12px', fontWeight: 700 }}>기준: {scheduleYear}년 {MONTH_NAMES[scheduleMonth]} {scheduleWeekIdx + 1}주차 {weekRangeLabel && `(${weekRangeLabel})`}</p>

                    {DAY_LABELS.map((day, dayIdx) => {
                        const d = weekDates[dayIdx];
                        const dateLabel = d ? `${d.getMonth() + 1}/${d.getDate()} ${day}요일` : `${day}요일`;
                        return (
                            <div key={day} style={{ marginBottom: '16px' }}>
                                <h4 style={{ fontSize: '13px', fontWeight: 900, color: 'var(--gray-700)', marginBottom: '8px', paddingLeft: '4px' }}>{dateLabel}</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    {slots.filter(s => s.day === day).map(slot => {
                                        const st = statusStyle(slot.status);
                                        return (
                                            <div key={slot.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--bg-surface)', border: '1px solid var(--border-light)', borderRadius: 'var(--r-md)' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--gray-500)', width: '60px' }}>{slot.time}</span>
                                                    {slot.label && <span style={{ fontSize: '11px', color: 'var(--gray-400)' }}>{slot.label}</span>}
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span style={{ background: st.bg, color: st.color, fontSize: '11px', fontWeight: 800, padding: '4px 8px', borderRadius: '12px' }}>{st.label}</span>
                                                    {(slot.status === 'OPEN' || slot.status === 'CLOSED') && (
                                                        <button type="button" onClick={() => toggleSlotStatus(slot.id)} style={{ padding: '4px', color: 'var(--gray-400)' }}>
                                                            {slot.status === 'OPEN' ? <ToggleRight size={22} color="var(--brand-trust)" /> : <ToggleLeft size={22} />}
                                                        </button>
                                                    )}
                                                    <button type="button" onClick={() => setEditingSlot(slot)} style={{ padding: '4px', color: 'var(--gray-400)' }}>
                                                        <Edit3 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
    );

    return (
        <div className="animate-fade-in" style={{ paddingBottom: '80px', background: 'var(--bg-page)', minHeight: '100vh' }}>
            <Header title={isScheduleOnly ? '시간표 편집' : '파트너 콘솔'} showBack />

            {isScheduleOnly ? (
                <div style={{ padding: '16px 20px', background: 'var(--brand-primary)', color: 'white', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--gray-400)', marginBottom: '4px', fontWeight: 800 }}>대관 가능 시간대</p>
                    <h2 style={{ fontSize: '18px', fontWeight: 900 }}>에이치 스포츠 센터 반여점</h2>
                    <p style={{ fontSize: '12px', color: 'var(--gray-300)', marginTop: '4px' }}>부산광역시 해운대구 반여동</p>
                </div>
            ) : (
                <>
                    {/* Owner Hero */}
                    <div style={{ padding: '28px 20px', background: 'var(--brand-primary)', color: 'white' }}>
                        <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--gray-400)', marginBottom: '6px', fontWeight: 800 }}>체육관 운영 대시보드</p>
                        <h2 style={{ fontSize: '24px', fontWeight: 900, marginBottom: '4px' }}>에이치 스포츠 센터 반여점</h2>
                        <p style={{ fontSize: '13px', color: 'var(--gray-300)' }}>부산광역시 해운대구 반여동</p>
                    </div>

                    {/* KPI Cards */}
                    <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div className="card" style={{ padding: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: 'var(--gray-500)', marginBottom: '8px' }}>
                                <TrendingUp size={14} /> 금월 누적 매출
                            </div>
                            <div style={{ fontSize: '22px', fontWeight: 900, color: 'var(--gray-900)' }}>₩4,200,000</div>
                        </div>
                        <div className="card" style={{ padding: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: 'var(--gray-500)', marginBottom: '8px' }}>
                                <Activity size={14} /> 코트 가동률
                            </div>
                            <div style={{ fontSize: '22px', fontWeight: 900, color: 'var(--brand-energy)' }}>{utilisationRate}%</div>
                        </div>
                    </div>
                    <div style={{ padding: '0 16px 16px' }}>
                        <button type="button" className="btn btn-secondary" style={{ width: '100%' }} onClick={() => navigate('/owner/payment-methods')}>
                            결제 정보 (카카오페이 링크 · 계좌) 설정
                        </button>
                    </div>

                    {/* Tab Nav: 대시보드 전용 (시간표는 /owner/schedule) */}
                    <div style={{ display: 'flex', borderBottom: '2px solid var(--border-light)', padding: '0 20px', background: 'var(--bg-surface)' }}>
                        {[
                            { id: 'overview' as const, label: '예약 현황' },
                            { id: 'add' as const, label: '슬롯 추가' },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id)}
                                style={{
                                    flex: 1, padding: '14px 0', fontSize: '13px', fontWeight: 800,
                                    color: activeTab === tab.id ? 'var(--brand-primary)' : 'var(--gray-400)',
                                    borderBottom: activeTab === tab.id ? '2px solid var(--brand-primary)' : '2px solid transparent',
                                    marginBottom: '-2px', background: 'transparent', transition: 'all 0.15s'
                                }}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </>
            )}

            {/* Tab: Overview (콘솔만) */}
            {!isScheduleOnly && activeTab === 'overview' && (
                <div style={{ padding: '20px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--gray-700)', marginBottom: '16px' }}>최근 예약 접수 내역</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {ownerData.view.reservationsMock.map((res: any) => (
                            <div key={res.id} className="card" style={{ padding: '16px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span style={{ fontSize: '15px', fontWeight: 800 }}>{res.date} • {res.time}</span>
                                    <span className="badge badge-black">확정</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--gray-600)' }}>
                                    <span>예약자: {res.booker}</span>
                                    <span style={{ fontWeight: 700, color: 'var(--gray-900)' }}>{(res.price || 120000).toLocaleString()}원</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {isScheduleOnly && scheduleSection}

            {/* Tab: Add Slot */}
            {!isScheduleOnly && activeTab === 'add' && (
                <div style={{ padding: '20px' }}>
                    <div className="card" style={{ padding: '24px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 900, marginBottom: '20px' }}>새 시간 슬롯 추가</h3>
                        <p style={{ fontSize: '13px', color: 'var(--gray-500)', fontWeight: 600, lineHeight: 1.6, background: 'var(--gray-50)', padding: '16px', borderRadius: 'var(--r-md)', border: '1px solid var(--border-light)' }}>
                            ⚙️ 시간표 편집 탭에서 기존 슬롯 상태를 변경하거나, 백엔드 연동 후 직접 슬롯을 추가할 수 있습니다.<br /><br />
                            시간표는 <strong>시간표 편집</strong> 메뉴에서 년·월·주 단위로 수정합니다.
                        </p>
                        <button type="button" className="btn btn-trust" style={{ width: '100%', marginTop: '16px' }} onClick={() => navigate('/owner/schedule')}>
                            시간표 편집 화면으로 이동
                        </button>
                        <button type="button" className="btn btn-energy" style={{ width: '100%', marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                            <Plus size={18} /> 새 슬롯 등록 (곧 출시)
                        </button>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {editingSlot && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                    <div style={{ width: '100%', maxWidth: 'var(--max-w)', background: 'white', borderTopLeftRadius: '20px', borderTopRightRadius: '20px', padding: '28px 24px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 900, marginBottom: '4px' }}>{editingSlot.day}요일 {editingSlot.time}</h3>
                        <p style={{ fontSize: '13px', color: 'var(--gray-500)', marginBottom: '24px' }}>슬롯 상태를 수정하세요</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {(['OPEN', 'CLOSED', 'LESSON', 'REGULAR'] as SlotStatus[]).map(s => {
                                const st = statusStyle(s);
                                return (
                                    <button
                                        key={s}
                                        onClick={() => updateSlot({ ...editingSlot, status: s })}
                                        style={{
                                            padding: '14px', borderRadius: 'var(--r-md)', fontWeight: 800, fontSize: '15px',
                                            background: editingSlot.status === s ? st.bg : 'var(--gray-50)',
                                            color: editingSlot.status === s ? st.color : 'var(--gray-700)',
                                            border: `1.5px solid ${editingSlot.status === s ? st.color : 'var(--border-light)'}`,
                                            cursor: 'pointer', textAlign: 'left'
                                        }}
                                    >
                                        {st.label} {editingSlot.status === s ? '✓' : ''}
                                    </button>
                                );
                            })}
                        </div>
                        <button className="btn btn-secondary" onClick={() => setEditingSlot(null)} style={{ width: '100%', marginTop: '16px' }}>취소</button>
                    </div>
                </div>
            )}
        </div>
    );
};
