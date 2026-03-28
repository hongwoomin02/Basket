import React from 'react';
import { Header } from '../components/Header';
import { useNavigate } from 'react-router-dom';

export const Terms: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="animate-fade-in" style={{ minHeight: '100vh', background: 'var(--bg-page)', paddingBottom: '40px' }}>
            <Header title="이용약관 / 개인정보 처리" showBack />

            <div style={{ padding: '24px 20px' }}>
                <div className="card" style={{ padding: '20px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 800, marginBottom: '12px' }}>이용약관 (목업)</h3>
                    <p style={{ fontSize: '13px', color: 'var(--gray-600)', lineHeight: 1.6 }}>
                        BusoCourt 서비스 이용과 관련된 약관 내용이 여기에 표시됩니다. 실제 서비스에서는 법적 검토 후 최종 문구가 노출됩니다.
                    </p>
                </div>
                <div className="card" style={{ marginTop: '16px', padding: '20px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 800, marginBottom: '12px' }}>개인정보 처리방침 (목업)</h3>
                    <p style={{ fontSize: '13px', color: 'var(--gray-600)', lineHeight: 1.6 }}>
                        수집하는 개인정보 항목, 이용 목적, 보관 기간 등이 여기에 표시됩니다. 실제 서비스에서는 개인정보처리방침이 적용됩니다.
                    </p>
                </div>
            </div>
        </div>
    );
}
