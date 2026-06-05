import type { Entry, FilterState, CustomTag, ReadingPlanItem, DuplicateGroup, KanbanViewMode, SortOption, FilterFavorite, Rating } from '../types';
import { ENTRY_TYPES, COMPLETION_STATUSES, READ_STATUSES, FLAVOR_TAGS } from '../types';

export const CURRENT_SCHEMA_VERSION = 3;
export const STORAGE_KEY = 'cp-grain-list-data';
export const BACKUP_KEY = 'cp-grain-list-data-backup';
export const MIGRATION_INFO_KEY = 'cp-grain-list-migration-info';

export interface PersistedStateV0 {
  entries?: unknown[];
  customTags?: unknown[];
  filters?: unknown;
  readingPlan?: unknown[];
  duplicateGroups?: unknown[];
  kanbanViewMode?: string;
  expandedKanbanGroups?: Record<string, boolean>;
}

export interface PersistedStateV1 {
  schemaVersion: 1;
  entries: Entry[];
  customTags: CustomTag[];
  filters: FilterState;
  readingPlan: ReadingPlanItem[];
  duplicateGroups: DuplicateGroup[];
  kanbanViewMode: KanbanViewMode;
  expandedKanbanGroups: Record<string, boolean>;
}

export interface PersistedStateV2 {
  schemaVersion: 2;
  entries: Entry[];
  customTags: CustomTag[];
  filters: FilterState;
  filterFavorites: FilterFavorite[];
  readingPlan: ReadingPlanItem[];
  duplicateGroups: DuplicateGroup[];
  kanbanViewMode: KanbanViewMode;
  expandedKanbanGroups: Record<string, boolean>;
  sortOption: SortOption;
}

export interface PersistedStateV3 {
  schemaVersion: 3;
  entries: Entry[];
  customTags: CustomTag[];
  filters: FilterState;
  filterFavorites: FilterFavorite[];
  readingPlan: ReadingPlanItem[];
  duplicateGroups: DuplicateGroup[];
  kanbanViewMode: KanbanViewMode;
  expandedKanbanGroups: Record<string, boolean>;
  sortOption: SortOption;
}

export type PersistedState = PersistedStateV3;

export interface MigrationResult {
  success: boolean;
  fromVersion: number;
  toVersion: number;
  warnings: string[];
  errors: string[];
  migratedData?: PersistedState;
  backupCreated?: boolean;
  backupKey?: string;
}

export interface MigrationInfo {
  lastMigration: number;
  lastMigrationResult: MigrationResult | null;
  pendingRestore: boolean;
  lastBackupKey: string | null;
}

const defaultFilters: FilterState = {
  cpName: '',
  type: 'all',
  status: 'all',
  tags: [],
  customTags: [],
  readStatus: 'all',
  favoriteOnly: false,
  rating: 'all',
  revisitDateFrom: null,
  revisitDateTo: null,
  hasRevisitDate: 'all',
  searchKeyword: '',
  dateFrom: null,
  dateTo: null,
};

const defaultEntry: Omit<Entry, 'id' | 'workName' | 'cpName' | 'createdAt' | 'updatedAt'> = {
  type: '同人文',
  link: '',
  author: '',
  status: '已完结',
  tags: [],
  customTags: [],
  readStatus: '未读',
  notes: '',
  favorite: false,
  rating: 0,
  revisitDate: null,
};

function isValidEntryType(value: unknown): value is Entry['type'] {
  return typeof value === 'string' && ENTRY_TYPES.includes(value as Entry['type']);
}

function isValidCompletionStatus(value: unknown): value is Entry['status'] {
  return typeof value === 'string' && COMPLETION_STATUSES.includes(value as Entry['status']);
}

function isValidReadStatus(value: unknown): value is Entry['readStatus'] {
  return typeof value === 'string' && READ_STATUSES.includes(value as Entry['readStatus']);
}

function isValidFlavorTag(value: unknown): value is Entry['tags'][number] {
  return typeof value === 'string' && FLAVOR_TAGS.includes(value as Entry['tags'][number]);
}

function isValidKanbanViewMode(value: unknown): value is KanbanViewMode {
  return typeof value === 'string' && ['cp', 'work', 'readStatus', 'type'].includes(value);
}

export function validateAndFixEntry(rawEntry: unknown, index: number, warnings: string[]): Entry | null {
  if (!rawEntry || typeof rawEntry !== 'object' || Array.isArray(rawEntry)) {
    warnings.push(`条目 ${index + 1}: 不是有效对象，已跳过`);
    return null;
  }

  const entry = rawEntry as Record<string, unknown>;
  const workName = typeof entry.workName === 'string' ? entry.workName : '';
  const label = workName ? `「${workName}」` : `条目 ${index + 1}`;

  const id = typeof entry.id === 'string' && entry.id ? entry.id : `migrated-${Date.now()}-${index}`;
  if (typeof entry.id !== 'string' || !entry.id) {
    warnings.push(`${label}: 缺少有效 id，已自动生成`);
  }

  if (typeof entry.workName !== 'string' || !entry.workName.trim()) {
    warnings.push(`${label}: 缺少作品名称，已跳过`);
    return null;
  }

  if (typeof entry.cpName !== 'string' || !entry.cpName.trim()) {
    warnings.push(`${label}: 缺少 CP 名称，已跳过`);
    return null;
  }

  let type: Entry['type'] = defaultEntry.type;
  if (isValidEntryType(entry.type)) {
    type = entry.type;
  } else {
    warnings.push(`${label}: 类型"${entry.type}"无效，已设为默认值"同人文"`);
  }

  const link = typeof entry.link === 'string' ? entry.link : defaultEntry.link;
  const author = typeof entry.author === 'string' ? entry.author : defaultEntry.author;

  let status: Entry['status'] = defaultEntry.status;
  if (isValidCompletionStatus(entry.status)) {
    status = entry.status;
  } else {
    warnings.push(`${label}: 完成状态"${entry.status}"无效，已设为默认值"已完结"`);
  }

  let tags: Entry['tags'] = [];
  if (Array.isArray(entry.tags)) {
    tags = entry.tags.filter((tag): tag is Entry['tags'][number] => {
      if (!isValidFlavorTag(tag)) {
        warnings.push(`${label}: 包含无效标签"${String(tag)}"，已移除`);
        return false;
      }
      return true;
    });
  } else {
    warnings.push(`${label}: 标签格式错误，已重置为空数组`);
  }

  let customTags: string[] = [];
  if (Array.isArray(entry.customTags)) {
    customTags = entry.customTags.filter((tag): tag is string => typeof tag === 'string');
  }

  let readStatus: Entry['readStatus'] = defaultEntry.readStatus;
  if (isValidReadStatus(entry.readStatus)) {
    readStatus = entry.readStatus;
  } else {
    warnings.push(`${label}: 阅读状态"${entry.readStatus}"无效，已设为默认值"未读"`);
  }

  const notes = typeof entry.notes === 'string' ? entry.notes : defaultEntry.notes;
  const favorite = typeof entry.favorite === 'boolean' ? entry.favorite : defaultEntry.favorite;

  let rating: Rating = defaultEntry.rating;
  if (typeof entry.rating === 'number' && [0, 1, 2, 3, 4, 5].includes(entry.rating)) {
    rating = entry.rating as Rating;
  } else if (entry.rating !== undefined) {
    warnings.push(`${label}: 评分格式错误，已设为默认值`);
  }

  let revisitDate: number | null = defaultEntry.revisitDate;
  if (entry.revisitDate === null || entry.revisitDate === undefined) {
    revisitDate = null;
  } else if (typeof entry.revisitDate === 'number' && entry.revisitDate > 0) {
    revisitDate = entry.revisitDate;
  } else {
    warnings.push(`${label}: 重温日期格式错误，已设为默认值`);
  }

  const createdAt = typeof entry.createdAt === 'number' && entry.createdAt > 0 ? entry.createdAt : Date.now() - index * 1000;
  const updatedAt = typeof entry.updatedAt === 'number' && entry.updatedAt > 0 ? entry.updatedAt : Date.now();

  return {
    id,
    workName: entry.workName,
    cpName: entry.cpName,
    type,
    link,
    author,
    status,
    tags,
    customTags,
    readStatus,
    notes,
    favorite,
    rating,
    revisitDate,
    createdAt,
    updatedAt,
  };
}

export function validateAndFixFilters(rawFilters: unknown, warnings: string[]): FilterState {
  const filters: FilterState = { ...defaultFilters };

  if (!rawFilters || typeof rawFilters !== 'object' || Array.isArray(rawFilters)) {
    warnings.push('筛选配置格式错误，已重置为默认值');
    return filters;
  }

  const raw = rawFilters as Record<string, unknown>;

  if (typeof raw.cpName === 'string') {
    filters.cpName = raw.cpName;
  }

  if (raw.type === 'all' || isValidEntryType(raw.type)) {
    filters.type = raw.type as FilterState['type'];
  }

  if (Array.isArray(raw.tags)) {
    filters.tags = raw.tags.filter(isValidFlavorTag);
  }

  if (Array.isArray(raw.customTags)) {
    filters.customTags = raw.customTags.filter((tag): tag is string => typeof tag === 'string');
  }

  if (raw.readStatus === 'all' || isValidReadStatus(raw.readStatus)) {
    filters.readStatus = raw.readStatus as FilterState['readStatus'];
  }

  if (typeof raw.favoriteOnly === 'boolean') {
    filters.favoriteOnly = raw.favoriteOnly;
  }

  const validRatingFilters = ['all', 'rated', 'unrated', 0, 1, 2, 3, 4, 5];
  if (validRatingFilters.includes(raw.rating as string | number)) {
    filters.rating = raw.rating as FilterState['rating'];
  }

  if (typeof raw.revisitDateFrom === 'number' && raw.revisitDateFrom > 0) {
    filters.revisitDateFrom = raw.revisitDateFrom;
  }
  if (typeof raw.revisitDateTo === 'number' && raw.revisitDateTo > 0) {
    filters.revisitDateTo = raw.revisitDateTo;
  }

  if (raw.hasRevisitDate === true || raw.hasRevisitDate === false || raw.hasRevisitDate === 'all') {
    filters.hasRevisitDate = raw.hasRevisitDate;
  }

  if (typeof raw.searchKeyword === 'string') {
    filters.searchKeyword = raw.searchKeyword;
  }

  return filters;
}

export function validateAndFixCustomTags(rawTags: unknown, warnings: string[]): CustomTag[] {
  if (!Array.isArray(rawTags)) {
    if (rawTags !== undefined) {
      warnings.push('自定义标签格式错误，已重置为空');
    }
    return [];
  }

  return rawTags
    .map((tag: unknown, index: number): CustomTag | null => {
      if (!tag || typeof tag !== 'object' || Array.isArray(tag)) {
        warnings.push(`自定义标签 ${index + 1}: 格式错误，已跳过`);
        return null;
      }

      const t = tag as Record<string, unknown>;

      const id = typeof t.id === 'string' && t.id ? t.id : `custom-tag-${Date.now()}-${index}`;
      if (typeof t.id !== 'string' || !t.id) {
        warnings.push(`自定义标签 ${index + 1}: 缺少有效 id，已自动生成`);
      }

      if (typeof t.name !== 'string' || !t.name.trim()) {
        warnings.push(`自定义标签 ${index + 1}: 缺少名称，已跳过`);
        return null;
      }

      const color = typeof t.color === 'string' ? t.color : 'blue';
      const createdAt = typeof t.createdAt === 'number' && t.createdAt > 0 ? t.createdAt : Date.now();

      return { id, name: t.name, color, createdAt };
    })
    .filter((t): t is CustomTag => t !== null);
}

export function validateAndFixReadingPlan(
  rawPlan: unknown,
  entryIds: Set<string>,
  warnings: string[]
): ReadingPlanItem[] {
  if (!Array.isArray(rawPlan)) {
    if (rawPlan !== undefined) {
      warnings.push('阅读计划格式错误，已重置为空');
    }
    return [];
  }

  const validItems: ReadingPlanItem[] = [];
  let order = 1;

  rawPlan.forEach((item: unknown, index: number) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      warnings.push(`阅读计划项 ${index + 1}: 格式错误，已跳过`);
      return;
    }

    const i = item as Record<string, unknown>;

    if (typeof i.entryId !== 'string' || !entryIds.has(i.entryId)) {
      warnings.push(`阅读计划项 ${index + 1}: 引用的条目不存在，已跳过`);
      return;
    }

    validItems.push({
      entryId: i.entryId,
      addedAt: typeof i.addedAt === 'number' && i.addedAt > 0 ? i.addedAt : Date.now(),
      order: order++,
      status: i.status === 'done' || i.status === 'skipped' ? i.status : 'planned',
    });
  });

  return validItems;
}

export function validateAndFixDuplicateGroups(
  rawGroups: unknown,
  entryIds: Set<string>,
  warnings: string[]
): DuplicateGroup[] {
  if (!Array.isArray(rawGroups)) {
    return [];
  }

  return rawGroups
    .map((group: unknown, index: number): DuplicateGroup | null => {
      if (!group || typeof group !== 'object' || Array.isArray(group)) {
        warnings.push(`重复检查组 ${index + 1}: 格式错误，已跳过`);
        return null;
      }

      const g = group as Record<string, unknown>;

      const id = typeof g.id === 'string' && g.id ? g.id : `dup-group-${Date.now()}-${index}`;

      if (!Array.isArray(g.entries)) {
        warnings.push(`重复检查组 ${index + 1}: 条目列表格式错误，已跳过`);
        return null;
      }

      const entries = g.entries.filter((e): e is Entry => {
        return (
          e &&
          typeof e === 'object' &&
          'id' in e &&
          typeof (e as Record<string, unknown>).id === 'string' &&
          entryIds.has((e as Record<string, unknown>).id as string)
        );
      });

      if (entries.length < 2) {
        return null;
      }

      return {
        id,
        entries,
        matchScore: typeof g.matchScore === 'number' ? g.matchScore : 0,
        matchReasons: Array.isArray(g.matchReasons)
          ? g.matchReasons.filter((r): r is string => typeof r === 'string')
          : [],
        ignored: typeof g.ignored === 'boolean' ? g.ignored : false,
      };
    })
    .filter((g): g is DuplicateGroup => g !== null);
}

export function migrateV0ToV1(data: PersistedStateV0, warnings: string[]): PersistedStateV1 {
  const entries: Entry[] = [];
  const seenIds = new Set<string>();

  if (Array.isArray(data.entries)) {
    data.entries.forEach((rawEntry, index) => {
      const entry = validateAndFixEntry(rawEntry, index, warnings);
      if (entry) {
        if (seenIds.has(entry.id)) {
          warnings.push(`发现重复 id: ${entry.id}，已重新生成`);
          entry.id = `dup-${entry.id}-${Date.now()}-${index}`;
        }
        seenIds.add(entry.id);
        entries.push(entry);
      }
    });
  }

  const entryIds = new Set(entries.map((e) => e.id));

  return {
    schemaVersion: 1,
    entries,
    customTags: validateAndFixCustomTags(data.customTags, warnings),
    filters: validateAndFixFilters(data.filters, warnings),
    readingPlan: validateAndFixReadingPlan(data.readingPlan, entryIds, warnings),
    duplicateGroups: validateAndFixDuplicateGroups(data.duplicateGroups, entryIds, warnings),
    kanbanViewMode: isValidKanbanViewMode(data.kanbanViewMode) ? data.kanbanViewMode : 'cp',
    expandedKanbanGroups:
      data.expandedKanbanGroups && typeof data.expandedKanbanGroups === 'object'
        ? data.expandedKanbanGroups
        : {},
  };
}

export function migrateV1ToV2(data: PersistedStateV1, warnings: string[]): PersistedStateV2 {
  const entryIds = new Set(data.entries.map((e) => e.id));

  return {
    schemaVersion: 2,
    entries: data.entries.map((entry) => {
      const newEntry = { ...entry };
      if (!Array.isArray(newEntry.customTags)) {
        warnings.push(`条目「${entry.workName}」: customTags 格式错误，已重置`);
        newEntry.customTags = [];
      }
      return newEntry;
    }),
    customTags: validateAndFixCustomTags(data.customTags, warnings),
    filters: validateAndFixFilters(data.filters, warnings),
    filterFavorites: [],
    readingPlan: validateAndFixReadingPlan(data.readingPlan, entryIds, warnings),
    duplicateGroups: validateAndFixDuplicateGroups(data.duplicateGroups, entryIds, warnings),
    kanbanViewMode: isValidKanbanViewMode(data.kanbanViewMode) ? data.kanbanViewMode : 'cp',
    expandedKanbanGroups: data.expandedKanbanGroups || {},
    sortOption: 'createdAtDesc',
  };
}

export function migrateV2ToV3(data: PersistedStateV2, warnings: string[]): PersistedStateV3 {
  const entryIds = new Set(data.entries.map((e) => e.id));

  return {
    schemaVersion: 3,
    entries: data.entries.map((entry) => ({
      ...entry,
      rating: (entry as unknown as { rating?: Rating }).rating ?? 0,
      revisitDate: (entry as unknown as { revisitDate?: number | null }).revisitDate ?? null,
    })),
    customTags: validateAndFixCustomTags(data.customTags, warnings),
    filters: validateAndFixFilters(data.filters, warnings),
    filterFavorites: data.filterFavorites.map((fav) => ({
      ...fav,
      filters: validateAndFixFilters(fav.filters, warnings),
    })),
    readingPlan: validateAndFixReadingPlan(data.readingPlan, entryIds, warnings),
    duplicateGroups: validateAndFixDuplicateGroups(data.duplicateGroups, entryIds, warnings),
    kanbanViewMode: isValidKanbanViewMode(data.kanbanViewMode) ? data.kanbanViewMode : 'cp',
    expandedKanbanGroups: data.expandedKanbanGroups || {},
    sortOption: data.sortOption || 'createdAtDesc',
  };
}

export function getSchemaVersion(data: unknown): number {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return 0;
  }
  const obj = data as Record<string, unknown>;
  if (typeof obj.schemaVersion === 'number') {
    return obj.schemaVersion;
  }
  return 0;
}

export function createBackup(data: unknown): string {
  const backupKey = `${BACKUP_KEY}-${Date.now()}`;
  try {
    localStorage.setItem(backupKey, JSON.stringify(data));
    return backupKey;
  } catch {
    console.error('Failed to create backup');
    return '';
  }
}

export function restoreFromBackup(backupKey: string): boolean {
  try {
    const backupData = localStorage.getItem(backupKey);
    if (backupData) {
      localStorage.setItem(STORAGE_KEY, backupData);
      return true;
    }
    return false;
  } catch (e) {
    console.error('Failed to restore backup:', e);
    return false;
  }
}

export function listBackups(): string[] {
  const backups: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(BACKUP_KEY)) {
      backups.push(key);
    }
  }
  return backups.sort().reverse();
}

export function deleteBackup(backupKey: string): void {
  localStorage.removeItem(backupKey);
}

export function getMigrationInfo(): MigrationInfo {
  try {
    const info = localStorage.getItem(MIGRATION_INFO_KEY);
    if (info) {
      return JSON.parse(info);
    }
  } catch (e) {
    console.error('Failed to read migration info:', e);
  }
  return {
    lastMigration: 0,
    lastMigrationResult: null,
    pendingRestore: false,
    lastBackupKey: null,
  };
}

export function saveMigrationInfo(info: MigrationInfo): void {
  try {
    localStorage.setItem(MIGRATION_INFO_KEY, JSON.stringify(info));
  } catch (e) {
    console.error('Failed to save migration info:', e);
  }
}

function recordMigrationResult(
  result: MigrationResult,
  backupKey: string
): void {
  const info = getMigrationInfo();
  info.lastMigration = Date.now();
  info.lastMigrationResult = result;
  info.pendingRestore = !result.success && result.backupCreated;
  info.lastBackupKey = backupKey || info.lastBackupKey;
  saveMigrationInfo(info);
}

export function migrateData(rawData: unknown): MigrationResult {
  const warnings: string[] = [];
  const errors: string[] = [];
  const fromVersion = getSchemaVersion(rawData);

  let backupKey = '';
  let backupCreated = false;

  if (fromVersion !== CURRENT_SCHEMA_VERSION) {
    try {
      backupKey = createBackup(rawData);
      backupCreated = !!backupKey;
      if (backupCreated) {
        warnings.push(`已创建数据备份: ${backupKey}`);
      }
    } catch {
      errors.push('创建备份失败');
    }
  }

  try {
    let migratedData: PersistedStateV0 | PersistedStateV1 | PersistedStateV2 | PersistedStateV3;

    if (fromVersion === 0) {
      migratedData = migrateV0ToV1(rawData as PersistedStateV0, warnings);
      migratedData = migrateV1ToV2(migratedData as PersistedStateV1, warnings);
      migratedData = migrateV2ToV3(migratedData as PersistedStateV2, warnings);
    } else if (fromVersion === 1) {
      migratedData = migrateV1ToV2(rawData as PersistedStateV1, warnings);
      migratedData = migrateV2ToV3(migratedData as PersistedStateV2, warnings);
    } else if (fromVersion === 2) {
      migratedData = migrateV2ToV3(rawData as PersistedStateV2, warnings);
    } else if (fromVersion === CURRENT_SCHEMA_VERSION) {
      const result: MigrationResult = {
        success: true,
        fromVersion,
        toVersion: CURRENT_SCHEMA_VERSION,
        warnings: [],
        errors: [],
        migratedData: rawData as PersistedState,
        backupCreated: false,
      };
      recordMigrationResult(result, '');
      return result;
    } else {
      errors.push(`不支持从版本 ${fromVersion} 迁移`);
      const result: MigrationResult = {
        success: false,
        fromVersion,
        toVersion: CURRENT_SCHEMA_VERSION,
        warnings,
        errors,
        backupCreated,
        backupKey,
      };
      recordMigrationResult(result, backupKey);
      return result;
    }

    const result: MigrationResult = {
      success: true,
      fromVersion,
      toVersion: CURRENT_SCHEMA_VERSION,
      warnings,
      errors: [],
      migratedData: migratedData as PersistedState,
      backupCreated,
      backupKey,
    };
    recordMigrationResult(result, backupKey);
    return result;
  } catch (e) {
    errors.push(`迁移失败: ${e instanceof Error ? e.message : String(e)}`);

    const result: MigrationResult = {
      success: false,
      fromVersion,
      toVersion: CURRENT_SCHEMA_VERSION,
      warnings,
      errors,
      backupCreated,
      backupKey,
    };
    recordMigrationResult(result, backupKey);
    return result;
  }
}
