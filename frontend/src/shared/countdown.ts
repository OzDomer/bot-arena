export function formatCountdown(ms: number): string {
    if (ms == null || ms === 0 || Number.isNaN(ms)) {
        return '0:00'
    }
    const totalSec = Math.ceil(ms / 1000)
    if (totalSec <= 0) {
        return '0:00'
    }
    const min = Math.floor(totalSec / 60)
    const sec = totalSec % 60
    return `${min}:${sec < 10 ? '0' : ''}${sec}`
}
