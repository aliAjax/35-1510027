export type EntryType = '同人文' | '同人漫' | '视频' | '音频' | '图' | '其他';
export type CompletionStatus = '连载中' | '已完结' | '暂停' | '坑';
export type ReadStatus = '未读' | '在读' | '已读' | '弃坑';
export type FlavorTag = '虐' | '甜' | '中等' | 'HE' | 'BE' | 'OE' | '车' | '清水';

export interface CustomTag {
  id: string;
  name: string;
  color: string;
  createdAt: number;
}

export interface Entry {
  id: string;
  workName: string;
  cpName: string;
  type: EntryType;
  link: string;
  author: string;
  status: CompletionStatus;
  tags: FlavorTag[];
  customTags: string[];
  readStatus: ReadStatus;
  notes: string;
  favorite: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface FilterState {
  cpName: string;
  type: EntryType | 'all';
  status: CompletionStatus | 'all';
  tags: FlavorTag[];
  customTags: string[];
  readStatus: ReadStatus | 'all';
  favoriteOnly: boolean;
  searchKeyword: string;
}

export interface FilterFavorite {
  id: string;
  name: string;
  filters: FilterState;
  createdAt: number;
  updatedAt: number;
}

export interface EntryStore extends DuplicateCheckStore, LinkManagerStore, DataAnalysisStore {
  entries: Entry[];
  customTags: CustomTag[];
  filters: FilterState;
  filterFavorites: FilterFavorite[];
  editingEntry: Entry | null;
  isFormOpen: boolean;
  isDetailOpen: boolean;
  detailEntry: Entry | null;
  isBatchImportOpen: boolean;
  isTagManagerOpen: boolean;
  isReadingPlanOpen: boolean;
  readingPlan: ReadingPlanItem[];
  isKanbanOpen: boolean;
  kanbanViewMode: KanbanViewMode;
  expandedKanbanGroups: Record<string, boolean>;
  addEntry: (entry: Omit<Entry, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateEntry: (id: string, updates: Partial<Entry>) => void;
  deleteEntry: (id: string) => void;
  toggleFavorite: (id: string) => void;
  setFilters: (filters: Partial<FilterState>) => void;
  resetFilters: () => void;
  addFilterFavorite: (name: string, filters: FilterState) => void;
  updateFilterFavorite: (id: string, updates: Partial<FilterFavorite>) => void;
  deleteFilterFavorite: (id: string) => void;
  applyFilterFavorite: (id: string) => void;
  openForm: (entry?: Entry) => void;
  closeForm: () => void;
  openDetail: (entry: Entry) => void;
  closeDetail: () => void;
  openBatchImport: () => void;
  closeBatchImport: () => void;
  openTagManager: () => void;
  closeTagManager: () => void;
  openReadingPlan: () => void;
  closeReadingPlan: () => void;
  addToPlan: (entryId: string) => void;
  removeFromPlan: (entryId: string) => void;
  movePlanItem: (entryId: string, direction: 'up' | 'down') => void;
  markPlanDone: (entryId: string) => void;
  markPlanSkipped: (entryId: string) => void;
  clearPlanCompleted: () => void;
  getTodayPlanCount: () => number;
  addCustomTag: (name: string, color: string) => void;
  updateCustomTag: (id: string, updates: Partial<CustomTag>) => void;
  deleteCustomTag: (id: string) => void;
  getEntriesWithTag: (tagId: string) => Entry[];
  getFilteredEntries: () => Entry[];
  getUniqueCpNames: () => string[];
  getStats: () => {
    total: number;
    favorites: number;
    unread: number;
    read: number;
    todayPlan: number;
  };
  exportData: () => BackupData;
  validateAndParseImport: (jsonString: string) => ImportResult;
  importData: (data: BackupData, merge: boolean) => void;
  batchImportEntries: (entries: ParsedBatchEntry[]) => void;
  parseBatchText: (text: string) => BatchImportResult;
  parseBatchCSV: (csvText: string) => BatchImportResult;
  clearAllData: () => void;
  openKanban: () => void;
  closeKanban: () => void;
  setKanbanViewMode: (mode: KanbanViewMode) => void;
  toggleKanbanGroup: (groupKey: string) => void;
  expandAllKanbanGroups: (groupKeys: string[]) => void;
  collapseAllKanbanGroups: (groupKeys: string[]) => void;
}

export const ENTRY_TYPES: EntryType[] = ['同人文', '同人漫', '视频', '音频', '图', '其他'];
export const COMPLETION_STATUSES: CompletionStatus[] = ['连载中', '已完结', '暂停', '坑'];
export const READ_STATUSES: ReadStatus[] = ['未读', '在读', '已读', '弃坑'];
export const FLAVOR_TAGS: FlavorTag[] = ['虐', '甜', '中等', 'HE', 'BE', 'OE', '车', '清水'];

export const TYPE_COLORS: Record<EntryType, string> = {
  '同人文': 'bg-purple-100 text-purple-700 border-purple-200',
  '同人漫': 'bg-pink-100 text-pink-700 border-pink-200',
  '视频': 'bg-blue-100 text-blue-700 border-blue-200',
  '音频': 'bg-green-100 text-green-700 border-green-200',
  '图': 'bg-amber-100 text-amber-700 border-amber-200',
  '其他': 'bg-gray-100 text-gray-700 border-gray-200',
};

export const STATUS_COLORS: Record<CompletionStatus, string> = {
  '连载中': 'bg-blue-100 text-blue-700',
  '已完结': 'bg-green-100 text-green-700',
  '暂停': 'bg-yellow-100 text-yellow-700',
  '坑': 'bg-red-100 text-red-700',
};

export const READ_STATUS_COLORS: Record<ReadStatus, string> = {
  '未读': 'bg-gray-100 text-gray-600',
  '在读': 'bg-amber-100 text-amber-700',
  '已读': 'bg-mint/30 text-emerald-700',
  '弃坑': 'bg-red-100 text-red-600',
};

export const TAG_COLORS: Record<FlavorTag, string> = {
  '虐': 'bg-angst/50 text-blue-700',
  '甜': 'bg-sweet/50 text-pink-700',
  '中等': 'bg-purple-100 text-purple-700',
  'HE': 'bg-green-100 text-green-700',
  'BE': 'bg-red-100 text-red-700',
  'OE': 'bg-gray-100 text-gray-700',
  '车': 'bg-orange-100 text-orange-700',
  '清水': 'bg-sky-100 text-sky-700',
};

export const CUSTOM_TAG_COLORS: Record<string, string> = {
  red: 'bg-red-100 text-red-700',
  orange: 'bg-orange-100 text-orange-700',
  amber: 'bg-amber-100 text-amber-700',
  yellow: 'bg-yellow-100 text-yellow-700',
  lime: 'bg-lime-100 text-lime-700',
  green: 'bg-green-100 text-green-700',
  emerald: 'bg-emerald-100 text-emerald-700',
  teal: 'bg-teal-100 text-teal-700',
  cyan: 'bg-cyan-100 text-cyan-700',
  sky: 'bg-sky-100 text-sky-700',
  blue: 'bg-blue-100 text-blue-700',
  indigo: 'bg-indigo-100 text-indigo-700',
  violet: 'bg-violet-100 text-violet-700',
  purple: 'bg-purple-100 text-purple-700',
  fuchsia: 'bg-fuchsia-100 text-fuchsia-700',
  pink: 'bg-pink-100 text-pink-700',
  rose: 'bg-rose-100 text-rose-700',
  slate: 'bg-slate-100 text-slate-700',
};

export const CUSTOM_TAG_PRESET_COLORS = [
  { id: 'red', name: '红色', color: '#ef4444' },
  { id: 'orange', name: '橙色', color: '#f97316' },
  { id: 'amber', name: '琥珀', color: '#f59e0b' },
  { id: 'yellow', name: '黄色', color: '#eab308' },
  { id: 'lime', name: '青柠', color: '#84cc16' },
  { id: 'green', name: '绿色', color: '#22c55e' },
  { id: 'emerald', name: '翡翠', color: '#10b981' },
  { id: 'teal', name: '蓝绿', color: '#14b8a6' },
  { id: 'cyan', name: '青色', color: '#06b6d4' },
  { id: 'sky', name: '天蓝', color: '#0ea5e9' },
  { id: 'blue', name: '蓝色', color: '#3b82f6' },
  { id: 'indigo', name: '靛蓝', color: '#6366f1' },
  { id: 'violet', name: '紫罗兰', color: '#8b5cf6' },
  { id: 'purple', name: '紫色', color: '#a855f7' },
  { id: 'fuchsia', name: '紫红', color: '#d946ef' },
  { id: 'pink', name: '粉色', color: '#ec4899' },
  { id: 'rose', name: '玫瑰', color: '#f43f5e' },
  { id: 'slate', name: '石板', color: '#64748b' },
];

export interface BackupData {
  version: string;
  exportedAt: number;
  entries: Entry[];
  customTags: CustomTag[];
  filters: FilterState;
}

export interface ImportResult {
  success: boolean;
  entriesCount: number;
  validEntriesCount: number;
  duplicateCount: number;
  currentEntriesCount: number;
  overwriteCount: number;
  errors: string[];
  warnings: string[];
  data?: BackupData;
}

export interface BatchImportRow {
  rowNumber: number;
  workName: string;
  cpName: string;
  type: string;
  link: string;
  author: string;
  status: string;
  tags: string;
  readStatus: string;
  notes: string;
  favorite: string;
}

export interface ParsedBatchEntry {
  rowNumber: number;
  workName: string;
  cpName: string;
  type: EntryType;
  link: string;
  author: string;
  status: CompletionStatus;
  tags: FlavorTag[];
  customTags: string[];
  readStatus: ReadStatus;
  notes: string;
  favorite: boolean;
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export type PlanItemStatus = 'planned' | 'done' | 'skipped';

export interface ReadingPlanItem {
  entryId: string;
  addedAt: number;
  order: number;
  status: PlanItemStatus;
}

export interface BatchImportResult {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  entries: ParsedBatchEntry[];
  hasErrors: boolean;
}

export type KanbanViewMode = 'cp' | 'work' | 'readStatus' | 'type';

export interface DuplicateGroup {
  id: string;
  entries: Entry[];
  matchScore: number;
  matchReasons: string[];
  ignored: boolean;
}

export interface DuplicateCheckStore {
  isDuplicateCheckerOpen: boolean;
  duplicateGroups: DuplicateGroup[];
  openDuplicateChecker: () => void;
  closeDuplicateChecker: () => void;
  findDuplicates: () => DuplicateGroup[];
  ignoreDuplicateGroup: (groupId: string) => void;
  keepEntry: (groupId: string, entryId: string) => void;
  mergeEntries: (groupId: string, keepEntryId: string) => void;
}

export type LinkIssueType = 'empty' | 'duplicate' | 'invalid' | 'warning';

export interface LinkIssue {
  type: LinkIssueType;
  message: string;
}

export interface LinkInfo {
  entryId: string;
  workName: string;
  cpName: string;
  link: string;
  domain: string;
  notes: string;
  issues: LinkIssue[];
  hasIssue: boolean;
}

export interface LinkDomainGroup {
  domain: string;
  links: LinkInfo[];
  count: number;
  issueCount: number;
}

export interface LinkAnalysisResult {
  totalLinks: number;
  emptyLinks: number;
  duplicateLinks: number;
  invalidLinks: number;
  domainGroups: LinkDomainGroup[];
  allLinks: LinkInfo[];
}

export interface CpDistributionItem {
  cpName: string;
  count: number;
  percentage: number;
}

export interface TypeDistributionItem {
  type: EntryType;
  count: number;
  percentage: number;
}

export interface ReadStatusDistributionItem {
  status: ReadStatus;
  count: number;
  percentage: number;
}

export interface TrendDataItem {
  date: string;
  timestamp: number;
  count: number;
}

export interface DataAnalysisResult {
  totalEntries: number;
  cpDistribution: CpDistributionItem[];
  typeDistribution: TypeDistributionItem[];
  readStatusDistribution: ReadStatusDistributionItem[];
  favoriteCount: number;
  favoritePercentage: number;
  trendData: TrendDataItem[];
  hasData: boolean;
}

export interface DataAnalysisStore {
  isDataAnalysisOpen: boolean;
  openDataAnalysis: () => void;
  closeDataAnalysis: () => void;
  analyzeData: () => DataAnalysisResult;
}

export interface LinkManagerStore {
  isLinkManagerOpen: boolean;
  openLinkManager: () => void;
  closeLinkManager: () => void;
  analyzeLinks: (entriesToAnalyze?: Entry[]) => LinkAnalysisResult;
  batchUpdateNotes: (entryIds: string[], notes: string) => void;
}
