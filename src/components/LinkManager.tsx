import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  X,
  Link2,
  ExternalLink,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  CheckSquare,
  Square,
  FileText,
  BookOpen,
  Globe,
  AlertCircle,
  Copy,
  XCircle,
  Edit3,
  Trash2,
  Filter,
} from 'lucide-react';
import { useEntryStore } from '../store/useEntryStore';
import type { LinkInfo, LinkDomainGroup, LinkIssueType } from '../types';

export const LinkManager = () => {
  const {
    isLinkManagerOpen,
    closeLinkManager,
    analyzeLinks,
    batchUpdateNotes,
    batchClearEmptyLinks,
    openForm,
    entries,
  } = useEntryStore();

  const [isAnimating, setIsAnimating] = useState(false);
  const [selectedLinks, setSelectedLinks] = useState<Set<string>>(new Set());
  const [expandedDomains, setExpandedDomains] = useState<Set<string>>(new Set());
  const [filterType, setFilterType] = useState<'all' | 'issues' | 'empty' | 'duplicate' | 'invalid'>('all');
  const [filterDomain, setFilterDomain] = useState<string>('all');
  const [batchNotes, setBatchNotes] = useState('');
  const [showBatchNotes, setShowBatchNotes] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');

  useEffect(() => {
    if (isLinkManagerOpen) {
      setIsAnimating(true);
      setSelectedLinks(new Set());
      setExpandedDomains(new Set());
      setFilterType('all');
      setFilterDomain('all');
      setBatchNotes('');
      setShowBatchNotes(false);
      setSearchKeyword('');
    }
  }, [isLinkManagerOpen]);

  const analysisResult = useMemo(() => analyzeLinks(entries), [analyzeLinks, entries]);

  const allDomains = useMemo(() => {
    const domains = new Set<string>();
    analysisResult.allLinks.forEach((link) => domains.add(link.domain));
    return Array.from(domains).sort();
  }, [analysisResult]);

  const matchFilterType = useCallback((link: LinkInfo): boolean => {
    switch (filterType) {
      case 'issues':
        return link.hasIssue;
      case 'empty':
        return link.issues.some((i) => i.type === 'empty');
      case 'duplicate':
        return link.issues.some((i) => i.type === 'duplicate');
      case 'invalid':
        return link.issues.some((i) => i.type === 'invalid');
      default:
        return true;
    }
  }, [filterType]);

  const matchFilterDomain = useCallback((link: LinkInfo): boolean => {
    if (filterDomain === 'all') return true;
    return link.domain === filterDomain;
  }, [filterDomain]);

  const matchSearch = useCallback((link: LinkInfo): boolean => {
    if (!searchKeyword) return true;
    const keyword = searchKeyword.toLowerCase();
    return (
      link.workName.toLowerCase().includes(keyword) ||
      link.cpName.toLowerCase().includes(keyword) ||
      link.link.toLowerCase().includes(keyword) ||
      link.domain.toLowerCase().includes(keyword) ||
      link.notes.toLowerCase().includes(keyword)
    );
  }, [searchKeyword]);

  const filteredGroups = useMemo(() => {
    return analysisResult.domainGroups
      .map((group) => ({
        ...group,
        links: group.links.filter((l) => matchFilterType(l) && matchFilterDomain(l) && matchSearch(l)),
      }))
      .filter((group) => group.links.length > 0);
  }, [analysisResult, matchFilterType, matchFilterDomain, matchSearch]);

  if (!isLinkManagerOpen) return null;

  const closeModal = () => {
    setIsAnimating(false);
    setTimeout(closeLinkManager, 200);
  };

  const toggleLinkSelection = (entryId: string) => {
    setSelectedLinks((prev) => {
      const next = new Set(prev);
      if (next.has(entryId)) {
        next.delete(entryId);
      } else {
        next.add(entryId);
      }
      return next;
    });
  };

  const toggleDomain = (domain: string) => {
    setExpandedDomains((prev) => {
      const next = new Set(prev);
      if (next.has(domain)) {
        next.delete(domain);
      } else {
        next.add(domain);
      }
      return next;
    });
  };

  const selectAllInDomain = (domain: string, links: LinkInfo[]) => {
    const filteredLinks = links.filter((l) => matchFilterType(l) && matchFilterDomain(l) && matchSearch(l));
    const allSelected = filteredLinks.every((l) => selectedLinks.has(l.entryId));
    
    setSelectedLinks((prev) => {
      const next = new Set(prev);
      filteredLinks.forEach((l) => {
        if (allSelected) {
          next.delete(l.entryId);
        } else {
          next.add(l.entryId);
        }
      });
      return next;
    });
  };

  const selectAllFiltered = () => {
    const allFilteredIds = new Set<string>();
    filteredGroups.forEach((group) => {
      group.links.forEach((l) => allFilteredIds.add(l.entryId));
    });
    
    const currentAllSelected = Array.from(allFilteredIds).every((id) => selectedLinks.has(id));
    
    if (currentAllSelected) {
      setSelectedLinks(new Set());
    } else {
      setSelectedLinks(allFilteredIds);
    }
  };

  const handleOpenLink = (link: string) => {
    if (link) {
      const url = link.startsWith('http') ? link : `https://${link}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleOpenEditForm = (entryId: string) => {
    const entry = entries.find((e) => e.id === entryId);
    if (entry) {
      closeModal();
      setTimeout(() => openForm(entry), 200);
    }
  };

  const handleBatchUpdateNotes = () => {
    if (selectedLinks.size > 0 && batchNotes.trim()) {
      batchUpdateNotes(Array.from(selectedLinks), batchNotes.trim());
      setBatchNotes('');
      setShowBatchNotes(false);
      setSelectedLinks(new Set());
    }
  };

  const handleBatchClearLinks = () => {
    if (selectedLinks.size > 0) {
      batchClearEmptyLinks(Array.from(selectedLinks));
      setSelectedLinks(new Set());
    }
  };

  const getIssueIcon = (type: LinkIssueType) => {
    switch (type) {
      case 'empty':
        return <XCircle size={14} className="text-gray-400" />;
      case 'duplicate':
        return <Copy size={14} className="text-amber-500" />;
      case 'invalid':
        return <AlertCircle size={14} className="text-red-500" />;
      default:
        return <AlertTriangle size={14} className="text-amber-500" />;
    }
  };

  const getIssueBadgeClass = (type: LinkIssueType) => {
    switch (type) {
      case 'empty':
        return 'bg-gray-100 text-gray-600';
      case 'duplicate':
        return 'bg-amber-100 text-amber-700';
      case 'invalid':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-amber-100 text-amber-700';
    }
  };

  const renderLinkItem = (linkInfo: LinkInfo) => {
    const isSelected = selectedLinks.has(linkInfo.entryId);

    return (
      <div
        key={linkInfo.entryId}
        className={`p-4 rounded-lg border transition-all duration-200 ${
          isSelected
            ? 'bg-primary-50 border-primary-300'
            : 'bg-white/60 border-gray-200 hover:border-primary-200'
        }`}
      >
        <div className="flex items-start gap-3">
          <button
            onClick={() => toggleLinkSelection(linkInfo.entryId)}
            className="mt-1 flex-shrink-0 text-gray-400 hover:text-primary-500 transition-colors"
          >
            {isSelected ? (
              <CheckSquare size={18} className="text-primary-500" />
            ) : (
              <Square size={18} />
            )}
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="flex-1 min-w-0">
                <h4 className="font-display font-semibold text-gray-800 truncate">
                  {linkInfo.workName}
                </h4>
                <div className="flex items-center gap-1.5 text-sm text-gray-500">
                  <BookOpen size={12} className="text-primary-400" />
                  <span className="font-display text-primary-600">{linkInfo.cpName}</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {linkInfo.link && (
                  <button
                    onClick={() => handleOpenLink(linkInfo.link)}
                    className="p-1.5 rounded-lg hover:bg-primary-100 text-gray-400 hover:text-primary-600 transition-colors"
                    title="打开链接"
                  >
                    <ExternalLink size={14} />
                  </button>
                )}
                <button
                  onClick={() => handleOpenEditForm(linkInfo.entryId)}
                  className="p-1.5 rounded-lg hover:bg-primary-100 text-gray-400 hover:text-primary-600 transition-colors"
                  title="编辑链接"
                >
                  <Edit3 size={14} />
                </button>
              </div>
            </div>

            {linkInfo.link && (
              <div className="flex items-center gap-1.5 mb-2 text-sm text-gray-600">
                <Link2 size={12} className="text-gray-400" />
                <span className="truncate break-all">{linkInfo.link}</span>
              </div>
            )}

            {linkInfo.issues.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {linkInfo.issues.map((issue, idx) => (
                  <span
                    key={idx}
                    className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-display ${getIssueBadgeClass(
                      issue.type
                    )}`}
                  >
                    {getIssueIcon(issue.type)}
                    {issue.message}
                  </span>
                ))}
              </div>
            )}

            {linkInfo.notes && (
              <div className="text-xs text-gray-500 bg-gray-50 rounded px-2 py-1 truncate">
                📝 {linkInfo.notes}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderDomainGroup = (group: LinkDomainGroup) => {
    const isExpanded = expandedDomains.has(group.domain);
    const allSelected = group.links.every((l) => selectedLinks.has(l.entryId));
    const someSelected = group.links.some((l) => selectedLinks.has(l.entryId));

    return (
      <div key={group.domain} className="mb-4">
        <div
          onClick={() => toggleDomain(group.domain)}
          className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-primary-50 to-purple-50 border border-primary-100 cursor-pointer hover:shadow-sm transition-shadow"
        >
          <div className="flex items-center gap-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                selectAllInDomain(group.domain, group.links);
              }}
              className="text-gray-400 hover:text-primary-500 transition-colors"
            >
              {allSelected ? (
                <CheckSquare size={18} className="text-primary-500" />
              ) : someSelected ? (
                <CheckSquare size={18} className="text-primary-300" />
              ) : (
                <Square size={18} />
              )}
            </button>
            <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center text-primary-600">
              <Globe size={18} />
            </div>
            <div>
              <h3 className="font-display font-bold text-gray-800">
                {group.domain}
              </h3>
              <div className="text-xs text-gray-500">
                {group.count} 条链接
                {group.issueCount > 0 && (
                  <span className="ml-2 text-amber-600">
                    · {group.issueCount} 条有问题
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isExpanded ? (
              <ChevronUp size={18} className="text-gray-400" />
            ) : (
              <ChevronDown size={18} className="text-gray-400" />
            )}
          </div>
        </div>

        {isExpanded && (
          <div className="mt-3 space-y-2 pl-2">
            {group.links.map(renderLinkItem)}
          </div>
        )}
      </div>
    );
  };

  const allFilteredCount = filteredGroups.reduce((sum, g) => sum + g.links.length, 0);
  const allFilteredSelected = filteredGroups.every((g) =>
    g.links.every((l) => selectedLinks.has(l.entryId))
  );
  const someFilteredSelected = filteredGroups.some((g) =>
    g.links.some((l) => selectedLinks.has(l.entryId))
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
        <div className="sticky top-0 bg-gradient-to-r from-primary-500 to-purple-500 px-6 py-4 text-white z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-display font-bold flex items-center gap-2">
              <Link2 size={22} />
              链接管理工作台
            </h2>
            <button
              onClick={closeModal}
              className="p-2 rounded-full hover:bg-white/20 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="sticky top-[72px] bg-white/90 backdrop-blur-sm border-b border-gray-100 px-6 py-3 z-10">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="搜索作品名、CP、链接..."
                className="input-field py-2 pl-9 text-sm"
              />
              <Link2
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <Filter size={14} />
                <span>域名:</span>
              </div>
              <select
                value={filterDomain}
                onChange={(e) => setFilterDomain(e.target.value)}
                className="input-field py-2 text-sm w-48"
              >
                <option value="all">全部域名</option>
                {allDomains.map((domain) => (
                  <option key={domain} value={domain}>
                    {domain}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1 flex-wrap mt-3">
            {[
              { key: 'all', label: '全部' },
              { key: 'issues', label: '有问题' },
              { key: 'empty', label: '空链接' },
              { key: 'duplicate', label: '重复' },
              { key: 'invalid', label: '格式异常' },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => setFilterType(item.key as typeof filterType)}
                className={`px-3 py-1.5 text-sm rounded-lg font-display transition-colors ${
                  filterType === item.key
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-primary-100 hover:text-primary-600'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="px-6 py-3 bg-gray-50/50 border-b border-gray-100">
          <div className="grid grid-cols-5 gap-3 text-sm">
            <div className="text-center">
              <div className="font-display font-bold text-lg text-primary-600">
                {analysisResult.totalLinks}
              </div>
              <div className="text-xs text-gray-500">有效链接</div>
            </div>
            <div className="text-center">
              <div className="font-display font-bold text-lg text-gray-500">
                {analysisResult.emptyLinks}
              </div>
              <div className="text-xs text-gray-500">空链接</div>
            </div>
            <div className="text-center">
              <div className="font-display font-bold text-lg text-amber-500">
                {analysisResult.duplicateLinks}
              </div>
              <div className="text-xs text-gray-500">重复链接</div>
            </div>
            <div className="text-center">
              <div className="font-display font-bold text-lg text-red-500">
                {analysisResult.invalidLinks}
              </div>
              <div className="text-xs text-gray-500">格式异常</div>
            </div>
            <div className="text-center">
              <div className="font-display font-bold text-lg text-purple-500">
                {allDomains.length}
              </div>
              <div className="text-xs text-gray-500">域名数量</div>
            </div>
          </div>
        </div>

        {selectedLinks.size > 0 && (
          <div className="px-6 py-3 bg-primary-50 border-b border-primary-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={selectAllFiltered}
                  className="flex items-center gap-1.5 text-sm font-display text-primary-700 hover:text-primary-800 transition-colors"
                >
                  {allFilteredSelected ? (
                    <CheckSquare size={16} className="text-primary-500" />
                  ) : someFilteredSelected ? (
                    <CheckSquare size={16} className="text-primary-300" />
                  ) : (
                    <Square size={16} />
                  )}
                  全选当前筛选 ({allFilteredCount})
                </button>
                <span className="text-sm font-display text-primary-700">
                  已选择 {selectedLinks.size} 条链接
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowBatchNotes(!showBatchNotes)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-primary-500 text-white hover:bg-primary-600 transition-colors font-display"
                >
                  <FileText size={14} />
                  批量补充备注
                </button>
                <button
                  onClick={handleBatchClearLinks}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors font-display"
                >
                  <Trash2 size={14} />
                  批量清空链接
                </button>
              </div>
            </div>

            {showBatchNotes && (
              <div className="mt-3 flex items-start gap-2">
                <textarea
                  value={batchNotes}
                  onChange={(e) => setBatchNotes(e.target.value)}
                  placeholder="输入要批量添加的备注内容..."
                  className="input-field flex-1 py-2 text-sm resize-none"
                  rows={2}
                />
                <button
                  onClick={handleBatchUpdateNotes}
                  disabled={!batchNotes.trim()}
                  className={`px-4 py-2 rounded-lg text-sm font-display transition-colors ${
                    batchNotes.trim()
                      ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  确认
                </button>
              </div>
            )}
          </div>
        )}

        <div className="p-6 overflow-y-auto flex-1">
          {filteredGroups.length > 0 ? (
            <div>{filteredGroups.map(renderDomainGroup)}</div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                <Link2 size={28} />
              </div>
              <p className="text-gray-500 font-display">
                {searchKeyword || filterDomain !== 'all' || filterType !== 'all'
                  ? '没有找到匹配的链接'
                  : '暂无符合条件的链接'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
