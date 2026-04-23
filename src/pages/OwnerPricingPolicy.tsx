import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { useToast } from '../context/ToastContext';
import { ownerApi, gymsApi, PricingPolicy, OwnedGymBrief } from '../lib/api';
import { DollarSign, Tag, Percent, AlertCircle, Info, Check } from 'lucide-react';

export const OwnerPricingPolicy: React.FC = () => {
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [gyms, setGyms] = useState<OwnedGymBrief[]>([]);
    const [selectedGymId, setSelectedGymId] = useState<string | null>(null);
    const [bootstrap, setBootstrap] = useState<'loading' | 'no_gym' | 'error' | 'ready'>('loading');

    const [baseHourlyPrice, setBaseHourlyPrice] = useState<number>(0);
    const [weekendHourlyPrice, setWeekendHourlyPrice] = useState<number>(0);
    const [discountEnabled, setDiscountEnabled] = useState<boolean>(false);
    const [discountPersonThreshold, setDiscountPersonThreshold] = useState<number>(0);
    const [discountRatePercent, setDiscountRatePercent] = useState<number>(0);
    const [discountFixedAmount, setDiscountFixedAmount] = useState<number>(0);
    const [sameDayOnly, setSameDayOnly] = useState<boolean>(false);

    const [formState, setFormState] = useState<'loading' | 'ready' | 'error'>('loading');
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState<string[]>([]);

    // 1) 체육관 목록 확보
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

    const loadPolicy = useCallback(async (gymId: string) => {
        setFormState('loading');
        try {
            const p = await gymsApi.pricingPolicy(gymId);
            setBaseHourlyPrice(p.baseHourlyPrice ?? 0);
            setWeekendHourlyPrice(p.weekendHourlyPrice ?? 0);
            setDiscountPersonThreshold(p.discountPersonThreshold ?? 0);
            setDiscountRatePercent(p.discountRatePercent ?? 0);
            setDiscountFixedAmount(p.discountFixedAmount ?? 0);
            setSameDayOnly(!!p.sameDayOnly);
            setDiscountEnabled(Boolean(p.discountPersonThreshold && (p.discountRatePercent || p.discountFixedAmount)));
            setFormState('ready');
        } catch (e: unknown) {
            const err = e as { response?: { status?: number } };
            if (err?.response?.status === 404) {
                // 신규 체육관 — 기본값
                setBaseHourlyPrice(0); setWeekendHourlyPrice(0);
                setDiscountPersonThreshold(0); setDiscountRatePercent(0); setDiscountFixedAmount(0);
                setSameDayOnly(false); setDiscountEnabled(false);
                setFormState('ready');
            } else {
                setFormState('error');
            }
        }
    }, []);

    useEffect(() => {
        if (selectedGymId) loadPolicy(selectedGymId);
    }, [selectedGymId, loadPolicy]);

    const validate = (): string[] => {
        const errs: string[] = [];
        if (baseHourlyPrice <= 0) errs.push('기본 시간당 가격은 0원보다 커야 합니다.');
        if (weekendHourlyPrice < 0) errs.push('주말 시간당 가격은 0원 이상이어야 합니다.');
        if (discountEnabled) {
            if (discountPersonThreshold <= 0) errs.push('할인 적용 인원 기준은 1명 이상이어야 합니다.');
            if (discountRatePercent < 0 || discountRatePercent > 100) errs.push('할인율은 0~100 사이여야 합니다.');
            if (discountFixedAmount < 0) errs.push('고정 할인액은 0원 이상이어야 합니다.');
            if (discountRatePercent === 0 && discountFixedAmount === 0) {
                errs.push('할인율 또는 고정 할인액 중 최소 하나는 0보다 커야 합니다.');
            }
        }
        return errs;
    };

    const handleSave = async () => {
        if (!selectedGymId) return;
        const errs = validate();
        setErrors(errs);
        if (errs.length > 0) return;

        setSaving(true);
        try {
            const body: Partial<PricingPolicy> = {
                baseHourlyPrice,
                weekendHourlyPrice,
                discountPersonThreshold: discountEnabled ? discountPersonThreshold : undefined,
                discountRatePercent: discountEnabled ? discountRatePercent : 0,
                discountFixedAmount: discountEnabled ? discountFixedAmount : 0,
                sameDayOnly,
            };
            await gymsApi.updatePricingPolicy(selectedGymId, body);
            showToast('가격 정책이 저장되었습니다.');
            await loadPolicy(selectedGymId);
        } catch (e: unknown) {
            const err = e as { response?: { data?: { error?: { message?: string } } } };
            showToast(err?.response?.data?.error?.message ?? '저장에 실패했습니다.');
        } finally {
            setSaving(false);
        }
    };

    // 예시 계산
    const samplePeople = Math.max(discountEnabled ? discountPersonThreshold : 5, 3);
    const sampleBase = baseHourlyPrice || 0;
    const sampleDiscount = discountEnabled && samplePeople >= discountPersonThreshold
        ? Math.max(Math.round(sampleBase * (discountRatePercent / 100)), 0) + (discountFixedAmount || 0)
        : 0;
    const sampleFinal = Math.max(sampleBase - sampleDiscount, 0);

    if (bootstrap === 'loading') return (
        <div style={{ paddingBottom: 40, background: 'var(--bg-page)', minHeight: '100vh' }}>
            <Header title="가격 정책" showBack />
            <div style={{ padding: 20 }}><div style={{ height: 100, background: 'var(--gray-200)', borderRadius: 'var(--r-md)' }} /></div>
        </div>
    );
    if (bootstrap === 'no_gym') return (
        <div style={{ paddingBottom: 40, background: 'var(--bg-page)', minHeight: '100vh' }}>
            <Header title="가격 정책" showBack />
            <div style={{ padding: '40px 20px' }}>
                <div className="card" style={{ padding: 24, textAlign: 'center' }}>
                    <AlertCircle size={36} color="var(--status-error)" style={{ margin: '0 auto 10px' }} />
                    <p style={{ fontWeight: 700, marginBottom: 12 }}>등록된 체육관이 없어 가격 정책을 설정할 수 없습니다.</p>
                    <button type="button" className="btn btn-secondary" onClick={() => navigate('/owner')}>대시보드로</button>
                </div>
            </div>
        </div>
    );
    if (bootstrap === 'error') return (
        <div style={{ paddingBottom: 40, background: 'var(--bg-page)', minHeight: '100vh' }}>
            <Header title="가격 정책" showBack />
            <div style={{ padding: '40px 20px' }}>
                <div className="card" style={{ padding: 24, textAlign: 'center' }}>
                    <AlertCircle size={36} color="var(--status-error)" style={{ margin: '0 auto 10px' }} />
                    <p style={{ fontWeight: 700, marginBottom: 12 }}>정보를 불러오지 못했습니다.</p>
                    <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>재시도</button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="animate-fade-in" style={{ paddingBottom: 100, background: 'var(--bg-page)', minHeight: '100vh' }}>
            <Header title="가격 정책" showBack />

            <div style={{ padding: 20 }}>
                {gyms.length > 1 && (
                    <div style={{ marginBottom: 16 }}>
                        <label className="input-label">설정할 체육관</label>
                        <select className="input-field" value={selectedGymId ?? ''} onChange={(e) => setSelectedGymId(e.target.value)}>
                            {gyms.map((g) => <option key={g.gymPlaceId} value={g.gymPlaceId}>{g.name} ({g.district})</option>)}
                        </select>
                    </div>
                )}

                <p style={{ fontSize: 13, color: 'var(--gray-600)', fontWeight: 600, lineHeight: 1.5, marginBottom: 16 }}>
                    체육관 기본 시간당 가격과 할인 조건을 설정합니다. 예약 화면에서 자동으로 적용되어 고객에게 노출됩니다.
                </p>

                {formState === 'loading' && (
                    <div style={{ height: 200, background: 'var(--gray-200)', borderRadius: 'var(--r-md)' }} />
                )}

                {formState === 'error' && (
                    <div className="card" style={{ padding: 14, marginBottom: 16, borderLeft: '4px solid var(--status-error)' }}>
                        <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--status-error)' }}>기존 정책을 불러오지 못했습니다. 새로 입력해서 저장하거나 다시 시도해 주세요.</p>
                        <button type="button" className="btn btn-primary" style={{ marginTop: 10 }} onClick={() => selectedGymId && loadPolicy(selectedGymId)}>재시도</button>
                    </div>
                )}

                {formState === 'ready' && (
                    <>
                        {/* 기본 요금 */}
                        <div className="card" style={{ padding: 20, marginBottom: 14 }}>
                            <h3 style={{ fontSize: 14, fontWeight: 800, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <DollarSign size={18} color="var(--brand-trust)" /> 시간당 기본 요금
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                <div>
                                    <label className="input-label">평일 시간당 (원)</label>
                                    <input type="number" min={0} step={1000} className="input-field" value={baseHourlyPrice} onChange={(e) => setBaseHourlyPrice(Number(e.target.value) || 0)} />
                                </div>
                                <div>
                                    <label className="input-label">주말 시간당 (원) — 미설정 시 평일과 동일</label>
                                    <input type="number" min={0} step={1000} className="input-field" value={weekendHourlyPrice} onChange={(e) => setWeekendHourlyPrice(Number(e.target.value) || 0)} />
                                </div>
                            </div>
                        </div>

                        {/* 할인 정책 */}
                        <div className="card" style={{ padding: 20, marginBottom: 14 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                                <h3 style={{ fontSize: 14, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Tag size={18} color="var(--brand-energy)" /> 단체 할인
                                </h3>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: 'var(--gray-600)' }}>
                                    <input type="checkbox" checked={discountEnabled} onChange={(e) => setDiscountEnabled(e.target.checked)} />
                                    사용
                                </label>
                            </div>

                            {discountEnabled && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                    <div>
                                        <label className="input-label">할인 적용 최소 인원 (명)</label>
                                        <input type="number" min={1} className="input-field" value={discountPersonThreshold} onChange={(e) => setDiscountPersonThreshold(Number(e.target.value) || 0)} />
                                    </div>
                                    <div>
                                        <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <Percent size={12} /> 할인율 (%) — 0 이면 미적용
                                        </label>
                                        <input type="number" min={0} max={100} step={1} className="input-field" value={discountRatePercent} onChange={(e) => setDiscountRatePercent(Number(e.target.value) || 0)} />
                                    </div>
                                    <div>
                                        <label className="input-label">고정 할인액 (원) — 0 이면 미적용</label>
                                        <input type="number" min={0} step={1000} className="input-field" value={discountFixedAmount} onChange={(e) => setDiscountFixedAmount(Number(e.target.value) || 0)} />
                                    </div>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: 'var(--gray-700)' }}>
                                        <input type="checkbox" checked={sameDayOnly} onChange={(e) => setSameDayOnly(e.target.checked)} />
                                        당일 예약에만 할인 적용 (공실 방지용)
                                    </label>
                                    {discountRatePercent > 0 && discountFixedAmount > 0 && (
                                        <div style={{ padding: 10, background: 'var(--gray-50)', borderRadius: 'var(--r-sm)', fontSize: 11, color: 'var(--gray-600)', display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                                            <Info size={12} style={{ marginTop: 2 }} /> 할인율과 고정 할인액이 모두 적용됩니다 (중복 할인). 한 가지만 쓰시려면 나머지를 0으로 두세요.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {errors.length > 0 && (
                            <div className="card" style={{ padding: 14, marginBottom: 14, borderLeft: '4px solid var(--status-error)' }}>
                                <p style={{ fontSize: 12, fontWeight: 800, color: 'var(--status-error)', marginBottom: 6 }}>저장 전에 아래 항목을 확인해 주세요:</p>
                                <ul style={{ fontSize: 12, color: 'var(--status-error)', paddingLeft: 18, margin: 0, lineHeight: 1.6 }}>
                                    {errors.map((er) => <li key={er}>{er}</li>)}
                                </ul>
                            </div>
                        )}

                        <button type="button" className="btn btn-trust" style={{ width: '100%', height: 52 }} disabled={saving} onClick={handleSave}>
                            {saving ? '저장 중...' : (<><Check size={16} /> 저장하기</>)}
                        </button>

                        {/* 미리보기 */}
                        <div className="card" style={{ padding: 16, marginTop: 20, background: 'var(--gray-50)' }}>
                            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--gray-500)', marginBottom: 8 }}>고객 예약 화면 미리보기</div>
                            <div style={{ fontSize: 13, color: 'var(--gray-700)', lineHeight: 1.8 }}>
                                <div>1시간 평일 기본 요금: <strong>{baseHourlyPrice.toLocaleString()}원</strong></div>
                                <div>주말: <strong>{weekendHourlyPrice.toLocaleString()}원</strong></div>
                                {discountEnabled && (
                                    <>
                                        <div style={{ borderTop: '1px dashed var(--border-light)', marginTop: 8, paddingTop: 8 }}>
                                            예시: <strong>{samplePeople}명</strong> 예약 시
                                        </div>
                                        <div>기본가 {sampleBase.toLocaleString()}원 - 할인 {sampleDiscount.toLocaleString()}원 = <strong style={{ color: 'var(--brand-trust)' }}>{sampleFinal.toLocaleString()}원</strong></div>
                                    </>
                                )}
                            </div>
                        </div>

                        <button type="button" className="btn btn-secondary" style={{ width: '100%', marginTop: 12, background: 'white' }} onClick={() => navigate('/owner')}>
                            대시보드로
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};
