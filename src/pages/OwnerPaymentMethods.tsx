import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { useMock } from '../store/MockProvider';
import { useToast } from '../context/ToastContext';
import { ownerApi, gymsApi, PaymentMethods, OwnedGymBrief } from '../lib/api';
import { Link2, Building2, AlertCircle, Info, Check } from 'lucide-react';

export const OwnerPaymentMethods: React.FC = () => {
    const { logEvent } = useMock();
    const { showToast } = useToast();
    const navigate = useNavigate();

    // 체육관 선택
    const [gyms, setGyms] = useState<OwnedGymBrief[]>([]);
    const [selectedGymId, setSelectedGymId] = useState<string | null>(null);
    const [bootstrapState, setBootstrapState] = useState<'loading' | 'no_gym' | 'error' | 'ready'>('loading');

    // 폼 상태
    const [kakaoPayLink, setKakaoPayLink] = useState('');
    const [bankName, setBankName] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [accountHolder, setAccountHolder] = useState('');
    const [kakaoVisible, setKakaoVisible] = useState(true);
    const [bankVisible, setBankVisible] = useState(true);

    const [formState, setFormState] = useState<'loading' | 'missing' | 'loaded' | 'error'>('loading');
    const [saving, setSaving] = useState(false);
    const [validationErrors, setValidationErrors] = useState<string[]>([]);

    // 1) 대시보드를 호출해 소유 체육관 목록 확보
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
                setBootstrapState('ready');
            } catch (e: unknown) {
                const err = e as { response?: { status?: number; data?: { error?: { code?: string } } } };
                if (err?.response?.data?.error?.code === 'NO_GYM' || err?.response?.status === 404) {
                    setBootstrapState('no_gym');
                } else {
                    setBootstrapState('error');
                }
            }
        })();
    }, []);

    // 2) 선택된 체육관의 결제 수단 로드
    const loadForGym = useCallback(async (gymId: string) => {
        setFormState('loading');
        try {
            const pm = await gymsApi.paymentMethods(gymId);
            setKakaoPayLink(pm.kakaoPayLink ?? '');
            setBankName(pm.bankName ?? '');
            setAccountNumber(pm.accountNumber ?? '');
            setAccountHolder(pm.accountHolder ?? '');
            setKakaoVisible((pm.visibleMethods ?? []).includes('kakao'));
            setBankVisible((pm.visibleMethods ?? []).includes('bank'));
            setFormState('loaded');
        } catch (e: unknown) {
            const err = e as { response?: { status?: number; data?: { error?: { code?: string } } } };
            if (err?.response?.status === 404 || err?.response?.data?.error?.code === 'PAYMENT_METHOD_NOT_SET') {
                // 처음 등록하는 케이스 — 빈 폼
                setKakaoPayLink(''); setBankName(''); setAccountNumber(''); setAccountHolder('');
                setKakaoVisible(true); setBankVisible(true);
                setFormState('missing');
            } else {
                setFormState('error');
            }
        }
    }, []);

    useEffect(() => {
        if (selectedGymId) loadForGym(selectedGymId);
    }, [selectedGymId, loadForGym]);

    // 저장
    const validate = (): string[] => {
        const errs: string[] = [];
        if (kakaoVisible && !kakaoPayLink.trim()) errs.push('카카오페이 송금 링크가 비어있습니다.');
        if (kakaoVisible && kakaoPayLink.trim() && !/^https?:\/\//i.test(kakaoPayLink.trim())) {
            errs.push('카카오페이 링크는 https:// 로 시작해야 합니다.');
        }
        if (bankVisible) {
            if (!bankName.trim()) errs.push('은행명이 비어있습니다.');
            if (!accountNumber.trim()) errs.push('계좌번호가 비어있습니다.');
            if (!accountHolder.trim()) errs.push('예금주가 비어있습니다.');
        }
        return errs;
    };

    const handleSave = async () => {
        if (!selectedGymId) return;
        const errs = validate();
        setValidationErrors(errs);
        if (errs.length > 0) return;

        const visibleMethods: string[] = [];
        if (kakaoVisible) visibleMethods.push('kakao');
        if (bankVisible) visibleMethods.push('bank');

        if (visibleMethods.length === 0) {
            const ok = window.confirm('노출 설정된 결제 수단이 없습니다.\n저장하면 고객이 송금할 방법이 없어 예약이 불가능해집니다. 계속할까요?');
            if (!ok) return;
        }

        setSaving(true);
        try {
            const body: Partial<PaymentMethods> = {
                kakaoPayLink: kakaoPayLink.trim() || undefined,
                bankName: bankName.trim() || undefined,
                accountNumber: accountNumber.trim() || undefined,
                accountHolder: accountHolder.trim() || undefined,
                visibleMethods,
            };
            await gymsApi.updatePaymentMethods(selectedGymId, body);
            logEvent('OWNER_PAYMENT_METHODS_SAVE', { gymId: selectedGymId, visibleMethods });
            showToast('결제 정보가 저장되었습니다.');
            await loadForGym(selectedGymId);
        } catch (e: unknown) {
            const err = e as { response?: { data?: { error?: { message?: string } } } };
            showToast(err?.response?.data?.error?.message ?? '저장에 실패했습니다.');
        } finally {
            setSaving(false);
        }
    };

    // ── 부트스트랩 분기 ────────────────────────────────────
    if (bootstrapState === 'loading') {
        return (
            <div style={{ paddingBottom: 40, background: 'var(--bg-page)', minHeight: '100vh' }}>
                <Header title="결제 정보 관리" showBack />
                <div style={{ padding: 20 }}>
                    <div style={{ height: 100, background: 'var(--gray-200)', borderRadius: 'var(--r-md)' }} />
                </div>
            </div>
        );
    }

    if (bootstrapState === 'no_gym') {
        return (
            <div style={{ paddingBottom: 40, background: 'var(--bg-page)', minHeight: '100vh' }}>
                <Header title="결제 정보 관리" showBack />
                <div style={{ padding: '40px 20px' }}>
                    <div className="card" style={{ padding: 24, textAlign: 'center' }}>
                        <AlertCircle size={36} color="var(--status-error)" style={{ margin: '0 auto 10px' }} />
                        <p style={{ fontWeight: 700, marginBottom: 12 }}>등록된 체육관이 없어 결제 정보를 설정할 수 없습니다.</p>
                        <button type="button" className="btn btn-secondary" onClick={() => navigate('/owner')}>대시보드로</button>
                    </div>
                </div>
            </div>
        );
    }

    if (bootstrapState === 'error') {
        return (
            <div style={{ paddingBottom: 40, background: 'var(--bg-page)', minHeight: '100vh' }}>
                <Header title="결제 정보 관리" showBack />
                <div style={{ padding: '40px 20px' }}>
                    <div className="card" style={{ padding: 24, textAlign: 'center' }}>
                        <AlertCircle size={36} color="var(--status-error)" style={{ margin: '0 auto 10px' }} />
                        <p style={{ fontWeight: 700, marginBottom: 12 }}>운영 정보를 불러오지 못했습니다.</p>
                        <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>재시도</button>
                    </div>
                </div>
            </div>
        );
    }

    // ── 본 폼 ─────────────────────────────────────────────
    return (
        <div className="animate-fade-in" style={{ paddingBottom: 100, background: 'var(--bg-page)', minHeight: '100vh' }}>
            <Header title="결제 정보 관리" showBack />

            <div style={{ padding: 20 }}>
                {/* 체육관 선택 */}
                {gyms.length > 1 && (
                    <div style={{ marginBottom: 16 }}>
                        <label className="input-label">설정할 체육관</label>
                        <select className="input-field" value={selectedGymId ?? ''} onChange={(e) => setSelectedGymId(e.target.value)}>
                            {gyms.map((g) => <option key={g.gymPlaceId} value={g.gymPlaceId}>{g.name} ({g.district})</option>)}
                        </select>
                    </div>
                )}

                <p style={{ fontSize: 13, color: 'var(--gray-600)', fontWeight: 600, lineHeight: 1.5, marginBottom: 16 }}>
                    예약 고객에게 노출되는 송금 수단입니다. <strong>카카오페이</strong>와 <strong>계좌이체</strong> 중 원하는 방식을 노출/숨김 할 수 있습니다. 카드 정보는 수집하지 않습니다.
                </p>

                {formState === 'missing' && (
                    <div className="card" style={{ padding: 14, marginBottom: 16, background: 'var(--brand-light)', borderLeft: '4px solid var(--brand-trust)' }}>
                        <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--brand-trust)', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Info size={14} /> 아직 결제 수단이 등록되지 않았습니다. 아래 정보를 입력 후 저장해 주세요.
                        </p>
                    </div>
                )}

                {formState === 'error' && (
                    <div className="card" style={{ padding: 14, marginBottom: 16, borderLeft: '4px solid var(--status-error)' }}>
                        <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--status-error)' }}>기존 결제 정보를 불러오지 못했습니다. 새로 입력해서 저장하거나 다시 시도해 주세요.</p>
                    </div>
                )}

                {formState !== 'loading' && (
                    <>
                        {/* 카카오페이 카드 */}
                        <div className="card" style={{ padding: 20, marginBottom: 14 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                                <h3 style={{ fontSize: 14, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Link2 size={18} color="var(--brand-trust)" /> 카카오페이 송금 링크
                                </h3>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: 'var(--gray-600)' }}>
                                    <input type="checkbox" checked={kakaoVisible} onChange={(e) => setKakaoVisible(e.target.checked)} />
                                    고객에게 노출
                                </label>
                            </div>
                            <label className="input-label">링크 URL</label>
                            <input className="input-field" type="url" placeholder="https://qr.kakaopay.com/..." value={kakaoPayLink} onChange={(e) => setKakaoPayLink(e.target.value)} />
                        </div>

                        {/* 계좌이체 카드 */}
                        <div className="card" style={{ padding: 20, marginBottom: 20 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                                <h3 style={{ fontSize: 14, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Building2 size={18} color="var(--brand-primary)" /> 계좌 이체
                                </h3>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: 'var(--gray-600)' }}>
                                    <input type="checkbox" checked={bankVisible} onChange={(e) => setBankVisible(e.target.checked)} />
                                    고객에게 노출
                                </label>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                <div>
                                    <label className="input-label">은행명</label>
                                    <input className="input-field" value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="예: 국민은행" />
                                </div>
                                <div>
                                    <label className="input-label">계좌번호</label>
                                    <input className="input-field" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="숫자 또는 하이픈 포함" />
                                </div>
                                <div>
                                    <label className="input-label">예금주</label>
                                    <input className="input-field" value={accountHolder} onChange={(e) => setAccountHolder(e.target.value)} placeholder="실명" />
                                </div>
                            </div>
                        </div>

                        {validationErrors.length > 0 && (
                            <div className="card" style={{ padding: 14, marginBottom: 14, borderLeft: '4px solid var(--status-error)' }}>
                                <p style={{ fontSize: 12, fontWeight: 800, color: 'var(--status-error)', marginBottom: 6 }}>저장 전에 아래 항목을 확인해 주세요:</p>
                                <ul style={{ fontSize: 12, color: 'var(--status-error)', paddingLeft: 18, margin: 0, lineHeight: 1.6 }}>
                                    {validationErrors.map((err) => <li key={err}>{err}</li>)}
                                </ul>
                            </div>
                        )}

                        <button type="button" className="btn btn-trust" style={{ width: '100%', height: 52 }} disabled={saving} onClick={handleSave}>
                            {saving ? '저장 중...' : (<><Check size={16} /> 저장하기</>)}
                        </button>

                        <div className="card" style={{ padding: 16, marginTop: 24, background: 'var(--gray-50)' }}>
                            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--gray-500)', marginBottom: 8 }}>고객이 보게 되는 정보 미리보기</div>
                            <ul style={{ fontSize: 13, color: 'var(--gray-700)', paddingLeft: 18, margin: 0, lineHeight: 1.6 }}>
                                {kakaoVisible && kakaoPayLink && <li>카카오페이 송금 링크로 즉시 송금 가능</li>}
                                {bankVisible && bankName && accountNumber && <li>{bankName} {accountNumber} ({accountHolder})</li>}
                                {!kakaoVisible && !bankVisible && <li style={{ color: 'var(--status-error)' }}>노출된 결제 수단이 없어 고객은 예약이 불가능합니다.</li>}
                            </ul>
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
