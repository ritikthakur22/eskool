import * as SecureStore from 'expo-secure-store';

const STORAGE_KEY = 'notice_read_state_v1';

export type NoticeReadState = {
  initialized: boolean;
  readThrough: number;
  readIds: string[];
};

type ReadableNotice = { id: string; date?: string; createdAt?: string };

const timestampOf = (notice: ReadableNotice) => {
  const value = notice.createdAt || notice.date;
  const timestamp = value ? new Date(value).getTime() : 0;
  return Number.isFinite(timestamp) ? timestamp : 0;
};

export async function loadNoticeReadState(existingNotices: ReadableNotice[] = []): Promise<NoticeReadState> {
  try {
    const saved = await SecureStore.getItemAsync(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed.readIds) && Number.isFinite(parsed.readThrough)) {
        return { initialized: true, readThrough: parsed.readThrough, readIds: parsed.readIds.filter((id: unknown) => typeof id === 'string') };
      }
    }
  } catch { /* Treat unread-state storage as optional and recover cleanly. */ }

  // On first install, existing notices are historical, not newly arrived alerts.
  const latestExisting = existingNotices.reduce((latest, notice) => Math.max(latest, timestampOf(notice)), 0);
  const initial = { initialized: true, readThrough: Math.max(Date.now(), latestExisting), readIds: [] };
  await saveNoticeReadState(initial);
  return initial;
}

export function isNoticeUnread(notice: ReadableNotice, state: NoticeReadState) {
  return !state.readIds.includes(notice.id) && timestampOf(notice) > state.readThrough;
}

export function markNoticeRead(state: NoticeReadState, noticeId: string): NoticeReadState {
  return state.readIds.includes(noticeId) ? state : { ...state, readIds: [...state.readIds, noticeId] };
}

export function markAllNoticesRead(state: NoticeReadState, notices: ReadableNotice[]): NoticeReadState {
  const latestNotice = notices.reduce((latest, notice) => Math.max(latest, timestampOf(notice)), 0);
  return {
    initialized: true,
    readThrough: Math.max(Date.now(), state.readThrough, latestNotice),
    readIds: [...new Set([...state.readIds, ...notices.map(notice => notice.id)])],
  };
}

export async function saveNoticeReadState(state: NoticeReadState) {
  try { await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(state)); }
  catch { /* Notice reading remains usable even if local persistence is unavailable. */ }
}
