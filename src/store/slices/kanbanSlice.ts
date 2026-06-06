import type { StateCreator } from 'zustand';
import type { EntryStore, KanbanViewMode } from '../../types';

export const createKanbanSlice: StateCreator<
  EntryStore,
  [],
  [],
  {
    isKanbanOpen: boolean;
    kanbanViewMode: KanbanViewMode;
    expandedKanbanGroups: Record<string, boolean>;
    setKanbanViewMode: (mode: KanbanViewMode) => void;
    toggleKanbanGroup: (groupKey: string) => void;
    expandAllKanbanGroups: (groupKeys: string[]) => void;
    collapseAllKanbanGroups: (groupKeys: string[]) => void;
  }
> = (set) => ({
  isKanbanOpen: false,
  kanbanViewMode: 'cp' as KanbanViewMode,
  expandedKanbanGroups: {},

  setKanbanViewMode: (mode) => {
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
});
