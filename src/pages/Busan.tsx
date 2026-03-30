import React from 'react';
import { Header } from '../components/Header';
import busanData from '../data/routes/busan.json';
import { useNavigate } from 'react-router-dom';
import { useMock } from '../store/MockProvider';
import { MapPin, ChevronRight } from 'lucide-react';

export const Busan: React.FC = () => {
    const { view, page } = busanData;
    const navigate = useNavigate();
    const { logEvent } = useMock();

    const handleCardClick = (to: string) => {
        logEvent('CLICK_PREVIEW_CARD', { to });
        navigate(to);
    };

    return (
        <div className="animate-fade-in" style={{ minHeight: '100vh', background: 'var(--bg-page)', paddingBottom: '80px' }}>
            <Header title={page.title} showBack />

            <div style={{ padding: '16px 20px 12px', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-light)' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--brand-primary)', marginBottom: '6px' }}>
                    부산에서 바로 찾기
                </h2>
                <p style={{ fontSize: '13px', color: 'var(--gray-500)', fontWeight: 500 }}>
                    대관 가능한 체육관을 한 화면에서 탐색해 보세요.
                </p>
            </div>

            <div style={{ padding: '16px 16px 24px' }}>
                <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--gray-400)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                            요즘 뜨는 체육관
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--gray-500)', fontWeight: 600 }}>총 {view.rentPreview.count}곳</span>
                    </div>

                    {view.rentPreview.items.map((gym) => (
                        <div
                            key={gym.gymId}
                            onClick={() => handleCardClick(view.rentPreview.to)}
                            className="card"
                            style={{ padding: '16px 18px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '10px' }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <h3 style={{ fontSize: '16px', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--gray-900)', marginBottom: '4px' }}>
                                        {gym.name}
                                    </h3>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--gray-500)' }}>
                                        <MapPin size={14} color="var(--gray-400)" />
                                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{gym.nextSlot}</span>
                                    </div>
                                </div>
                                <span
                                    className={`badge ${gym.badge === '예약가능' ? 'badge-trust' : 'badge-gray'}`}
                                    style={{ whiteSpace: 'nowrap' }}
                                >
                                    {gym.badge}
                                </span>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid var(--border-light)' }}>
                                <span style={{ fontSize: '12px', color: 'var(--gray-500)', fontWeight: 600 }}>자세히 보기</span>
                                <ChevronRight size={16} color="var(--gray-400)" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
