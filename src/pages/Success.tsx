import React from 'react';
import successData from '../data/routes/success.json';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Megaphone, CalendarCheck } from 'lucide-react';
import { useMock } from '../store/MockProvider';

export const Success: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { setRole } = useMock();

    const title = searchParams.get('title') || '예약 완료';
    const price = searchParams.get('price') || '0';
    const type = searchParams.get('type') || 'Unknown';

    // The logic to direct users to write a recruiting post
    const handleRecruitFlow = () => {
        // Upgrade them temporarily to ORGANIZER to view creation layout for mockup flow
        setRole('ORGANIZER');
        alert("팀원 모집 기능으로 이동합니다. 주최자 권한이 오픈되었습니다.");
        navigate('/organizer');
    };

    return (
        <div className="animate-fade-in" style={{ minHeight: '100vh', background: 'var(--bg-page)', padding: '40px 16px', display: 'flex', flexDirection: 'column' }}>

            <div style={{ textAlign: 'center', marginTop: '40px', marginBottom: '32px' }}>
                <CheckCircle size={64} color="var(--brand-primary)" style={{ margin: '0 auto 16px' }} />
                <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--gray-900)', marginBottom: '8px' }}>예약·송금 확인 요청이 접수되었습니다</h1>
                <p style={{ fontSize: '14px', color: 'var(--gray-500)', fontWeight: 500 }}>운영자가 송금 내역을 확인하면 예약이 확정됩니다. 마이페이지에서 상태를 확인하세요.</p>
            </div>

            <div className="card" style={{ padding: '24px', marginBottom: '16px' }}>
                <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--gray-400)', marginBottom: '8px', fontWeight: 700 }}>영수증</p>
                <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '24px' }}>{decodeURIComponent(title)}</h3>

                <div className="divider" style={{ margin: '16px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '14px', color: 'var(--gray-600)', fontWeight: 600 }}>송금 금액</span>
                    <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--brand-primary)' }}>{parseInt(price, 10).toLocaleString()} 원</span>
                </div>
            </div>

            {/* Crucial Flow: Suggest creating a guest recruit post if they just rented a gym */}
            {type === 'rent' && (
                <div
                    onClick={handleRecruitFlow}
                    className="animate-slide-up"
                    style={{ background: 'var(--gray-900)', color: 'white', borderRadius: 'var(--r-md)', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', marginTop: '24px' }}
                >
                    <div style={{ background: 'var(--brand-primary)', padding: '12px', borderRadius: '50%' }}>
                        <Megaphone size={24} color="white" />
                    </div>
                    <div>
                        <h4 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '4px' }}>팀원이 더 필요하신가요?</h4>
                        <p style={{ fontSize: '13px', color: 'var(--gray-400)', lineHeight: 1.4 }}>방금 대관한 코트에서 함께 뛸 팀원을 <br />모집 글로 공유할 수 있습니다.</p>
                    </div>
                </div>
            )}

            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingBottom: '24px' }}>
                <button
                    onClick={() => navigate('/my')}
                    className="btn btn-secondary"
                    style={{ background: 'white' }}
                >
                    <CalendarCheck size={18} /> 예약 내역 확인하기
                </button>
                <button
                    onClick={() => navigate('/')}
                    className="btn btn-primary"
                    style={{ background: 'transparent', border: 'none', color: 'var(--gray-500)', boxShadow: 'none' }}
                >
                    홈으로 돌아가기
                </button>
            </div>
        </div>
    );
};
