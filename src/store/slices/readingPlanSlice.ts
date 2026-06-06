import type { StateCreator } from 'zustand';
import type { EntryStore, ReadingPlanItem, Entry } from '../../types';

export const createReadingPlanSlice: StateCreator<
  EntryStore,
  [],
  [],
  {
    readingPlan: ReadingPlanItem[];
    lastAddedCount: number;
    addToPlan: (entryId: string) => void;
    removeFromPlan: (entryId: string) => void;
    movePlanItem: (entryId: string, direction: 'up' | 'down') => void;
    markPlanDone: (entryId: string) => void;
    markPlanSkipped: (entryId: string) => void;
    clearPlanCompleted: () => void;
    getTodayPlanCount: () => number;
    batchAddFilteredToPlan: () => void;
  }
> = (set, get) => ({
  readingPlan: [],
  lastAddedCount: 0,

  addToPlan: (entryId: string) => {
    const { readingPlan } = get();
    if (readingPlan.some((item) => item.entryId === entryId)) return;
    const maxOrder = readingPlan.length > 0
      ? Math.max(...readingPlan.map((item) => item.order))
      : 0;
    const newItem: ReadingPlanItem = {
      entryId,
      addedAt: Date.now(),
      order: maxOrder + 1,
      status: 'planned',
    };
    set({ readingPlan: [...readingPlan, newItem] });
  },

  removeFromPlan: (entryId: string) => {
    set((state) => ({
      readingPlan: state.readingPlan
        .filter((item) => item.entryId !== entryId)
        .map((item, idx) => ({ ...item, order: idx + 1 })),
    }));
  },

  movePlanItem: (entryId: string, direction: 'up' | 'down') => {
    const { readingPlan } = get();
    const sorted = [...readingPlan].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex((item) => item.entryId === entryId);
    if (idx === -1) return;
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === sorted.length - 1) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    const temp = sorted[idx];
    sorted[idx] = sorted[swapIdx];
    sorted[swapIdx] = temp;
    set({
      readingPlan: sorted.map((item, i) => ({ ...item, order: i + 1 })),
    });
  },

  markPlanDone: (entryId: string) => {
    set((state) => ({
      readingPlan: state.readingPlan.map((item) =>
        item.entryId === entryId
          ? { ...item, status: 'done' as const }
          : item
      ),
    }));
    const { entries } = get();
    const entry = entries.find((e) => e.id === entryId);
    if (entry && (entry.readStatus === '未读' || entry.readStatus === '在读')) {
      set((state) => ({
        entries: state.entries.map((e) =>
          e.id === entryId
            ? { ...e, readStatus: '已读' as const, updatedAt: Date.now() }
            : e
        ),
      }));
    }
  },

  markPlanSkipped: (entryId: string) => {
    set((state) => ({
      readingPlan: state.readingPlan.map((item) =>
        item.entryId === entryId
          ? { ...item, status: 'skipped' as const }
          : item
      ),
    }));
  },

  clearPlanCompleted: () => {
    set((state) => ({
      readingPlan: state.readingPlan
        .filter((item) => item.status === 'planned')
        .map((item, idx) => ({ ...item, order: idx + 1 })),
    }));
  },

  getTodayPlanCount: () => {
    const { readingPlan, entries } = get();
    const entryIds = new Set(entries.map((e) => e.id));
    return readingPlan.filter(
      (item) => item.status === 'planned' && entryIds.has(item.entryId)
    ).length;
  },

  batchAddFilteredToPlan: () => {
    const { readingPlan, getFilteredEntries, sortEntries } = get();
    const filtered = getFilteredEntries();
    const sorted = sortEntries(filtered);
    const planIdSet = new Set(readingPlan.map((item) => item.entryId));
    const candidates = sorted.filter(
      (e) => (e.readStatus === '未读' || e.readStatus === '在读') && !planIdSet.has(e.id)
    );
    if (candidates.length === 0) {
      set({ lastAddedCount: 0, isReadingPlanOpen: true });
      return;
    }
    const maxOrder = readingPlan.length > 0
      ? Math.max(...readingPlan.map((item) => item.order))
      : 0;
    const newItems: ReadingPlanItem[] = candidates.map((entry, idx) => ({
      entryId: entry.id,
      addedAt: Date.now(),
      order: maxOrder + idx + 1,
      status: 'planned',
    }));
    set({
      readingPlan: [...readingPlan, ...newItems],
      lastAddedCount: candidates.length,
      isReadingPlanOpen: true,
    });
  },
});
