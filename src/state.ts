import { homedir } from "node:os";
import { join, dirname } from "node:path";
import { mkdirSync, readFileSync, writeFileSync, renameSync } from "node:fs";

export const STATE_DIR =
  process.env.IMESSAGE_STATE_DIR ?? join(homedir(), ".imessage-mcp");
const STATE_FILE = join(STATE_DIR, "state.json");

export type State = {
  /** Highest message ROWID already handed to a client. */
  cursor: number;
  /** ISO time the cursor last moved. */
  updatedAt: string | null;
};

const EMPTY: State = { cursor: 0, updatedAt: null };

/**
 * The cursor lives on disk, not in memory. This is the whole difference
 * between an intercom and an inbox: messages that arrive while nothing is
 * running are still waiting the next time a client asks, instead of being
 * skipped by a fresh MAX(ROWID) at boot.
 */
export function loadState(): State {
  try {
    const raw = JSON.parse(readFileSync(STATE_FILE, "utf8")) as Partial<State>;
    return {
      cursor: typeof raw.cursor === "number" && raw.cursor >= 0 ? raw.cursor : 0,
      updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : null,
    };
  } catch {
    return { ...EMPTY };
  }
}

export function saveState(s: State): void {
  mkdirSync(dirname(STATE_FILE), { recursive: true });
  // Write then rename, so a crash mid-write cannot leave a truncated cursor
  // that would silently replay or skip messages.
  const tmp = `${STATE_FILE}.tmp`;
  writeFileSync(tmp, JSON.stringify(s, null, 2));
  renameSync(tmp, STATE_FILE);
}

export function advanceCursor(to: number): void {
  const s = loadState();
  if (to <= s.cursor) return;
  saveState({ cursor: to, updatedAt: new Date().toISOString() });
}
