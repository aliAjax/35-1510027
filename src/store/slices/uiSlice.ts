import type { StateCreator } from 'zustand';
import type { EntryStore, Entry } from '../../types';

export const createUiSlice: StateCreator<
  EntryStore,
  [],
  [],
  {
    editingEntry: Entry | null;
    isFormOpen: boolean;
    isDetailOpen: boolean;
    detailEntryId: string | null;
    isBatchImportOpen: boolean;
    isTagManagerOpen: boolean;
    isReadingPlanOpen: boolean;
    isDuplicateCheckerOpen: boolean;
    isKanbanOpen: boolean;
    isLinkManagerOpen: boolean;
    isDataAnalysisOpen: boolean;
    lastAddedCount: number;
    openForm: (entry?: Entry) => void;
    closeForm: () => void;
    openDetail: (entry: Entry) => void;
    closeDetail: () => void;
    detailEntry: () => Entry | null;
    openBatchImport: () => void;
    closeBatchImport: () => void;
    openTagManager: () => void;
    closeTagManager: () => void;
    openReadingPlan: () => void;
    closeReadingPlan: () => void;
    openDuplicateChecker: () => void;
    closeDuplicateChecker: () => void;
    openKanban: () => void;
    closeKanban: () => void;
    openLinkManager: () => void;
    closeLinkManager: () => void;
    openDataAnalysis: () => void;
    closeDataAnalysis: () => void;
  }
> = (set, get) => ({
  editingEntry: null,
  isFormOpen: false,
  isDetailOpen: false,
  detailEntryId: null as string | null,
  isBatchImportOpen: false,
  isTagManagerOpen: false,
  isReadingPlanOpen: false,
  isDuplicateCheckerOpen: false,
  isKanbanOpen: false,
  isLinkManagerOpen: false,
  isDataAnalysisOpen: false,
  lastAddedCount: 0,

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
      detailEntryId: entry.id,
      isDetailOpen: true,
      isFormOpen: false,
    });
  },

  closeDetail: () => {
    set({
      detailEntryId: null,
      isDetailOpen: false,
    });
  },

  detailEntry: () => {
    const { detailEntryId, entries } = get();
    if (!detailEntryId) return null;
    return entries.find((e) => e.id === detailEntryId) || null;
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

  openTagManager: () => {
    set({
      isTagManagerOpen: true,
      isFormOpen: false,
      isDetailOpen: false,
      isBatchImportOpen: false,
    });
  },

  closeTagManager: () => {
    set({
      isTagManagerOpen: false,
    });
  },

  openReadingPlan: () => {
    set({
      isReadingPlanOpen: true,
      isFormOpen: false,
      isDetailOpen: false,
      isBatchImportOpen: false,
      isTagManagerOpen: false,
    });
  },

  closeReadingPlan: () => {
    set({
      isReadingPlanOpen: false,
      lastAddedCount: 0,
    });
  },

  openDuplicateChecker: () => {
    set({
      isDuplicateCheckerOpen: true,
      isFormOpen: false,
      isDetailOpen: false,
      isBatchImportOpen: false,
      isTagManagerOpen: false,
      isReadingPlanOpen: false,
    });
  },

  closeDuplicateChecker: () => {
    set({ isDuplicateCheckerOpen: false });
  },

  openKanban: () => {
    set({
      isKanbanOpen: true,
      isFormOpen: false,
      isDetailOpen: false,
      isBatchImportOpen: false,
      isTagManagerOpen: false,
      isReadingPlanOpen: false,
      isDuplicateCheckerOpen: false,
    });
  },

  closeKanban: () => {
    set({ isKanbanOpen: false });
  },

  openLinkManager: () => {
    set({
      isLinkManagerOpen: true,
      isFormOpen: false,
      isDetailOpen: false,
      isBatchImportOpen: false,
      isTagManagerOpen: false,
      isReadingPlanOpen: false,
      isDuplicateCheckerOpen: false,
      isKanbanOpen: false,
    });
  },

  closeLinkManager: () => {
    set({ isLinkManagerOpen: false });
  },

  openDataAnalysis: () => {
    set({
      isDataAnalysisOpen: true,
      isFormOpen: false,
      isDetailOpen: false,
      isBatchImportOpen: false,
      isTagManagerOpen: false,
      isReadingPlanOpen: false,
      isDuplicateCheckerOpen: false,
      isKanbanOpen: false,
      isLinkManagerOpen: false,
    });
  },

  closeDataAnalysis: () => {
    set({ isDataAnalysisOpen: false });
  },
});
