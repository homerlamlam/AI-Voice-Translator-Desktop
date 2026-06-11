import type { LogEntry } from '../../types/status';

interface LogPanelProps {
  logs: LogEntry[];
}

export const LogPanel = ({ logs }: LogPanelProps) => (
  <section className="panel log-panel">
    <h2>Logs</h2>
    <div className="log-list">
      {logs.length === 0 ? (
        <p className="empty">No logs yet.</p>
      ) : (
        logs.map((log) => (
          <div className="log-row" key={log.id}>
            <span>[{log.time}]</span>
            <p>{log.message}</p>
          </div>
        ))
      )}
    </div>
  </section>
);
