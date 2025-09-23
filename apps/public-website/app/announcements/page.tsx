"use client";

import { useState, useMemo, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Navbar } from "@/components/layouts/Navbar";
import { Footer } from "@/components/layouts/Footer";
import { Button } from "@club-website/ui/components/button";
import { Input } from "@club-website/ui/components/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@club-website/ui/components/select";
import { useAnnouncements } from '@/hooks/useAnnouncements';
import { AnnouncementCardPublic } from "@club-website/ui/components/announcements/AnnouncementCardPublic";
import { AnnouncementPreviewProvider, useAnnouncementPreview } from "@club-website/ui/components/announcements/AnnouncementPreviewContext";
import { AnnouncementPreview } from "@club-website/ui/components/announcements/AnnouncementPreview";
import { toAnnouncementCardProps } from '@/lib/adapters';
import {
  Search,
  SortAsc,
  SortDesc,
  X,
  MessageSquare
} from "lucide-react";
import { AnnouncementSkeletonList } from "@club-website/ui/components/announcements/AnnouncementSkeleton";
import { Skeleton } from "@club-website/ui/components/skeleton";

type SortOption = 'newest' | 'oldest';

function AnnouncementsContent() {
  const { announcements, loading, error } = useAnnouncements();
  const searchParams = useSearchParams();
  const previewId = searchParams.get('preview');
  const { openPreview } = useAnnouncementPreview();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [hasOpenedPreview, setHasOpenedPreview] = useState(false);

  // Auto-open preview if ID provided - only run once
  useEffect(() => {
    if (previewId && announcements && !hasOpenedPreview) {
      const announcement = announcements.find(a => a.id === previewId);
      if (announcement) {
        // Transform to match the preview context interface
        openPreview(toAnnouncementCardProps(announcement));
        setHasOpenedPreview(true);
      }
    }
  }, [previewId, announcements, hasOpenedPreview]); // Remove openPreview from dependencies

  // Filter and sort announcements
  const filteredAndSortedAnnouncements = useMemo(() => {
    let filtered = announcements;

    // Apply search filter
    if (searchQuery.trim()) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter(announcement => 
        announcement.content.toLowerCase().includes(searchLower)
      );
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        default:
          return 0;
      }
    });

    return sorted;
  }, [announcements, searchQuery, sortBy]);

  // Separate pinned and regular announcements for display
  const { pinnedAnnouncements, regularAnnouncements } = useMemo(() => {
    return {
      pinnedAnnouncements: filteredAndSortedAnnouncements.filter(a => a.isPinned),
      regularAnnouncements: filteredAndSortedAnnouncements.filter(a => !a.isPinned)
    };
  }, [filteredAndSortedAnnouncements]);

  const clearSearch = () => {
    setSearchQuery("");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 pt-16">
          {/* Hero Section */}
          <section className="bg-gradient-to-b from-muted/30 to-background py-12">
            <div className="container mx-auto px-4 max-w-4xl text-center">
              <h1 className="text-4xl font-bold text-foreground mb-6">
                Announcements
              </h1>
              <p className="text-lg text-muted-foreground">
                Stay up to date with the latest news, events, and updates from the Computer Science Club.
              </p>
            </div>
          </section>

          {/* Search and Filters Skeleton */}
          <section className="py-6">
            <div className="container mx-auto px-4 max-w-4xl">
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1 max-w-md">
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <Skeleton className="h-10 w-full sm:w-[180px]" />
                </div>
              </div>
            </div>
          </section>

          {/* Results count skeleton */}
          <section className="py-4">
            <div className="container mx-auto px-4 max-w-4xl">
              <Skeleton className="h-4 w-32" />
            </div>
          </section>

          {/* Announcements Skeleton */}
          <section className="py-8">
            <div className="container mx-auto px-4 max-w-4xl">
              <div className="space-y-8">
                {/* Pinned announcements skeleton */}
                <div>
                  <Skeleton className="h-6 w-48 mb-4" />
                  <AnnouncementSkeletonList count={2} />
                </div>

                {/* Regular announcements skeleton */}
                <div>
                  <Skeleton className="h-6 w-40 mb-4" />
                  <AnnouncementSkeletonList count={4} />
                </div>
              </div>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 pt-16">
          <div className="container mx-auto px-4 py-16">
            <div className="text-center">
              <p className="text-red-500 mb-4">Failed to load announcements</p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-muted/30 to-background py-12">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <h1 className="text-4xl font-bold text-foreground mb-6">
              Announcements
            </h1>
            <p className="text-lg text-muted-foreground">
              Stay up to date with the latest news, events, and updates from the Computer Science Club.
            </p>
          </div>
        </section>

        {/* Search and Filters */}
        <section className="py-6">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="space-y-4">
              {/* Search and Sort Controls */}
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
                  </SelectContent>
                </Select>
              </div>

              {/* Active filters indicator */}
              {(searchQuery || sortBy !== 'newest') && (
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <span>Active filters:</span>
                  {searchQuery && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded-md">
                      Search: "{searchQuery}"
                    </span>
                  )}
                  {sortBy !== 'newest' && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded-md">
                      Oldest first
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Results count */}
        <section className="py-4">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="text-sm text-muted-foreground">
              {filteredAndSortedAnnouncements.length === 0 ? (
                searchQuery ? "No announcements found" : "No announcements"
              ) : (
                `${filteredAndSortedAnnouncements.length} announcement${filteredAndSortedAnnouncements.length === 1 ? '' : 's'}`
              )}
            </div>
          </div>
        </section>

        {/* Announcements */}
        <section className="py-8">
          <div className="container mx-auto px-4 max-w-4xl">
            {filteredAndSortedAnnouncements.length === 0 ? (
              searchQuery ? (
                <div className="text-center py-16">
                  <h3 className="text-lg font-semibold mb-2">No announcements found</h3>
                  <p className="text-muted-foreground mb-4">
                    Try adjusting your search terms.
                  </p>
                  <Button variant="outline" onClick={clearSearch}>
                    Clear search
                  </Button>
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
                    <MessageSquare className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No announcements yet</h3>
                  <p className="text-muted-foreground">Check back later for updates from the CS Club!</p>
                </div>
              )
            ) : (
              <div className="space-y-8">
                {/* Pinned announcements */}
                {pinnedAnnouncements.length > 0 && (
                  <div>
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      📌 Pinned Announcements
                    </h2>
                    <div className="space-y-4">
                      {pinnedAnnouncements.map((announcement) => (
                        <AnnouncementCardPublic
                          key={announcement.id}
                          announcement={toAnnouncementCardProps(announcement)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Regular announcements */}
                {regularAnnouncements.length > 0 && (
                  <div>
                    {pinnedAnnouncements.length > 0 && (
                      <h2 className="text-lg font-semibold mb-4">Recent Announcements</h2>
                    )}
                    <div className="space-y-4">
                      {regularAnnouncements.map((announcement) => (
                        <AnnouncementCardPublic
                          key={announcement.id}
                          announcement={toAnnouncementCardProps(announcement)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Stay Connected */}
        <section className="py-12">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <h2 className="text-3xl font-bold text-foreground mb-6">
              Don't Miss Out
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join our Discord server to get real-time notifications about new announcements, 
              events, and club activities.
            </p>
            <Button size="lg" className="px-8 py-6 text-lg">
                <a href="https://discord.gg/zeFSpn3VJ9" target="_blank" rel="noopener noreferrer">
                  Join Our Discord
                </a>
            </Button>
          </div>
        </section>
      </main>
      <Footer />

      {/* Preview Modal */}
      <AnnouncementPreview />
    </div>
  );
}

export default function AnnouncementsPage() {
  return (
    <AnnouncementPreviewProvider>
       <Suspense fallback={
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-1 pt-16">
            <div className="container mx-auto px-4 py-16">
              <div className="text-center">
                <p className="text-muted-foreground">Loading announcements...</p>
              </div>
            </div>
          </main>
          <Footer />
        </div>
      }>
        <AnnouncementsContent />
      </Suspense>
    </AnnouncementPreviewProvider>
  );
} 