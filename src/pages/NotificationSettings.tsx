import React, { useState } from 'react';
import { Header } from '../components/Header';
import { useNavigate } from 'react-router-dom';

export const NotificationSettings: React.FC = () => {
    const navigate = useNavigate();
    const [bookingConfirm, setBookingConfirm] = useState(true);
    const [recruitDeadline, setRecruitDeadline] = useState(true);
    const [promo, setPromo] = useState(false);

    const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void }> = ({ checked, onChange }) => (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            onClick={() => onChange(!checked)}
            style={{
                width: '48px',
                height: '28px',
                borderRadius: '14px',
                background: checked ? 'var(--brand-trust)' : 'var(--gray-300)',
                border: 'none',
                position: 'relative',
                transition: 'background 0.2s',
            }}
        >
            <span
                style={{
                    position: 'absolute',
                    top: '2px',
                    left: checked ? '22px' : '2px',
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: 'white',
                    boxShadow: 'var(--shadow-sm)',
                    transition: 'left 0.2s',
                }}
            />
        </button>
    );

    return (
        <div className="animate-fade-in" style={{ minHeight: '100vh', background: 'var(--bg-page)', paddingBottom: '40px' }}>
            <Header title="알림 설정" showBack />

            <div style={{ padding: '24px 20px' }}>
                <p style={{ fontSize: '13px', color: 'var(--gray-500)', marginBottom: '20px', fontWeight: 500 }}>예약 확정, 모집 마감 알림</p>

                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border-light)' }}>
                        <div>
                            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--gray-900)' }}>예약 확정 알림</div>
                            <div style={{ fontSize: '12px', color: 'var(--gray-500)', marginTop: '2px' }}>대관·픽업 예약 확정 시</div>
                        </div>
                        <Toggle checked={bookingConfirm} onChange={setBookingConfirm} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border-light)' }}>
                        <div>
                            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--gray-900)' }}>모집 마감 알림</div>
                            <div style={{ fontSize: '12px', color: 'var(--gray-500)', marginTop: '2px' }}>참여 중인 픽업 마감 임박 시</div>
                        </div>
                        <Toggle checked={recruitDeadline} onChange={setRecruitDeadline} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px' }}>
                        <div>
                            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--gray-900)' }}>프로모션 알림</div>
                            <div style={{ fontSize: '12px', color: 'var(--gray-500)', marginTop: '2px' }}>이벤트·할인 소식</div>
                        </div>
                        <Toggle checked={promo} onChange={setPromo} />
                    </div>
                </div>

                <button type="button" className="btn btn-primary" style={{ width: '100%', marginTop: '24px' }} onClick={() => navigate('/my')}>
                    저장
                </button>
            </div>
        </div>
    );
}
