import React, { useState } from 'react';
import { Header } from '../components/Header';
import pickupData from '../data/routes/pickup.json';
import { useNavigate } from 'react-router-dom';
import { Calendar, Users } from 'lucide-react';

export const Pickup: React.FC = () => {
    const { view } = pickupData;
    const navigate = useNavigate();

    const [statusOpt, setStatusOpt] = useState(view.filters.status.options[0]);
    const [dayOpt, setDayOpt] = useState(view.filters.day.options[0]);

    return (
        <div className="animate-fade-in" style={{ paddingBottom: '80px', background: 'var(--bg-page)', minHeight: '100vh' }}>
            <Header title="픽업게임 참여" showBack />

            {/* Styled Filter Chips */}
            <div style={{ position: 'sticky', top: '56px', zIndex: 10, background: 'var(--bg-surface)', padding: '12px 20px', borderBottom: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)', display: 'flex', gap: '8px', overflowX: 'auto' }} className="scrollbar-hide">
                <button
                    onClick={() => setStatusOpt(statusOpt === '모집중' ? '전체' : '모집중')}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', fontSize: '13px', fontWeight: 800, whiteSpace: 'nowrap',
                        background: statusOpt === '모집중' ? 'var(--brand-primary)' : 'var(--gray-100)',
                        color: statusOpt === '모집중' ? 'white' : 'var(--gray-600)',
                        border: '1px solid', borderColor: statusOpt === '모집중' ? 'var(--brand-primary)' : 'var(--border-light)', borderRadius: '20px', transition: 'all 0.2s'
                    }}
                >
                    🔥 모집중만
                </button>

                <div style={{ width: '1px', height: '20px', background: 'var(--border-light)', margin: 'auto 4px' }} />

                {view.filters.day.options.map(opt => (
                    <button
                        key={opt}
                        onClick={() => setDayOpt(opt)}
                        style={{
                            padding: '6px 12px', fontSize: '13px', fontWeight: 700, whiteSpace: 'nowrap',
                            background: dayOpt === opt ? 'white' : 'var(--gray-50)',
                            color: dayOpt === opt ? 'var(--brand-trust)' : 'var(--gray-500)',
                            border: '1px solid', borderColor: dayOpt === opt ? 'var(--brand-trust)' : 'var(--border-light)', borderRadius: '20px', transition: 'all 0.2s'
                        }}
                    >
                        {opt}
                    </button>
                ))}
            </div>

            {/* List */}
            <div style={{ padding: '16px' }}>
                {view.list.map((game) => {
                    const isFull = game.people.current >= game.people.max;
                    return (
                        <div
                            key={game.gameId}
                            onClick={() => navigate(game.to)}
                            className="card"
                            style={{ cursor: 'pointer', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                                    <span className={`badge ${game.badge === '모집중' ? 'badge-blue' : 'badge-gray'}`}>
                                        {game.badge}
                                    </span>
                                </div>
                            </div>

                            <h3 style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.3 }}>{game.title}</h3>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'var(--gray-50)', padding: '12px', borderRadius: 'var(--r-sm)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--gray-700)', fontWeight: 600 }}>
                                    <Calendar size={16} color="var(--brand-primary)" /> {game.time}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--gray-700)' }}>
                                    <span style={{ width: '16px', textAlign: 'center' }}>@</span> {game.gymName}
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid var(--border-light)' }}>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <Users size={16} color="var(--gray-400)" />
                                    <span style={{ fontSize: '13px', fontWeight: 600, color: isFull ? 'var(--status-error)' : 'var(--text-primary)' }}>
                                        {game.people.current} / {game.people.max}명 {isFull ? '(마감)' : '참여 가능'}
                                    </span>
                                </div>
                                <span style={{ fontSize: '16px', fontWeight: 700 }}>{game.pricePerPerson.toLocaleString()} ₩</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
