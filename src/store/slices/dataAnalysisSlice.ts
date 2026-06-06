import type { StateCreator } from 'zustand';
import type {
  EntryStore,
  DataAnalysisResult,
  CpDistributionItem,
  WorkDistributionItem,
  TypeDistributionItem,
  ReadStatusDistributionItem,
  TrendDataItem,
  RatingDistributionItem,
  Rating,
  EntryType,
} from '../../types';
import { ENTRY_TYPES, READ_STATUSES } from '../../types';

export const createDataAnalysisSlice: StateCreator<
  EntryStore,
  [],
  [],
  {
    isDataAnalysisOpen: boolean;
    analyzeData: () => DataAnalysisResult;
  }
> = (_set, get) => ({
  isDataAnalysisOpen: false,

  analyzeData: (): DataAnalysisResult => {
    const { entries } = get();
    const totalEntries = entries.length;
    const hasData = totalEntries > 0;

    if (!hasData) {
      return {
        totalEntries: 0,
        cpDistribution: [],
        workDistribution: [],
        typeDistribution: [],
        readStatusDistribution: [],
        ratingDistribution: [],
        ratedCount: 0,
        ratedPercentage: 0,
        revisitDateCount: 0,
        revisitDatePercentage: 0,
        favoriteCount: 0,
        favoritePercentage: 0,
        trendData: [],
        hasData: false,
      };
    }

    const cpCount = new Map<string, number>();
    const workCount = new Map<string, { cpName: string; type: EntryType; count: number }>();
    const typeCount = new Map<string, number>();
    const readStatusCount = new Map<string, number>();
    const ratingCount = new Map<number, number>();
    let favoriteCount = 0;
    let ratedCount = 0;
    let revisitDateCount = 0;

    const dailyCount = new Map<number, { dateStr: string; count: number }>();
    const now = Date.now();
    const daysToShow = 14;

    for (let i = daysToShow - 1; i >= 0; i--) {
      const d = new Date(now - i * 24 * 60 * 60 * 1000);
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      dailyCount.set(dayStart, { dateStr: `${d.getMonth() + 1}/${d.getDate()}`, count: 0 });
    }

    entries.forEach((entry) => {
      cpCount.set(entry.cpName, (cpCount.get(entry.cpName) || 0) + 1);
      const existingWork = workCount.get(entry.workName);
      if (existingWork) {
        existingWork.count++;
      } else {
        workCount.set(entry.workName, { cpName: entry.cpName, type: entry.type, count: 1 });
      }
      typeCount.set(entry.type, (typeCount.get(entry.type) || 0) + 1);
      readStatusCount.set(entry.readStatus, (readStatusCount.get(entry.readStatus) || 0) + 1);
      const rating = entry.rating ?? 0;
      ratingCount.set(rating, (ratingCount.get(rating) || 0) + 1);
      if (rating > 0) ratedCount++;
      if (entry.favorite) favoriteCount++;
      if (entry.revisitDate) revisitDateCount++;

      const entryDate = new Date(entry.createdAt);
      const dayStart = new Date(entryDate.getFullYear(), entryDate.getMonth(), entryDate.getDate()).getTime();
      const existing = dailyCount.get(dayStart);
      if (existing) {
        existing.count++;
      }
    });

    const cpDistribution: CpDistributionItem[] = Array.from(cpCount.entries())
      .map(([cpName, count]) => ({
        cpName,
        count,
        percentage: Math.round((count / totalEntries) * 100),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const workDistribution: WorkDistributionItem[] = Array.from(workCount.entries())
      .map(([workName, info]) => ({
        workName,
        cpName: info.cpName,
        type: info.type,
        count: info.count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    const typeDistribution: TypeDistributionItem[] = ENTRY_TYPES.map((type) => ({
      type,
      count: typeCount.get(type) || 0,
      percentage: Math.round(((typeCount.get(type) || 0) / totalEntries) * 100),
    })).filter((item) => item.count > 0);

    const readStatusDistribution: ReadStatusDistributionItem[] = READ_STATUSES.map((status) => ({
      status,
      count: readStatusCount.get(status) || 0,
      percentage: Math.round(((readStatusCount.get(status) || 0) / totalEntries) * 100),
    }));

    const ratingLabels: Record<number, string> = {
      0: '未评分',
      1: '⭐ 1星',
      2: '⭐⭐ 2星',
      3: '⭐⭐⭐ 3星',
      4: '⭐⭐⭐⭐ 4星',
      5: '⭐⭐⭐⭐⭐ 5星',
    };
    const ratingDistribution: RatingDistributionItem[] = [0, 1, 2, 3, 4, 5].map((rating) => ({
      rating: rating as Rating,
      count: ratingCount.get(rating) || 0,
      percentage: Math.round(((ratingCount.get(rating) || 0) / totalEntries) * 100),
      label: ratingLabels[rating],
    }));

    const trendData: TrendDataItem[] = Array.from(dailyCount.entries())
      .map(([timestamp, { dateStr, count }]) => ({
        date: dateStr,
        timestamp,
        count,
      }))
      .sort((a, b) => a.timestamp - b.timestamp);

    return {
      totalEntries,
      cpDistribution,
      workDistribution,
      typeDistribution,
      readStatusDistribution,
      ratingDistribution,
      ratedCount,
      ratedPercentage: Math.round((ratedCount / totalEntries) * 100),
      revisitDateCount,
      revisitDatePercentage: Math.round((revisitDateCount / totalEntries) * 100),
      favoriteCount,
      favoritePercentage: Math.round((favoriteCount / totalEntries) * 100),
      trendData,
      hasData: true,
    };
  },
});
