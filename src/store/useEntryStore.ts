import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Entry, EntryStore, FilterState, BackupData, ImportResult, EntryType, ReadStatus, FlavorTag, ParsedBatchEntry, BatchImportResult, CompletionStatus } from '../types';
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
      isBatchImportOpen: false,

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

        const validTypes = new Set<string>(ENTRY_TYPES);
        const validStatuses = new Set<string>(COMPLETION_STATUSES);
        const validReadStatuses = new Set<string>(READ_STATUSES);
        const validTags = new Set<string>(FLAVOR_TAGS);

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
            tags: rawFilters.tags as FlavorTag[],
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
          const readStatusStr = normalizeValue(row[7] || '');
          const notes = normalizeValue(row[8] || '');
          const favoriteStr = normalizeValue(row[9] || '').toLowerCase();

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
            warnings.push(`标签不合法: ${invalidTags.join('、')}`);
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
          ['作品名', 'cp名', '类型', '链接', '作者', '状态', '标签', '阅读状态', '备注', '收藏'].includes(
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
          const readStatusStr = normalizeValue(row[7] || '');
          const notes = normalizeValue(row[8] || '');
          const favoriteStr = normalizeValue(row[9] || '').toLowerCase();

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
            warnings.push(`标签不合法: ${invalidTags.join('、')}`);
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
          ['作品名', 'cp名', '类型', '链接', '作者', '状态', '标签', '阅读状态', '备注', '收藏'].includes(
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
