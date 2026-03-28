import React, { useState } from 'react';
import { Header } from '../components/Header';
import busanData from '../data/routes/busan.json';
import { useNavigate } from 'react-router-dom';
import { useMock } from '../store/MockProvider';
import { MapPin, Users, Clock, ChevronRight } from 'lucide-react';

export const Busan: React.FC = () => {
    const { view, page } = busanData;
    const navigate = useNavigate();
    const { logEvent } = useMock();
    const [activeTab, setActiveTab] = useState(view.tabs[0].id);

    const handleTabSwitch = (tabId: string) => {
        logEvent('SWITCH_TAB_BUSAN', { tabId });
        setActiveTab(tabId);
    };

    const handleCardClick = (to: string) => {
        logEvent('CLICK_PREVIEW_CARD', { to });
        navigate(to);
    };

    return (
        <div className="animate-fade-in" style={{ minHeight: '100vh', background: 'var(--bg-page)', paddingBottom: '80px' }}>
            <Header title={page.title} showBack />

            {/* Top intro section */}
            <div style={{ padding: '16px 20px 12px', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-light)' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--brand-primary)', marginBottom: '6px' }}>
                    부산에서 바로 찾기
                </h2>
                <p style={{ fontSize: '13px', color: 'var(--gray-500)', fontWeight: 500 }}>
                    대관과 픽업을 한 화면에서 탐색해 보세요.
                </p>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-light)' }}>
                {view.tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => handleTabSwitch(tab.id)}
                            style={{
                                flex: 1,
                                padding: '12px 0',
                                fontSize: '13px',
                                fontWeight: 800,
                                border: 'none',
                                cursor: 'pointer',
                                color: isActive ? 'var(--brand-primary)' : 'var(--gray-400)',
                                borderBottom: isActive ? '2px solid var(--brand-primary)' : '2px solid transparent',
                                background: 'transparent',
                                letterSpacing: '0.04em',
                                textTransform: 'uppercase',
                            }}
                        >
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Content */}
            <div style={{ padding: '16px 16px 24px' }}>
                {activeTab === 'TAB_RENT' && (
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
                )}

                {activeTab === 'TAB_PICKUP' && (
                    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                            <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--gray-400)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                                마감 임박 픽업
                            </span>
                            <span style={{ fontSize: '11px', color: 'var(--gray-500)', fontWeight: 600 }}>총 {view.pickupPreview.count}건</span>
                        </div>

                        {view.pickupPreview.items.map((game) => (
                            <div
                                key={game.gameId}
                                onClick={() => handleCardClick(view.pickupPreview.to)}
                                className="card"
                                style={{ padding: '16px 18px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '10px' }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <h3 style={{ fontSize: '16px', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--gray-900)', marginBottom: '6px' }}>
                                            {game.title}
                                        </h3>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px', color: 'var(--gray-600)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <Clock size={14} color="var(--brand-primary)" />
                                                <span>{game.time}</span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <Users size={14} color="var(--status-warn)" />
                                                <span>{game.people}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <span
                                        className={`badge ${game.badge === '모집중' ? 'badge-trust' : 'badge-gray'}`}
                                        style={{ whiteSpace: 'nowrap' }}
                                    >
                                        {game.badge}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
