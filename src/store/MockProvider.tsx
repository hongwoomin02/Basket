import React, { createContext, useContext, useState, useEffect } from 'react';

type Role = 'GUEST' | 'OWNER' | 'ORGANIZER' | 'OPS';
type MockMode = 'success' | 'empty' | 'error';

export interface Application {
    id: string;
    type: 'rent' | 'pickup';
    title: string;
    date: string;
    price: number;
    /** 대관/참여 시간 (표시용, 예: 12:00 ~ 15:00) */
    startTime?: string;
    endTime?: string;
    /** 취소 수수료 퍼센트 (체육관 사장 설정, 목업 기본 10) */
    cancelFeePercent?: number;

    /** 송금 방식 (목업) */
    transferMethod?: 'KAKAO' | 'BANK';
    /** 송금 스크린샷 파일명 (목업: 실제 파일은 저장하지 않음) */
    proofFileName?: string | null;
    /** 사장님 확인/확정 상태 (목업) */
    transferStatus?: 'PENDING' | 'CONFIRMED';
}

interface MockState {
    role: Role;
    setRole: (role: Role) => void;
    mockMode: MockMode;
    setMockMode: (mode: MockMode) => void;
    applications: Application[];
    addApplication: (app: Application) => void;
    removeApplication: (id: string) => void;
    confirmApplication: (id: string) => void;
    logEvent: (eventName: string, meta?: any) => void;
    eventLogs: Array<{ ts: string; event: string; meta?: any }>;
    clearLogs: () => void;
}

const MockContext = createContext<MockState | undefined>(undefined);

export const MockProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [role, setRole] = useState<Role>('GUEST');
    const [mockMode, setMockMode] = useState<MockMode>('success');
    const [applications, setApplications] = useState<Application[]>([]);
    const [eventLogs, setEventLogs] = useState<Array<{ ts: string; event: string; meta?: any }>>([]);

    // Load state from local storage on mount
    useEffect(() => {
        try {
            const storedRole = localStorage.getItem('busocourt_role');
            if (storedRole) setRole(storedRole as Role);

            const storedMode = localStorage.getItem('busocourt_mode');
            if (storedMode) setMockMode(storedMode as MockMode);

            const storedApps = localStorage.getItem('busocourt_apps');
            if (storedApps) setApplications(JSON.parse(storedApps));

            const storedLogs = localStorage.getItem('busocourt_logs');
            if (storedLogs) setEventLogs(JSON.parse(storedLogs));
        } catch (e) {
            console.error('Failed to load local state', e);
        }
    }, []);

    // Save state to local storage on change
    useEffect(() => {
        localStorage.setItem('busocourt_role', role);
        localStorage.setItem('busocourt_mode', mockMode);
        localStorage.setItem('busocourt_apps', JSON.stringify(applications));
        localStorage.setItem('busocourt_logs', JSON.stringify(eventLogs));
    }, [role, mockMode, applications, eventLogs]);

    const addApplication = (app: Application) => {
        setApplications((prev) => [
            ...prev,
            {
                ...app,
                cancelFeePercent: app.cancelFeePercent ?? 10,
                transferStatus: app.transferStatus ?? 'PENDING',
            },
        ]);
    };

    const removeApplication = (id: string) => {
        setApplications((prev) => prev.filter((a) => a.id !== id));
    };

    const confirmApplication = (id: string) => {
        setApplications((prev) =>
            prev.map((a) => (a.id === id ? { ...a, transferStatus: 'CONFIRMED' } : a))
        );
    };

    const logEvent = (eventName: string, meta?: any) => {
        const newLog = {
            ts: new Date().toISOString(),
            event: eventName,
            meta,
        };
        console.log(`[Event] ${eventName}`, meta);
        setEventLogs((prev) => [newLog, ...prev]);
    };

    const clearLogs = () => {
        setEventLogs([]);
    };

    return (
        <MockContext.Provider
            value={{
                role,
                setRole,
                mockMode,
                setMockMode,
                applications,
                addApplication,
                removeApplication,
                confirmApplication,
                logEvent,
                eventLogs,
                clearLogs,
            }}
        >
            {children}
        </MockContext.Provider>
    );
};

export const useMock = () => {
    const context = useContext(MockContext);
    if (context === undefined) {
        throw new Error('useMock must be used within a MockProvider');
    }
    return context;
};
