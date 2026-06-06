import type { StateCreator } from 'zustand';
import type { EntryStore, DuplicateGroup, Entry } from '../../types';
import { generateId } from './utils';

export const createDuplicateCheckSlice: StateCreator<
  EntryStore,
  [],
  [],
  {
    isDuplicateCheckerOpen: boolean;
    duplicateGroups: DuplicateGroup[];
    findDuplicates: () => DuplicateGroup[];
    ignoreDuplicateGroup: (groupId: string) => void;
    keepEntry: (groupId: string, entryId: string) => void;
    mergeEntries: (groupId: string, keepEntryId: string) => void;
  }
> = (set, get) => ({
  isDuplicateCheckerOpen: false,
  duplicateGroups: [],

  findDuplicates: () => {
    const { entries } = get();
    if (entries.length < 2) {
      set({ duplicateGroups: [] });
      return [];
    }

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

    const parent = new Map<string, string>();
    entries.forEach((e) => parent.set(e.id, e.id));

    const find = (id: string): string => {
      if (parent.get(id) !== id) {
        parent.set(id, find(parent.get(id)!));
      }
      return parent.get(id)!;
    };

    const union = (id1: string, id2: string) => {
      const r1 = find(id1);
      const r2 = find(id2);
      if (r1 !== r2) {
        parent.set(r1, r2);
      }
    };

    const pairReasons = new Map<string, string[]>();

    for (let i = 0; i < entries.length; i++) {
      for (let j = i + 1; j < entries.length; j++) {
        const a = entries[i];
        const b = entries[j];

        const matchReasons: string[] = [];
        let score = 0;
        let hasLinkMatch = false;

        if (isLooseMatch(a.workName, b.workName)) {
          matchReasons.push('作品名匹配');
          score += 2;
        }
        if (isLooseMatch(a.cpName, b.cpName)) {
          matchReasons.push('CP名匹配');
          score += 2;
        }
        if (isLooseMatch(a.author, b.author)) {
          matchReasons.push('作者匹配');
          score += 2;
        }
        if (isUrlMatch(a.link, b.link)) {
          matchReasons.push('链接匹配');
          score += 3;
          hasLinkMatch = true;
        }

        const isDuplicate = hasLinkMatch || score >= 4;

        if (isDuplicate) {
          union(a.id, b.id);
          const pairKey = [a.id, b.id].sort().join('|');
          pairReasons.set(pairKey, matchReasons);
        }
      }
    }

    const clusters = new Map<string, Entry[]>();
    entries.forEach((e) => {
      const root = find(e.id);
      if (!clusters.has(root)) {
        clusters.set(root, []);
      }
      clusters.get(root)!.push(e);
    });

    const prevIgnoredKeys = new Set<string>();
    get().duplicateGroups.forEach((g) => {
      if (g.ignored) {
        const key = g.entries.map((e) => e.id).sort().join('|');
        prevIgnoredKeys.add(key);
      }
    });

    const groups: DuplicateGroup[] = [];

    clusters.forEach((clusterEntries) => {
      if (clusterEntries.length <= 1) return;

      const allReasons = new Set<string>();
      for (let i = 0; i < clusterEntries.length; i++) {
        for (let j = i + 1; j < clusterEntries.length; j++) {
          const pairKey = [clusterEntries[i].id, clusterEntries[j].id].sort().join('|');
          const reasons = pairReasons.get(pairKey);
          if (reasons) {
            reasons.forEach((r) => allReasons.add(r));
          }
        }
      }

      const totalScore = clusterEntries.length * 2 + allReasons.size;
      const groupKey = clusterEntries.map((e) => e.id).sort().join('|');
      const wasIgnored = prevIgnoredKeys.has(groupKey);

      groups.push({
        id: generateId(),
        entries: clusterEntries,
        matchScore: totalScore,
        matchReasons: Array.from(allReasons),
        ignored: wasIgnored,
      });
    });

    groups.sort((a, b) => b.matchScore - a.matchScore);
    set({ duplicateGroups: groups });
    return groups;
  },

  ignoreDuplicateGroup: (groupId: string) => {
    set((state) => ({
      duplicateGroups: state.duplicateGroups.map((g) =>
        g.id === groupId ? { ...g, ignored: true } : g
      ),
    }));
  },

  keepEntry: (groupId: string, entryId: string) => {
    const { duplicateGroups } = get();
    const group = duplicateGroups.find((g) => g.id === groupId);
    if (!group) return;

    const idsToDelete = group.entries
      .map((e) => e.id)
      .filter((id) => id !== entryId);

    set((state) => ({
      entries: state.entries.filter((e) => !idsToDelete.includes(e.id)),
      duplicateGroups: state.duplicateGroups.filter((g) => g.id !== groupId),
      readingPlan: state.readingPlan
        .filter((item) => !idsToDelete.includes(item.entryId))
        .map((item, idx) => ({ ...item, order: idx + 1 })),
    }));
  },

  mergeEntries: (groupId: string, keepEntryId: string) => {
    const { duplicateGroups, entries } = get();
    const group = duplicateGroups.find((g) => g.id === groupId);
    if (!group) return;

    const keepEntry = entries.find((e) => e.id === keepEntryId);
    if (!keepEntry) return;

    const otherEntries = group.entries.filter((e) => e.id !== keepEntryId);

    const mergedNotes: string[] = [keepEntry.notes];
    const mergedTags = new Set(keepEntry.tags);
    const mergedCustomTags = new Set(keepEntry.customTags);
    let mergedFavorite = keepEntry.favorite;

    otherEntries.forEach((entry) => {
      if (entry.notes) mergedNotes.push(entry.notes);
      entry.tags.forEach((t) => mergedTags.add(t));
      entry.customTags.forEach((t) => mergedCustomTags.add(t));
      if (entry.favorite) mergedFavorite = true;
    });

    const idsToDelete = otherEntries.map((e) => e.id);
    const finalNotes = mergedNotes.filter(Boolean).join('\n\n---\n\n');

    set((state) => ({
      entries: state.entries
        .map((e) =>
          e.id === keepEntryId
            ? {
                ...e,
                tags: Array.from(mergedTags),
                customTags: Array.from(mergedCustomTags),
                notes: finalNotes,
                favorite: mergedFavorite,
                updatedAt: Date.now(),
              }
            : e
        )
        .filter((e) => !idsToDelete.includes(e.id)),
      duplicateGroups: state.duplicateGroups.filter((g) => g.id !== groupId),
      readingPlan: state.readingPlan
        .filter((item) => !idsToDelete.includes(item.entryId))
        .map((item, idx) => ({ ...item, order: idx + 1 })),
    }));
  },
});
