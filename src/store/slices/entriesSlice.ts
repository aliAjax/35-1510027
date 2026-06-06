import type { StateCreator } from 'zustand';
import type { Entry, EntryStore, CustomTag, ReadStatus } from '../../types';
import { generateId } from './utils';

export const createEntriesSlice: StateCreator<
  EntryStore,
  [],
  [],
  {
    entries: Entry[];
    customTags: CustomTag[];
    addEntry: (entry: Omit<Entry, 'id' | 'createdAt' | 'updatedAt'>) => void;
    updateEntry: (id: string, updates: Partial<Entry>) => void;
    deleteEntry: (id: string) => void;
    toggleFavorite: (id: string) => void;
    updateReadStatus: (id: string, readStatus: ReadStatus) => void;
    addCustomTag: (name: string, color: string) => void;
    updateCustomTag: (id: string, updates: Partial<CustomTag>) => void;
    deleteCustomTag: (id: string) => void;
    getEntriesWithTag: (tagId: string) => Entry[];
    getUniqueCpNames: () => string[];
    getUniqueWorkNames: () => string[];
    getUniqueAuthors: () => string[];
    getStats: () => {
      total: number;
      favorites: number;
      unread: number;
      read: number;
      todayPlan: number;
    };
    clearAllData: () => void;
    checkForDuplicates: (entryData: { workName: string; cpName: string; link: string; author: string }) => {
      entry: Entry;
      matchReasons: string[];
      matchScore: number;
    }[];
    batchUpdateNotes: (entryIds: string[], notes: string) => void;
    batchClearEmptyLinks: (entryIds: string[]) => void;
  }
> = (set, get) => ({
  entries: [],
  customTags: [],

  addEntry: (entryData) => {
    const now = Date.now();
    const newEntry: Entry = {
      ...entryData,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };
    set((state) => ({
      entries: [newEntry, ...state.entries],
    }));
  },

  updateEntry: (id, updates) => {
    set((state) => ({
      entries: state.entries.map((entry) =>
        entry.id === id
          ? { ...entry, ...updates, updatedAt: Date.now() }
          : entry
      ),
    }));
  },

  deleteEntry: (id) => {
    set((state) => ({
      entries: state.entries.filter((entry) => entry.id !== id),
      readingPlan: state.readingPlan
        .filter((item) => item.entryId !== id)
        .map((item, idx) => ({ ...item, order: idx + 1 })),
    }));
  },

  toggleFavorite: (id) => {
    set((state) => ({
      entries: state.entries.map((entry) =>
        entry.id === id
          ? { ...entry, favorite: !entry.favorite, updatedAt: Date.now() }
          : entry
      ),
    }));
  },

  updateReadStatus: (id: string, readStatus: ReadStatus) => {
    set((state) => ({
      entries: state.entries.map((entry) =>
        entry.id === id
          ? { ...entry, readStatus, updatedAt: Date.now() }
          : entry
      ),
    }));
  },

  addCustomTag: (name, color) => {
    const newTag: CustomTag = {
      id: generateId(),
      name,
      color,
      createdAt: Date.now(),
    };
    set((state) => ({
      customTags: [...state.customTags, newTag],
    }));
  },

  updateCustomTag: (id, updates) => {
    set((state) => ({
      customTags: state.customTags.map((tag) =>
        tag.id === id ? { ...tag, ...updates } : tag
      ),
    }));
  },

  deleteCustomTag: (id) => {
    set((state) => ({
      customTags: state.customTags.filter((tag) => tag.id !== id),
      entries: state.entries.map((entry) => ({
        ...entry,
        customTags: entry.customTags.filter((tagId) => tagId !== id),
      })),
      filters: {
        ...state.filters,
        customTags: state.filters.customTags.filter((tagId) => tagId !== id),
      },
    }));
  },

  getEntriesWithTag: (tagId) => {
    const { entries } = get();
    return entries.filter((entry) => (entry.customTags || []).includes(tagId));
  },

  getUniqueCpNames: () => {
    const { entries } = get();
    const cpSet = new Set(entries.map((e) => e.cpName).filter(Boolean));
    return Array.from(cpSet).sort();
  },

  getUniqueWorkNames: () => {
    const { entries } = get();
    const workSet = new Set(entries.map((e) => e.workName).filter(Boolean));
    return Array.from(workSet).sort();
  },

  getUniqueAuthors: () => {
    const { entries } = get();
    const authorSet = new Set(entries.map((e) => e.author).filter(Boolean));
    return Array.from(authorSet).sort();
  },

  getStats: () => {
    const { entries, readingPlan } = get();
    const entryIds = new Set(entries.map((e) => e.id));
    return {
      total: entries.length,
      favorites: entries.filter((e) => e.favorite).length,
      unread: entries.filter((e) => e.readStatus === '未读').length,
      read: entries.filter((e) => e.readStatus === '已读').length,
      todayPlan: readingPlan.filter(
        (item) => item.status === 'planned' && entryIds.has(item.entryId)
      ).length,
    };
  },

  clearAllData: () => {
    set({
      entries: [],
      customTags: [],
      filters: get().filters,
      readingPlan: [],
      duplicateGroups: [],
      expandedKanbanGroups: {},
    });
  },

  checkForDuplicates: (entryData: { workName: string; cpName: string; link: string; author: string }) => {
    const { entries } = get();
    if (entries.length === 0) return [];

    const normalize = (str: string): string => {
      return str
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '')
        .replace(/[^\w\u4e00-\u9fa5]/g, '');
    };

    const normalizeUrl = (url: string): string => {
      try {
        const u = new URL(url);
        return u.hostname + u.pathname.replace(/\/$/, '');
      } catch {
        return normalize(url);
      }
    };

    const isLooseMatch = (a: string, b: string): boolean => {
      if (!a || !b) return false;
      const normA = normalize(a);
      const normB = normalize(b);
      if (!normA || !normB) return false;
      if (normA === normB) return true;
      const shorter = normA.length < normB.length ? normA : normB;
      const longer = normA.length < normB.length ? normB : normA;
      if (shorter.length < 2) return false;
      if (!longer.includes(shorter)) return false;
      const ratio = shorter.length / longer.length;
      return ratio >= 0.5;
    };

    const isUrlMatch = (a: string, b: string): boolean => {
      if (!a || !b) return false;
      const urlA = normalizeUrl(a);
      const urlB = normalizeUrl(b);
      if (!urlA || !urlB) return false;
      if (urlA === urlB) return true;
      const shorter = urlA.length < urlB.length ? urlA : urlB;
      const longer = urlA.length < urlB.length ? urlB : urlA;
      if (shorter.length < 3) return false;
      if (!longer.includes(shorter)) return false;
      const ratio = shorter.length / longer.length;
      return ratio >= 0.6;
    };

    const matches: { entry: Entry; matchReasons: string[]; matchScore: number }[] = [];

    for (const existing of entries) {
      const matchReasons: string[] = [];
      let score = 0;
      let hasLinkMatch = false;

      if (isLooseMatch(entryData.workName, existing.workName)) {
        matchReasons.push('作品名匹配');
        score += 2;
      }
      if (isLooseMatch(entryData.cpName, existing.cpName)) {
        matchReasons.push('CP名匹配');
        score += 2;
      }
      if (isLooseMatch(entryData.author, existing.author)) {
        matchReasons.push('作者匹配');
        score += 2;
      }
      if (isUrlMatch(entryData.link, existing.link)) {
        matchReasons.push('链接匹配');
        score += 3;
        hasLinkMatch = true;
      }

      const isDuplicate = hasLinkMatch || score >= 4;

      if (isDuplicate) {
        matches.push({
          entry: existing,
          matchReasons,
          matchScore: score,
        });
      }
    }

    return matches.sort((a, b) => b.matchScore - a.matchScore);
  },

  batchUpdateNotes: (entryIds: string[], notes: string) => {
    set((state) => ({
      entries: state.entries.map((entry) => {
        if (!entryIds.includes(entry.id)) return entry;
        const existingNotes = entry.notes ? entry.notes.trim() : '';
        const newNotes = notes.trim();
        const finalNotes = existingNotes && newNotes
          ? `${existingNotes}\n\n${newNotes}`
          : existingNotes || newNotes;
        return { ...entry, notes: finalNotes, updatedAt: Date.now() };
      }),
    }));
  },

  batchClearEmptyLinks: (entryIds: string[]) => {
    set((state) => ({
      entries: state.entries.map((entry) => {
        if (!entryIds.includes(entry.id)) return entry;
        return { ...entry, link: '', updatedAt: Date.now() };
      }),
    }));
  },
});
