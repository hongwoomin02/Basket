import React, { useState } from 'react';
import { Header } from '../components/Header';
import { useNavigate } from 'react-router-dom';
import { useMock } from '../store/MockProvider';

export const Login: React.FC = () => {
    const navigate = useNavigate();
    const { setRole } = useMock();
    const [loginType, setLoginType] = useState<'USER' | 'OWNER'>('USER');

    const handleLogin = () => {
        setRole(loginType === 'USER' ? 'GUEST' : 'OWNER');
        navigate(loginType === 'USER' ? '/' : '/owner');
    };

    return (
        <div className="animate-fade-in" style={{ minHeight: '100vh', background: 'var(--bg-page)', display: 'flex', flexDirection: 'column' }}>
            <Header title="로그인" showBack />

            <div style={{ padding: '32px 20px', flex: 1 }}>
                <h2 style={{ fontSize: '28px', fontWeight: 900, marginBottom: '32px', lineHeight: 1.3, letterSpacing: '-0.02em' }}>
                    프리미엄 코트의 완성,<br />BusoCourt에 오신 것을 <br />환영합니다.
                </h2>

                <div style={{ display: 'flex', gap: '8px', marginBottom: '32px' }}>
                    <button
                        onClick={() => setLoginType('USER')}
                        style={{
                            flex: 1, padding: '16px', borderRadius: 'var(--r-md)', fontSize: '15px', fontWeight: 800, transition: 'all 0.1s',
                            background: loginType === 'USER' ? 'var(--brand-primary)' : 'var(--bg-surface)',
                            color: loginType === 'USER' ? 'white' : 'var(--gray-500)',
                            border: loginType === 'USER' ? '1px solid var(--brand-primary)' : '1px solid var(--border-medium)'
                        }}
                    >개인 회원</button>
                    <button
                        onClick={() => setLoginType('OWNER')}
                        style={{
                            flex: 1, padding: '16px', borderRadius: 'var(--r-md)', fontSize: '15px', fontWeight: 800, transition: 'all 0.1s',
                            background: loginType === 'OWNER' ? 'var(--brand-trust)' : 'var(--bg-surface)',
                            color: loginType === 'OWNER' ? 'white' : 'var(--gray-500)',
                            border: loginType === 'OWNER' ? '1px solid var(--brand-trust)' : '1px solid var(--border-medium)'
                        }}
                    >체육관 파트너</button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                        <label className="input-label">이메일 계정</label>
                        <input type="email" className="input-field" placeholder="example@buso.com" />
                    </div>
                    <div>
                        <label className="input-label">비밀번호</label>
                        <input type="password" className="input-field" placeholder="당신의 비밀번호" />
                    </div>

                    <button onClick={handleLogin} className={`btn ${loginType === 'USER' ? 'btn-primary' : 'btn-trust'}`} style={{ width: '100%', marginTop: '16px' }}>
                        로그인
                    </button>
                </div>

                <div className="divider" style={{ margin: '32px 0' }} />

                <div style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: '14px', color: 'var(--gray-500)', fontWeight: 600 }}>아직 계정이 없으신가요? </span>
                    <button onClick={() => navigate('/signup')} style={{ fontSize: '14px', fontWeight: 800, color: 'var(--brand-trust)', marginLeft: '4px' }}>초간편 회원가입</button>
                </div>
            </div>
        </div>
    );
};
