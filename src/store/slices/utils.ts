import type { FilterState, SortOption, ReadStatus } from '../../types';

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const defaultFilters: FilterState = {
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

export const defaultSortOption: SortOption = 'createdAtDesc';

export const READ_STATUS_ORDER: Record<ReadStatus, number> = {
  '在读': 0,
  '未读': 1,
  '已读': 2,
  '弃坑': 3,
};

export const persistKeys = [
  'schemaVersion',
  'entries',
  'customTags',
  'filters',
  'filterFavorites',
  'readingPlan',
  'duplicateGroups',
  'kanbanViewMode',
  'expandedKanbanGroups',
  'sortOption',
] as const;
