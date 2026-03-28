import React, { useState } from 'react';
import { Header } from '../components/Header';
import { AppLayout } from '../components/AppLayout';
import { Calendar, Users, MapPin, CheckCircle } from 'lucide-react';

export const Organizer: React.FC = () => {
    const [title, setTitle] = useState('');
    const [price, setPrice] = useState('15000');

    return (
        <div className="animate-fade-in" style={{ paddingBottom: '80px', background: 'var(--bg-page)', minHeight: '100vh' }}>
            <Header title="주최자 콘솔" showBack />

            <div style={{ padding: '32px 20px', background: 'var(--brand-primary)', color: 'white' }}>
                <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--gray-400)', marginBottom: '8px', fontWeight: 800 }}>주최자 대시보드</p>
                <h2 style={{ fontSize: '26px', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: '8px' }}>Buso 멤버십</h2>
                <p style={{ fontSize: '13px', color: 'var(--gray-300)', fontWeight: 600 }}>Level 4 (픽업 모집 권한)</p>
            </div>

            <div style={{ padding: '24px 20px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 900, marginBottom: '20px', color: 'var(--gray-900)' }}>신규 픽업 모집 생성</h3>
                <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '24px 20px' }}>
                    <div>
                        <label className="input-label">모집 방 제목 (어젠다)</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="예: 금요일 야간 즐농 멤버 구합니다"
                            className="input-field"
                        />
                    </div>
                    <div>
                        <label className="input-label">1인당 참가비 (원)</label>
                        <input
                            type="number"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            className="input-field"
                        />
                    </div>
                    <button className="btn btn-energy" style={{ width: '100%', marginTop: '8px' }}>픽업 모집방 개설하기</button>
                </div>
            </div>

            <div style={{ padding: '8px 20px 32px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 900, marginBottom: '16px', color: 'var(--gray-900)' }}>진행 중인 모집 관리</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

                    <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--gray-900)' }}>금요일 야간 자체 경기</span>
                            <span className="badge badge-error">모집중</span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: 'var(--gray-50)', padding: '12px', borderRadius: 'var(--r-sm)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--gray-600)', fontWeight: 600 }}>
                                <Calendar size={14} color="var(--brand-energy)" /> 2026.04.18 • 20:00 - 22:00
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--gray-600)', fontWeight: 600 }}>
                                <Users size={14} color="var(--brand-trust)" /> 확정 인원: 12명
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
