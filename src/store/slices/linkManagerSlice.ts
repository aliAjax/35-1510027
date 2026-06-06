import type { StateCreator } from 'zustand';
import type { EntryStore, LinkAnalysisResult, LinkInfo, LinkDomainGroup, Entry, LinkIssue, LinkIssueType } from '../../types';

export const createLinkManagerSlice: StateCreator<
  EntryStore,
  [],
  [],
  {
    isLinkManagerOpen: boolean;
    analyzeLinks: (entriesToAnalyze?: Entry[]) => LinkAnalysisResult;
  }
> = (_set, get) => ({
  isLinkManagerOpen: false,

  analyzeLinks: (entriesToAnalyze?: Entry[]): LinkAnalysisResult => {
    const entries = entriesToAnalyze ?? get().entries;
    
    const extractDomain = (url: string): string => {
      if (!url) return '无链接';
      try {
        const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
        return urlObj.hostname;
      } catch {
        return '格式异常';
      }
    };

    const isValidUrl = (url: string): boolean => {
      if (!url) return false;
      try {
        new URL(url.startsWith('http') ? url : `https://${url}`);
        return true;
      } catch {
        return false;
      }
    };

    const urlCount = new Map<string, number>();

    entries.forEach((entry) => {
      if (entry.link) {
        const normalizedUrl = entry.link.trim().toLowerCase();
        urlCount.set(normalizedUrl, (urlCount.get(normalizedUrl) || 0) + 1);
      }
    });

    const allLinks: LinkInfo[] = entries.map((entry) => {
      const issues: LinkIssue[] = [];
      const link = entry.link || '';

      if (!link.trim()) {
        issues.push({ type: 'empty', message: '空链接' });
      } else if (!isValidUrl(link)) {
        issues.push({ type: 'invalid', message: '链接格式异常' });
      }

      const normalizedUrl = link.trim().toLowerCase();
      if (normalizedUrl && (urlCount.get(normalizedUrl) || 0) > 1) {
        issues.push({ type: 'duplicate', message: '重复链接' });
      }

      return {
        entryId: entry.id,
        workName: entry.workName,
        cpName: entry.cpName,
        link: entry.link,
        domain: extractDomain(entry.link),
        notes: entry.notes,
        issues,
        hasIssue: issues.length > 0,
      };
    });

    const domainGroupsMap = new Map<string, LinkInfo[]>();
    allLinks.forEach((linkInfo) => {
      const domain = linkInfo.domain;
      if (!domainGroupsMap.has(domain)) {
        domainGroupsMap.set(domain, []);
      }
      domainGroupsMap.get(domain)!.push(linkInfo);
    });

    const domainGroups: LinkDomainGroup[] = Array.from(domainGroupsMap.entries())
      .map(([domain, links]) => ({
        domain,
        links,
        count: links.length,
        issueCount: links.filter((l) => l.hasIssue).length,
      }))
      .sort((a, b) => b.count - a.count);

    return {
      totalLinks: allLinks.filter((l) => l.link).length,
      emptyLinks: allLinks.filter((l) => !l.link.trim()).length,
      duplicateLinks: allLinks.filter((l) => l.issues.some((i) => i.type === 'duplicate')).length,
      invalidLinks: allLinks.filter((l) => l.issues.some((i) => i.type === 'invalid')).length,
      domainGroups,
      allLinks,
    };
  },
});
