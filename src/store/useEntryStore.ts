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
        const warnings: string[] = [];
        let data: BackupData | null = null;

        try {
          data = JSON.parse(jsonString);
        } catch {
          return {
            success: false,
            entriesCount: 0,
            validEntriesCount: 0,
            duplicateCount: 0,
            currentEntriesCount: 0,
            overwriteCount: 0,
            errors: ['JSON 格式错误，请检查文件内容'],
            warnings: [],
          };
        }

        if (!data || typeof data !== 'object' || Array.isArray(data)) {
          return {
            success: false,
            entriesCount: 0,
            validEntriesCount: 0,
            duplicateCount: 0,
            currentEntriesCount: 0,
            overwriteCount: 0,
            errors: ['数据格式无效，根元素必须为对象'],
            warnings: [],
          };
        }

        if (!data.version || typeof data.version !== 'string') {
          warnings.push('缺少版本信息，可能不是有效的备份文件');
        }

        if (typeof data.exportedAt !== 'number' || data.exportedAt <= 0) {
          warnings.push('缺少导出时间信息');
        }

        if (!Array.isArray(data.entries)) {
          return {
            success: false,
            entriesCount: 0,
            validEntriesCount: 0,
            duplicateCount: 0,
            currentEntriesCount: 0,
            overwriteCount: 0,
            errors: ['entries 字段缺失或格式错误，必须为数组'],
            warnings,
          };
        }

        if (!data.filters || typeof data.filters !== 'object' || Array.isArray(data.filters)) {
          warnings.push('筛选配置缺失或格式错误，将使用默认配置');
          data.filters = { ...defaultFilters };
        } else {
          if (typeof data.filters.cpName !== 'string') warnings.push('筛选配置 cpName 格式错误');
          if (typeof data.filters.favoriteOnly !== 'boolean') warnings.push('筛选配置 favoriteOnly 格式错误');
          if (typeof data.filters.searchKeyword !== 'string') warnings.push('筛选配置 searchKeyword 格式错误');
        }

        const validTypes = new Set<string>(ENTRY_TYPES);
        const validStatuses = new Set<string>(COMPLETION_STATUSES);
        const validReadStatuses = new Set<string>(READ_STATUSES);
        const validTags = new Set<string>(FLAVOR_TAGS);

        const rawEntries = data.entries as unknown as Record<string, unknown>[];
        let validEntriesCount = 0;

        rawEntries.forEach((entry, index) => {
          if (!entry || typeof entry !== 'object') {
            errors.push(`第 ${index + 1} 条数据不是有效对象`);
            return;
          }

          const label = typeof entry.workName === 'string' && entry.workName ? `「${entry.workName}」` : `第 ${index + 1} 条`;

          if (typeof entry.id !== 'string' || !entry.id) {
            errors.push(`${label}缺少有效 id`);
          }
          if (typeof entry.workName !== 'string' || !entry.workName.trim()) {
            errors.push(`${label}缺少作品名称`);
          }
          if (typeof entry.cpName !== 'string' || !entry.cpName.trim()) {
            errors.push(`${label}缺少 CP 名称`);
          }
          if (typeof entry.type !== 'string' || !entry.type) {
            errors.push(`${label}缺少类型`);
          } else if (!validTypes.has(entry.type)) {
            errors.push(`${label}类型无效: ${entry.type}`);
          }
          if (typeof entry.link !== 'string') {
            warnings.push(`${label}链接格式错误`);
          }
          if (typeof entry.author !== 'string') {
            warnings.push(`${label}作者格式错误`);
          }
          if (typeof entry.status !== 'string' || !entry.status) {
            errors.push(`${label}缺少完成状态`);
          } else if (!validStatuses.has(entry.status)) {
            errors.push(`${label}完成状态无效: ${entry.status}`);
          }
          if (!Array.isArray(entry.tags)) {
            errors.push(`${label}标签格式错误，必须为数组`);
          } else {
            (entry.tags as unknown[]).forEach((tag) => {
              if (typeof tag !== 'string' || !validTags.has(tag)) {
                warnings.push(`${label}包含无效标签: ${String(tag)}`);
              }
            });
          }
          if (typeof entry.readStatus !== 'string' || !entry.readStatus) {
            errors.push(`${label}缺少阅读状态`);
          } else if (!validReadStatuses.has(entry.readStatus)) {
            errors.push(`${label}阅读状态无效: ${entry.readStatus}`);
          }
          if (typeof entry.notes !== 'string') {
            warnings.push(`${label}备注格式错误`);
          }
          if (typeof entry.favorite !== 'boolean') {
            warnings.push(`${label}收藏标记格式错误`);
          }
          if (typeof entry.createdAt !== 'number' || entry.createdAt <= 0) {
            warnings.push(`${label}创建时间格式错误`);
          }
          if (typeof entry.updatedAt !== 'number' || entry.updatedAt <= 0) {
            warnings.push(`${label}更新时间格式错误`);
          }

          const hasId = typeof entry.id === 'string' && entry.id;
          const hasRequiredStrings = typeof entry.workName === 'string' && entry.workName.trim()
            && typeof entry.cpName === 'string' && entry.cpName.trim()
            && typeof entry.type === 'string' && entry.type
            && typeof entry.status === 'string' && entry.status
            && typeof entry.readStatus === 'string' && entry.readStatus;
          const hasTagsArray = Array.isArray(entry.tags);

          if (hasId && hasRequiredStrings && hasTagsArray) {
            validEntriesCount++;
          }
        });

        const { entries: currentEntries } = get();
        const currentEntriesCount = currentEntries.length;
        const currentIds = new Set(currentEntries.map((e) => e.id));
        const duplicateCount = rawEntries.filter((e) =>
          typeof e.id === 'string' && currentIds.has(e.id as string)
        ).length;
        const overwriteCount = currentEntriesCount;

        return {
          success: errors.length === 0,
          entriesCount: data.entries.length,
          validEntriesCount,
          duplicateCount,
          currentEntriesCount,
          overwriteCount,
          errors,
          warnings,
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
