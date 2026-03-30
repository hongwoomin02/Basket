import { useState, useEffect, useCallback } from 'react';

export type MockScreenMode = 'success' | 'empty' | 'error';

interface MockMeta {
    /** JSON에서 string으로 올 수 있음 */
    __mock?: { mode?: MockScreenMode | string; latencyMs?: number };
}

/** FRONT_PROMPT_V3: latencyMs 동안 로딩, mode에 따라 empty/error UI */
export function useMockPageLoad<T extends MockMeta>(
    staticData: T,
    opts?: { emptyCheck?: (d: T) => boolean }
) {
    const [loading, setLoading] = useState(true);
    const [retryKey, setRetryKey] = useState(0);
    const mode = staticData.__mock?.mode ?? 'success';
    const latency = staticData.__mock?.latencyMs ?? 300;

    useEffect(() => {
        setLoading(true);
        const t = window.setTimeout(() => setLoading(false), latency);
        return () => window.clearTimeout(t);
    }, [latency, retryKey, staticData]);

    const reload = useCallback(() => setRetryKey((k) => k + 1), []);

    const isEmpty = mode === 'empty' || (opts?.emptyCheck?.(staticData) ?? false);
    const isError = mode === 'error';

    return { loading, mode, isEmpty, isError, reload };
}
