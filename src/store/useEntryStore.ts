import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Entry, EntryStore, FilterState } from '../types';

const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

const defaultFilters: FilterState = {
  cpName: '',
  type: 'all',
  tags: [],
  readStatus: 'all',
  favoriteOnly: false,
  searchKeyword: '',
};

export const useEntryStore = create<EntryStore>()(
  persist(
    (set, get) => ({
      entries: [],
      filters: { ...defaultFilters },
      editingEntry: null,
      isFormOpen: false,
      isDetailOpen: false,
      detailEntry: null,

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

      setFilters: (newFilters) => {
        set((state) => ({
          filters: { ...state.filters, ...newFilters },
        }));
      },

      resetFilters: () => {
        set({ filters: { ...defaultFilters } });
      },

      openForm: (entry) => {
        set({
          editingEntry: entry || null,
          isFormOpen: true,
          isDetailOpen: false,
        });
      },

      closeForm: () => {
        set({
          editingEntry: null,
          isFormOpen: false,
        });
      },

      openDetail: (entry) => {
        set({
          detailEntry: entry,
          isDetailOpen: true,
          isFormOpen: false,
        });
      },

      closeDetail: () => {
        set({
          detailEntry: null,
          isDetailOpen: false,
        });
      },

      getFilteredEntries: () => {
        const { entries, filters } = get();
        return entries.filter((entry) => {
          if (filters.cpName && entry.cpName !== filters.cpName) return false;
          if (filters.type !== 'all' && entry.type !== filters.type) return false;
          if (filters.readStatus !== 'all' && entry.readStatus !== filters.readStatus) return false;
          if (filters.favoriteOnly && !entry.favorite) return false;
          if (filters.tags.length > 0) {
            const hasAllTags = filters.tags.every((tag) => entry.tags.includes(tag));
            if (!hasAllTags) return false;
          }
          if (filters.searchKeyword) {
            const keyword = filters.searchKeyword.toLowerCase();
            const searchFields = [
              entry.workName,
              entry.cpName,
              entry.author,
              entry.notes,
              ...entry.tags,
            ];
            const matches = searchFields.some((field) =>
              field.toLowerCase().includes(keyword)
            );
            if (!matches) return false;
          }
          return true;
        });
      },

      getUniqueCpNames: () => {
        const { entries } = get();
        const cpSet = new Set(entries.map((e) => e.cpName).filter(Boolean));
        return Array.from(cpSet).sort();
      },

      getStats: () => {
        const { entries } = get();
        return {
          total: entries.length,
          favorites: entries.filter((e) => e.favorite).length,
          unread: entries.filter((e) => e.readStatus === '未读').length,
          read: entries.filter((e) => e.readStatus === '已读').length,
        };
      },
    }),
    {
      name: 'cp-grain-list-data',
      partialize: (state) => ({
        entries: state.entries,
        filters: state.filters,
      }),
    }
  )
);
