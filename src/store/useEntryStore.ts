import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Entry, EntryStore, FilterState, BackupData, ImportResult, EntryType, ReadStatus, FlavorTag, ParsedBatchEntry, BatchImportResult, CompletionStatus, CustomTag, ReadingPlanItem, DuplicateGroup, KanbanViewMode, FilterFavorite, LinkAnalysisResult, LinkInfo, LinkDomainGroup, LinkIssue, DataAnalysisResult, CpDistributionItem, TypeDistributionItem, ReadStatusDistributionItem, TrendDataItem } from '../types';
import { ENTRY_TYPES, COMPLETION_STATUSES, READ_STATUSES, FLAVOR_TAGS } from '../types';
import { migrateData, CURRENT_SCHEMA_VERSION, type PersistedState } from '../utils/dataMigration';

const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

const defaultFilters: FilterState = {
  cpName: '',
  type: 'all',
  status: 'all',
  tags: [],
  customTags: [],
  readStatus: 'all',
  favoriteOnly: false,
  searchKeyword: '',
};

export const useEntryStore = create<EntryStore>()(
  persist(
    (set, get) => ({
      entries: [],
      customTags: [],
      filters: { ...defaultFilters },
      filterFavorites: [],
      editingEntry: null,
      isFormOpen: false,
      isDetailOpen: false,
      detailEntry: null,
      isBatchImportOpen: false,
      isTagManagerOpen: false,
      isReadingPlanOpen: false,
      readingPlan: [],
      isDuplicateCheckerOpen: false,
      duplicateGroups: [],
      isKanbanOpen: false,
      kanbanViewMode: 'cp' as KanbanViewMode,
      expandedKanbanGroups: {},
      isLinkManagerOpen: false,
      isDataAnalysisOpen: false,

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

      setFilters: (newFilters) => {
        set((state) => ({
          filters: { ...state.filters, ...newFilters },
        }));
      },

      resetFilters: () => {
        set({ filters: { ...defaultFilters } });
      },

      addFilterFavorite: (name, filters) => {
        const now = Date.now();
        const newFavorite: FilterFavorite = {
          id: generateId(),
          name,
          filters: { ...filters },
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({
          filterFavorites: [...state.filterFavorites, newFavorite],
        }));
      },

      updateFilterFavorite: (id, updates) => {
        set((state) => ({
          filterFavorites: state.filterFavorites.map((fav) =>
            fav.id === id
              ? { ...fav, ...updates, updatedAt: Date.now() }
              : fav
          ),
        }));
      },

      deleteFilterFavorite: (id) => {
        set((state) => ({
          filterFavorites: state.filterFavorites.filter((fav) => fav.id !== id),
        }));
      },

      applyFilterFavorite: (id) => {
        const { filterFavorites, customTags, entries } = get();
        const favorite = filterFavorites.find((fav) => fav.id === id);
        if (!favorite) return;

        const validTags = new Set<string>(FLAVOR_TAGS);
        const validCustomTagIds = new Set(customTags.map((t) => t.id));
        const validTypes = new Set<string>(ENTRY_TYPES);
        const validStatuses = new Set<string>(COMPLETION_STATUSES);
        const validReadStatuses = new Set<string>(READ_STATUSES);
        const validCpNames = new Set(entries.map((e) => e.cpName));

        const appliedFilters: FilterState = {
          ...defaultFilters,
          ...favorite.filters,
          tags: (favorite.filters.tags || []).filter((tag) => validTags.has(tag)),
          customTags: (favorite.filters.customTags || []).filter((tagId) => validCustomTagIds.has(tagId)),
          type: (favorite.filters.type || 'all') === 'all' || validTypes.has(favorite.filters.type)
            ? favorite.filters.type || 'all'
            : 'all',
          status: (favorite.filters.status || 'all') === 'all' || validStatuses.has(favorite.filters.status)
            ? favorite.filters.status || 'all'
            : 'all',
          readStatus: (favorite.filters.readStatus || 'all') === 'all' || validReadStatuses.has(favorite.filters.readStatus)
            ? favorite.filters.readStatus || 'all'
            : 'all',
          cpName: validCpNames.has(favorite.filters.cpName)
            ? favorite.filters.cpName
            : '',
        };

        set({ filters: appliedFilters });
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

      openBatchImport: () => {
        set({
          isBatchImportOpen: true,
          isFormOpen: false,
          isDetailOpen: false,
        });
      },

      closeBatchImport: () => {
        set({
          isBatchImportOpen: false,
        });
      },

      openTagManager: () => {
        set({
          isTagManagerOpen: true,
          isFormOpen: false,
          isDetailOpen: false,
          isBatchImportOpen: false,
        });
      },

      closeTagManager: () => {
        set({
          isTagManagerOpen: false,
        });
      },

      openReadingPlan: () => {
        set({
          isReadingPlanOpen: true,
          isFormOpen: false,
          isDetailOpen: false,
          isBatchImportOpen: false,
          isTagManagerOpen: false,
        });
      },

      closeReadingPlan: () => {
        set({
          isReadingPlanOpen: false,
        });
      },

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

      getFilteredEntries: () => {
        const { entries, filters, customTags } = get();
        return entries.filter((entry) => {
          const entryCustomTags = entry.customTags || [];
          if (filters.cpName && entry.cpName !== filters.cpName) return false;
          if (filters.type !== 'all' && entry.type !== filters.type) return false;
          if (filters.status !== 'all' && entry.status !== filters.status) return false;
          if (filters.readStatus !== 'all' && entry.readStatus !== filters.readStatus) return false;
          if (filters.favoriteOnly && !entry.favorite) return false;
          if (filters.tags.length > 0) {
            const hasAllTags = filters.tags.every((tag) => entry.tags.includes(tag));
            if (!hasAllTags) return false;
          }
          if (filters.customTags.length > 0) {
            const hasAllCustomTags = filters.customTags.every((tagId) =>
              entryCustomTags.includes(tagId)
            );
            if (!hasAllCustomTags) return false;
          }
          if (filters.searchKeyword) {
            const keyword = filters.searchKeyword.toLowerCase();
            const tagNames = customTags
              .filter((t) => entryCustomTags.includes(t.id))
              .map((t) => t.name);
            const searchFields = [
              entry.workName,
              entry.cpName,
              entry.author,
              entry.notes,
              ...entry.tags,
              ...tagNames,
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

      exportData: () => {
        const { entries, customTags, filters } = get();
        return {
          version: '1.0',
          exportedAt: Date.now(),
          entries,
          customTags,
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

        const validTypes = new Set<string>(ENTRY_TYPES);
        const validStatuses = new Set<string>(COMPLETION_STATUSES);
        const validReadStatuses = new Set<string>(READ_STATUSES);
        const validTags = new Set<string>(FLAVOR_TAGS);

        if (!Array.isArray(data.customTags)) {
          warnings.push('自定义标签数据缺失或格式错误，将使用空数组');
          data.customTags = [];
        } else {
          const { customTags } = get();
          const existingTagIds = new Set(customTags.map((t) => t.id));
          data.customTags = data.customTags.filter((tag: unknown) => {
            if (tag && typeof tag === 'object' && 'id' in tag && 'name' in tag && 'color' in tag) {
              const t = tag as CustomTag;
              if (existingTagIds.has(t.id)) {
                warnings.push(`自定义标签「${t.name}」ID 重复，已跳过`);
                return false;
              }
              return true;
            }
            warnings.push('发现无效的自定义标签数据，已跳过');
            return false;
          }) as CustomTag[];
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

        if (data.entries.length === 0) {
          warnings.push('备份文件中没有条目数据');
        }

        if (!data.filters || typeof data.filters !== 'object' || Array.isArray(data.filters)) {
          warnings.push('筛选配置缺失或格式错误，将使用默认配置');
          data.filters = { ...defaultFilters };
        } else {
          const rawFilters = data.filters as unknown as Record<string, unknown>;
          if (typeof rawFilters.cpName !== 'string') {
            warnings.push('筛选配置 cpName 缺失或格式错误，已使用默认值');
            rawFilters.cpName = '';
          }
          if (typeof rawFilters.type !== 'string' || (rawFilters.type !== 'all' && !validTypes.has(rawFilters.type))) {
            warnings.push(`筛选配置 type 缺失或值无效: ${String(rawFilters.type)}，已使用默认值`);
            rawFilters.type = 'all';
          }
          if (typeof rawFilters.status !== 'string' || (rawFilters.status !== 'all' && !validStatuses.has(rawFilters.status))) {
            if (rawFilters.status !== undefined) {
              warnings.push(`筛选配置 status 缺失或值无效: ${String(rawFilters.status)}，已使用默认值`);
            }
            rawFilters.status = 'all';
          }
          if (!Array.isArray(rawFilters.tags)) {
            if (rawFilters.tags !== undefined) warnings.push('筛选配置 tags 格式错误，已使用默认值');
            rawFilters.tags = [];
          } else {
            const validFilterTags = (rawFilters.tags as unknown[]).filter((tag): tag is string =>
              typeof tag === 'string' && validTags.has(tag)
            );
            if (validFilterTags.length !== (rawFilters.tags as unknown[]).length) {
              warnings.push(`筛选配置标签中已移除 ${(rawFilters.tags as unknown[]).length - validFilterTags.length} 个无效值`);
            }
            rawFilters.tags = validFilterTags;
          }
          if (!Array.isArray(rawFilters.customTags)) {
            if (rawFilters.customTags !== undefined) warnings.push('筛选配置 customTags 格式错误，已使用默认值');
            rawFilters.customTags = [];
          } else {
            const validCustomTags = (rawFilters.customTags as unknown[]).filter((tag): tag is string =>
              typeof tag === 'string'
            );
            rawFilters.customTags = validCustomTags;
          }
          if (typeof rawFilters.readStatus !== 'string' || (rawFilters.readStatus !== 'all' && !validReadStatuses.has(rawFilters.readStatus))) {
            warnings.push(`筛选配置 readStatus 缺失或值无效: ${String(rawFilters.readStatus)}，已使用默认值`);
            rawFilters.readStatus = 'all';
          }
          if (typeof rawFilters.favoriteOnly !== 'boolean') {
            warnings.push('筛选配置 favoriteOnly 缺失或格式错误，已使用默认值');
            rawFilters.favoriteOnly = false;
          }
          if (typeof rawFilters.searchKeyword !== 'string') {
            warnings.push('筛选配置 searchKeyword 缺失或格式错误，已使用默认值');
            rawFilters.searchKeyword = '';
          }
          data.filters = {
            cpName: rawFilters.cpName as string,
            type: rawFilters.type as EntryType | 'all',
            status: rawFilters.status as CompletionStatus | 'all',
            tags: rawFilters.tags as FlavorTag[],
            customTags: rawFilters.customTags as string[],
            readStatus: rawFilters.readStatus as ReadStatus | 'all',
            favoriteOnly: rawFilters.favoriteOnly as boolean,
            searchKeyword: rawFilters.searchKeyword as string,
          };
        }

        const rawEntries = data.entries as unknown as Record<string, unknown>[];
        let validEntriesCount = 0;
        const seenIds = new Set<string>();
        const sanitizedEntries: Record<string, unknown>[] = [];

        rawEntries.forEach((entry, index) => {
          if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
            errors.push(`第 ${index + 1} 条数据不是有效对象`);
            return;
          }
          sanitizedEntries.push(entry);

          const label = typeof entry.workName === 'string' && entry.workName ? `「${entry.workName}」` : `第 ${index + 1} 条`;

          if (typeof entry.id !== 'string' || !entry.id) {
            errors.push(`${label}缺少有效 id`);
          } else if (seenIds.has(entry.id)) {
            warnings.push(`${label}id 与已有条目重复: ${entry.id}`);
          } else {
            seenIds.add(entry.id);
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
          if (!Array.isArray(entry.customTags)) {
            entry.customTags = [];
          } else {
            entry.customTags = (entry.customTags as unknown[]).filter((tag): tag is string =>
              typeof tag === 'string'
            );
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

        data.entries = sanitizedEntries as unknown as Entry[];

        const { entries: currentEntries } = get();
        const currentEntriesCount = currentEntries.length;
        const currentIds = new Set(currentEntries.map((e) => e.id));
        const duplicateCount = sanitizedEntries.filter((e) =>
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
          const { entries: currentEntries, customTags: currentTags } = get();
          const currentIds = new Set(currentEntries.map((e) => e.id));
          const currentTagIds = new Set(currentTags.map((t) => t.id));
          const newEntries = data.entries.filter((e) => !currentIds.has(e.id));
          const newCustomTags = data.customTags.filter((t) => !currentTagIds.has(t.id));
          set((state) => ({
            entries: [...newEntries, ...state.entries],
            customTags: [...newCustomTags, ...state.customTags],
            filters: data.filters,
          }));
        } else {
          const newEntryIds = new Set(data.entries.map((e) => e.id));
          set((state) => ({
            entries: data.entries,
            customTags: data.customTags,
            filters: data.filters,
            readingPlan: state.readingPlan
              .filter((item) => newEntryIds.has(item.entryId))
              .map((item, idx) => ({ ...item, order: idx + 1 })),
          }));
        }
      },

      batchImportEntries: (parsedEntries: ParsedBatchEntry[]) => {
        const validEntries = parsedEntries.filter((e) => e.isValid);
        const now = Date.now();
        const newEntries: Entry[] = validEntries.map((entry, index) => ({
          id: generateId() + index.toString(),
          workName: entry.workName,
          cpName: entry.cpName,
          type: entry.type,
          link: entry.link,
          author: entry.author,
          status: entry.status,
          tags: entry.tags,
          customTags: entry.customTags,
          readStatus: entry.readStatus,
          notes: entry.notes,
          favorite: entry.favorite,
          createdAt: now - index,
          updatedAt: now,
        }));
        set((state) => ({
          entries: [...newEntries, ...state.entries],
          isBatchImportOpen: false,
        }));
      },

      parseBatchText: (text: string): BatchImportResult => {
        const validTypes = new Set<string>(ENTRY_TYPES);
        const validStatuses = new Set<string>(COMPLETION_STATUSES);
        const validReadStatuses = new Set<string>(READ_STATUSES);
        const validTags = new Set<string>(FLAVOR_TAGS);
        const { customTags } = get();
        const customTagMap = new Map(customTags.map((t) => [t.name.toLowerCase(), t.id]));

        const normalizeValue = (val: string): string => val.trim().replace(/^["']|["']$/g, '');

        const parseRow = (row: string[], rowNumber: number): ParsedBatchEntry => {
          const errors: string[] = [];
          const warnings: string[] = [];

          const workName = normalizeValue(row[0] || '');
          const cpName = normalizeValue(row[1] || '');
          const typeStr = normalizeValue(row[2] || '');
          const link = normalizeValue(row[3] || '');
          const author = normalizeValue(row[4] || '');
          const statusStr = normalizeValue(row[5] || '');
          const tagsStr = normalizeValue(row[6] || '');
          const customTagsStr = normalizeValue(row[7] || '');
          const readStatusStr = normalizeValue(row[8] || '');
          const notes = normalizeValue(row[9] || '');
          const favoriteStr = normalizeValue(row[10] || '').toLowerCase();

          if (!workName) {
            errors.push('缺少作品名');
          }
          if (!cpName) {
            errors.push('缺少CP名');
          }

          let type: EntryType = '同人文';
          if (typeStr && !validTypes.has(typeStr)) {
            errors.push(`类型"${typeStr}"不合法`);
          } else if (typeStr) {
            type = typeStr as EntryType;
          }

          let status: CompletionStatus = '已完结';
          if (statusStr && !validStatuses.has(statusStr)) {
            errors.push(`状态"${statusStr}"不合法`);
          } else if (statusStr) {
            status = statusStr as CompletionStatus;
          }

          const rawTags = tagsStr.split(/[,，、\s]+/).filter((t) => t);
          const tags: FlavorTag[] = [];
          const invalidTags: string[] = [];
          rawTags.forEach((tag) => {
            if (validTags.has(tag)) {
              tags.push(tag as FlavorTag);
            } else if (tag) {
              invalidTags.push(tag);
            }
          });
          if (invalidTags.length > 0) {
            errors.push(`标签不合法: ${invalidTags.join('、')}`);
          }

          const rawCustomTags = customTagsStr.split(/[,，、\s]+/).filter((t) => t);
          const parsedCustomTags: string[] = [];
          const unmatchedCustomTags: string[] = [];
          rawCustomTags.forEach((tagName) => {
            const tagId = customTagMap.get(tagName.toLowerCase());
            if (tagId) {
              parsedCustomTags.push(tagId);
            } else if (tagName) {
              unmatchedCustomTags.push(tagName);
            }
          });
          if (unmatchedCustomTags.length > 0) {
            warnings.push(`自定义标签未找到: ${unmatchedCustomTags.join('、')}（请先创建标签再导入）`);
          }

          let readStatus: ReadStatus = '未读';
          if (readStatusStr && !validReadStatuses.has(readStatusStr)) {
            errors.push(`阅读状态"${readStatusStr}"不合法`);
          } else if (readStatusStr) {
            readStatus = readStatusStr as ReadStatus;
          }

          const favorite = favoriteStr === 'true' || favoriteStr === '是' || favoriteStr === 'yes' || favoriteStr === '1';

          return {
            rowNumber,
            workName,
            cpName,
            type,
            link,
            author,
            status,
            tags,
            customTags: parsedCustomTags,
            readStatus,
            notes,
            favorite,
            isValid: errors.length === 0,
            errors,
            warnings,
          };
        };

        const lines = text.split(/\r?\n/).filter((line) => line.trim());
        if (lines.length === 0) {
          return {
            totalRows: 0,
            validRows: 0,
            invalidRows: 0,
            entries: [],
            hasErrors: false,
          };
        }

        const firstLine = lines[0].split(/[\t,，]/);
        const hasHeader = firstLine.some((cell) =>
          ['作品名', 'cp名', '类型', '链接', '作者', '状态', '标签', '自定义标签', '阅读状态', '备注', '收藏'].includes(
            cell.trim().toLowerCase()
          )
        );

        const startLine = hasHeader ? 1 : 0;
        const entries: ParsedBatchEntry[] = [];

        for (let i = startLine; i < lines.length; i++) {
          const line = lines[i];
          const row = line.split(/[\t,，]/);
          if (row.some((cell) => cell.trim())) {
            entries.push(parseRow(row, i - startLine + 1));
          }
        }

        const validRows = entries.filter((e) => e.isValid).length;
        const hasErrors = entries.some((e) => e.errors.length > 0);

        return {
          totalRows: entries.length,
          validRows,
          invalidRows: entries.length - validRows,
          entries,
          hasErrors,
        };
      },

      parseBatchCSV: (csvText: string): BatchImportResult => {
        const parseCSVLine = (line: string): string[] => {
          const result: string[] = [];
          let current = '';
          let inQuotes = false;
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
              if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++;
              } else {
                inQuotes = !inQuotes;
              }
            } else if (char === ',' && !inQuotes) {
              result.push(current);
              current = '';
            } else {
              current += char;
            }
          }
          result.push(current);
          return result;
        };

        const validTypes = new Set<string>(ENTRY_TYPES);
        const validStatuses = new Set<string>(COMPLETION_STATUSES);
        const validReadStatuses = new Set<string>(READ_STATUSES);
        const validTags = new Set<string>(FLAVOR_TAGS);
        const { customTags } = get();
        const customTagMap = new Map(customTags.map((t) => [t.name.toLowerCase(), t.id]));

        const normalizeValue = (val: string): string => val.trim().replace(/^["']|["']$/g, '');

        const parseRow = (row: string[], rowNumber: number): ParsedBatchEntry => {
          const errors: string[] = [];
          const warnings: string[] = [];

          const workName = normalizeValue(row[0] || '');
          const cpName = normalizeValue(row[1] || '');
          const typeStr = normalizeValue(row[2] || '');
          const link = normalizeValue(row[3] || '');
          const author = normalizeValue(row[4] || '');
          const statusStr = normalizeValue(row[5] || '');
          const tagsStr = normalizeValue(row[6] || '');
          const customTagsStr = normalizeValue(row[7] || '');
          const readStatusStr = normalizeValue(row[8] || '');
          const notes = normalizeValue(row[9] || '');
          const favoriteStr = normalizeValue(row[10] || '').toLowerCase();

          if (!workName) {
            errors.push('缺少作品名');
          }
          if (!cpName) {
            errors.push('缺少CP名');
          }

          let type: EntryType = '同人文';
          if (typeStr && !validTypes.has(typeStr)) {
            errors.push(`类型"${typeStr}"不合法`);
          } else if (typeStr) {
            type = typeStr as EntryType;
          }

          let status: CompletionStatus = '已完结';
          if (statusStr && !validStatuses.has(statusStr)) {
            errors.push(`状态"${statusStr}"不合法`);
          } else if (statusStr) {
            status = statusStr as CompletionStatus;
          }

          const rawTags = tagsStr.split(/[,，、\s]+/).filter((t) => t);
          const tags: FlavorTag[] = [];
          const invalidTags: string[] = [];
          rawTags.forEach((tag) => {
            if (validTags.has(tag)) {
              tags.push(tag as FlavorTag);
            } else if (tag) {
              invalidTags.push(tag);
            }
          });
          if (invalidTags.length > 0) {
            errors.push(`标签不合法: ${invalidTags.join('、')}`);
          }

          const rawCustomTags = customTagsStr.split(/[,，、\s]+/).filter((t) => t);
          const parsedCustomTags: string[] = [];
          const unmatchedCustomTags: string[] = [];
          rawCustomTags.forEach((tagName) => {
            const tagId = customTagMap.get(tagName.toLowerCase());
            if (tagId) {
              parsedCustomTags.push(tagId);
            } else if (tagName) {
              unmatchedCustomTags.push(tagName);
            }
          });
          if (unmatchedCustomTags.length > 0) {
            warnings.push(`自定义标签未找到: ${unmatchedCustomTags.join('、')}（请先创建标签再导入）`);
          }

          let readStatus: ReadStatus = '未读';
          if (readStatusStr && !validReadStatuses.has(readStatusStr)) {
            errors.push(`阅读状态"${readStatusStr}"不合法`);
          } else if (readStatusStr) {
            readStatus = readStatusStr as ReadStatus;
          }

          const favorite = favoriteStr === 'true' || favoriteStr === '是' || favoriteStr === 'yes' || favoriteStr === '1';

          return {
            rowNumber,
            workName,
            cpName,
            type,
            link,
            author,
            status,
            tags,
            customTags: parsedCustomTags,
            readStatus,
            notes,
            favorite,
            isValid: errors.length === 0,
            errors,
            warnings,
          };
        };

        const lines = csvText.split(/\r?\n/).filter((line) => line.trim());
        if (lines.length === 0) {
          return {
            totalRows: 0,
            validRows: 0,
            invalidRows: 0,
            entries: [],
            hasErrors: false,
          };
        }

        const firstLine = parseCSVLine(lines[0]);
        const hasHeader = firstLine.some((cell) =>
          ['作品名', 'cp名', '类型', '链接', '作者', '状态', '标签', '自定义标签', '阅读状态', '备注', '收藏'].includes(
            cell.trim().toLowerCase()
          )
        );

        const startLine = hasHeader ? 1 : 0;
        const entries: ParsedBatchEntry[] = [];

        for (let i = startLine; i < lines.length; i++) {
          const row = parseCSVLine(lines[i]);
          if (row.some((cell) => cell.trim())) {
            entries.push(parseRow(row, i - startLine + 1));
          }
        }

        const validRows = entries.filter((e) => e.isValid).length;
        const hasErrors = entries.some((e) => e.errors.length > 0);

        return {
          totalRows: entries.length,
          validRows,
          invalidRows: entries.length - validRows,
          entries,
          hasErrors,
        };
      },

      clearAllData: () => {
        set({
          entries: [],
          customTags: [],
          filters: { ...defaultFilters },
          readingPlan: [],
          duplicateGroups: [],
          expandedKanbanGroups: {},
        });
      },

      openKanban: () => {
        set({
          isKanbanOpen: true,
          isFormOpen: false,
          isDetailOpen: false,
          isBatchImportOpen: false,
          isTagManagerOpen: false,
          isReadingPlanOpen: false,
          isDuplicateCheckerOpen: false,
        });
      },

      closeKanban: () => {
        set({ isKanbanOpen: false });
      },

      setKanbanViewMode: (mode: KanbanViewMode) => {
        set({ kanbanViewMode: mode, expandedKanbanGroups: {} });
      },

      toggleKanbanGroup: (groupKey: string) => {
        set((state) => {
          const isExpanded = state.expandedKanbanGroups[groupKey] !== false;
          return {
            expandedKanbanGroups: {
              ...state.expandedKanbanGroups,
              [groupKey]: !isExpanded,
            },
          };
        });
      },

      expandAllKanbanGroups: (groupKeys: string[]) => {
        const expanded: Record<string, boolean> = {};
        groupKeys.forEach((key) => { expanded[key] = true; });
        set({ expandedKanbanGroups: expanded });
      },

      collapseAllKanbanGroups: (groupKeys: string[]) => {
        const collapsed: Record<string, boolean> = {};
        groupKeys.forEach((key) => { collapsed[key] = false; });
        set({ expandedKanbanGroups: collapsed });
      },

      openLinkManager: () => {
        set({
          isLinkManagerOpen: true,
          isFormOpen: false,
          isDetailOpen: false,
          isBatchImportOpen: false,
          isTagManagerOpen: false,
          isReadingPlanOpen: false,
          isDuplicateCheckerOpen: false,
          isKanbanOpen: false,
        });
      },

      closeLinkManager: () => {
        set({ isLinkManagerOpen: false });
      },

      analyzeLinks: (entriesToAnalyze?: Entry[]): LinkAnalysisResult => {
        const entries = entriesToAnalyze ?? get().entries;
        
        const extractDomain = (url: string): string => {
          if (!url) return '无链接';
          try {
            const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
            return urlObj.hostname;
          } catch {
            return '格式异常';
          }
        };

        const isValidUrl = (url: string): boolean => {
          if (!url) return false;
          try {
            new URL(url.startsWith('http') ? url : `https://${url}`);
            return true;
          } catch {
            return false;
          }
        };

        const urlCount = new Map<string, number>();

        entries.forEach((entry) => {
          if (entry.link) {
            const normalizedUrl = entry.link.trim().toLowerCase();
            urlCount.set(normalizedUrl, (urlCount.get(normalizedUrl) || 0) + 1);
          }
        });

        const allLinks: LinkInfo[] = entries.map((entry) => {
          const issues: LinkIssue[] = [];
          const link = entry.link || '';

          if (!link.trim()) {
            issues.push({ type: 'empty', message: '空链接' });
          } else if (!isValidUrl(link)) {
            issues.push({ type: 'invalid', message: '链接格式异常' });
          }

          const normalizedUrl = link.trim().toLowerCase();
          if (normalizedUrl && (urlCount.get(normalizedUrl) || 0) > 1) {
            issues.push({ type: 'duplicate', message: '重复链接' });
          }

          return {
            entryId: entry.id,
            workName: entry.workName,
            cpName: entry.cpName,
            link: entry.link,
            domain: extractDomain(entry.link),
            notes: entry.notes,
            issues,
            hasIssue: issues.length > 0,
          };
        });

        const domainGroupsMap = new Map<string, LinkInfo[]>();
        allLinks.forEach((linkInfo) => {
          const domain = linkInfo.domain;
          if (!domainGroupsMap.has(domain)) {
            domainGroupsMap.set(domain, []);
          }
          domainGroupsMap.get(domain)!.push(linkInfo);
        });

        const domainGroups: LinkDomainGroup[] = Array.from(domainGroupsMap.entries())
          .map(([domain, links]) => ({
            domain,
            links,
            count: links.length,
            issueCount: links.filter((l) => l.hasIssue).length,
          }))
          .sort((a, b) => b.count - a.count);

        return {
          totalLinks: allLinks.filter((l) => l.link).length,
          emptyLinks: allLinks.filter((l) => !l.link.trim()).length,
          duplicateLinks: allLinks.filter((l) => l.issues.some((i) => i.type === 'duplicate')).length,
          invalidLinks: allLinks.filter((l) => l.issues.some((i) => i.type === 'invalid')).length,
          domainGroups,
          allLinks,
        };
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

      openDataAnalysis: () => {
        set({
          isDataAnalysisOpen: true,
          isFormOpen: false,
          isDetailOpen: false,
          isBatchImportOpen: false,
          isTagManagerOpen: false,
          isReadingPlanOpen: false,
          isDuplicateCheckerOpen: false,
          isKanbanOpen: false,
          isLinkManagerOpen: false,
        });
      },

      closeDataAnalysis: () => {
        set({ isDataAnalysisOpen: false });
      },

      analyzeData: (): DataAnalysisResult => {
        const { entries } = get();
        const totalEntries = entries.length;
        const hasData = totalEntries > 0;

        if (!hasData) {
          return {
            totalEntries: 0,
            cpDistribution: [],
            typeDistribution: [],
            readStatusDistribution: [],
            favoriteCount: 0,
            favoritePercentage: 0,
            trendData: [],
            hasData: false,
          };
        }

        const cpCount = new Map<string, number>();
        const typeCount = new Map<EntryType, number>();
        const readStatusCount = new Map<ReadStatus, number>();
        let favoriteCount = 0;

        const dailyCount = new Map<string, number>();
        const now = Date.now();
        const daysToShow = 14;

        for (let i = daysToShow - 1; i >= 0; i--) {
          const date = new Date(now - i * 24 * 60 * 60 * 1000);
          const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
          dailyCount.set(dateStr, 0);
        }

        entries.forEach((entry) => {
          cpCount.set(entry.cpName, (cpCount.get(entry.cpName) || 0) + 1);
          typeCount.set(entry.type, (typeCount.get(entry.type) || 0) + 1);
          readStatusCount.set(entry.readStatus, (readStatusCount.get(entry.readStatus) || 0) + 1);
          if (entry.favorite) favoriteCount++;

          const entryDate = new Date(entry.createdAt);
          const daysDiff = Math.floor((now - entry.createdAt) / (24 * 60 * 60 * 1000));
          if (daysDiff < daysToShow) {
            const dateStr = `${entryDate.getMonth() + 1}/${entryDate.getDate()}`;
            dailyCount.set(dateStr, (dailyCount.get(dateStr) || 0) + 1);
          }
        });

        const cpDistribution: CpDistributionItem[] = Array.from(cpCount.entries())
          .map(([cpName, count]) => ({
            cpName,
            count,
            percentage: Math.round((count / totalEntries) * 100),
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);

        const typeDistribution: TypeDistributionItem[] = ENTRY_TYPES.map((type) => ({
          type,
          count: typeCount.get(type) || 0,
          percentage: Math.round(((typeCount.get(type) || 0) / totalEntries) * 100),
        })).filter((item) => item.count > 0);

        const readStatusDistribution: ReadStatusDistributionItem[] = READ_STATUSES.map((status) => ({
          status,
          count: readStatusCount.get(status) || 0,
          percentage: Math.round(((readStatusCount.get(status) || 0) / totalEntries) * 100),
        }));

        const trendData: TrendDataItem[] = Array.from(dailyCount.entries())
          .map(([date, count]) => ({
            date,
            timestamp: new Date(date).getTime(),
            count,
          }));

        return {
          totalEntries,
          cpDistribution,
          typeDistribution,
          readStatusDistribution,
          favoriteCount,
          favoritePercentage: Math.round((favoriteCount / totalEntries) * 100),
          trendData,
          hasData: true,
        };
      },

      openDuplicateChecker: () => {
        set({
          isDuplicateCheckerOpen: true,
          isFormOpen: false,
          isDetailOpen: false,
          isBatchImportOpen: false,
          isTagManagerOpen: false,
          isReadingPlanOpen: false,
        });
      },

      closeDuplicateChecker: () => {
        set({ isDuplicateCheckerOpen: false });
      },

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
    }),
    {
      name: 'cp-grain-list-data',
      version: CURRENT_SCHEMA_VERSION,
      partialize: (state) => ({
        schemaVersion: CURRENT_SCHEMA_VERSION,
        entries: state.entries,
        customTags: state.customTags,
        filters: state.filters,
        filterFavorites: state.filterFavorites,
        readingPlan: state.readingPlan,
        duplicateGroups: state.duplicateGroups,
        kanbanViewMode: state.kanbanViewMode,
        expandedKanbanGroups: state.expandedKanbanGroups,
      }),
      migrate: (persistedState: unknown, persistedVersion: number) => {
        console.log(`[Migration] 检测到存储版本 v${persistedVersion}，当前版本 v${CURRENT_SCHEMA_VERSION}`);
        
        const result = migrateData(persistedState);
        
        if (!result.success) {
          console.error('[Migration] 数据迁移失败:', result.errors);
          return persistedState;
        }

        if (result.warnings.length > 0) {
          console.warn('[Migration] 数据迁移警告:', result.warnings);
        }

        if (result.fromVersion !== result.toVersion) {
          console.log(`[Migration] 数据迁移完成: v${result.fromVersion} -> v${result.toVersion}`);
        }

        return result.migratedData;
      },
      onRehydrateStorage: () => (state) => {
        if (state) {
          const persistedState = state as unknown as PersistedState;
          
          if (persistedState.schemaVersion !== CURRENT_SCHEMA_VERSION) {
            console.log(`Schema version mismatch: expected ${CURRENT_SCHEMA_VERSION}, got ${persistedState.schemaVersion}`);
          }

          state.filters = {
            ...defaultFilters,
            ...state.filters,
            customTags: state.filters?.customTags || [],
          };
          state.filterFavorites = state.filterFavorites || [];
          state.entries = state.entries?.map((entry) => ({
            ...entry,
            customTags: entry.customTags || [],
          })) || [];
          state.customTags = state.customTags || [];
          state.readingPlan = state.readingPlan || [];
          state.duplicateGroups = state.duplicateGroups || [];
          state.isDuplicateCheckerOpen = false;
          state.isKanbanOpen = false;
          state.kanbanViewMode = state.kanbanViewMode || 'cp';
          state.expandedKanbanGroups = state.expandedKanbanGroups || {};
          if (state.readingPlan.length > 0 && state.entries.length > 0) {
            const entryIds = new Set(state.entries.map((e) => e.id));
            state.readingPlan = state.readingPlan
              .filter((item) => entryIds.has(item.entryId))
              .map((item, idx) => ({ ...item, order: idx + 1 }));
          }
        }
      },
    }
  )
);
