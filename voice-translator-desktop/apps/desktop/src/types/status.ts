export type AppStatus =
  | 'idle'
  | 'recording'
  | 'transcribing'
  | 'translating'
  | 'synthesizing'
  | 'playing'
  | 'error';

export interface LogEntry {
  id: string;
  time: string;
  message: string;
}
