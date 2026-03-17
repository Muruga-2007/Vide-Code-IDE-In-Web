export type TerminalMessageType =
  | "ready"
  | "output"
  | "exit"
  | "pong"
  | "error"
  | "input"
  | "resize"
  | "ping";

export interface TerminalMessage {
  type: TerminalMessageType;
  data?: string;        // base64 output or raw input
  session_id?: string;
  cwd?: string;
  code?: number;
  cols?: number;
  rows?: number;
  message?: string;
}
