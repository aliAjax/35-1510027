import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Entry, EntryStore, FilterState, BackupData, ImportResult, EntryType, CompletionStatus, ReadStatus, FlavorTag } from '../types';
import { ENTRY_TYPES, COMPLETION_STATUSES, READ_STATUSES, FLAVOR_TAGS } from '../types';

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

      exportData: () => {
        const { entries, filters } = get();
        return {
          version: '1.0',
          exportedAt: Date.now(),
          entries,
          filters,
        };
      },

      validateAndParseImport: (jsonString: string): ImportResult => {
        const errors: string[] = [];
        let data: BackupData | null = null;

        try {
          data = JSON.parse(jsonString) as BackupData;
        } catch {
          return {
            success: false,
            entriesCount: 0,
            duplicateCount: 0,
            errors: ['JSON 格式错误，请检查文件内容'],
          };
        }

        if (!data || typeof data !== 'object') {
          return {
            success: false,
            entriesCount: 0,
            duplicateCount: 0,
            errors: ['数据格式无效'],
          };
        }

        if (!data.version) {
          errors.push('缺少版本信息，可能不是有效的备份文件');
        }

        if (!Array.isArray(data.entries)) {
          errors.push('entries 字段格式错误');
          return {
            success: false,
            entriesCount: 0,
            duplicateCount: 0,
            errors,
          };
        }

        const validTypes = new Set(ENTRY_TYPES);
        const validStatuses = new Set(COMPLETION_STATUSES);
        const validReadStatuses = new Set(READ_STATUSES);
        const validTags = new Set(FLAVOR_TAGS);

        data.entries.forEach((entry, index) => {
          if (!entry.workName) {
            errors.push(`第 ${index + 1} 条数据缺少作品名称`);
          }
          if (!entry.cpName) {
            errors.push(`第 ${index + 1} 条数据缺少 CP 名称`);
          }
          if (entry.type && !validTypes.has(entry.type as EntryType)) {
            errors.push(`第 ${index + 1} 条数据类型无效: ${entry.type}`);
          }
          if (entry.status && !validStatuses.has(entry.status as CompletionStatus)) {
            errors.push(`第 ${index + 1} 条数据完成状态无效: ${entry.status}`);
          }
          if (entry.readStatus && !validReadStatuses.has(entry.readStatus as ReadStatus)) {
            errors.push(`第 ${index + 1} 条数据阅读状态无效: ${entry.readStatus}`);
          }
          if (Array.isArray(entry.tags)) {
            entry.tags.forEach((tag) => {
              if (!validTags.has(tag as FlavorTag)) {
                errors.push(`第 ${index + 1} 条数据包含无效标签: ${tag}`);
              }
            });
          }
        });

        const { entries: currentEntries } = get();
        const currentIds = new Set(currentEntries.map((e) => e.id));
        const duplicateCount = data.entries.filter((e) => currentIds.has(e.id)).length;

        return {
          success: errors.length === 0 || (data.entries.length > 0),
          entriesCount: data.entries.length,
          duplicateCount,
          errors,
          data,
        };
      },

      importData: (data: BackupData, merge: boolean) => {
        if (merge) {
          const { entries: currentEntries } = get();
          const currentIds = new Set(currentEntries.map((e) => e.id));
          const newEntries = data.entries.filter((e) => !currentIds.has(e.id));
          set((state) => ({
            entries: [...newEntries, ...state.entries],
            filters: data.filters,
          }));
        } else {
          set({
            entries: data.entries,
            filters: data.filters,
          });
        }
      },

      clearAllData: () => {
        set({
          entries: [],
          filters: { ...defaultFilters },
        });
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
