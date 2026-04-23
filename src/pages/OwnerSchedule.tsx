import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { useToast } from '../context/ToastContext';
import {
    ownerApi, gymsApi,
    OwnedGymBrief, CalendarSlot, RepeatRule, ExceptionRule,
} from '../lib/api';
import {
    ChevronLeft, ChevronRight, X, AlertCircle, Plus, Trash2, Save,
    CalendarDays, RefreshCw, Repeat, CalendarX, Info,
} from 'lucide-react';

type Tab = 'calendar' | 'repeat' | 'exception';

const SLOT_STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
    AVAILABLE: { label: '판매중', color: 'var(--brand-trust)', bg: 'var(--brand-light)' },
    CLOSED: { label: '차단', color: 'var(--gray-500)', bg: 'var(--gray-100)' },
    CLASS: { label: '수업', color: 'var(--gray-700)', bg: '#E5E7EB' },
    REGULAR: { label: '정기대관', color: 'var(--status-error)', bg: '#FEF2F2' },
};

function ymLabel(ym: string): string {
    const [y, m] = ym.split('-').map(Number);
    return `${y}년 ${m}월`;
}
function adjustMonth(ym: string, delta: number): string {
    const [y, m] = ym.split('-').map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
function monthDaysGrid(ym: string) {
    const [y, m] = ym.split('-').map(Number);
    const first = new Date(y, m - 1, 1);
    const last = new Date(y, m, 0);
    const startOffset = first.getDay();
    const days: { date: string | null }[] = [];
    for (let i = 0; i < startOffset; i++) days.push({ date: null });
    for (let d = 1; d <= last.getDate(); d++) {
        days.push({ date: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}` });
    }
    while (days.length % 7 !== 0) days.push({ date: null });
    return days;
}

export const OwnerSchedule: React.FC = () => {
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [gyms, setGyms] = useState<OwnedGymBrief[]>([]);
    const [selectedGymId, setSelectedGymId] = useState<string | null>(null);
    const [bootstrap, setBootstrap] = useState<'loading' | 'no_gym' | 'error' | 'ready'>('loading');
    const [tab, setTab] = useState<Tab>('calendar');

    const todayYm = useMemo(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    }, []);
    const [ym, setYm] = useState<string>(todayYm);

    const [slots, setSlots] = useState<CalendarSlot[]>([]);
    const [slotsLoading, setSlotsLoading] = useState(true);
    const [slotsError, setSlotsError] = useState(false);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);

    const [repeatRules, setRepeatRules] = useState<RepeatRule[]>([]);
    const [exceptionRules, setExceptionRules] = useState<ExceptionRule[]>([]);
    const [rulesLoading, setRulesLoading] = useState(false);

    // 부트스트랩
    useEffect(() => {
        (async () => {
            try {
                const d = await ownerApi.dashboard();
                const owned = d.ownedGyms ?? [{
                    gymPlaceId: d.ownerGymProfile.gymPlaceId,
                    name: d.ownerGymProfile.name,
                    district: d.ownerGymProfile.district,
                }];
                setGyms(owned);
                setSelectedGymId(owned[0]?.gymPlaceId ?? null);
                setBootstrap('ready');
            } catch (e: unknown) {
                const err = e as { response?: { status?: number; data?: { error?: { code?: string } } } };
                if (err?.response?.data?.error?.code === 'NO_GYM' || err?.response?.status === 404) setBootstrap('no_gym');
                else setBootstrap('error');
            }
        })();
    }, []);

    // 캘린더 로드
    const loadCalendar = useCallback(async (gymId: string, month: string) => {
        setSlotsLoading(true);
        setSlotsError(false);
        try {
            const c = await gymsApi.calendar(gymId, month);
            setSlots(c.slots ?? []);
        } catch {
            setSlotsError(true);
        } finally {
            setSlotsLoading(false);
        }
    }, []);

    // 규칙 로드
    const loadRules = useCallback(async (gymId: string) => {
        setRulesLoading(true);
        try {
            const [r, e] = await Promise.all([gymsApi.repeatRules(gymId), gymsApi.exceptionRules(gymId)]);
            setRepeatRules(r.repeatRules ?? []);
            setExceptionRules(e.exceptionRules ?? []);
        } catch {
            showToast('규칙을 불러오지 못했습니다.');
        } finally {
            setRulesLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        if (!selectedGymId) return;
        if (tab === 'calendar') loadCalendar(selectedGymId, ym);
        else loadRules(selectedGymId);
    }, [selectedGymId, ym, tab, loadCalendar, loadRules]);

    const slotsByDate = useMemo(() => {
        const map = new Map<string, CalendarSlot[]>();
        slots.forEach((s) => {
            if (!map.has(s.date)) map.set(s.date, []);
            map.get(s.date)!.push(s);
        });
        return map;
    }, [slots]);

    const daySlots = selectedDate ? (slotsByDate.get(selectedDate) ?? []) : [];

    // 슬롯 상태 토글
    const handleSlotToggle = async (slot: CalendarSlot) => {
        if (!selectedGymId) return;
        if (slot.status === 'CLASS' || slot.status === 'REGULAR') {
            showToast('고정 수업/정기대관 슬롯은 여기서 바꿀 수 없습니다. 반복 규칙 탭에서 관리하세요.');
            return;
        }
        const next = slot.status === 'AVAILABLE' ? 'CLOSED' : 'AVAILABLE';
        try {
            await gymsApi.patchSlot(selectedGymId, slot.date, slot.startTime, { status: next, price: slot.price });
            showToast('슬롯 상태가 변경되었습니다.');
            await loadCalendar(selectedGymId, ym);
        } catch (e: unknown) {
            const err = e as { response?: { data?: { error?: { message?: string } } } };
            showToast(err?.response?.data?.error?.message ?? '저장에 실패했습니다.');
        }
    };

    // 슬롯 가격 override
    const handleSlotPrice = async (slot: CalendarSlot, newPrice: number | null) => {
        if (!selectedGymId) return;
        try {
            await gymsApi.patchSlot(selectedGymId, slot.date, slot.startTime, { status: slot.status, price: newPrice });
            showToast('가격이 저장되었습니다.');
            await loadCalendar(selectedGymId, ym);
        } catch (e: unknown) {
            const err = e as { response?: { data?: { error?: { message?: string } } } };
            showToast(err?.response?.data?.error?.message ?? '저장에 실패했습니다.');
        }
    };

    // 반복 규칙 CRUD
    const handleRepeatToggle = async (rule: RepeatRule) => {
        if (!selectedGymId) return;
        try {
            await gymsApi.patchRepeatRule(selectedGymId, rule.id, { enabled: !rule.enabled });
            await loadRules(selectedGymId);
        } catch { showToast('변경에 실패했습니다.'); }
    };
    const handleRepeatDelete = async (rule: RepeatRule) => {
        if (!selectedGymId) return;
        if (!window.confirm(`"${rule.label}" 규칙을 삭제하시겠습니까?`)) return;
        try {
            await gymsApi.deleteRepeatRule(selectedGymId, rule.id);
            showToast('삭제되었습니다.');
            await loadRules(selectedGymId);
        } catch { showToast('삭제에 실패했습니다.'); }
    };

    // 예외 규칙 CRUD
    const handleExceptionToggle = async (rule: ExceptionRule) => {
        if (!selectedGymId) return;
        try {
            await gymsApi.patchExceptionRule(selectedGymId, rule.id, { enabled: !rule.enabled });
            await loadRules(selectedGymId);
        } catch { showToast('변경에 실패했습니다.'); }
    };
    const handleExceptionDelete = async (rule: ExceptionRule) => {
        if (!selectedGymId) return;
        if (!window.confirm(`"${rule.label}" 규칙을 삭제하시겠습니까?`)) return;
        try {
            await gymsApi.deleteExceptionRule(selectedGymId, rule.id);
            showToast('삭제되었습니다.');
            await loadRules(selectedGymId);
        } catch { showToast('삭제에 실패했습니다.'); }
    };

    // 신규 규칙 폼 상태
    const [newRepeatOpen, setNewRepeatOpen] = useState(false);
    const [newRepeat, setNewRepeat] = useState<{ type: string; label: string; rruleSpec: string }>({
        type: 'CLASS', label: '', rruleSpec: 'FREQ=WEEKLY;BYDAY=MO',
    });
    const [newExceptionOpen, setNewExceptionOpen] = useState(false);
    const [newException, setNewException] = useState<{ label: string; exceptionDate: string }>({
        label: '', exceptionDate: '',
    });

    const submitNewRepeat = async () => {
        if (!selectedGymId) return;
        if (!newRepeat.label.trim()) { showToast('라벨을 입력해 주세요.'); return; }
        if (!newRepeat.rruleSpec.trim()) { showToast('반복 규칙(RRULE)을 입력해 주세요.'); return; }
        try {
            await gymsApi.createRepeatRule(selectedGymId, { ...newRepeat, enabled: true });
            setNewRepeat({ type: 'CLASS', label: '', rruleSpec: 'FREQ=WEEKLY;BYDAY=MO' });
            setNewRepeatOpen(false);
            showToast('반복 규칙이 추가되었습니다.');
            await loadRules(selectedGymId);
        } catch (e: unknown) {
            const err = e as { response?: { data?: { error?: { message?: string } } } };
            showToast(err?.response?.data?.error?.message ?? '추가에 실패했습니다.');
        }
    };

    const submitNewException = async () => {
        if (!selectedGymId) return;
        if (!newException.label.trim()) { showToast('라벨을 입력해 주세요.'); return; }
        if (!newException.exceptionDate) { showToast('예외 날짜를 선택해 주세요.'); return; }
        try {
            await gymsApi.createExceptionRule(selectedGymId, { ...newException, enabled: true });
            setNewException({ label: '', exceptionDate: '' });
            setNewExceptionOpen(false);
            showToast('예외 날짜가 추가되었습니다.');
            await loadRules(selectedGymId);
        } catch (e: unknown) {
            const err = e as { response?: { data?: { error?: { message?: string } } } };
            showToast(err?.response?.data?.error?.message ?? '추가에 실패했습니다.');
        }
    };

    // ── 분기 ─────────────────────────────────────────────
    if (bootstrap === 'loading') return (
        <div style={{ paddingBottom: 40, background: 'var(--bg-page)', minHeight: '100vh' }}>
            <Header title="시간표 편집" showBack />
            <div style={{ padding: 20 }}><div style={{ height: 100, background: 'var(--gray-200)', borderRadius: 'var(--r-md)' }} /></div>
        </div>
    );
    if (bootstrap === 'no_gym') return (
        <div style={{ paddingBottom: 40, background: 'var(--bg-page)', minHeight: '100vh' }}>
            <Header title="시간표 편집" showBack />
            <div style={{ padding: '40px 20px' }}>
                <div className="card" style={{ padding: 24, textAlign: 'center' }}>
                    <AlertCircle size={36} color="var(--status-error)" style={{ margin: '0 auto 10px' }} />
                    <p style={{ fontWeight: 700, marginBottom: 12 }}>등록된 체육관이 없어 시간표를 편집할 수 없습니다.</p>
                    <button type="button" className="btn btn-secondary" onClick={() => navigate('/owner')}>대시보드로</button>
                </div>
            </div>
        </div>
    );
    if (bootstrap === 'error') return (
        <div style={{ paddingBottom: 40, background: 'var(--bg-page)', minHeight: '100vh' }}>
            <Header title="시간표 편집" showBack />
            <div style={{ padding: '40px 20px' }}>
                <div className="card" style={{ padding: 24, textAlign: 'center' }}>
                    <AlertCircle size={36} color="var(--status-error)" style={{ margin: '0 auto 10px' }} />
                    <p style={{ fontWeight: 700 }}>정보를 불러오지 못했습니다.</p>
                    <button type="button" className="btn btn-primary" style={{ marginTop: 10 }} onClick={() => window.location.reload()}>재시도</button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="animate-fade-in" style={{ paddingBottom: 100, background: 'var(--bg-page)', minHeight: '100vh' }}>
            <Header title="시간표 편집" showBack />

            {gyms.length > 1 && (
                <div style={{ padding: '12px 16px', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-light)' }}>
                    <select className="input-field" value={selectedGymId ?? ''} onChange={(e) => setSelectedGymId(e.target.value)}>
                        {gyms.map((g) => <option key={g.gymPlaceId} value={g.gymPlaceId}>{g.name} ({g.district})</option>)}
                    </select>
                </div>
            )}

            {/* 탭 */}
            <div style={{ display: 'flex', borderBottom: '2px solid var(--border-light)', background: 'var(--bg-surface)' }}>
                {([
                    { key: 'calendar' as const, label: '캘린더', icon: <CalendarDays size={14} /> },
                    { key: 'repeat' as const, label: '반복 규칙', icon: <Repeat size={14} /> },
                    { key: 'exception' as const, label: '예외 날짜', icon: <CalendarX size={14} /> },
                ]).map((t) => (
                    <button
                        key={t.key}
                        type="button"
                        onClick={() => setTab(t.key)}
                        style={{
                            flex: 1, padding: '12px 0', fontSize: 13, fontWeight: 800,
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                            color: tab === t.key ? 'var(--brand-primary)' : 'var(--gray-400)',
                            borderBottom: tab === t.key ? '2px solid var(--brand-primary)' : '2px solid transparent',
                            marginBottom: -2, background: 'transparent',
                        }}
                    >
                        {t.icon} {t.label}
                    </button>
                ))}
            </div>

            {/* ── 캘린더 탭 ────────────────────────────────── */}
            {tab === 'calendar' && (
                <div style={{ padding: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <button type="button" onClick={() => setYm((v) => adjustMonth(v, -1))} style={{ width: 36, height: 36, borderRadius: 'var(--r-sm)', border: '1px solid var(--border-light)', background: 'white' }}>
                            <ChevronLeft size={16} />
                        </button>
                        <h2 style={{ fontSize: 16, fontWeight: 900 }}>{ymLabel(ym)}</h2>
                        <button type="button" onClick={() => setYm((v) => adjustMonth(v, 1))} style={{ width: 36, height: 36, borderRadius: 'var(--r-sm)', border: '1px solid var(--border-light)', background: 'white' }}>
                            <ChevronRight size={16} />
                        </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 4 }}>
                        {['일', '월', '화', '수', '목', '금', '토'].map((d) => (
                            <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: 'var(--gray-500)', padding: 4 }}>{d}</div>
                        ))}
                    </div>

                    {slotsLoading ? (
                        <div style={{ height: 240, background: 'var(--gray-200)', borderRadius: 'var(--r-md)' }} />
                    ) : slotsError ? (
                        <div className="card" style={{ padding: 20, textAlign: 'center' }}>
                            <AlertCircle size={28} color="var(--status-error)" style={{ margin: '0 auto 8px' }} />
                            <p style={{ fontWeight: 700, marginBottom: 10 }}>캘린더를 불러오지 못했습니다.</p>
                            <button type="button" className="btn btn-primary" onClick={() => selectedGymId && loadCalendar(selectedGymId, ym)}>재시도</button>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
                            {monthDaysGrid(ym).map((cell, i) => {
                                const day = cell.date ? Number(cell.date.split('-')[2]) : null;
                                const daySl = cell.date ? (slotsByDate.get(cell.date) ?? []) : [];
                                const closedCount = daySl.filter((s) => s.status === 'CLOSED').length;
                                const availCount = daySl.filter((s) => s.status === 'AVAILABLE').length;
                                return (
                                    <button
                                        key={i}
                                        type="button"
                                        disabled={!cell.date}
                                        onClick={() => cell.date && setSelectedDate(cell.date)}
                                        style={{
                                            minHeight: 56, borderRadius: 'var(--r-sm)', padding: 4, fontSize: 12, textAlign: 'left',
                                            background: cell.date ? 'white' : 'transparent',
                                            border: '1px solid',
                                            borderColor: selectedDate === cell.date ? 'var(--brand-trust)' : 'var(--border-light)',
                                            cursor: cell.date ? 'pointer' : 'default',
                                            color: cell.date ? 'var(--gray-900)' : 'transparent',
                                            fontWeight: 700,
                                        }}
                                    >
                                        {day}
                                        {daySl.length > 0 && (
                                            <div style={{ marginTop: 4, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                                {availCount > 0 && <span style={{ fontSize: 9, padding: '1px 4px', background: 'var(--brand-light)', color: 'var(--brand-trust)', borderRadius: 3, fontWeight: 800 }}>판{availCount}</span>}
                                                {closedCount > 0 && <span style={{ fontSize: 9, padding: '1px 4px', background: 'var(--gray-100)', color: 'var(--gray-500)', borderRadius: 3, fontWeight: 800 }}>차{closedCount}</span>}
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    <div style={{ marginTop: 16, padding: 12, background: 'var(--gray-50)', borderRadius: 'var(--r-sm)', fontSize: 11, color: 'var(--gray-600)', lineHeight: 1.6 }}>
                        <Info size={12} style={{ verticalAlign: 'middle' }} /> 날짜를 탭하면 해당 날의 시간 슬롯을 편집할 수 있습니다. 수업/정기대관 슬롯은 반복 규칙 탭에서 관리하세요.
                    </div>
                </div>
            )}

            {/* 슬롯 편집 Drawer */}
            {tab === 'calendar' && selectedDate && (
                <div onClick={() => setSelectedDate(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                    <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 'var(--max-w)', background: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '80vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                            <h3 style={{ fontSize: 16, fontWeight: 900 }}>{selectedDate} 슬롯 편집</h3>
                            <button type="button" onClick={() => setSelectedDate(null)} style={{ background: 'none' }}><X size={22} /></button>
                        </div>

                        {daySlots.length === 0 ? (
                            <p style={{ textAlign: 'center', color: 'var(--gray-500)', padding: 20 }}>이 날은 슬롯이 없습니다.</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {daySlots.map((s) => (
                                    <SlotRow key={s.id} slot={s} onToggle={() => handleSlotToggle(s)} onPriceSave={(p) => handleSlotPrice(s, p)} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── 반복 규칙 탭 ───────────────────────────── */}
            {tab === 'repeat' && (
                <div style={{ padding: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <p style={{ fontSize: 12, color: 'var(--gray-500)' }}>매주/매월 반복되는 휴관·수업·정기대관 규칙</p>
                        <button type="button" className="btn btn-trust" style={{ height: 36, fontSize: 12 }} onClick={() => setNewRepeatOpen(true)}>
                            <Plus size={14} /> 새 규칙
                        </button>
                    </div>

                    {rulesLoading ? (
                        <div style={{ height: 120, background: 'var(--gray-200)', borderRadius: 'var(--r-md)' }} />
                    ) : repeatRules.length === 0 ? (
                        <div className="card" style={{ padding: 20, textAlign: 'center', color: 'var(--gray-500)' }}>
                            <Repeat size={28} color="var(--gray-400)" style={{ margin: '0 auto 8px' }} />
                            <p style={{ fontWeight: 700 }}>등록된 반복 규칙이 없습니다.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {repeatRules.map((r) => (
                                <div key={r.id} className="card" style={{ padding: 14, opacity: r.enabled ? 1 : 0.6 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 4 }}>
                                                <span className={`badge ${r.type === 'REGULAR' ? 'badge-energy' : 'badge-trust'}`} style={{ fontSize: 10 }}>{r.type === 'CLASS' ? '수업' : '정기대관'}</span>
                                                <span style={{ fontSize: 14, fontWeight: 800 }}>{r.label}</span>
                                            </div>
                                            <p style={{ fontSize: 11, color: 'var(--gray-500)', fontFamily: 'monospace' }}>{r.rruleSpec}</p>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                                        <button type="button" className="btn btn-secondary" style={{ flex: 1, height: 34, fontSize: 12, background: 'white' }} onClick={() => handleRepeatToggle(r)}>
                                            {r.enabled ? '비활성화' : '활성화'}
                                        </button>
                                        <button type="button" className="btn" style={{ width: 90, height: 34, fontSize: 12, background: 'white', color: 'var(--status-error)', border: '1px solid var(--status-error)' }} onClick={() => handleRepeatDelete(r)}>
                                            <Trash2 size={13} /> 삭제
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ── 예외 날짜 탭 ───────────────────────────── */}
            {tab === 'exception' && (
                <div style={{ padding: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <p style={{ fontSize: 12, color: 'var(--gray-500)' }}>공휴일·특별 휴무일 등 일회성 예외</p>
                        <button type="button" className="btn btn-trust" style={{ height: 36, fontSize: 12 }} onClick={() => setNewExceptionOpen(true)}>
                            <Plus size={14} /> 새 예외
                        </button>
                    </div>

                    {rulesLoading ? (
                        <div style={{ height: 120, background: 'var(--gray-200)', borderRadius: 'var(--r-md)' }} />
                    ) : exceptionRules.length === 0 ? (
                        <div className="card" style={{ padding: 20, textAlign: 'center', color: 'var(--gray-500)' }}>
                            <CalendarX size={28} color="var(--gray-400)" style={{ margin: '0 auto 8px' }} />
                            <p style={{ fontWeight: 700 }}>등록된 예외 날짜가 없습니다.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {exceptionRules.map((r) => (
                                <div key={r.id} className="card" style={{ padding: 14, opacity: r.enabled ? 1 : 0.6 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                                        <div style={{ flex: 1 }}>
                                            <span style={{ fontSize: 14, fontWeight: 800 }}>{r.label}</span>
                                            {r.exceptionDate && <p style={{ fontSize: 12, color: 'var(--gray-600)', marginTop: 2 }}>{r.exceptionDate}</p>}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                                        <button type="button" className="btn btn-secondary" style={{ flex: 1, height: 34, fontSize: 12, background: 'white' }} onClick={() => handleExceptionToggle(r)}>
                                            {r.enabled ? '비활성화' : '활성화'}
                                        </button>
                                        <button type="button" className="btn" style={{ width: 90, height: 34, fontSize: 12, background: 'white', color: 'var(--status-error)', border: '1px solid var(--status-error)' }} onClick={() => handleExceptionDelete(r)}>
                                            <Trash2 size={13} /> 삭제
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* 신규 반복 규칙 모달 */}
            {newRepeatOpen && (
                <div onClick={() => setNewRepeatOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                    <div onClick={(e) => e.stopPropagation()} className="card" style={{ width: '100%', maxWidth: 380, padding: 20 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 900, marginBottom: 14 }}>새 반복 규칙</h3>
                        <p style={{ fontSize: 11, color: 'var(--gray-500)', marginBottom: 10, lineHeight: 1.5 }}>
                            수업·정기대관처럼 <strong>매주/매월 반복되는 일정</strong> 을 등록합니다. 일회성 휴관(공휴일 등)은 "예외 날짜" 탭을 이용하세요.
                        </p>
                        <label className="input-label">타입</label>
                        <select className="input-field" value={newRepeat.type} onChange={(e) => setNewRepeat((v) => ({ ...v, type: e.target.value }))}>
                            <option value="CLASS">수업</option>
                            <option value="REGULAR">정기대관</option>
                        </select>
                        <label className="input-label" style={{ marginTop: 10 }}>라벨</label>
                        <input className="input-field" placeholder="예: 매주 월요일 휴관" value={newRepeat.label} onChange={(e) => setNewRepeat((v) => ({ ...v, label: e.target.value }))} />
                        <label className="input-label" style={{ marginTop: 10 }}>RRULE</label>
                        <input className="input-field" placeholder="FREQ=WEEKLY;BYDAY=MO" value={newRepeat.rruleSpec} onChange={(e) => setNewRepeat((v) => ({ ...v, rruleSpec: e.target.value }))} />
                        <p style={{ fontSize: 11, color: 'var(--gray-500)', marginTop: 4 }}>예) 매주 월 = FREQ=WEEKLY;BYDAY=MO · 매월 1일 = FREQ=MONTHLY;BYMONTHDAY=1</p>
                        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                            <button type="button" className="btn btn-secondary" style={{ flex: 1, background: 'white' }} onClick={() => setNewRepeatOpen(false)}>취소</button>
                            <button type="button" className="btn btn-trust" style={{ flex: 1 }} onClick={submitNewRepeat}><Save size={14} /> 추가</button>
                        </div>
                    </div>
                </div>
            )}

            {/* 신규 예외 모달 */}
            {newExceptionOpen && (
                <div onClick={() => setNewExceptionOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                    <div onClick={(e) => e.stopPropagation()} className="card" style={{ width: '100%', maxWidth: 380, padding: 20 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 900, marginBottom: 14 }}>새 예외 날짜</h3>
                        <label className="input-label">라벨</label>
                        <input className="input-field" placeholder="예: 추석 연휴 휴관" value={newException.label} onChange={(e) => setNewException((v) => ({ ...v, label: e.target.value }))} />
                        <label className="input-label" style={{ marginTop: 10 }}>날짜</label>
                        <input type="date" className="input-field" value={newException.exceptionDate} onChange={(e) => setNewException((v) => ({ ...v, exceptionDate: e.target.value }))} />
                        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                            <button type="button" className="btn btn-secondary" style={{ flex: 1, background: 'white' }} onClick={() => setNewExceptionOpen(false)}>취소</button>
                            <button type="button" className="btn btn-trust" style={{ flex: 1 }} onClick={submitNewException}><Save size={14} /> 추가</button>
                        </div>
                    </div>
                </div>
            )}

            {/* 수동 새로고침 */}
            <button type="button" onClick={() => selectedGymId && (tab === 'calendar' ? loadCalendar(selectedGymId, ym) : loadRules(selectedGymId))} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, margin: '16px auto 0', fontSize: 12, color: 'var(--gray-500)', background: 'none', fontWeight: 700 }}>
                <RefreshCw size={12} /> 새로고침
            </button>
        </div>
    );
};

// ── Sub-component: 슬롯 행 ─────────────────────────────
interface SlotRowProps {
    slot: CalendarSlot;
    onToggle: () => void;
    onPriceSave: (price: number | null) => void;
}
const SlotRow: React.FC<SlotRowProps> = ({ slot, onToggle, onPriceSave }) => {
    const meta = SLOT_STATUS_META[slot.status] ?? { label: slot.status, color: 'var(--gray-500)', bg: 'var(--gray-100)' };
    const [editingPrice, setEditingPrice] = useState(false);
    const [priceInput, setPriceInput] = useState<string>(slot.price?.toString() ?? '');
    const locked = slot.status === 'CLASS' || slot.status === 'REGULAR';

    return (
        <div style={{ padding: 12, border: '1px solid var(--border-light)', borderRadius: 'var(--r-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 800 }}>{slot.time}</span>
                <span style={{ background: meta.bg, color: meta.color, fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 10 }}>{meta.label}</span>
            </div>

            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                {!editingPrice ? (
                    <button type="button" onClick={() => !locked && setEditingPrice(true)} disabled={locked} style={{ flex: 1, padding: '6px 10px', border: '1px solid var(--border-light)', borderRadius: 4, background: 'white', fontSize: 12, fontWeight: 700, color: 'var(--gray-700)', textAlign: 'left', cursor: locked ? 'not-allowed' : 'pointer', opacity: locked ? 0.5 : 1 }}>
                        {slot.price !== null ? `${slot.price.toLocaleString()}원` : '가격 미설정'}
                    </button>
                ) : (
                    <>
                        <input type="number" min={0} step={1000} className="input-field" style={{ flex: 1, height: 34 }} value={priceInput} onChange={(e) => setPriceInput(e.target.value)} />
                        <button type="button" className="btn btn-trust" style={{ height: 34, width: 60, fontSize: 12 }} onClick={() => {
                            const num = priceInput.trim() === '' ? null : Number(priceInput);
                            if (num !== null && (Number.isNaN(num) || num < 0)) return;
                            onPriceSave(num);
                            setEditingPrice(false);
                        }}>저장</button>
                        <button type="button" className="btn btn-secondary" style={{ height: 34, width: 60, fontSize: 12, background: 'white' }} onClick={() => { setPriceInput(slot.price?.toString() ?? ''); setEditingPrice(false); }}>취소</button>
                    </>
                )}
                {!editingPrice && !locked && (
                    <button type="button" className="btn" style={{ height: 34, width: 74, fontSize: 12, background: slot.status === 'AVAILABLE' ? 'var(--gray-100)' : 'var(--brand-light)', color: slot.status === 'AVAILABLE' ? 'var(--gray-700)' : 'var(--brand-trust)', fontWeight: 800 }} onClick={onToggle}>
                        {slot.status === 'AVAILABLE' ? '차단' : '열기'}
                    </button>
                )}
            </div>
        </div>
    );
};
