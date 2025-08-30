"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select";
import { AnnouncementCardOfficersHub } from "@workspace/ui/components/announcements/AnnouncementCardOfficersHub";
import { AnnouncementPreviewProvider } from "@workspace/ui/components/announcements/AnnouncementPreviewContext";
import { AnnouncementPreview } from "@workspace/ui/components/announcements/AnnouncementPreview";
import { useIsMobile } from "@workspace/ui/hooks/use-mobile";
import { useApiClient } from "@/lib/api";
import { useNavigation } from "@/components/navigation/NavigationContext";
import {
  Plus,
  MessageSquare,
  Search,
  SortAsc,
  SortDesc,
  Filter,
  X
} from "lucide-react";
import { toast } from "sonner";
import { AnnouncementSkeletonList } from "@workspace/ui/components/announcements/AnnouncementSkeleton";
import { Skeleton } from "@workspace/ui/components/skeleton";

interface Announcement {
  id: string;
  content: string;
  display_text?: string;
  pinned: boolean;
  is_draft: boolean;
  discord_message_id?: string;
  created_by?: number;
  created_at: string;
  updated_at: string;
}

type SortOption = 'newest' | 'oldest' | 'updated';
type FilterOption = 'all' | 'published' | 'drafts' | 'pinned';

const EmptyState = ({ onAdd, filter }: { onAdd: () => void; filter: FilterOption }) => {
  const getEmptyMessage = () => {
    switch (filter) {
      case 'published':
        return {
          title: "No published announcements",
          description: "Create and publish your first announcement to share with your community."
        };
      case 'drafts':
        return {
          title: "No draft announcements",
          description: "Draft announcements are saved automatically while you work on them."
        };
      case 'pinned':
        return {
          title: "No pinned announcements",
          description: "Pin important announcements to highlight them for your community."
        };
      default:
        return {
          title: "No announcements yet",
          description: "Create your first announcement to keep your community informed. It will automatically sync with Discord!"
        };
    }
  };

  const { title, description } = getEmptyMessage();

  return (
    <div className="text-center py-16">
      <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
        <MessageSquare className="h-12 w-12 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
        {description}
      </p>
      <Button onClick={onAdd}>
        <Plus className="h-4 w-4 mr-2" />
        Create Announcement
      </Button>
    </div>
  );
};

export default function AnnouncementsView() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [isLoading, setIsLoading] = useState(true);
  
  const api = useApiClient();
  const { setView } = useNavigation();
  const isMobile = useIsMobile();

  // Load announcements on mount
  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setIsLoading(true);
      const data = await api.announcements.getAll();
      const transformedAnnouncements: Announcement[] = data.map(announcement => ({
        id: announcement.id.toString(),
        content: announcement.content,
        display_text: announcement.display_text || undefined,
        pinned: announcement.pinned,
        is_draft: announcement.is_draft,
        discord_message_id: announcement.discord_message_id || undefined,
        created_at: announcement.created_at,
        updated_at: announcement.updated_at,
      }));
      setAnnouncements(transformedAnnouncements);
    } catch (error) {
      console.error('Failed to fetch announcements:', error);
      toast.error('Failed to load announcements');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter and sort announcements
  const filteredAndSortedAnnouncements = useMemo(() => {
    let filtered = announcements;

    // Apply search filter
    if (searchQuery.trim()) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter(announcement => 
        (announcement.display_text?.toLowerCase().includes(searchLower)) ||
        announcement.content.toLowerCase().includes(searchLower)
      );
    }

    // Apply status filter
    switch (filterBy) {
      case 'published':
        filtered = filtered.filter(a => !a.is_draft);
        break;
      case 'drafts':
        filtered = filtered.filter(a => a.is_draft);
        break;
      case 'pinned':
        filtered = filtered.filter(a => a.pinned);
        break;
      // 'all' shows everything
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'updated':
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        default:
          return 0;
      }
    });

    return sorted;
  }, [announcements, searchQuery, filterBy, sortBy]);

  // Separate pinned and regular announcements for display
  const { pinnedAnnouncements, regularAnnouncements } = useMemo(() => {
    if (filterBy === 'pinned') {
      return { pinnedAnnouncements: filteredAndSortedAnnouncements, regularAnnouncements: [] };
    }
    
    return {
      pinnedAnnouncements: filteredAndSortedAnnouncements.filter(a => a.pinned),
      regularAnnouncements: filteredAndSortedAnnouncements.filter(a => !a.pinned)
    };
  }, [filteredAndSortedAnnouncements, filterBy]);

  const handleAnnouncementChange = () => {
    fetchAnnouncements();
  };

  const handleCreateNew = () => {
    setView('announcements', 'create');
  };

  const clearSearch = () => {
    setSearchQuery("");
  };

  const getSortLabel = (sort: SortOption) => {
    switch (sort) {
      case 'newest': return 'Newest first';
      case 'oldest': return 'Oldest first';
      case 'updated': return 'Recently updated';
      default: return 'Newest first';
    }
  };

  const getFilterLabel = (filter: FilterOption) => {
    switch (filter) {
      case 'all': return 'All announcements';
      case 'published': return 'Published only';
      case 'drafts': return 'Drafts only';
      case 'pinned': return 'Pinned only';
      default: return 'All announcements';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div>
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-5 w-80" />
            </div>
            <Skeleton className="h-10 w-full sm:w-40" />
          </div>

          {/* Search and filters skeleton */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-md">
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Skeleton className="h-10 w-full sm:w-[180px]" />
              <Skeleton className="h-10 w-full sm:w-[160px]" />
            </div>
          </div>
        </div>

        {/* Results count skeleton */}
        <Skeleton className="h-4 w-32" />

        {/* Content skeleton */}
        <div className="space-y-8">
          {/* Pinned announcements skeleton */}
          <div>
            <Skeleton className="h-6 w-48 mb-4" />
            <AnnouncementSkeletonList count={2} />
          </div>

          {/* Regular announcements skeleton */}
          <div>
            <Skeleton className="h-6 w-40 mb-4" />
            <AnnouncementSkeletonList count={5} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <AnnouncementPreviewProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Announcements</h1>
            </div>
            <Button onClick={handleCreateNew} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Create Announcement
            </Button>
          </div>

          {/* Search and filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search announcements..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSearch}
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-muted"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>

            {/* Filters - Stack on mobile, inline on desktop */}
            <div className="flex flex-col sm:flex-row gap-2">
              {/* Sort */}
              <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
                <SelectTrigger className="w-full sm:w-[180px]" size="default">
                  {sortBy === 'newest' ? (
                    <SortDesc className="h-4 w-4 mr-2" />
                  ) : (
                    <SortAsc className="h-4 w-4 mr-2" />
                  )}
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest first</SelectItem>
                  <SelectItem value="oldest">Oldest first</SelectItem>
                  <SelectItem value="updated">Recently updated</SelectItem>
                </SelectContent>
              </Select>

              {/* Filter */}
              <Select value={filterBy} onValueChange={(value: FilterOption) => setFilterBy(value)}>
                <SelectTrigger className="w-full sm:w-[160px]" size="default">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All announcements</SelectItem>
                  <SelectItem value="published">Published only</SelectItem>
                  <SelectItem value="drafts">Drafts only</SelectItem>
                  <SelectItem value="pinned">Pinned only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Active filters indicator */}
          {(searchQuery || filterBy !== 'all' || sortBy !== 'newest') && (
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span>Active filters:</span>
              {searchQuery && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded-md">
                  Search: "{searchQuery}"
                </span>
              )}
              {filterBy !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded-md">
                  {getFilterLabel(filterBy)}
                </span>
              )}
              {sortBy !== 'newest' && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded-md">
                  {getSortLabel(sortBy)}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Results count */}
        {!isLoading && (
          <div className="text-sm text-muted-foreground">
            {filteredAndSortedAnnouncements.length === 0 ? (
              searchQuery ? "No announcements found" : "No announcements"
            ) : (
              `${filteredAndSortedAnnouncements.length} announcement${filteredAndSortedAnnouncements.length === 1 ? '' : 's'}`
            )}
          </div>
        )}

        {/* Content */}
        {filteredAndSortedAnnouncements.length === 0 ? (
          searchQuery ? (
            <div className="text-center py-16">
              <h3 className="text-lg font-semibold mb-2">No announcements found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your search terms or filters.
              </p>
              <Button variant="outline" onClick={clearSearch}>
                Clear search
              </Button>
            </div>
          ) : (
            <EmptyState onAdd={handleCreateNew} filter={filterBy} />
          )
        ) : (
          <div className="space-y-8">
            {/* Pinned announcements */}
            {pinnedAnnouncements.length > 0 && filterBy !== 'pinned' && (
              <div>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  📌 Pinned Announcements
                </h2>
                <div className="space-y-4">
                  {pinnedAnnouncements.map((announcement) => (
                    <AnnouncementCardOfficersHub
                      key={announcement.id}
                      announcement={announcement}
                      apiClient={{
                        pin: async (id, displayText) => { await api.announcements.pin(id, displayText); },
                        unpin: async (id) => { await api.announcements.unpin(id); },
                        delete: async (id) => { await api.announcements.delete(id); },
                        update: async (id, data) => { await api.announcements.update(id, data); },
                      }}
                      onEdit={(id) => setView('announcements', 'edit', { id })}
                      permissions={{
                        canEdit: true,
                        canDelete: true,
                        canPin: true,
                      }}
                      onChange={fetchAnnouncements}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Regular announcements or all if filtering by pinned */}
            {(regularAnnouncements.length > 0 || filterBy === 'pinned') && (
              <div>
                {pinnedAnnouncements.length > 0 && filterBy !== 'pinned' && (
                  <h2 className="text-lg font-semibold mb-4">
                    {filterBy === 'all' ? 'Recent Announcements' : getFilterLabel(filterBy)}
                  </h2>
                )}
                <div className="space-y-4">
                  {(filterBy === 'pinned' ? pinnedAnnouncements : regularAnnouncements).map((announcement) => (
                    <AnnouncementCardOfficersHub
                      key={announcement.id}
                      announcement={announcement}
                      apiClient={{
                        pin: async (id, displayText) => { await api.announcements.pin(id, displayText); },
                        unpin: async (id) => { await api.announcements.unpin(id); },
                        delete: async (id) => { await api.announcements.delete(id); },
                        update: async (id, data) => { await api.announcements.update(id, data); },
                      }}
                      onEdit={(id) => setView('announcements', 'edit', { id })}
                      permissions={{
                        canEdit: true,
                        canDelete: true,
                        canPin: true,
                      }}
                      onChange={fetchAnnouncements}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      <AnnouncementPreview />
    </AnnouncementPreviewProvider>
  );
}
