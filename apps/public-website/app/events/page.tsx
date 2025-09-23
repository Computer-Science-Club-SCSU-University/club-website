"use client";

import { useState } from 'react';
import { Navbar } from "@/components/layouts/Navbar";
import { Footer } from "@/components/layouts/Footer";
import { Button } from "@club-website/ui/components/button";
import { useEvents } from '@/hooks/useEvents';
import { EventCardPublic } from "@club-website/ui/components/events/EventCardPublic";
import { EventPreviewProvider } from "@club-website/ui/components/events/EventPreviewContext";
import { EventPreview } from "@club-website/ui/components/events/EventPreview";
import Link from "next/link";
import { usePublicApiClient } from '@/lib/api';

const EmptyState = () => (
  <div className="text-center py-12">
    <svg 
      className="mx-auto h-12 w-12 text-muted-foreground mb-4" 
      fill="none" 
      stroke="currentColor" 
      viewBox="0 0 24 24"
    >
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth={1.5} 
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" 
      />
    </svg>
    <h3 className="text-lg font-medium text-foreground mb-2">
      No events found
    </h3>
    <p className="text-muted-foreground">
      Check back later for new events!
    </p>
  </div>
);

export default function EventsPage() {
  const { upcomingEvents, ongoingEvents, pastEvents, loading, error } = useEvents();
  const apiClient = usePublicApiClient();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'ongoing' | 'past'>('upcoming');

  const filteredEvents = 
    activeTab === 'upcoming' ? upcomingEvents :
    activeTab === 'ongoing' ? ongoingEvents :
    pastEvents;

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 pt-16">
          <div className="container mx-auto px-4 py-16">
            <div className="text-center">Loading events...</div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <EventPreviewProvider>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 pt-16">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-muted/30 to-background py-12">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <h1 className="text-4xl font-bold text-foreground mb-6">
              Events
            </h1>
            <p className="text-lg text-muted-foreground">
              Join us for workshops, tech talks, hackathons, and networking events throughout the semester.
            </p>
          </div>
        </section>

        {/* Filter Controls */}
        <section className="py-6">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex space-x-2">
                <Button
                  variant={activeTab === 'upcoming' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveTab('upcoming')}
                >
                  Upcoming
                </Button>
                <Button
                  variant={activeTab === 'ongoing' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveTab('ongoing')}
                >
                  Ongoing
                </Button>
                <Button
                  variant={activeTab === 'past' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveTab('past')}
                >
                  Past Events
                </Button>
              </div>
              
              <div className="text-sm text-muted-foreground">
                {filteredEvents.length} events found
              </div>
            </div>
          </div>
        </section>

        {/* Events List */}
        <section className="pb-16 pt-8">
          <div className="container mx-auto px-4 max-w-4xl">
            {filteredEvents.length > 0 ? (
              <div className="space-y-4">
                {filteredEvents.map((event) => (
                  <EventCardPublic key={event.id} event={event} />
                ))}
              </div>
            ) : (
              <EmptyState />
            )}
          </div>
        </section>
        </main>
        <Footer />
      </div>
      
      {/* Event Preview Modal */}
      <EventPreview apiClient={apiClient} />
    </EventPreviewProvider>
  );
} 