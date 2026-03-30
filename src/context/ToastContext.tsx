import React, { createContext, useCallback, useContext, useState } from 'react';

type ToastContextValue = {
    showToast: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [message, setMessage] = useState<string | null>(null);

    const showToast = useCallback((msg: string) => {
        setMessage(msg);
        window.setTimeout(() => setMessage(null), 2400);
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {message && (
                <div
                    className="bc-toast"
                    role="status"
                >
                    {message}
                </div>
            )}
        </ToastContext.Provider>
    );
};

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast needs ToastProvider');
    return ctx;
}
