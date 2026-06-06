import type { StateCreator } from 'zustand';
import type { EntryStore, FilterState, FilterFavorite, SortOption, Entry } from '../../types';
import { ENTRY_TYPES, COMPLETION_STATUSES, READ_STATUSES, FLAVOR_TAGS } from '../../types';
import { defaultFilters, defaultSortOption, READ_STATUS_ORDER } from './utils';
import { generateId } from './utils';

export const createFiltersSlice: StateCreator<
  EntryStore,
  [],
  [],
  {
    filters: FilterState;
    filterFavorites: FilterFavorite[];
    sortOption: SortOption;
    setFilters: (filters: Partial<FilterState>) => void;
    resetFilters: () => void;
    setSortOption: (option: SortOption) => void;
    sortEntries: (entries: Entry[]) => Entry[];
    addFilterFavorite: (name: string, filters: FilterState) => void;
    updateFilterFavorite: (id: string, updates: Partial<FilterFavorite>) => void;
    deleteFilterFavorite: (id: string) => void;
    applyFilterFavorite: (id: string) => void;
    getFilteredEntries: () => Entry[];
  }
> = (set, get) => ({
  filters: { ...defaultFilters },
  filterFavorites: [],
  sortOption: defaultSortOption,

  setFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    }));
  },

  resetFilters: () => {
    set({ filters: { ...defaultFilters } });
  },

  setSortOption: (option) => {
    set({ sortOption: option });
  },

  sortEntries: (entries) => {
    const { sortOption } = get();
    const sorted = [...entries];

    switch (sortOption) {
      case 'createdAtDesc':
        return sorted.sort((a, b) => b.createdAt - a.createdAt);
      case 'createdAtAsc':
        return sorted.sort((a, b) => a.createdAt - b.createdAt);
      case 'updatedAtDesc':
        return sorted.sort((a, b) => b.updatedAt - a.updatedAt);
      case 'updatedAtAsc':
        return sorted.sort((a, b) => a.updatedAt - b.updatedAt);
      case 'workNameAsc':
        return sorted.sort((a, b) => a.workName.localeCompare(b.workName, 'zh-CN'));
      case 'workNameDesc':
        return sorted.sort((a, b) => b.workName.localeCompare(a.workName, 'zh-CN'));
      case 'cpNameAsc':
        return sorted.sort((a, b) => a.cpName.localeCompare(b.cpName, 'zh-CN'));
      case 'cpNameDesc':
        return sorted.sort((a, b) => b.cpName.localeCompare(a.cpName, 'zh-CN'));
      case 'favoriteFirst':
        return sorted.sort((a, b) => {
          if (a.favorite !== b.favorite) {
            return a.favorite ? -1 : 1;
          }
          return b.createdAt - a.createdAt;
        });
      case 'readStatus':
        return sorted.sort((a, b) => {
          const orderA = READ_STATUS_ORDER[a.readStatus] ?? 99;
          const orderB = READ_STATUS_ORDER[b.readStatus] ?? 99;
          if (orderA !== orderB) {
            return orderA - orderB;
          }
          return b.createdAt - a.createdAt;
        });
      default:
        return sorted;
    }
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

    const validRatingFilters: (string | number)[] = ['all', 'rated', 'unrated', 0, 1, 2, 3, 4, 5];
    const appliedFilters: FilterState = {
      ...defaultFilters,
      ...favorite.filters,
      tags: (favorite.filters.tags || []).filter((tag) => validTags.has(tag)),
      customTags: (favorite.filters.customTags || []).filter((tagId) => validCustomTagIds.has(tagId)),
      type: (favorite.filters.type || 'all') === 'all' || validTypes.has(favorite.filters.type as string)
        ? favorite.filters.type || 'all'
        : 'all',
      status: (favorite.filters.status || 'all') === 'all' || validStatuses.has(favorite.filters.status as string)
        ? favorite.filters.status || 'all'
        : 'all',
      readStatus: (favorite.filters.readStatus || 'all') === 'all' || validReadStatuses.has(favorite.filters.readStatus as string)
        ? favorite.filters.readStatus || 'all'
        : 'all',
      rating: validRatingFilters.includes(favorite.filters.rating as string | number)
        ? favorite.filters.rating || 'all'
        : 'all',
      hasRevisitDate: favorite.filters.hasRevisitDate === true || favorite.filters.hasRevisitDate === false || favorite.filters.hasRevisitDate === 'all'
        ? favorite.filters.hasRevisitDate
        : 'all',
      revisitDateFrom: favorite.filters.revisitDateFrom ?? null,
      revisitDateTo: favorite.filters.revisitDateTo ?? null,
      cpName: validCpNames.has(favorite.filters.cpName)
        ? favorite.filters.cpName
        : '',
      dateFrom: favorite.filters.dateFrom ?? null,
      dateTo: favorite.filters.dateTo ?? null,
    };

    set({ filters: appliedFilters });
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
      if (filters.rating !== 'all') {
        if (filters.rating === 'rated' && (entry.rating === 0 || entry.rating === undefined)) return false;
        if (filters.rating === 'unrated' && entry.rating !== 0 && entry.rating !== undefined) return false;
        if (typeof filters.rating === 'number' && entry.rating !== filters.rating) return false;
      }
      if (filters.hasRevisitDate !== 'all') {
        const hasDate = entry.revisitDate !== null && entry.revisitDate !== undefined;
        if (filters.hasRevisitDate === true && !hasDate) return false;
        if (filters.hasRevisitDate === false && hasDate) return false;
      }
      if (filters.revisitDateFrom !== null && (!entry.revisitDate || entry.revisitDate < filters.revisitDateFrom)) return false;
      if (filters.revisitDateTo !== null && (!entry.revisitDate || entry.revisitDate > filters.revisitDateTo)) return false;
      if (filters.dateFrom !== null && entry.createdAt < filters.dateFrom) return false;
      if (filters.dateTo !== null && entry.createdAt > filters.dateTo) return false;
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
});
