import React, { useState } from 'react';
import { Header } from '../components/Header';
import { useMock, type Application } from '../store/MockProvider';
import { useNavigate, useSearchParams } from 'react-router-dom';
import checkoutData from '../data/routes/checkout.json';

export const Checkout: React.FC = () => {
    const { view } = checkoutData;
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { mockMode, addApplication, logEvent, role } = useMock();

    // Safety Fallbacks so nothing breaks if routed incorrectly
    const type = searchParams.get('type') || 'pickup';
    const refId = searchParams.get('refId') || 'unknown';
    const price = searchParams.get('price') || '0';
    const title = searchParams.get('title') || '결제 상품';
    const headcount = searchParams.get('headcount') || '1';
    const rentStart = searchParams.get('rentStart') || '';
    const rentEnd = searchParams.get('rentEnd') || '';
    const pickupStart = searchParams.get('pickupStart') || '';
    const pickupEnd = searchParams.get('pickupEnd') || '';

    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [paymentMethod, setPaymentMethod] = useState(view.paymentMethods[0].id);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    // Form strict validation for production
    const isPhoneValid = /^[0-9-]{10,13}$/.test(phone);
    const formValid = name.trim().length >= 2 && isPhoneValid;

    const handleSubmit = () => {
        if (!formValid) return;

        setIsSubmitting(true);
        setErrorMsg('');
        logEvent('SUBMIT_PAYMENT', { type, refId, method: paymentMethod });

        setTimeout(() => {
            setIsSubmitting(false);

            if (mockMode === 'error') {
                logEvent('PAYMENT_FAIL', { reason: 'mock_mode_error' });
                setErrorMsg('결제 서버 승인이 거절되었습니다. 잔액을 확인해주세요.');
                return;
            }

            logEvent('PAYMENT_SUCCESS', { type, refId });

            const newApp: Application = {
                id: `TX_${Math.floor(Math.random() * 1000000)}`,
                type: type as 'rent' | 'pickup',
                title: decodeURIComponent(title),
                date: new Date().toISOString(),
                price: parseInt(price, 10),
                ...(type === 'rent' && rentStart && rentEnd
                    ? { startTime: rentStart, endTime: rentEnd }
                    : type === 'pickup' && pickupStart && pickupEnd
                        ? { startTime: pickupStart, endTime: pickupEnd }
                        : {}),
            };

            addApplication(newApp);
            navigate(`/success?type=${type}&refId=${refId}&price=${price}&title=${title}`);

        }, 1200); // Realistic network delay
    };

    return (
        <div className="animate-fade-in" style={{ paddingBottom: '120px', background: 'var(--bg-page)', minHeight: '100vh' }}>
            <Header title="안전 결제" showBack />

            {/* Receipt Summary */}
            <div style={{ background: 'var(--brand-primary)', color: 'white', padding: '32px 20px', marginBottom: '16px' }}>
                <span className="badge" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', marginBottom: '16px' }}>
                    {type === 'rent' ? '단독 대관' : '픽업 단일 참여'}
                </span>
                <h2 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.3, marginBottom: '24px' }}>
                    {decodeURIComponent(title)}
                </h2>

                <div style={{ background: 'rgba(255,255,255,0.1)', padding: '16px', borderRadius: 'var(--r-sm)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '13px', opacity: 0.8, fontWeight: 600 }}>참여 인원</span>
                        <span style={{ fontSize: '13px', fontWeight: 700 }}>{headcount}명</span>
                    </div>
                    <div className="divider" style={{ background: 'rgba(255,255,255,0.2)', margin: '12px 0' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '14px', fontWeight: 700 }}>최종 결제 금액</span>
                        <span style={{ fontSize: '24px', fontWeight: 900 }}>{parseInt(price, 10).toLocaleString()} <span style={{ fontSize: '16px' }}>₩</span></span>
                    </div>
                </div>
            </div>

            {/* User Form */}
            <div style={{ padding: '0 20px', marginBottom: '24px' }}>
                <div className="card" style={{ padding: '24px 20px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--gray-900)', marginBottom: '16px' }}>예약자 정보</h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div>
                            <label className="input-label">실명</label>
                            <input
                                type="text"
                                className="input-field"
                                placeholder="예약자 이름을 입력하세요"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                disabled={isSubmitting}
                            />
                        </div>
                        <div>
                            <label className="input-label">연락처 (- 제외)</label>
                            <input
                                type="tel"
                                className="input-field"
                                placeholder="01012345678"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                disabled={isSubmitting}
                                style={{ borderColor: phone.length > 0 && !isPhoneValid ? 'var(--status-error)' : 'var(--border-medium)' }}
                            />
                            {phone.length > 0 && !isPhoneValid && (
                                <span style={{ fontSize: '12px', color: 'var(--status-error)', fontWeight: 600, marginTop: '4px', display: 'block' }}>정확한 휴대폰 번호를 입력하세요.</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Payment Method */}
            <div style={{ padding: '0 20px' }}>
                <h3 style={{ fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--gray-500)', marginBottom: '12px', paddingLeft: '4px' }}>결제 수단</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {view.paymentMethods.map(method => {
                        const isSelected = paymentMethod === method.id;
                        return (
                            <div
                                key={method.id}
                                onClick={() => !isSubmitting && setPaymentMethod(method.id)}
                                className="card"
                                style={{
                                    padding: '16px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    border: isSelected ? '2px solid var(--brand-trust)' : '1px solid var(--border-light)',
                                    background: isSelected ? 'var(--brand-light)' : 'var(--bg-surface)'
                                }}
                            >
                                <span style={{ fontSize: '15px', fontWeight: 800, color: isSelected ? 'var(--brand-trust)' : 'var(--gray-700)' }}>{method.label}</span>
                                {isSelected && <div style={{ width: '10px', height: '10px', background: 'var(--brand-trust)', borderRadius: '50%' }} />}
                            </div>
                        )
                    })}
                </div>

                {errorMsg && (
                    <div style={{ marginTop: '16px', color: 'var(--status-error)', fontSize: '13px', fontWeight: 700, padding: '12px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 'var(--r-sm)' }}>
                        {errorMsg}
                    </div>
                )}
            </div>

            <div className="floating-bar">
                <button
                    onClick={handleSubmit}
                    disabled={!formValid || isSubmitting}
                    className="btn btn-trust"
                    style={{ width: '100%', height: '56px', fontSize: '18px' }}
                >
                    {isSubmitting ? '승인 중...' : `${parseInt(price, 10).toLocaleString()}원 결제하기`}
                </button>
            </div>
        </div>
    );
};
