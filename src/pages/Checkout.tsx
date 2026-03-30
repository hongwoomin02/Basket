import React, { useRef, useState } from 'react';
import { Header } from '../components/Header';
import { useMock, type Application } from '../store/MockProvider';
import { useNavigate, useSearchParams } from 'react-router-dom';
import checkoutData from '../data/routes/checkout.json';
import { ExternalLink, ImagePlus } from 'lucide-react';

type TransferMethod = { id: string; label: string };

export const Checkout: React.FC = () => {
    const { view } = checkoutData;
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { mockMode, addApplication, logEvent } = useMock();

    const type = (searchParams.get('type') || 'rent') as 'rent' | 'pickup';
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
    const [transferMethod, setTransferMethod] = useState(view.transferMethods[0]?.id ?? 'KAKAO');
    const [proofFileName, setProofFileName] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const isPhoneValid = /^[0-9-]{10,13}$/.test(phone);
    const formValid = name.trim().length >= 2 && isPhoneValid;

    const dt = view.directTransfer;

    const handleSubmit = () => {
        if (!formValid) return;

        setIsSubmitting(true);
        setErrorMsg('');
        logEvent('SUBMIT_PAYMENT', {
            type,
            refId,
            transferMethod,
            hasProof: !!proofFileName,
        });

        setTimeout(() => {
            setIsSubmitting(false);

            if (mockMode === 'error') {
                logEvent('PAYMENT_FAIL', { reason: 'mock_mode_error' });
                setErrorMsg('요청 처리에 실패했습니다. 잠시 후 다시 시도해 주세요.');
                return;
            }

            logEvent('PAYMENT_SUCCESS', { type, refId });

            const newApp: Application = {
                id: `TX_${Math.floor(Math.random() * 1000000)}`,
                type: type === 'pickup' ? 'pickup' : 'rent',
                title: decodeURIComponent(title),
                date: new Date().toISOString(),
                price: parseInt(price, 10),
                transferMethod: transferMethod === 'KAKAO' ? 'KAKAO' : 'BANK',
                proofFileName: proofFileName,
                transferStatus: 'PENDING',
                ...(type === 'rent' && rentStart && rentEnd
                    ? { startTime: rentStart, endTime: rentEnd }
                    : type === 'pickup' && pickupStart && pickupEnd
                        ? { startTime: pickupStart, endTime: pickupEnd }
                        : {}),
            };

            addApplication(newApp);
            navigate(`/success?type=${type}&refId=${refId}&price=${price}&title=${encodeURIComponent(title)}`);
        }, 1200);
    };

    return (
        <div className="animate-fade-in" style={{ paddingBottom: '140px', background: 'var(--bg-page)', minHeight: '100vh' }}>
            <Header title="직접 송금 안내" showBack />

            <div style={{ background: 'var(--brand-primary)', color: 'white', padding: '32px 20px', marginBottom: '16px' }}>
                <span className="badge" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', marginBottom: '16px' }}>
                    {type === 'rent' ? '단독 대관' : '예약'}
                </span>
                <h2 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.3, marginBottom: '24px' }}>
                    {decodeURIComponent(title)}
                </h2>

                <div style={{ background: 'rgba(255,255,255,0.1)', padding: '16px', borderRadius: 'var(--r-sm)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '13px', opacity: 0.8, fontWeight: 600 }}>입실 인원</span>
                        <span style={{ fontSize: '13px', fontWeight: 700 }}>{headcount}명</span>
                    </div>
                    <div className="divider" style={{ background: 'rgba(255,255,255,0.2)', margin: '12px 0' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '14px', fontWeight: 700 }}>송금하실 금액</span>
                        <span style={{ fontSize: '24px', fontWeight: 900 }}>
                            {parseInt(price, 10).toLocaleString()} <span style={{ fontSize: '16px' }}>₩</span>
                        </span>
                    </div>
                </div>
            </div>

            <div style={{ padding: '0 20px', marginBottom: '20px' }}>
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
                                <span style={{ fontSize: '12px', color: 'var(--status-error)', fontWeight: 600, marginTop: '4px', display: 'block' }}>
                                    정확한 휴대폰 번호를 입력하세요.
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ padding: '0 20px', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--gray-500)', marginBottom: '10px', paddingLeft: '4px' }}>송금 수단 선택</h3>
                <p style={{ fontSize: '13px', color: 'var(--gray-600)', marginBottom: '12px', lineHeight: 1.5 }}>{view.transferNotice}</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                    {view.transferMethods.map((m) => {
                        const isSelected = transferMethod === m.id;
                        return (
                            <button
                                key={m.id}
                                type="button"
                                onClick={() => !isSubmitting && setTransferMethod(m.id)}
                                className="card"
                                style={{
                                    padding: '16px 20px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    border: isSelected ? '2px solid var(--brand-trust)' : '1px solid var(--border-light)',
                                    background: isSelected ? 'var(--brand-light)' : 'var(--bg-surface)',
                                    textAlign: 'left',
                                    width: '100%',
                                }}
                            >
                                <span style={{ fontSize: '15px', fontWeight: 800, color: isSelected ? 'var(--brand-trust)' : 'var(--gray-700)' }}>{m.label}</span>
                                {isSelected && <div style={{ width: '10px', height: '10px', background: 'var(--brand-trust)', borderRadius: '50%' }} />}
                            </button>
                        );
                    })}
                </div>

                {transferMethod === 'KAKAO' && (
                    <div className="card" style={{ padding: '20px', background: 'var(--brand-light)', borderColor: '#BFDBFE' }}>
                        <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--gray-500)', marginBottom: '8px' }}>카카오페이 송금</div>
                        <a
                            href={dt.kakaoPayLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontSize: '15px',
                                fontWeight: 800,
                                color: 'var(--brand-trust)',
                                wordBreak: 'break-all',
                            }}
                        >
                            송금 링크 열기 <ExternalLink size={18} />
                        </a>
                        <p style={{ fontSize: '12px', color: 'var(--gray-500)', marginTop: '10px' }}>{dt.kakaoPayLink}</p>
                    </div>
                )}

                {transferMethod === 'BANK' && (
                    <div className="card" style={{ padding: '20px', background: 'var(--gray-50)' }}>
                        <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--gray-500)', marginBottom: '8px' }}>계좌 정보</div>
                        <p style={{ fontSize: '16px', fontWeight: 800, color: 'var(--gray-900)', marginBottom: '4px' }}>
                            {dt.bankName} {dt.accountNumber}
                        </p>
                        <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--gray-600)' }}>예금주 {dt.accountHolder}</p>
                    </div>
                )}
            </div>

            <div style={{ padding: '0 20px', marginBottom: '24px' }}>
                <label className="input-label">{view.screenshotLabel ?? '송금 스크린샷 첨부'}</label>
                <p style={{ fontSize: '12px', color: 'var(--gray-500)', marginBottom: '10px' }}>{view.screenshotHint}</p>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0,0,0,0)', border: 0 }}
                    onChange={(e) => {
                        const f = e.target.files?.[0];
                        setProofFileName(f ? f.name : null);
                    }}
                />
                <button
                    type="button"
                    className="card"
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                        width: '100%',
                        padding: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px',
                        cursor: 'pointer',
                        borderStyle: 'dashed',
                        background: 'var(--bg-surface)',
                    }}
                >
                    <ImagePlus size={22} color="var(--gray-400)" />
                    <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--gray-600)' }}>
                        {proofFileName ? proofFileName : '이미지 선택'}
                    </span>
                </button>
            </div>

            {errorMsg && (
                <div style={{ margin: '0 20px 16px', color: 'var(--status-error)', fontSize: '13px', fontWeight: 700, padding: '12px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 'var(--r-sm)' }}>
                    {errorMsg}
                </div>
            )}

            <div className="floating-bar">
                <button
                    onClick={handleSubmit}
                    disabled={!formValid || isSubmitting}
                    className="btn btn-trust"
                    style={{ width: '100%', height: '56px', fontSize: '16px' }}
                >
                    {isSubmitting ? '처리 중...' : '예약·송금 확인 요청'}
                </button>
            </div>
        </div>
    );
};
