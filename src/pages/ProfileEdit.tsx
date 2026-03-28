import React, { useState } from 'react';
import { Header } from '../components/Header';
import { useNavigate } from 'react-router-dom';
import { ImagePlus } from 'lucide-react';

const POSITIONS = ['포인트가드', '슈팅가드', '스몰포워드', '파워포워드', '센터', '올라운더'];

export const ProfileEdit: React.FC = () => {
    const navigate = useNavigate();
    const [name, setName] = useState('홍길동');
    const [nickname, setNickname] = useState('길동이');
    const [phone, setPhone] = useState('010-1234-5678');
    const [heightCm, setHeightCm] = useState('178');
    const [position, setPosition] = useState(POSITIONS[0]);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);

    return (
        <div className="animate-fade-in" style={{ minHeight: '100vh', background: 'var(--bg-page)', paddingBottom: '40px' }}>
            <Header title="프로필 수정" showBack />

            <div style={{ padding: '24px 20px' }}>
                <div className="card" style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                        <span className="input-label">프로필 사진</span>
                        <label htmlFor="profile-photo" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', minHeight: '120px', border: '1px dashed var(--border-medium)', borderRadius: 'var(--r-md)', cursor: 'pointer', background: 'var(--gray-50)' }}>
                            {photoPreview ? (
                                <img src={photoPreview} alt="" style={{ maxHeight: '100px', borderRadius: 'var(--r-sm)' }} />
                            ) : (
                                <>
                                    <ImagePlus size={32} color="var(--gray-400)" />
                                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--gray-500)' }}>사진 추가</span>
                                </>
                            )}
                            <input
                                id="profile-photo"
                                type="file"
                                accept="image/*"
                                style={{ display: 'none' }}
                                onChange={(e) => {
                                    const f = e.target.files?.[0];
                                    if (f) setPhotoPreview(URL.createObjectURL(f));
                                }}
                            />
                        </label>
                    </div>
                    <div>
                        <label className="input-label">이름</label>
                        <input type="text" className="input-field" placeholder="실명" value={name} onChange={(e) => setName(e.target.value)} />
                    </div>
                    <div>
                        <label className="input-label">닉네임</label>
                        <input type="text" className="input-field" placeholder="앱에서 보여질 이름" value={nickname} onChange={(e) => setNickname(e.target.value)} />
                    </div>
                    <div>
                        <label className="input-label">연락처</label>
                        <input type="tel" className="input-field" placeholder="010-0000-0000" value={phone} onChange={(e) => setPhone(e.target.value)} />
                    </div>
                    <div>
                        <label className="input-label">키 (cm)</label>
                        <input type="number" className="input-field" placeholder="예: 178" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} min={120} max={230} />
                    </div>
                    <div>
                        <label className="input-label">농구 포지션</label>
                        <select className="input-field" value={position} onChange={(e) => setPosition(e.target.value)}>
                            {POSITIONS.map((p) => (
                                <option key={p} value={p}>{p}</option>
                            ))}
                        </select>
                    </div>
                    <button type="button" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }} onClick={() => navigate('/my')}>
                        저장
                    </button>
                </div>
            </div>
        </div>
    );
}
