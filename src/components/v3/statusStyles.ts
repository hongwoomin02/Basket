/** FRONT_PROMPT_V3 상태 배지 색상 */
export const slotStatusClass: Record<string, string> = {
    available: 'v3-badge v3-badge--avail',
    class: 'v3-badge v3-badge--class',
    regular: 'v3-badge v3-badge--regular',
    closed: 'v3-badge v3-badge--closed',
};

export const reservationStatusClass: Record<string, string> = {
    신청됨: 'v3-badge v3-badge--neutral',
    '송금 대기': 'v3-badge v3-badge--warn',
    '송금 완료': 'v3-badge v3-badge--info',
    '확인 완료': 'v3-badge v3-badge--purple',
    '예약 확정': 'v3-badge v3-badge--ok',
    취소: 'v3-badge v3-badge--danger',
};
