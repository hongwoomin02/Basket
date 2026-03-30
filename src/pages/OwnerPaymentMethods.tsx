import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import ownerPaymentData from '../data/routes/ownerPaymentMethods.json';
import { useMock } from '../store/MockProvider';
import { useToast } from '../context/ToastContext';
import { Link2, Building2 } from 'lucide-react';

export const OwnerPaymentMethods: React.FC = () => {
    const { page, view } = ownerPaymentData;
    const { logEvent } = useMock();
    const { showToast } = useToast();
    const navigate = useNavigate();

    const initial = view.form;
    const [kakaoPayLink, setKakaoPayLink] = useState(initial.kakaoPayLink);
    const [bankName, setBankName] = useState(initial.bankName);
    const [accountNumber, setAccountNumber] = useState(initial.accountNumber);
    const [accountHolder, setAccountHolder] = useState(initial.accountHolder);

    const handleSave = () => {
        logEvent('OWNER_PAYMENT_METHODS_SAVE', { hasKakao: !!kakaoPayLink.trim(), hasBank: !!accountNumber.trim() });
        showToast('결제 정보가 저장되었습니다 (목업).');
    };

    return (
        <div className="animate-fade-in" style={{ paddingBottom: '100px', background: 'var(--bg-page)', minHeight: '100vh' }}>
            <Header title={page.title} showBack />

            <div style={{ padding: '20px' }}>
                <p style={{ fontSize: '13px', color: 'var(--gray-600)', fontWeight: 600, lineHeight: 1.5, marginBottom: '20px' }}>
                    예약 고객에게 노출되는 송금 수단입니다. <strong>카카오페이 송금 링크</strong>와 <strong>계좌번호</strong>를 입력하세요. 카드 정보는 수집하지 않습니다.
                </p>

                <div className="card" style={{ padding: '20px', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 800, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Link2 size={18} color="var(--brand-trust)" /> 카카오페이 송금 링크
                    </h3>
                    <label className="input-label">링크 URL</label>
                    <input
                        className="input-field"
                        type="url"
                        placeholder="https://qr.kakaopay.com/..."
                        value={kakaoPayLink}
                        onChange={(e) => setKakaoPayLink(e.target.value)}
                    />
                </div>

                <div className="card" style={{ padding: '20px', marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 800, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Building2 size={18} color="var(--brand-primary)" /> 계좌 이체
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        <div>
                            <label className="input-label">은행명</label>
                            <input className="input-field" value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="예: 국민은행" />
                        </div>
                        <div>
                            <label className="input-label">계좌번호</label>
                            <input className="input-field" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="숫자만 또는 하이픈 포함" />
                        </div>
                        <div>
                            <label className="input-label">예금주</label>
                            <input className="input-field" value={accountHolder} onChange={(e) => setAccountHolder(e.target.value)} placeholder="실명" />
                        </div>
                    </div>
                </div>

                <button type="button" className="btn btn-trust" style={{ width: '100%', height: '52px' }} onClick={handleSave}>
                    저장하기
                </button>

                <div className="card" style={{ padding: '16px', marginTop: '24px', background: 'var(--gray-50)' }}>
                    <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--gray-500)', marginBottom: '8px' }}>{view.preview.title}</div>
                    <ul style={{ fontSize: '13px', color: 'var(--gray-700)', paddingLeft: '18px', margin: 0, lineHeight: 1.6 }}>
                        {view.preview.labels.map((label) => (
                            <li key={label}>{label}</li>
                        ))}
                    </ul>
                </div>

                <button type="button" className="btn btn-secondary" style={{ width: '100%', marginTop: '12px' }} onClick={() => navigate('/owner')}>
                    대시보드로
                </button>
            </div>
        </div>
    );
};
