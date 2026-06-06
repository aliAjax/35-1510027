import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { EntryStore } from '../types';
import { migrateData, CURRENT_SCHEMA_VERSION, type PersistedState } from '../utils/dataMigration';
import { defaultFilters, defaultSortOption } from './slices/utils';
import { createEntriesSlice } from './slices/entriesSlice';
import { createFiltersSlice } from './slices/filtersSlice';
import { createUiSlice } from './slices/uiSlice';
import { createReadingPlanSlice } from './slices/readingPlanSlice';
import { createImportExportSlice } from './slices/importExportSlice';
import { createBatchImportSlice } from './slices/batchImportSlice';
import { createDuplicateCheckSlice } from './slices/duplicateCheckSlice';
import { createKanbanSlice } from './slices/kanbanSlice';
import { createLinkManagerSlice } from './slices/linkManagerSlice';
import { createDataAnalysisSlice } from './slices/dataAnalysisSlice';

export const useEntryStore = create<EntryStore>()(
  persist(
    (set, get, api) => ({
      ...createEntriesSlice(set, get, api),
      ...createFiltersSlice(set, get, api),
      ...createUiSlice(set, get, api),
      ...createReadingPlanSlice(set, get, api),
      ...createImportExportSlice(set, get, api),
      ...createBatchImportSlice(set, get, api),
      ...createDuplicateCheckSlice(set, get, api),
      ...createKanbanSlice(set, get, api),
      ...createLinkManagerSlice(set, get, api),
      ...createDataAnalysisSlice(set, get, api),
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
        sortOption: state.sortOption,
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
          state.sortOption = state.sortOption || defaultSortOption;
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
