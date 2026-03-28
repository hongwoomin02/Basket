import React, { useEffect, useState } from 'react';
import { Header } from '../components/Header';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Plus } from 'lucide-react';

const STORAGE_KEY = 'busocourt_saved_cards';

export type SavedCard = { id: string; brand: string; last4: string; isDefault: boolean };

function loadCards(): SavedCard[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return JSON.parse(raw);
    } catch { /* ignore */ }
    return [{ id: 'c1', brand: '신한', last4: '1234', isDefault: true }];
}

function saveCards(cards: SavedCard[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
}

export const CardPayment: React.FC = () => {
    const navigate = useNavigate();
    const [cards, setCards] = useState<SavedCard[]>(loadCards);
    const [cardNumber, setCardNumber] = useState('');
    const [expiry, setExpiry] = useState('');
    const [cvc, setCvc] = useState('');

    useEffect(() => {
        saveCards(cards);
    }, [cards]);

    const digitsOnly = (s: string) => s.replace(/\D/g, '');

    const handleDelete = (id: string) => {
        setCards((prev) => {
            const next = prev.filter((c) => c.id !== id);
            if (next.length && !next.some((c) => c.isDefault)) {
                next[0] = { ...next[0], isDefault: true };
            }
            return next;
        });
    };

    const handleSetDefault = (id: string) => {
        setCards((prev) => prev.map((c) => ({ ...c, isDefault: c.id === id })));
    };

    const handleRegister = () => {
        const num = digitsOnly(cardNumber);
        if (num.length < 14) return;
        const last4 = num.slice(-4);
        const id = `c_${Date.now()}`;
        setCards((prev) => {
            const hasDefault = prev.some((c) => c.isDefault);
            const next: SavedCard[] = [...prev, { id, brand: '등록카드', last4, isDefault: !hasDefault }];
            if (!hasDefault && next.length) next[next.length - 1] = { ...next[next.length - 1], isDefault: true };
            return next;
        });
        setCardNumber('');
        setExpiry('');
        setCvc('');
    };

    return (
        <div className="animate-fade-in" style={{ minHeight: '100vh', background: 'var(--bg-page)', paddingBottom: '40px' }}>
            <Header title="카드 등록 / 결제 정보" showBack />

            <div style={{ padding: '24px 20px' }}>
                <p style={{ fontSize: '13px', color: 'var(--gray-500)', marginBottom: '16px', fontWeight: 500 }}>결제 수단 등록 및 관리 · [기본] 카드로 결제됩니다.</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {cards.map((c) => (
                        <div key={c.id} className="card" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <CreditCard size={24} color="var(--gray-500)" />
                                <div style={{ flex: 1 }}>
                                    <span style={{ fontSize: '15px', fontWeight: 800 }}>{c.brand} •••• {c.last4}</span>
                                    {c.isDefault && (
                                        <span className="badge badge-black" style={{ marginLeft: '8px', fontSize: '10px' }}>기본</span>
                                    )}
                                </div>
                                <button type="button" onClick={() => handleDelete(c.id)} style={{ fontSize: '12px', fontWeight: 700, color: 'var(--status-error)' }}>삭제</button>
                            </div>
                            {!c.isDefault && (
                                <button type="button" className="btn btn-secondary" style={{ height: '40px', fontSize: '13px' }} onClick={() => handleSetDefault(c.id)}>
                                    기본 결제 카드로 설정
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                <div className="card" style={{ marginTop: '24px', padding: '20px' }}>
                    <h4 style={{ fontSize: '13px', fontWeight: 800, marginBottom: '12px' }}>새 카드 등록</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div>
                            <label className="input-label">카드 번호</label>
                            <input type="text" className="input-field" placeholder="0000-0000-0000-0000" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} maxLength={19} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div>
                                <label className="input-label">유효기간</label>
                                <input type="text" className="input-field" placeholder="MM/YY" value={expiry} onChange={(e) => setExpiry(e.target.value)} />
                            </div>
                            <div>
                                <label className="input-label">CVC</label>
                                <input type="text" className="input-field" placeholder="000" value={cvc} onChange={(e) => setCvc(e.target.value)} maxLength={4} />
                            </div>
                        </div>
                        <button type="button" className="btn btn-trust" style={{ width: '100%' }} onClick={handleRegister}>
                            등록
                        </button>
                    </div>
                </div>

                <button type="button" className="btn btn-secondary" style={{ width: '100%', marginTop: '16px' }} onClick={() => navigate('/my')}>
                    마이로 돌아가기
                </button>
            </div>
        </div>
    );
}
