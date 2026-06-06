import { describe, it, expect, beforeEach } from 'vitest';
import { useEntryStore } from '../useEntryStore';
import type { Entry, CustomTag, FlavorTag, ReadStatus } from '../../types';

const createTestEntry = (overrides: Partial<Entry> = {}): Entry => ({
  id: Math.random().toString(36).substr(2, 9),
  workName: '默认作品',
  cpName: '默认CP',
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
  createdAt: Date.now(),
  updatedAt: Date.now(),
  ...overrides,
});

const createTestCustomTag = (name: string, color: string = 'blue'): CustomTag => ({
  id: Math.random().toString(36).substr(2, 9),
  name,
  color,
  createdAt: Date.now(),
});

describe('useEntryStore - getFilteredEntries', () => {
  beforeEach(() => {
    const { resetFilters, setSortOption } = useEntryStore.getState();
    useEntryStore.setState({ entries: [], customTags: [] });
    resetFilters();
    setSortOption('createdAtDesc');
  });

  describe('基础筛选', () => {
    it('无筛选条件时返回所有条目', () => {
      const entries = [
        createTestEntry({ id: '1', workName: '作品A' }),
        createTestEntry({ id: '2', workName: '作品B' }),
        createTestEntry({ id: '3', workName: '作品C' }),
      ];
      useEntryStore.setState({ entries });

      const result = useEntryStore.getState().getFilteredEntries();
      expect(result).toHaveLength(3);
      expect(result.map(e => e.id)).toEqual(expect.arrayContaining(['1', '2', '3']));
    });

    it('按 CP 名筛选', () => {
      const entries = [
        createTestEntry({ id: '1', cpName: '忘羡' }),
        createTestEntry({ id: '2', cpName: '花怜' }),
        createTestEntry({ id: '3', cpName: '忘羡' }),
      ];
      useEntryStore.setState({ entries });
      useEntryStore.getState().setFilters({ cpName: '忘羡' });

      const result = useEntryStore.getState().getFilteredEntries();
      expect(result).toHaveLength(2);
      expect(result.every(e => e.cpName === '忘羡')).toBe(true);
    });

    it('按类型筛选', () => {
      const entries = [
        createTestEntry({ id: '1', type: '同人文' }),
        createTestEntry({ id: '2', type: '同人漫' }),
        createTestEntry({ id: '3', type: '视频' }),
      ];
      useEntryStore.setState({ entries });
      useEntryStore.getState().setFilters({ type: '同人文' });

      const result = useEntryStore.getState().getFilteredEntries();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });

    it('按阅读状态筛选', () => {
      const entries = [
        createTestEntry({ id: '1', readStatus: '未读' }),
        createTestEntry({ id: '2', readStatus: '在读' }),
        createTestEntry({ id: '3', readStatus: '已读' }),
        createTestEntry({ id: '4', readStatus: '弃坑' }),
      ];
      useEntryStore.setState({ entries });
      useEntryStore.getState().setFilters({ readStatus: '在读' });

      const result = useEntryStore.getState().getFilteredEntries();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('2');
    });

    it('按收藏筛选（仅显示收藏）', () => {
      const entries = [
        createTestEntry({ id: '1', favorite: true }),
        createTestEntry({ id: '2', favorite: false }),
        createTestEntry({ id: '3', favorite: true }),
      ];
      useEntryStore.setState({ entries });
      useEntryStore.getState().setFilters({ favoriteOnly: true });

      const result = useEntryStore.getState().getFilteredEntries();
      expect(result).toHaveLength(2);
      expect(result.every(e => e.favorite)).toBe(true);
    });
  });

  describe('评分筛选', () => {
    beforeEach(() => {
      const entries = [
        createTestEntry({ id: 'rated-5', rating: 5 }),
        createTestEntry({ id: 'rated-3', rating: 3 }),
        createTestEntry({ id: 'rated-1', rating: 1 }),
        createTestEntry({ id: 'unrated-0', rating: 0 }),
      ];
      useEntryStore.setState({ entries });
    });

    it('筛选已评分（rated）', () => {
      useEntryStore.getState().setFilters({ rating: 'rated' });
      const result = useEntryStore.getState().getFilteredEntries();
      expect(result).toHaveLength(3);
      expect(result.map(e => e.id)).toEqual(expect.arrayContaining(['rated-5', 'rated-3', 'rated-1']));
    });

    it('筛选未评分（unrated）', () => {
      useEntryStore.getState().setFilters({ rating: 'unrated' });
      const result = useEntryStore.getState().getFilteredEntries();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('unrated-0');
    });

    it('筛选特定评分 5 星', () => {
      useEntryStore.getState().setFilters({ rating: 5 });
      const result = useEntryStore.getState().getFilteredEntries();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('rated-5');
    });

    it('筛选特定评分 3 星', () => {
      useEntryStore.getState().setFilters({ rating: 3 });
      const result = useEntryStore.getState().getFilteredEntries();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('rated-3');
    });
  });

  describe('重温日期筛选', () => {
    const date2024 = new Date('2024-01-01').getTime();
    const date2025 = new Date('2025-06-15').getTime();
    const date2026 = new Date('2026-12-31').getTime();

    beforeEach(() => {
      const entries = [
        createTestEntry({ id: 'has-date-2024', revisitDate: date2024 }),
        createTestEntry({ id: 'has-date-2025', revisitDate: date2025 }),
        createTestEntry({ id: 'has-date-2026', revisitDate: date2026 }),
        createTestEntry({ id: 'no-date', revisitDate: null }),
      ];
      useEntryStore.setState({ entries });
    });

    it('筛选有重温日期的条目', () => {
      useEntryStore.getState().setFilters({ hasRevisitDate: true });
      const result = useEntryStore.getState().getFilteredEntries();
      expect(result).toHaveLength(3);
      expect(result.every(e => e.revisitDate !== null)).toBe(true);
    });

    it('筛选没有重温日期的条目', () => {
      useEntryStore.getState().setFilters({ hasRevisitDate: false });
      const result = useEntryStore.getState().getFilteredEntries();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('no-date');
    });

    it('按日期范围筛选 - 起始日期', () => {
      useEntryStore.getState().setFilters({ revisitDateFrom: date2025 });
      const result = useEntryStore.getState().getFilteredEntries();
      expect(result).toHaveLength(2);
      expect(result.map(e => e.id)).toEqual(expect.arrayContaining(['has-date-2025', 'has-date-2026']));
    });

    it('按日期范围筛选 - 结束日期', () => {
      useEntryStore.getState().setFilters({ revisitDateTo: date2025 });
      const result = useEntryStore.getState().getFilteredEntries();
      expect(result).toHaveLength(2);
      expect(result.map(e => e.id)).toEqual(expect.arrayContaining(['has-date-2024', 'has-date-2025']));
    });

    it('按日期范围筛选 - 起止都有', () => {
      useEntryStore.getState().setFilters({
        revisitDateFrom: date2024 + 1,
        revisitDateTo: date2026 - 1,
      });
      const result = useEntryStore.getState().getFilteredEntries();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('has-date-2025');
    });
  });

  describe('自定义标签筛选', () => {
    it('按单个自定义标签筛选', () => {
      const tag1 = createTestCustomTag('神作');
      const tag2 = createTestCustomTag('待补');
      const entries = [
        createTestEntry({ id: '1', customTags: [tag1.id] }),
        createTestEntry({ id: '2', customTags: [tag2.id] }),
        createTestEntry({ id: '3', customTags: [tag1.id, tag2.id] }),
      ];
      useEntryStore.setState({ entries, customTags: [tag1, tag2] });
      useEntryStore.getState().setFilters({ customTags: [tag1.id] });

      const result = useEntryStore.getState().getFilteredEntries();
      expect(result).toHaveLength(2);
      expect(result.map(e => e.id)).toEqual(expect.arrayContaining(['1', '3']));
    });

    it('按多个自定义标签筛选（AND 逻辑）', () => {
      const tag1 = createTestCustomTag('神作');
      const tag2 = createTestCustomTag('待补');
      const tag3 = createTestCustomTag('推荐');
      const entries = [
        createTestEntry({ id: '1', customTags: [tag1.id] }),
        createTestEntry({ id: '2', customTags: [tag1.id, tag2.id] }),
        createTestEntry({ id: '3', customTags: [tag1.id, tag2.id, tag3.id] }),
      ];
      useEntryStore.setState({ entries, customTags: [tag1, tag2, tag3] });
      useEntryStore.getState().setFilters({ customTags: [tag1.id, tag2.id] });

      const result = useEntryStore.getState().getFilteredEntries();
      expect(result).toHaveLength(2);
      expect(result.map(e => e.id)).toEqual(expect.arrayContaining(['2', '3']));
    });
  });

  describe('风味标签筛选', () => {
    it('按单个风味标签筛选', () => {
      const entries = [
        createTestEntry({ id: '1', tags: ['甜', 'HE'] }),
        createTestEntry({ id: '2', tags: ['虐', 'BE'] }),
        createTestEntry({ id: '3', tags: ['甜', '虐'] }),
      ];
      useEntryStore.setState({ entries });
      useEntryStore.getState().setFilters({ tags: ['甜'] });

      const result = useEntryStore.getState().getFilteredEntries();
      expect(result).toHaveLength(2);
      expect(result.map(e => e.id)).toEqual(expect.arrayContaining(['1', '3']));
    });

    it('按多个风味标签筛选（AND 逻辑）', () => {
      const entries = [
        createTestEntry({ id: '1', tags: ['甜', 'HE'] }),
        createTestEntry({ id: '2', tags: ['虐', 'BE'] }),
        createTestEntry({ id: '3', tags: ['甜', '虐', 'HE'] }),
      ];
      useEntryStore.setState({ entries });
      useEntryStore.getState().setFilters({ tags: ['甜', 'HE'] });

      const result = useEntryStore.getState().getFilteredEntries();
      expect(result).toHaveLength(2);
      expect(result.map(e => e.id)).toEqual(expect.arrayContaining(['1', '3']));
    });
  });

  describe('搜索关键词筛选', () => {
    it('按作品名搜索', () => {
      const tag1 = createTestCustomTag('神作');
      const entries = [
        createTestEntry({ id: '1', workName: '魔道祖师' }),
        createTestEntry({ id: '2', workName: '天官赐福' }),
        createTestEntry({ id: '3', workName: '渣反' }),
      ];
      useEntryStore.setState({ entries, customTags: [tag1] });
      useEntryStore.getState().setFilters({ searchKeyword: '魔道' });

      const result = useEntryStore.getState().getFilteredEntries();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });

    it('按 CP 名搜索', () => {
      const entries = [
        createTestEntry({ id: '1', cpName: '忘羡' }),
        createTestEntry({ id: '2', cpName: '花怜' }),
      ];
      useEntryStore.setState({ entries, customTags: [] });
      useEntryStore.getState().setFilters({ searchKeyword: '忘' });

      const result = useEntryStore.getState().getFilteredEntries();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });

    it('按作者搜索', () => {
      const entries = [
        createTestEntry({ id: '1', author: '墨香铜臭' }),
        createTestEntry({ id: '2', author: 'Priest' }),
      ];
      useEntryStore.setState({ entries, customTags: [] });
      useEntryStore.getState().setFilters({ searchKeyword: '墨香' });

      const result = useEntryStore.getState().getFilteredEntries();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });

    it('按备注搜索', () => {
      const entries = [
        createTestEntry({ id: '1', notes: '超级好看的一篇文' }),
        createTestEntry({ id: '2', notes: '一般般' }),
      ];
      useEntryStore.setState({ entries, customTags: [] });
      useEntryStore.getState().setFilters({ searchKeyword: '好看' });

      const result = useEntryStore.getState().getFilteredEntries();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });

    it('按风味标签搜索', () => {
      const entries = [
        createTestEntry({ id: '1', tags: ['甜', 'HE'] }),
        createTestEntry({ id: '2', tags: ['虐', 'BE'] }),
      ];
      useEntryStore.setState({ entries, customTags: [] });
      useEntryStore.getState().setFilters({ searchKeyword: '甜' });

      const result = useEntryStore.getState().getFilteredEntries();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });

    it('按自定义标签名搜索', () => {
      const tag1 = createTestCustomTag('神作推荐');
      const tag2 = createTestCustomTag('待补');
      const entries = [
        createTestEntry({ id: '1', customTags: [tag1.id] }),
        createTestEntry({ id: '2', customTags: [tag2.id] }),
      ];
      useEntryStore.setState({ entries, customTags: [tag1, tag2] });
      useEntryStore.getState().setFilters({ searchKeyword: '神作' });

      const result = useEntryStore.getState().getFilteredEntries();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });

    it('搜索不区分大小写', () => {
      const entries = [
        createTestEntry({ id: '1', workName: 'Hello World' }),
        createTestEntry({ id: '2', workName: 'Foo Bar' }),
      ];
      useEntryStore.setState({ entries, customTags: [] });
      useEntryStore.getState().setFilters({ searchKeyword: 'hello' });

      const result = useEntryStore.getState().getFilteredEntries();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });
  });

  describe('组合筛选', () => {
    it('CP名 + 类型 + 阅读状态 组合筛选', () => {
      const entries = [
        createTestEntry({ id: '1', cpName: '忘羡', type: '同人文', readStatus: '已读' }),
        createTestEntry({ id: '2', cpName: '忘羡', type: '同人漫', readStatus: '未读' }),
        createTestEntry({ id: '3', cpName: '花怜', type: '同人文', readStatus: '已读' }),
        createTestEntry({ id: '4', cpName: '忘羡', type: '同人文', readStatus: '未读' }),
      ];
      useEntryStore.setState({ entries });
      useEntryStore.getState().setFilters({
        cpName: '忘羡',
        type: '同人文',
        readStatus: '已读',
      });

      const result = useEntryStore.getState().getFilteredEntries();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });

    it('收藏 + 评分 + 标签 组合筛选', () => {
      const entries = [
        createTestEntry({ id: '1', favorite: true, rating: 5, tags: ['甜', 'HE'] }),
        createTestEntry({ id: '2', favorite: true, rating: 3, tags: ['甜'] }),
        createTestEntry({ id: '3', favorite: false, rating: 5, tags: ['甜', 'HE'] }),
        createTestEntry({ id: '4', favorite: true, rating: 5, tags: ['虐'] }),
      ];
      useEntryStore.setState({ entries });
      useEntryStore.getState().setFilters({
        favoriteOnly: true,
        rating: 5,
        tags: ['甜', 'HE'],
      });

      const result = useEntryStore.getState().getFilteredEntries();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });

    it('搜索关键词 + 自定义标签 + 重温日期 组合筛选', () => {
      const tag1 = createTestCustomTag('神作');
      const tag2 = createTestCustomTag('推荐');
      const revisitDate = new Date('2025-06-15').getTime();
      const entries = [
        createTestEntry({
          id: '1',
          workName: '魔道祖师',
          customTags: [tag1.id, tag2.id],
          revisitDate,
        }),
        createTestEntry({
          id: '2',
          workName: '天官赐福',
          customTags: [tag1.id],
          revisitDate,
        }),
        createTestEntry({
          id: '3',
          workName: '魔道祖师同人',
          customTags: [tag2.id],
          revisitDate: null,
        }),
      ];
      useEntryStore.setState({ entries, customTags: [tag1, tag2] });
      useEntryStore.getState().setFilters({
        searchKeyword: '魔道',
        customTags: [tag1.id],
        hasRevisitDate: true,
      });

      const result = useEntryStore.getState().getFilteredEntries();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });

    it('多重筛选条件无匹配时返回空数组', () => {
      const entries = [
        createTestEntry({ id: '1', cpName: '忘羡', type: '同人文' }),
        createTestEntry({ id: '2', cpName: '花怜', type: '同人漫' }),
      ];
      useEntryStore.setState({ entries });
      useEntryStore.getState().setFilters({
        cpName: '忘羡',
        type: '同人漫',
      });

      const result = useEntryStore.getState().getFilteredEntries();
      expect(result).toHaveLength(0);
    });
  });
});

describe('useEntryStore - sortEntries', () => {
  beforeEach(() => {
    const { resetFilters, setSortOption } = useEntryStore.getState();
    useEntryStore.setState({ entries: [], customTags: [] });
    resetFilters();
    setSortOption('createdAtDesc');
  });

  const getIds = (entries: Entry[]) => entries.map(e => e.id);

  describe('创建时间排序', () => {
    it('按创建时间降序（新→旧）', () => {
      const entries = [
        createTestEntry({ id: 'oldest', createdAt: 1000 }),
        createTestEntry({ id: 'newest', createdAt: 3000 }),
        createTestEntry({ id: 'middle', createdAt: 2000 }),
      ];
      useEntryStore.getState().setSortOption('createdAtDesc');

      const result = useEntryStore.getState().sortEntries(entries);
      expect(getIds(result)).toEqual(['newest', 'middle', 'oldest']);
    });

    it('按创建时间升序（旧→新）', () => {
      const entries = [
        createTestEntry({ id: 'oldest', createdAt: 1000 }),
        createTestEntry({ id: 'newest', createdAt: 3000 }),
        createTestEntry({ id: 'middle', createdAt: 2000 }),
      ];
      useEntryStore.getState().setSortOption('createdAtAsc');

      const result = useEntryStore.getState().sortEntries(entries);
      expect(getIds(result)).toEqual(['oldest', 'middle', 'newest']);
    });
  });

  describe('作品名排序', () => {
    it('按作品名升序（A→Z）', () => {
      const entries = [
        createTestEntry({ id: 'c', workName: 'C作品' }),
        createTestEntry({ id: 'a', workName: 'A作品' }),
        createTestEntry({ id: 'b', workName: 'B作品' }),
      ];
      useEntryStore.getState().setSortOption('workNameAsc');

      const result = useEntryStore.getState().sortEntries(entries);
      expect(getIds(result)).toEqual(['a', 'b', 'c']);
    });

    it('按作品名降序（Z→A）', () => {
      const entries = [
        createTestEntry({ id: 'c', workName: 'C作品' }),
        createTestEntry({ id: 'a', workName: 'A作品' }),
        createTestEntry({ id: 'b', workName: 'B作品' }),
      ];
      useEntryStore.getState().setSortOption('workNameDesc');

      const result = useEntryStore.getState().sortEntries(entries);
      expect(getIds(result)).toEqual(['c', 'b', 'a']);
    });
  });

  describe('收藏优先排序', () => {
    it('收藏的条目排在前面，同组内按创建时间降序', () => {
      const entries = [
        createTestEntry({ id: 'fav-old', favorite: true, createdAt: 1000 }),
        createTestEntry({ id: 'fav-new', favorite: true, createdAt: 3000 }),
        createTestEntry({ id: 'nonfav-new', favorite: false, createdAt: 4000 }),
        createTestEntry({ id: 'nonfav-old', favorite: false, createdAt: 2000 }),
      ];
      useEntryStore.getState().setSortOption('favoriteFirst');

      const result = useEntryStore.getState().sortEntries(entries);
      expect(getIds(result)).toEqual(['fav-new', 'fav-old', 'nonfav-new', 'nonfav-old']);
    });
  });

  describe('阅读状态排序', () => {
    it('按阅读状态顺序：在读→未读→已读→弃坑，同组内按创建时间降序', () => {
      const entries = [
        createTestEntry({ id: 'read-old', readStatus: '已读' as ReadStatus, createdAt: 1000 }),
        createTestEntry({ id: 'reading-new', readStatus: '在读' as ReadStatus, createdAt: 4000 }),
        createTestEntry({ id: 'unread-old', readStatus: '未读' as ReadStatus, createdAt: 2000 }),
        createTestEntry({ id: 'abandoned', readStatus: '弃坑' as ReadStatus, createdAt: 3000 }),
        createTestEntry({ id: 'unread-new', readStatus: '未读' as ReadStatus, createdAt: 5000 }),
        createTestEntry({ id: 'read-new', readStatus: '已读' as ReadStatus, createdAt: 3500 }),
      ];
      useEntryStore.getState().setSortOption('readStatus');

      const result = useEntryStore.getState().sortEntries(entries);
      const ids = getIds(result);

      const readingIdx = ids.indexOf('reading-new');
      const unreadIdx = ids.indexOf('unread-new');
      const readIdx = ids.indexOf('read-new');
      const abandonedIdx = ids.indexOf('abandoned');

      expect(readingIdx).toBeLessThan(unreadIdx);
      expect(unreadIdx).toBeLessThan(readIdx);
      expect(readIdx).toBeLessThan(abandonedIdx);

      const unreadEntries = result.filter(e => e.readStatus === '未读');
      expect(unreadEntries[0].id).toBe('unread-new');
      expect(unreadEntries[1].id).toBe('unread-old');
    });
  });

  describe('更新时间排序', () => {
    it('按更新时间降序', () => {
      const entries = [
        createTestEntry({ id: 'old', updatedAt: 1000 }),
        createTestEntry({ id: 'new', updatedAt: 3000 }),
        createTestEntry({ id: 'middle', updatedAt: 2000 }),
      ];
      useEntryStore.getState().setSortOption('updatedAtDesc');

      const result = useEntryStore.getState().sortEntries(entries);
      expect(getIds(result)).toEqual(['new', 'middle', 'old']);
    });

    it('按更新时间升序', () => {
      const entries = [
        createTestEntry({ id: 'old', updatedAt: 1000 }),
        createTestEntry({ id: 'new', updatedAt: 3000 }),
        createTestEntry({ id: 'middle', updatedAt: 2000 }),
      ];
      useEntryStore.getState().setSortOption('updatedAtAsc');

      const result = useEntryStore.getState().sortEntries(entries);
      expect(getIds(result)).toEqual(['old', 'middle', 'new']);
    });
  });

  describe('CP 名排序', () => {
    it('按 CP 名升序', () => {
      const entries = [
        createTestEntry({ id: 'c', cpName: '忘羡' }),
        createTestEntry({ id: 'a', cpName: '冰秋' }),
        createTestEntry({ id: 'b', cpName: '花怜' }),
      ];
      useEntryStore.getState().setSortOption('cpNameAsc');

      const result = useEntryStore.getState().sortEntries(entries);
      expect(result[0].cpName).toBe('冰秋');
      expect(result[1].cpName).toBe('花怜');
      expect(result[2].cpName).toBe('忘羡');
    });

    it('按 CP 名降序', () => {
      const entries = [
        createTestEntry({ id: 'c', cpName: '忘羡' }),
        createTestEntry({ id: 'a', cpName: '冰秋' }),
        createTestEntry({ id: 'b', cpName: '花怜' }),
      ];
      useEntryStore.getState().setSortOption('cpNameDesc');

      const result = useEntryStore.getState().sortEntries(entries);
      expect(result[0].cpName).toBe('忘羡');
      expect(result[1].cpName).toBe('花怜');
      expect(result[2].cpName).toBe('冰秋');
    });
  });

  describe('排序与筛选配合', () => {
    it('筛选后再排序结果正确', () => {
      const entries = [
        createTestEntry({ id: '1', cpName: '忘羡', createdAt: 1000, favorite: true }),
        createTestEntry({ id: '2', cpName: '忘羡', createdAt: 3000, favorite: false }),
        createTestEntry({ id: '3', cpName: '花怜', createdAt: 2000, favorite: true }),
      ];
      useEntryStore.setState({ entries });
      useEntryStore.getState().setFilters({ cpName: '忘羡' });
      useEntryStore.getState().setSortOption('favoriteFirst');

      const filtered = useEntryStore.getState().getFilteredEntries();
      const sorted = useEntryStore.getState().sortEntries(filtered);

      expect(sorted).toHaveLength(2);
      expect(sorted[0].id).toBe('1');
      expect(sorted[1].id).toBe('2');
    });
  });
});
