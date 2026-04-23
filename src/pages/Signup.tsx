import React, { useState } from 'react';
import { Header } from '../components/Header';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { authApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export const Signup: React.FC = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [searchParams] = useSearchParams();

    // ?as=OWNER 로 진입하면 기본 탭을 파트너 입점 신청으로 설정
    const initialType = (searchParams.get('as')?.toUpperCase() === 'OWNER' ? 'OWNER' : 'USER') as 'USER' | 'OWNER';
    const [signupType, setSignupType] = useState<'USER' | 'OWNER'>(initialType);

    const [displayName, setDisplayName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const [bizNo, setBizNo] = useState('');
    const [isBizValid, setIsBizValid] = useState<boolean | null>(null);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const handleBizChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value.replace(/[^0-9]/g, '');
        if (val.length > 3) val = val.slice(0, 3) + '-' + val.slice(3);
        if (val.length > 6) val = val.slice(0, 6) + '-' + val.slice(6, 11);
        setBizNo(val);
        setIsBizValid(null);
    };

    const runBizValidation = () => {
        setIsBizValid(bizNo.length === 12);
    };

    const validate = (): string | null => {
        if (!displayName.trim()) return '이름을 입력해주세요.';
        if (!email.trim()) return '이메일을 입력해주세요.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return '올바른 이메일 형식이 아닙니다.';
        if (password.length < 8) return '비밀번호는 8자 이상이어야 합니다.';
        if (signupType === 'OWNER' && !isBizValid) return '사업자 번호 인증이 필요합니다.';
        return null;
    };

    const handleSubmit = async () => {
        setErrorMsg(null);
        const validationError = validate();
        if (validationError) {
            setErrorMsg(validationError);
            return;
        }

        setIsSubmitting(true);
        try {
            await authApi.signup({
                email,
                password,
                display_name: displayName,
                role: signupType, // "USER" | "OWNER"
            });
            // 백엔드는 signup에서 토큰을 주지 않으므로 곧장 login을 이어 호출한다.
            await login(email, password);
            // OWNER 가입은 곧장 파트너 콘솔로, USER는 홈으로
            navigate(signupType === 'OWNER' ? '/owner' : '/', { replace: true });
        } catch (err) {
            if (axios.isAxiosError(err)) {
                const status = err.response?.status;
                const detail = err.response?.data?.detail ?? err.response?.data?.error;
                if (status === 409) {
                    setErrorMsg('이미 사용 중인 이메일입니다.');
                } else if (status === 422) {
                    setErrorMsg('입력값을 다시 확인해주세요.');
                } else if (typeof detail?.message === 'string') {
                    setErrorMsg(detail.message);
                } else {
                    setErrorMsg('회원가입에 실패했습니다. 잠시 후 다시 시도해주세요.');
                }
            } else {
                setErrorMsg('네트워크 오류가 발생했습니다.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const submitDisabled =
        isSubmitting || (signupType === 'OWNER' && !isBizValid);

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

                {signupType === 'OWNER' && (
                    <div style={{ marginBottom: '16px', padding: '12px 14px', borderRadius: 'var(--r-md)', background: 'var(--bg-surface)', border: '1px solid var(--border-light)', fontSize: '13px', color: 'var(--gray-500)', lineHeight: 1.5 }}>
                        파트너 입점은 사업자 인증 후 운영진 검토를 거쳐 승인됩니다. 일단 계정이 먼저 생성되고, 승인 완료 시 체육관 운영자 권한이 부여됩니다.
                    </div>
                )}

                <div className="card" style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div>
                        <label className="input-label">이름 {signupType === 'OWNER' && '(대표자명)'}</label>
                        <input
                            type="text"
                            className="input-field"
                            placeholder="실명을 입력하세요"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            autoComplete="name"
                        />
                    </div>
                    <div>
                        <label className="input-label">이메일 주소</label>
                        <input
                            type="email"
                            className="input-field"
                            placeholder="example@buso.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            autoComplete="email"
                        />
                    </div>
                    <div>
                        <label className="input-label">비밀번호 지정</label>
                        <input
                            type="password"
                            className="input-field"
                            placeholder="영문, 숫자 포함 8자리 이상"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !submitDisabled) handleSubmit();
                            }}
                            autoComplete="new-password"
                        />
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

                {errorMsg && (
                    <p style={{ marginTop: '16px', color: 'var(--status-error, #d33)', fontSize: '14px', fontWeight: 700 }}>
                        {errorMsg}
                    </p>
                )}

                <button
                    onClick={handleSubmit}
                    className={`btn ${signupType === 'USER' ? 'btn-primary' : 'btn-trust'}`}
                    style={{ width: '100%', marginTop: '32px', opacity: submitDisabled ? 0.6 : 1 }}
                    disabled={submitDisabled}
                >
                    {isSubmitting
                        ? '처리 중...'
                        : signupType === 'USER'
                            ? '동의하고 가입하기'
                            : '인증 완료 및 입점 신청'}
                </button>

                <div style={{ textAlign: 'center', marginTop: '24px' }}>
                    <span style={{ fontSize: '14px', color: 'var(--gray-500)', fontWeight: 600 }}>이미 계정이 있으신가요? </span>
                    <button onClick={() => navigate('/login')} style={{ fontSize: '14px', fontWeight: 800, color: 'var(--brand-trust)', marginLeft: '4px' }}>로그인</button>
                </div>
            </div>
        </div>
    );
};
