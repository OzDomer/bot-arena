import AccountMenu from '../auth/AccountMenu'
import useTheme from '../../shared/hooks/useTheme'
import { streamStatus } from './streamStatus'
import type { ConnectionStatus } from './useLive'

// Fixed height. Everything that can grow (the account forms) opens in a
// popover below it.
export default function LiveHeader({ connection }: { connection: ConnectionStatus }) {
    const { theme, toggleTheme } = useTheme()
    const stream = streamStatus(connection)

    return (
        <header className="site-header">
            <h1 className="wordmark">bot<span aria-hidden="true">/</span>arena</h1>
            <div className="site-tools">
                <span className="stream-status" data-tone={stream.tone} role="status" aria-label={`Stream: ${stream.label}`}>
                    <span className="stream-dot" aria-hidden="true" />
                    <span className="stream-word">{stream.label}</span>
                </span>
                <button
                    className="btn btn-quiet theme-toggle"
                    type="button"
                    onClick={toggleTheme}
                    aria-label={theme === 'dark' ? 'Switch to the light theme' : 'Switch to the dark theme'}
                    title={theme === 'dark' ? 'Light theme' : 'Dark theme'}
                >
                    <span className="theme-icon" aria-hidden="true" />
                </button>
                <AccountMenu />
            </div>
        </header>
    )
}
