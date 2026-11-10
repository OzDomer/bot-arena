import type { User } from '../../shared/api'

type Status = 'loading' | 'anonymous' | 'authenticated'

// The text on the header's account button.
export function accountLabel(status: Status, user: User | null): string {
    if (status === 'authenticated' && user) return user.name
    if (status === 'anonymous') return 'Log in'
    return 'Account'
}

export function creditsLabel(credits: number): string {
    return `${credits.toLocaleString('en-US')} cr`
}
