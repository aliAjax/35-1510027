import type { StateCreator } from 'zustand';
import type {
  EntryStore,
  ParsedBatchEntry,
  BatchImportResult,
  EntryType,
  CompletionStatus,
  ReadStatus,
  FlavorTag,
  Entry,
  ImportStrategy,
  Rating,
} from '../../types';
import { ENTRY_TYPES, COMPLETION_STATUSES, READ_STATUSES, FLAVOR_TAGS } from '../../types';
import { generateId } from './utils';

export const createBatchImportSlice: StateCreator<
  EntryStore,
  [],
  [],
  {
    batchImportEntries: (entries: ParsedBatchEntry[]) => void;
    parseBatchText: (text: string) => BatchImportResult;
    parseBatchCSV: (csvText: string) => BatchImportResult;
  }
> = (set, get) => {
  const createParseRow = (
    validTypes: Set<string>,
    validStatuses: Set<string>,
    validReadStatuses: Set<string>,
    validTags: Set<string>,
    customTagMap: Map<string, string>
  ) => {
    return (row: string[], rowNumber: number): ParsedBatchEntry => {
      const errors: string[] = [];
      const warnings: string[] = [];
      const normalizeValue = (val: string): string => val.trim().replace(/^["']|["']$/g, '');

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
        errors.push('类型"' + typeStr + '"不合法');
      } else if (typeStr) {
        type = typeStr as EntryType;
      }

      let status: CompletionStatus = '已完结';
      if (statusStr && !validStatuses.has(statusStr)) {
        errors.push('状态"' + statusStr + '"不合法');
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
        errors.push('标签不合法: ' + invalidTags.join('、'));
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
        warnings.push('自定义标签未找到: ' + unmatchedCustomTags.join('、') + '（请先创建标签再导入）');
      }

      let readStatus: ReadStatus = '未读';
      if (readStatusStr && !validReadStatuses.has(readStatusStr)) {
        errors.push('阅读状态"' + readStatusStr + '"不合法');
      } else if (readStatusStr) {
        readStatus = readStatusStr as ReadStatus;
      }

      const favorite = favoriteStr === 'true' || favoriteStr === '是' || favoriteStr === 'yes' || favoriteStr === '1';

      let rating: Rating = 0;
      const ratingStr = normalizeValue(row[11] || '');
      if (ratingStr) {
        const ratingNum = parseInt(ratingStr, 10);
        if (!isNaN(ratingNum) && ratingNum >= 1 && ratingNum <= 5) {
          rating = ratingNum as Rating;
        } else if (ratingStr !== '0' && ratingStr !== '') {
          warnings.push('评分"' + ratingStr + '"不合法，应为1-5的数字，已设为未评分');
        }
      }

      let revisitDate: number | null = null;
      const revisitDateStr = normalizeValue(row[12] || '');
      if (revisitDateStr) {
        const parsedDate = new Date(revisitDateStr);
        if (!isNaN(parsedDate.getTime())) {
          revisitDate = parsedDate.getTime();
        } else {
          warnings.push('重温日期"' + revisitDateStr + '"格式错误，已忽略');
        }
      }

      const isValid = errors.length === 0;
      const duplicates = isValid ? get().checkForDuplicates({ workName, cpName, link, author }) : [];

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
        rating,
        revisitDate,
        isValid,
        errors,
        warnings,
        duplicates,
        importStrategy: 'merge' as ImportStrategy,
      };
    };
  };

  return {
    batchImportEntries: (parsedEntries: ParsedBatchEntry[]) => {
      const validEntries = parsedEntries.filter((e) => e.isValid);
      const now = Date.now();

      const toAdd: Entry[] = [];
      const toUpdate: { id: string; updates: Partial<Entry> }[] = [];

      validEntries.forEach((entry, entryIndex) => {
        if (entry.importStrategy === 'skip' && entry.duplicates.length > 0) {
          return;
        }

        const primaryDuplicate = entry.duplicates[0];

        if (entry.importStrategy === 'overwrite' && primaryDuplicate) {
          toUpdate.push({
            id: primaryDuplicate.entry.id,
            updates: {
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
              rating: entry.rating,
              revisitDate: entry.revisitDate,
              updatedAt: now,
            },
          });
        } else if (entry.importStrategy === 'merge' && primaryDuplicate) {
          const existing = primaryDuplicate.entry;
          const mergedTags = Array.from(new Set([...existing.tags, ...entry.tags]));
          const mergedCustomTags = Array.from(new Set([...existing.customTags, ...entry.customTags]));
          const mergedNotes = [existing.notes, entry.notes].filter(Boolean).join('\n\n---\n\n');
          const mergedFavorite = existing.favorite || entry.favorite;
          const mergedRating = entry.rating > 0 ? entry.rating : existing.rating;
          const mergedRevisitDate = entry.revisitDate || existing.revisitDate;

          toUpdate.push({
            id: existing.id,
            updates: {
              tags: mergedTags,
              customTags: mergedCustomTags,
              notes: mergedNotes,
              favorite: mergedFavorite,
              rating: mergedRating,
              revisitDate: mergedRevisitDate,
              updatedAt: now,
            },
          });
        } else {
          toAdd.push({
            id: generateId() + entryIndex.toString(),
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
            rating: entry.rating,
            revisitDate: entry.revisitDate,
            createdAt: now - entryIndex,
            updatedAt: now,
          });
        }
      });

      set((state) => {
        let updatedEntries = [...state.entries];

        toUpdate.forEach(({ id, updates }) => {
          updatedEntries = updatedEntries.map((e) =>
            e.id === id ? { ...e, ...updates } : e
          );
        });

        const finalEntries = [...toAdd, ...updatedEntries];

        return {
          entries: finalEntries,
          isBatchImportOpen: false,
        };
      });
    },

    parseBatchText: (text: string): BatchImportResult => {
      const validTypes = new Set<string>(ENTRY_TYPES);
      const validStatuses = new Set<string>(COMPLETION_STATUSES);
      const validReadStatuses = new Set<string>(READ_STATUSES);
      const validTags = new Set<string>(FLAVOR_TAGS);
      const { customTags } = get();
      const customTagMap = new Map(customTags.map((t) => [t.name.toLowerCase(), t.id]));
      const parseRow = createParseRow(validTypes, validStatuses, validReadStatuses, validTags, customTagMap);

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
      const parseRow = createParseRow(validTypes, validStatuses, validReadStatuses, validTags, customTagMap);

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
  };
};
