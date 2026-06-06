import type { StateCreator } from 'zustand';
import type {
  EntryStore,
  BackupData,
  ImportResult,
  EntryType,
  CompletionStatus,
  ReadStatus,
  FlavorTag,
  CustomTag,
  ReadingPlanItem,
  FilterFavorite,
  KanbanViewMode,
  RatingFilter,
  Entry,
} from '../../types';
import { ENTRY_TYPES, COMPLETION_STATUSES, READ_STATUSES, FLAVOR_TAGS } from '../../types';
import { defaultFilters } from './utils';

export const createImportExportSlice: StateCreator<
  EntryStore,
  [],
  [],
  {
    exportData: () => BackupData;
    validateAndParseImport: (jsonString: string) => ImportResult;
    importData: (data: BackupData, merge: boolean) => void;
  }
> = (set, get) => ({
  exportData: () => {
    const { entries, customTags, filters, readingPlan, filterFavorites, kanbanViewMode } = get();
    return {
      version: '1.1',
      exportedAt: Date.now(),
      entries,
      customTags,
      filters,
      readingPlan,
      filterFavorites,
      kanbanViewMode,
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
        readingPlanCount: 0,
        filterFavoritesCount: 0,
        hasKanbanViewMode: false,
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
        readingPlanCount: 0,
        filterFavoritesCount: 0,
        hasKanbanViewMode: false,
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
        readingPlanCount: 0,
        filterFavoritesCount: 0,
        hasKanbanViewMode: false,
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
      if (typeof rawFilters.type !== 'string' || (rawFilters.type !== 'all' && !validTypes.has(rawFilters.type as string))) {
        warnings.push(`筛选配置 type 缺失或值无效: ${String(rawFilters.type)}，已使用默认值`);
        rawFilters.type = 'all';
      }
      if (typeof rawFilters.status !== 'string' || (rawFilters.status !== 'all' && !validStatuses.has(rawFilters.status as string))) {
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
      if (typeof rawFilters.readStatus !== 'string' || (rawFilters.readStatus !== 'all' && !validReadStatuses.has(rawFilters.readStatus as string))) {
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
        rating: (rawFilters.rating as unknown as RatingFilter) ?? 'all',
        revisitDateFrom: (rawFilters.revisitDateFrom as number | null) ?? null,
        revisitDateTo: (rawFilters.revisitDateTo as number | null) ?? null,
        hasRevisitDate: (rawFilters.hasRevisitDate as boolean | 'all') ?? 'all',
        searchKeyword: rawFilters.searchKeyword as string,
        dateFrom: (rawFilters.dateFrom as number | null) ?? null,
        dateTo: (rawFilters.dateTo as number | null) ?? null,
      };
    }

    const rawData = data as unknown as Record<string, unknown>;
    const validKanbanModes: KanbanViewMode[] = ['cp', 'work', 'readStatus', 'type'];
    let hasKanbanViewMode = false;
    let readingPlanCount = 0;
    let filterFavoritesCount = 0;

    if (!Array.isArray(rawData.readingPlan)) {
      warnings.push('阅读计划数据缺失或格式错误，将使用空数组');
      (data as unknown as Record<string, unknown>).readingPlan = [];
    } else {
      const validPlanItemStatuses = new Set<string>(['planned', 'done', 'skipped']);
      const rawPlan = rawData.readingPlan as unknown[];
      const validPlanItems: ReadingPlanItem[] = [];
      rawPlan.forEach((item) => {
        if (item && typeof item === 'object'
          && 'entryId' in item && typeof (item as Record<string, unknown>).entryId === 'string'
          && 'addedAt' in item && typeof (item as Record<string, unknown>).addedAt === 'number'
          && 'order' in item && typeof (item as Record<string, unknown>).order === 'number'
          && 'status' in item && typeof (item as Record<string, unknown>).status === 'string'
          && validPlanItemStatuses.has((item as Record<string, unknown>).status as string)
        ) {
          validPlanItems.push(item as ReadingPlanItem);
        }
      });
      if (validPlanItems.length !== rawPlan.length) {
        warnings.push(`阅读计划中已移除 ${rawPlan.length - validPlanItems.length} 个无效项`);
      }
      (data as unknown as Record<string, unknown>).readingPlan = validPlanItems;
      readingPlanCount = validPlanItems.length;
    }

    if (!Array.isArray(rawData.filterFavorites)) {
      warnings.push('筛选收藏数据缺失或格式错误，将使用空数组');
      (data as unknown as Record<string, unknown>).filterFavorites = [];
    } else {
      const rawFavorites = rawData.filterFavorites as unknown[];
      const validFavorites: FilterFavorite[] = [];
      const seenFavIds = new Set<string>();
      rawFavorites.forEach((fav) => {
        if (fav && typeof fav === 'object'
          && 'id' in fav && typeof (fav as Record<string, unknown>).id === 'string'
          && 'name' in fav && typeof (fav as Record<string, unknown>).name === 'string'
          && 'filters' in fav && (fav as Record<string, unknown>).filters && typeof (fav as Record<string, unknown>).filters === 'object'
        ) {
          const favId = (fav as Record<string, unknown>).id as string;
          if (!seenFavIds.has(favId)) {
            seenFavIds.add(favId);
            const favFilters = (fav as Record<string, unknown>).filters as Record<string, unknown>;
            if (favFilters.rating === undefined) favFilters.rating = 'all';
            if (favFilters.revisitDateFrom === undefined) favFilters.revisitDateFrom = null;
            if (favFilters.revisitDateTo === undefined) favFilters.revisitDateTo = null;
            if (favFilters.hasRevisitDate === undefined) favFilters.hasRevisitDate = 'all';
            validFavorites.push(fav as FilterFavorite);
          }
        }
      });
      if (validFavorites.length !== rawFavorites.length) {
        warnings.push(`筛选收藏中已移除 ${rawFavorites.length - validFavorites.length} 个无效项`);
      }
      (data as unknown as Record<string, unknown>).filterFavorites = validFavorites;
      filterFavoritesCount = validFavorites.length;
    }

    if (!rawData.kanbanViewMode || typeof rawData.kanbanViewMode !== 'string' || !validKanbanModes.includes(rawData.kanbanViewMode as KanbanViewMode)) {
      warnings.push('看板分组模式缺失或格式错误，将使用默认值');
      (data as unknown as Record<string, unknown>).kanbanViewMode = 'cp';
    } else {
      hasKanbanViewMode = true;
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
      } else if (seenIds.has(entry.id as string)) {
        warnings.push(`${label}id 与已有条目重复: ${entry.id}`);
      } else {
        seenIds.add(entry.id as string);
      }
      if (typeof entry.workName !== 'string' || !entry.workName.trim()) {
        errors.push(`${label}缺少作品名称`);
      }
      if (typeof entry.cpName !== 'string' || !entry.cpName.trim()) {
        errors.push(`${label}缺少 CP 名称`);
      }
      if (typeof entry.type !== 'string' || !entry.type) {
        errors.push(`${label}缺少类型`);
      } else if (!validTypes.has(entry.type as string)) {
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
      } else if (!validStatuses.has(entry.status as string)) {
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
      } else if (!validReadStatuses.has(entry.readStatus as string)) {
        errors.push(`${label}阅读状态无效: ${entry.readStatus}`);
      }
      if (typeof entry.notes !== 'string') {
        warnings.push(`${label}备注格式错误`);
      }
      if (typeof entry.favorite !== 'boolean') {
        warnings.push(`${label}收藏标记格式错误`);
      }
      const rawEntry = entry as unknown as Record<string, unknown>;
      if (rawEntry.rating === undefined) {
        rawEntry.rating = 0;
      } else if (typeof rawEntry.rating !== 'number' || rawEntry.rating < 0 || rawEntry.rating > 5) {
        warnings.push(`${label}评分格式错误，已使用默认值`);
        rawEntry.rating = 0;
      }
      if (rawEntry.revisitDate === undefined) {
        rawEntry.revisitDate = null;
      } else if (rawEntry.revisitDate !== null && (typeof rawEntry.revisitDate !== 'number' || rawEntry.revisitDate <= 0)) {
        warnings.push(`${label}重温日期格式错误，已使用默认值`);
        rawEntry.revisitDate = null;
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
      readingPlanCount,
      filterFavoritesCount,
      hasKanbanViewMode,
      errors,
      warnings,
      data,
    };
  },

  importData: (data: BackupData, merge: boolean) => {
    if (merge) {
      const { entries: currentEntries, customTags: currentTags, filterFavorites: currentFilterFavorites } = get();
      const currentIds = new Set(currentEntries.map((e) => e.id));
      const currentTagIds = new Set(currentTags.map((t) => t.id));
      const currentFavIds = new Set(currentFilterFavorites.map((f) => f.id));
      const newEntries = data.entries.filter((e) => !currentIds.has(e.id));
      const newCustomTags = data.customTags.filter((t) => !currentTagIds.has(t.id));
      const newFilterFavorites = data.filterFavorites.filter((f) => !currentFavIds.has(f.id));
      const existingPlanIds = new Set(get().readingPlan.map((p) => p.entryId));
      const newPlanItems = data.readingPlan
        .filter((p) => currentIds.has(p.entryId) || newEntries.some((e) => e.id === p.entryId))
        .filter((p) => !existingPlanIds.has(p.entryId))
        .map((p, idx, arr) => ({ ...p, order: get().readingPlan.length + arr.length - idx }));
      set((state) => ({
        entries: [...newEntries, ...state.entries],
        customTags: [...newCustomTags, ...state.customTags],
        filters: data.filters,
        readingPlan: [...newPlanItems, ...state.readingPlan],
        filterFavorites: [...newFilterFavorites, ...state.filterFavorites],
        kanbanViewMode: data.kanbanViewMode,
      }));
    } else {
      const newEntryIds = new Set(data.entries.map((e) => e.id));
      set({
        entries: data.entries,
        customTags: data.customTags,
        filters: data.filters,
        readingPlan: data.readingPlan
          .filter((item) => newEntryIds.has(item.entryId))
          .map((item, idx) => ({ ...item, order: idx + 1 })),
        filterFavorites: data.filterFavorites,
        kanbanViewMode: data.kanbanViewMode,
      });
    }
  },
});
