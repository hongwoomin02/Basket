import React from 'react';
import { Header } from '../components/Header';
import pickupDetailData from '../data/routes/pickupDetail.json';
import { useNavigate, useParams } from 'react-router-dom';
import { useMock } from '../store/MockProvider';

export const PickupDetail: React.FC = () => {
    const { gameId } = useParams();
    const { view, page } = pickupDetailData;
    const navigate = useNavigate();
    const { logEvent } = useMock();

    const handleCheckout = () => {
        logEvent('GO_CHECKOUT_PICKUP', { gameId: view.game.gameId });
        const q = new URLSearchParams({
            type: 'pickup',
            refId: view.game.gameId,
            price: String(view.game.pricePerPerson),
            title: view.game.title,
            pickupStart: view.game.time.start,
            pickupEnd: view.game.time.end,
        });
        navigate(`/checkout?${q.toString()}`);
    };

    const seatsLeft = view.game.people.max - view.game.people.current;
    const isAvailable = view.game.status === '모집중' && seatsLeft > 0;

    return (
        <div className="animate-fade-in" style={{ paddingBottom: '120px', background: 'var(--bg-page)', minHeight: '100vh' }}>
            <Header title={page.title} showBack />

            {/* Stark Hero Info */}
            <div style={{ padding: 'var(--sp-8) var(--sp-4) var(--sp-6)', borderBottom: '1px solid var(--border-light)' }}>
                <span className="badge badge-black" style={{ marginBottom: 'var(--sp-4)' }}>{view.game.status}</span>
                <h2 style={{ fontSize: '28px', fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--black)', lineHeight: 1.2, marginBottom: 'var(--sp-6)' }}>
                    {view.game.title}
                </h2>

                <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '16px 24px', fontSize: '14px', alignItems: 'flex-start' }}>
                    <span style={{ fontWeight: 600, color: 'var(--gray-900)' }}>Location</span>
                    <div style={{ color: 'var(--gray-500)' }}>
                        <p style={{ color: 'var(--black)', marginBottom: '2px' }}>{view.game.gym.name}</p>
                        <p>{view.game.gym.address}</p>
                    </div>

                    <span style={{ fontWeight: 600, color: 'var(--gray-900)' }}>Time</span>
                    <p style={{ color: 'var(--black)' }}>{view.game.time.start} &mdash; {view.game.time.end}</p>
                </div>
            </div>

            {/* Roster & Stats minimal frame */}
            <div style={{ padding: 'var(--sp-6) var(--sp-4)', borderBottom: '1px solid var(--border-light)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, textTransform: 'uppercase' }}>Roster</span>
                    <span style={{ fontSize: '13px', color: 'var(--gray-500)' }}>{view.game.people.current} / {view.game.people.max} filled</span>
                </div>

                {/* Thin minimal progress line */}
                <div style={{ height: '2px', background: 'var(--border-light)', width: '100%', marginBottom: 'var(--sp-6)' }}>
                    <div style={{ height: '100%', background: 'var(--black)', width: `${(view.game.people.current / view.game.people.max) * 100}%` }} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid var(--border-light)' }}>
                    <span style={{ fontSize: '14px', color: 'var(--gray-500)' }}>Price per slot</span>
                    <span style={{ fontSize: '24px', fontWeight: 600, color: 'var(--black)', letterSpacing: '-0.02em' }}>
                        {view.game.pricePerPerson.toLocaleString()} ₩
                    </span>
                </div>
            </div>

            {/* Note Section */}
            <div style={{ padding: 'var(--sp-6) var(--sp-4)' }}>
                <h4 style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)', marginBottom: '12px' }}>Guidelines</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {view.game.notes.map((note, idx) => (
                        <p key={idx} style={{ fontSize: '14px', color: 'var(--gray-600)', lineHeight: 1.5 }}>
                            {idx + 1}. {note}
                        </p>
                    ))}
                </div>
            </div>

            {/* Floating Action */}
            <div className="floating-bar">
                <button
                    onClick={handleCheckout}
                    disabled={!isAvailable}
                    className="btn btn-primary"
                    style={{ width: '100%', borderRadius: '0', height: '48px', fontSize: '15px' }}
                >
                    {isAvailable ? 'Join Game' : 'Full / Closed'}
                </button>
            </div>
        </div>
    );
};
