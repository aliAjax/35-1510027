export type EntryType = '同人文' | '同人漫' | '视频' | '音频' | '图' | '其他';
export type CompletionStatus = '连载中' | '已完结' | '暂停' | '坑';
export type ReadStatus = '未读' | '在读' | '已读' | '弃坑';
export type FlavorTag = '虐' | '甜' | '中等' | 'HE' | 'BE' | 'OE' | '车' | '清水';

export interface Entry {
  id: string;
  workName: string;
  cpName: string;
  type: EntryType;
  link: string;
  author: string;
  status: CompletionStatus;
  tags: FlavorTag[];
  readStatus: ReadStatus;
  notes: string;
  favorite: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface FilterState {
  cpName: string;
  type: EntryType | 'all';
  tags: FlavorTag[];
  readStatus: ReadStatus | 'all';
  favoriteOnly: boolean;
  searchKeyword: string;
}

export interface EntryStore {
  entries: Entry[];
  filters: FilterState;
  editingEntry: Entry | null;
  isFormOpen: boolean;
  isDetailOpen: boolean;
  detailEntry: Entry | null;
  addEntry: (entry: Omit<Entry, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateEntry: (id: string, updates: Partial<Entry>) => void;
  deleteEntry: (id: string) => void;
  toggleFavorite: (id: string) => void;
  setFilters: (filters: Partial<FilterState>) => void;
  resetFilters: () => void;
  openForm: (entry?: Entry) => void;
  closeForm: () => void;
  openDetail: (entry: Entry) => void;
  closeDetail: () => void;
  getFilteredEntries: () => Entry[];
  getUniqueCpNames: () => string[];
  getStats: () => {
    total: number;
    favorites: number;
    unread: number;
    read: number;
  };
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
