import { useState, useEffect, useMemo } from 'react';
import {
  X,
  BarChart3,
  PieChart,
  TrendingUp,
  Users,
  BookOpen,
  Heart,
  FileText,
  Calendar,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { useEntryStore } from '../store/useEntryStore';
import type { EntryType, ReadStatus, TrendDataItem } from '../types';
import { TYPE_COLORS, READ_STATUS_COLORS } from '../types';

const CHART_COLORS = [
  '#8b5cf6',
  '#ec4899',
  '#f59e0b',
  '#10b981',
  '#3b82f6',
  '#ef4444',
  '#06b6d4',
  '#84cc16',
  '#f97316',
  '#6366f1',
];

export const DataAnalyzer = () => {
  const {
    isDataAnalysisOpen,
    closeDataAnalysis,
    analyzeData,
    setFilters,
    resetFilters,
  } = useEntryStore();

  const [isAnimating, setIsAnimating] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'cp' | 'type' | 'status' | 'trend'>('overview');

  useEffect(() => {
    if (isDataAnalysisOpen) {
      setIsAnimating(true);
    }
  }, [isDataAnalysisOpen]);

  const analysisData = useMemo(() => analyzeData(), [analyzeData]);

  if (!isDataAnalysisOpen) return null;

  const closeModal = () => {
    setIsAnimating(false);
    setTimeout(closeDataAnalysis, 200);
  };

  const handleCpClick = (cpName: string) => {
    resetFilters();
    setFilters({ cpName });
    closeModal();
  };

  const handleTypeClick = (type: EntryType) => {
    resetFilters();
    setFilters({ type });
    closeModal();
  };

  const handleReadStatusClick = (status: ReadStatus) => {
    resetFilters();
    setFilters({ readStatus: status });
    closeModal();
  };

  const handleFavoriteClick = () => {
    resetFilters();
    setFilters({ favoriteOnly: true });
    closeModal();
  };

  const handleDateClick = (trendItem: TrendDataItem) => {
    const date = new Date(trendItem.timestamp);
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    const dateFrom = new Date(year, month, day, 0, 0, 0).getTime();
    const dateTo = new Date(year, month, day, 23, 59, 59).getTime();
    resetFilters();
    setFilters({ dateFrom, dateTo });
    closeModal();
  };

  const renderPieChart = (
    data: { label: string; value: number; color: string }[],
    onClick?: (index: number) => void
  ) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    if (total === 0) return null;

    let currentAngle = 0;
    const segments = data.map((item, index) => {
      const angle = (item.value / total) * 360;
      const startAngle = currentAngle;
      currentAngle += angle;

      const startRad = ((startAngle - 90) * Math.PI) / 180;
      const endRad = ((currentAngle - 90) * Math.PI) / 180;

      const x1 = 100 + 70 * Math.cos(startRad);
      const y1 = 100 + 70 * Math.sin(startRad);
      const x2 = 100 + 70 * Math.cos(endRad);
      const y2 = 100 + 70 * Math.sin(endRad);

      const largeArc = angle > 180 ? 1 : 0;

      return (
        <path
          key={index}
          d={`M 100 100 L ${x1} ${y1} A 70 70 0 ${largeArc} 1 ${x2} ${y2} Z`}
          fill={item.color}
          className="cursor-pointer transition-all duration-200 hover:opacity-80 hover:scale-105 origin-center"
          onClick={() => onClick?.(index)}
        />
      );
    });

    return (
      <svg viewBox="0 0 200 200" className="w-full max-w-[200px]">
        {segments}
        <circle cx="100" cy="100" r="35" fill="white" />
      </svg>
    );
  };

  const renderBarChart = (
    data: { label: string; value: number; color: string }[],
    onClick?: (index: number) => void
  ) => {
    const maxValue = Math.max(...data.map((d) => d.value), 1);

    return (
      <div className="space-y-2">
        {data.map((item, index) => (
          <div
            key={index}
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => onClick?.(index)}
          >
            <div className="w-20 text-sm text-gray-600 truncate font-display group-hover:text-primary-600 transition-colors">
              {item.label}
            </div>
            <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 group-hover:opacity-80"
                style={{
                  width: `${(item.value / maxValue) * 100}%`,
                  backgroundColor: item.color,
                }}
              />
            </div>
            <div className="w-12 text-right text-sm font-semibold text-gray-700 font-display">
              {item.value}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderTrendChart = (
    data: TrendDataItem[],
    onClick?: (item: TrendDataItem) => void
  ) => {
    const maxCount = Math.max(...data.map((d) => d.count), 1);
    const chartHeight = 120;
    const chartWidth = 100;
    const barWidth = chartWidth / data.length - 2;

    return (
      <svg viewBox="0 0 100 130" className="w-full h-full">
        {data.map((item, index) => {
          const barHeight = (item.count / maxCount) * chartHeight;
          const x = index * (chartWidth / data.length) + 1;
          const y = chartHeight - barHeight;

          return (
            <g
              key={index}
              onClick={() => onClick?.(item)}
              className={onClick ? 'cursor-pointer' : ''}
            >
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill="url(#barGradient)"
                rx="2"
                className="transition-all duration-300 hover:opacity-80"
              />
              <text
                x={x + barWidth / 2}
                y={chartHeight + 10}
                textAnchor="middle"
                fontSize="4"
                fill="#6b7280"
                className="font-display pointer-events-none"
              >
                {item.date.split('/')[1]}
              </text>
            </g>
          );
        })}
        <defs>
          <linearGradient id="barGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
        </defs>
      </svg>
    );
  };

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-24 h-24 mb-6 rounded-full bg-gradient-to-br from-primary-100 to-purple-100 flex items-center justify-center">
        <BarChart3 size={40} className="text-primary-400" />
      </div>
      <h3 className="text-xl font-display font-bold text-gray-700 mb-2">暂无数据</h3>
      <p className="text-gray-500 max-w-xs">
        添加一些粮单记录后，这里会展示你的收藏习惯分析。
        快去添加你的第一条记录吧！
      </p>
      <div className="mt-6 flex items-center gap-2 text-primary-500">
        <Sparkles size={16} />
        <span className="text-sm font-display font-medium">开始记录，发现你的收藏偏好</span>
      </div>
    </div>
  );

  const OverviewTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-panel p-4 cursor-pointer hover:shadow-soft-lg transition-all" onClick={handleFavoriteClick}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-100 to-rose-100 flex items-center justify-center">
              <Heart size={22} className="text-pink-500" fill="currentColor" />
            </div>
            <div>
              <div className="text-2xl font-display font-bold text-gray-800">
                {analysisData.favoriteCount}
              </div>
              <div className="text-xs text-gray-500 font-medium">收藏 ({analysisData.favoritePercentage}%)</div>
            </div>
          </div>
        </div>
        <div className="glass-panel p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-100 to-violet-100 flex items-center justify-center">
              <Users size={22} className="text-primary-500" />
            </div>
            <div>
              <div className="text-2xl font-display font-bold text-gray-800">
                {analysisData.cpDistribution.length}
              </div>
              <div className="text-xs text-gray-500 font-medium">CP 对数</div>
            </div>
          </div>
        </div>
        <div className="glass-panel p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
              <FileText size={22} className="text-amber-500" />
            </div>
            <div>
              <div className="text-2xl font-display font-bold text-gray-800">
                {analysisData.typeDistribution.length}
              </div>
              <div className="text-xs text-gray-500 font-medium">作品类型</div>
            </div>
          </div>
        </div>
        <div className="glass-panel p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
              <TrendingUp size={22} className="text-emerald-500" />
            </div>
            <div>
              <div className="text-2xl font-display font-bold text-gray-800">
                {analysisData.trendData.reduce((sum, d) => sum + d.count, 0)}
              </div>
              <div className="text-xs text-gray-500 font-medium">近14天新增</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="glass-panel p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-gray-800 flex items-center gap-2">
              <PieChart size={18} className="text-primary-500" />
              类型分布
            </h3>
            <button
              onClick={() => setActiveTab('type')}
              className="text-sm text-primary-500 hover:text-primary-600 flex items-center gap-1 font-display"
            >
              查看详情 <ArrowRight size={14} />
            </button>
          </div>
          <div className="flex items-center gap-6">
            {renderPieChart(
              analysisData.typeDistribution.map((item, index) => ({
                label: item.type,
                value: item.count,
                color: CHART_COLORS[index % CHART_COLORS.length],
              })),
              (index) => handleTypeClick(analysisData.typeDistribution[index].type)
            )}
            <div className="flex-1 space-y-2">
              {analysisData.typeDistribution.slice(0, 4).map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 cursor-pointer group"
                  onClick={() => handleTypeClick(item.type)}
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                  />
                  <span className="text-sm text-gray-600 group-hover:text-primary-600 transition-colors font-display">
                    {item.type}
                  </span>
                  <span className="text-xs text-gray-400 ml-auto">{item.count} 条</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="glass-panel p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-gray-800 flex items-center gap-2">
              <BookOpen size={18} className="text-emerald-500" />
              阅读状态
            </h3>
            <button
              onClick={() => setActiveTab('status')}
              className="text-sm text-primary-500 hover:text-primary-600 flex items-center gap-1 font-display"
            >
              查看详情 <ArrowRight size={14} />
            </button>
          </div>
          <div className="flex items-center gap-6">
            {renderPieChart(
              analysisData.readStatusDistribution
                .filter((item) => item.count > 0)
                .map((item, index) => ({
                  label: item.status,
                  value: item.count,
                  color: CHART_COLORS[(index + 3) % CHART_COLORS.length],
                })),
              (index) => {
                const filtered = analysisData.readStatusDistribution.filter((item) => item.count > 0);
                handleReadStatusClick(filtered[index].status);
              }
            )}
            <div className="flex-1 space-y-2">
              {analysisData.readStatusDistribution
                .filter((item) => item.count > 0)
                .map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 cursor-pointer group"
                    onClick={() => handleReadStatusClick(item.status)}
                  >
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: CHART_COLORS[(index + 3) % CHART_COLORS.length] }}
                    />
                    <span className="text-sm text-gray-600 group-hover:text-primary-600 transition-colors font-display">
                      {item.status}
                    </span>
                    <span className="text-xs text-gray-400 ml-auto">
                      {item.count} 条 ({item.percentage}%)
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      <div className="glass-panel p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-gray-800 flex items-center gap-2">
              <Calendar size={18} className="text-amber-500" />
              近14天新增趋势
            </h3>
            <button
              onClick={() => setActiveTab('trend')}
              className="text-sm text-primary-500 hover:text-primary-600 flex items-center gap-1 font-display"
            >
              查看详情 <ArrowRight size={14} />
            </button>
          </div>
          <div className="h-40">
            {renderTrendChart(analysisData.trendData, handleDateClick)}
          </div>
          <p className="text-xs text-gray-400 text-center mt-2 font-display">点击柱状图查看对应日期的记录</p>
        </div>

      <div className="glass-panel p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-gray-800 flex items-center gap-2">
            <Users size={18} className="text-violet-500" />
            Top CP 排行
          </h3>
          <button
            onClick={() => setActiveTab('cp')}
            className="text-sm text-primary-500 hover:text-primary-600 flex items-center gap-1 font-display"
          >
            查看全部 <ArrowRight size={14} />
          </button>
        </div>
        {renderBarChart(
          analysisData.cpDistribution.slice(0, 5).map((item, index) => ({
            label: item.cpName,
            value: item.count,
            color: CHART_COLORS[index % CHART_COLORS.length],
          })),
          (index) => handleCpClick(analysisData.cpDistribution[index].cpName)
        )}
      </div>
    </div>
  );

  const CpTab = () => (
    <div className="glass-panel p-5">
      <h3 className="font-display font-bold text-gray-800 flex items-center gap-2 mb-6">
        <Users size={20} className="text-violet-500" />
        CP 分布详情
      </h3>
      <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
        {analysisData.cpDistribution.map((item, index) => (
          <div
            key={index}
            className="flex items-center gap-4 p-3 rounded-xl bg-gray-50/50 hover:bg-primary-50/50 cursor-pointer transition-colors group"
            onClick={() => handleCpClick(item.cpName)}
          >
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-display font-bold text-sm"
              style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
            >
              {index + 1}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-display font-semibold text-gray-800 group-hover:text-primary-600 transition-colors truncate">
                {item.cpName}
              </div>
              <div className="text-xs text-gray-500">
                {item.count} 条 · 占比 {item.percentage}%
              </div>
            </div>
            <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${item.percentage}%`,
                  backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const TypeTab = () => (
    <div className="glass-panel p-5">
      <h3 className="font-display font-bold text-gray-800 flex items-center gap-2 mb-6">
        <FileText size={20} className="text-amber-500" />
        类型分布详情
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {analysisData.typeDistribution.map((item, index) => (
          <div
            key={index}
            className="p-4 rounded-xl bg-gray-50/50 hover:bg-primary-50/50 cursor-pointer transition-all group"
            onClick={() => handleTypeClick(item.type)}
          >
            <div className={`inline-block px-3 py-1 rounded-full text-sm font-display font-medium mb-2 ${TYPE_COLORS[item.type]}`}>
              {item.type}
            </div>
            <div className="text-3xl font-display font-bold text-gray-800 group-hover:text-primary-600 transition-colors">
              {item.count}
            </div>
            <div className="text-sm text-gray-500">条 · 占比 {item.percentage}%</div>
            <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${item.percentage}%`,
                  backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const StatusTab = () => (
    <div className="glass-panel p-5">
      <h3 className="font-display font-bold text-gray-800 flex items-center gap-2 mb-6">
        <BookOpen size={20} className="text-emerald-500" />
        阅读状态详情
      </h3>
      <div className="grid grid-cols-2 gap-4">
        {analysisData.readStatusDistribution.map((item, index) => (
          <div
            key={index}
            className="p-4 rounded-xl bg-gray-50/50 hover:bg-primary-50/50 cursor-pointer transition-all group"
            onClick={() => handleReadStatusClick(item.status)}
          >
            <div className={`inline-block px-3 py-1 rounded-full text-sm font-display font-medium mb-2 ${READ_STATUS_COLORS[item.status]}`}>
              {item.status}
            </div>
            <div className="text-3xl font-display font-bold text-gray-800 group-hover:text-primary-600 transition-colors">
              {item.count}
            </div>
            <div className="text-sm text-gray-500">条 · 占比 {item.percentage}%</div>
            <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${item.percentage}%`,
                  backgroundColor: CHART_COLORS[(index + 3) % CHART_COLORS.length],
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const TrendTab = () => (
    <div className="glass-panel p-5">
      <h3 className="font-display font-bold text-gray-800 flex items-center gap-2 mb-6">
        <Calendar size={20} className="text-blue-500" />
        近14天新增趋势
      </h3>
      <div className="h-64 mb-4">
        {renderTrendChart(analysisData.trendData, handleDateClick)}
      </div>
      <div className="grid grid-cols-7 gap-2">
        {analysisData.trendData.map((item, index) => (
          <div
            key={index}
            className="text-center p-2 rounded-lg bg-gray-50/50 hover:bg-primary-50/50 cursor-pointer transition-colors group"
            onClick={() => handleDateClick(item)}
          >
            <div className="text-xs text-gray-500 mb-1 font-display group-hover:text-primary-500 transition-colors">{item.date}</div>
            <div className="text-lg font-display font-bold text-primary-600 group-hover:text-primary-700 transition-colors">{item.count}</div>
          </div>
        ))}
      </div>
      <div className="mt-4 p-4 bg-gradient-to-r from-primary-50 to-purple-50 rounded-xl">
        <div className="flex items-center gap-2 text-sm text-gray-600 font-display">
          <TrendingUp size={16} className="text-emerald-500" />
          <span>
            近14天共新增 <span className="font-bold text-primary-600">{analysisData.trendData.reduce((sum, d) => sum + d.count, 0)}</span> 条记录，
            日均 <span className="font-bold text-primary-600">{(analysisData.trendData.reduce((sum, d) => sum + d.count, 0) / 14).toFixed(1)}</span> 条
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-200 ${
          isAnimating ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={closeModal}
      />
      <div
        className={`relative glass-panel w-full max-w-4xl max-h-[90vh] overflow-hidden transition-all duration-300 flex flex-col ${
          isAnimating ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
      >
        <div className="sticky top-0 bg-gradient-to-r from-primary-500 via-purple-500 to-pink-500 px-6 py-4 text-white z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-display font-bold flex items-center gap-2">
              <BarChart3 size={22} />
              数据分析
            </h2>
            <button
              onClick={closeModal}
              className="p-2 rounded-full hover:bg-white/20 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {analysisData.hasData ? (
          <>
            <div className="sticky top-[72px] bg-white/90 backdrop-blur-sm border-b border-gray-100 px-6 py-2 z-10">
              <div className="flex gap-1 overflow-x-auto">
                {[
                  { key: 'overview', label: '概览', icon: Sparkles },
                  { key: 'cp', label: 'CP分布', icon: Users },
                  { key: 'type', label: '类型分布', icon: FileText },
                  { key: 'status', label: '阅读状态', icon: BookOpen },
                  { key: 'trend', label: '新增趋势', icon: TrendingUp },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as typeof activeTab)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-display text-sm font-medium transition-all whitespace-nowrap ${
                      activeTab === tab.key
                        ? 'bg-primary-500 text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <tab.icon size={16} />
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {activeTab === 'overview' && <OverviewTab />}
              {activeTab === 'cp' && <CpTab />}
              {activeTab === 'type' && <TypeTab />}
              {activeTab === 'status' && <StatusTab />}
              {activeTab === 'trend' && <TrendTab />}
            </div>
          </>
        ) : (
          <div className="p-6">
            <EmptyState />
          </div>
        )}
      </div>
    </div>
  );
};
