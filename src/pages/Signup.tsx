import React, { useState } from 'react';
import { Header } from '../components/Header';
import { useNavigate } from 'react-router-dom';

export const Signup: React.FC = () => {
    const navigate = useNavigate();
    const [signupType, setSignupType] = useState<'USER' | 'OWNER'>('USER');

    // Business Validation
    const [bizNo, setBizNo] = useState('');
    const [isBizValid, setIsBizValid] = useState<boolean | null>(null);

    const handleBizChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value.replace(/[^0-9]/g, '');
        if (val.length > 3) val = val.slice(0, 3) + '-' + val.slice(3);
        if (val.length > 6) val = val.slice(0, 6) + '-' + val.slice(6, 11);
        setBizNo(val);
        setIsBizValid(null);
    };

    const runBizValidation = () => {
        if (bizNo.length === 12) {
            setIsBizValid(true);
        } else {
            setIsBizValid(false);
        }
    };

    return (
        <div className="animate-fade-in" style={{ minHeight: '100vh', background: 'var(--bg-page)', display: 'flex', flexDirection: 'column' }}>
            <Header title="회원가입" showBack />

            <div style={{ padding: '32px 20px', flex: 1 }}>

                <h2 style={{ fontSize: '24px', fontWeight: 900, marginBottom: '24px', letterSpacing: '-0.02em', lineHeight: 1.3 }}>
                    어떤 계정으로 계속할까요?
                </h2>

                <div style={{ display: 'flex', gap: '8px', marginBottom: '32px' }}>
                    <button
                        onClick={() => setSignupType('USER')}
                        style={{
                            flex: 1, padding: '16px', borderRadius: 'var(--r-md)', fontSize: '15px', fontWeight: 800, transition: 'all 0.1s',
                            background: signupType === 'USER' ? 'var(--brand-primary)' : 'var(--bg-surface)',
                            color: signupType === 'USER' ? 'white' : 'var(--gray-500)',
                            border: signupType === 'USER' ? '1px solid var(--brand-primary)' : '1px solid var(--border-medium)'
                        }}
                    >개인 회원</button>
                    <button
                        onClick={() => setSignupType('OWNER')}
                        style={{
                            flex: 1, padding: '16px', borderRadius: 'var(--r-md)', fontSize: '15px', fontWeight: 800, transition: 'all 0.1s',
                            background: signupType === 'OWNER' ? 'var(--brand-trust)' : 'var(--bg-surface)',
                            color: signupType === 'OWNER' ? 'white' : 'var(--gray-500)',
                            border: signupType === 'OWNER' ? '1px solid var(--brand-trust)' : '1px solid var(--border-medium)'
                        }}
                    >파트너 입점신청</button>
                </div>

                <div className="card" style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div>
                        <label className="input-label">이름 {signupType === 'OWNER' && '(대표자명)'}</label>
                        <input type="text" className="input-field" placeholder="실명을 입력하세요" />
                    </div>
                    <div>
                        <label className="input-label">이메일 주소</label>
                        <input type="email" className="input-field" placeholder="example@buso.com" />
                    </div>
                    <div>
                        <label className="input-label">비밀번호 지정</label>
                        <input type="password" className="input-field" placeholder="영문, 숫자 포함 8자리 이상" />
                    </div>

                    {signupType === 'OWNER' && (
                        <div style={{ paddingTop: '24px', borderTop: '1px solid var(--border-light)' }}>
                            <h4 style={{ fontSize: '15px', fontWeight: 900, marginBottom: '16px', color: 'var(--brand-trust)' }}>체육관 사업자 인증</h4>
                            <div>
                                <label className="input-label" style={{ color: 'var(--gray-500)' }}>10자리 사업자 등록번호</label>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <input
                                        type="text"
                                        className="input-field"
                                        placeholder="000-00-00000"
                                        value={bizNo}
                                        onChange={handleBizChange}
                                        maxLength={12}
                                        style={{ borderColor: isBizValid === true ? 'var(--status-success)' : isBizValid === false ? 'var(--status-error)' : 'var(--border-medium)' }}
                                    />
                                    <button onClick={runBizValidation} className="btn btn-trust" style={{ flexShrink: 0, padding: '0 16px' }}>조회</button>
                                </div>
                                {isBizValid === true && <p style={{ fontSize: '13px', color: 'var(--status-success)', marginTop: '8px', fontWeight: 800 }}>✓ 정상 인증 완료</p>}
                                {isBizValid === false && <p style={{ fontSize: '13px', color: 'var(--status-error)', marginTop: '8px', fontWeight: 800 }}>등록되지 않은 사업자입니다.</p>}
                            </div>
                        </div>
                    )}
                </div>

                <button
                    onClick={() => navigate('/login')}
                    className={`btn ${signupType === 'USER' ? 'btn-primary' : 'btn-trust'}`}
                    style={{ width: '100%', marginTop: '32px' }}
                    disabled={signupType === 'OWNER' && !isBizValid}
                >
                    {signupType === 'USER' ? '동의하고 가입하기' : '인증 완료 및 입점 신청'}
                </button>
            </div>
        </div>
    );
};
