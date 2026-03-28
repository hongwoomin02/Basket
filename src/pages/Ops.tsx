import React from 'react';
import { useMock } from '../store/MockProvider';

export const Ops: React.FC = () => {
    const { mockMode, setMockMode, eventLogs, clearLogs } = useMock();

    return (
        <div style={{ background: '#000', color: '#0f0', fontFamily: 'monospace', minHeight: '100vh', padding: '16px' }}>
            <h1 style={{ fontSize: '14px', borderBottom: '1px solid #0f0', paddingBottom: '8px', marginBottom: '16px' }}>BUSO_SYSTEM_TERMINAL v1.0.0 // ROOT</h1>

            <div style={{ marginBottom: '32px' }}>
                <p style={{ marginBottom: '8px' }}>&gt; SET_MOCK_ENV_MODE</p>
                <div style={{ display: 'flex', gap: '8px' }}>
                    {['success', 'empty', 'error'].map(mode => (
                        <button
                            key={mode}
                            onClick={() => setMockMode(mode as any)}
                            style={{ background: mockMode === mode ? '#0f0' : 'transparent', color: mockMode === mode ? '#000' : '#0f0', border: '1px solid #0f0', padding: '4px 12px', fontFamily: 'inherit', cursor: 'pointer' }}
                        >
                            [{mode.toUpperCase()}]
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', borderBottom: '1px solid #0f0', paddingBottom: '8px' }}>
                    <span>&gt; TAIL_SYS_LOGS</span>
                    <button onClick={clearLogs} style={{ color: '#f00', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>[CLEAR]</button>
                </div>
                {eventLogs.length === 0 ? (
                    <div style={{ opacity: 0.5 }}>No events buffered.</div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px' }}>
                        {eventLogs.map((log, i) => (
                            <div key={i}>
                                <span style={{ opacity: 0.5 }}>{new Date(log.ts).toISOString()}</span> <b>{log.event}</b> {log.meta && JSON.stringify(log.meta)}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
