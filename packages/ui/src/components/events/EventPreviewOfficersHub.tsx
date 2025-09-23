"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@club-website/ui/components/button';
import { Badge } from '@club-website/ui/components/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@club-website/ui/components/card';
import { Avatar, AvatarFallback, AvatarImage } from '@club-website/ui/components/avatar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@club-website/ui/components/collapsible';
import { 
  Calendar, 
  MapPin, 
  Video, 
  FileText, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Play,
  Download,
  Users,
  X,
  Edit
} from 'lucide-react';
import type { RSVP } from '@club-website/domain-types';

// Simple markdown-like text renderer for basic formatting (copied from EventPreview)
function renderMarkdownText(text: string) {
  // Convert basic markdown to HTML-like JSX
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  
  lines.forEach((line, index) => {
    if (line.trim() === '') {
      elements.push(<br key={index} />);
      return;
    }
    
    // Handle headers
    if (line.startsWith('### ')) {
      elements.push(<h3 key={index} className="text-lg font-semibold mt-4 mb-2">{line.slice(4)}</h3>);
    } else if (line.startsWith('## ')) {
      elements.push(<h2 key={index} className="text-xl font-semibold mt-4 mb-2">{line.slice(3)}</h2>);
    } else if (line.startsWith('# ')) {
      elements.push(<h1 key={index} className="text-2xl font-bold mt-4 mb-2">{line.slice(2)}</h1>);
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      // Simple bullet points
      elements.push(
        <div key={index} className="flex items-start gap-2 my-1">
          <span className="text-muted-foreground mt-1">•</span>
          <span>{line.slice(2)}</span>
        </div>
      );
    } else {
      // Regular paragraph
      let processedLine = line;
      
      // Handle bold text **text**
      processedLine = processedLine.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      
      // Handle italic text *text*
      processedLine = processedLine.replace(/\*(.*?)\*/g, '<em>$1</em>');
      
      // Handle inline code `code`
      processedLine = processedLine.replace(/`(.*?)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-sm">$1</code>');
      
      elements.push(
        <p 
          key={index} 
          className="mb-2 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: processedLine }}
        />
      );
    }
  });
  
  return <div className="space-y-1">{elements}</div>;
}

interface Event {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  startAt: Date;
  endAt: Date;
  meetingLink: string | null;
  slidesUrl: string | null;
  recordingUrl: string | null;
  status: 'upcoming' | 'ongoing' | 'past';
  rsvpCount: number;
  canRsvp: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface ApiClient {
  getRSVPs?: (eventId: string) => Promise<RSVP[]>;
}

interface EventPreviewOfficersHubProps {
  event: Event;
  apiClient: ApiClient;
  onBack: () => void;
  onEdit?: (eventId: string) => void;
}

// Helper functions
const formatDateLong = (date: Date | null) => {
  if (!date) return 'Date TBD';
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const formatTimeShort = (date: Date | null) => {
  if (!date) return 'TBD';
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};


const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
};

export function EventPreviewOfficersHub({ 
  event, 
  apiClient,
  onBack,
  onEdit
}: EventPreviewOfficersHubProps) {
  const [rsvps, setRsvps] = useState<RSVP[]>([]);
  const [isLoadingRSVPs, setIsLoadingRSVPs] = useState(true);
  const [recordingsExpanded, setRecordingsExpanded] = useState(false);
  const [slidesExpanded, setSlidesExpanded] = useState(false);

  // Load RSVPs
  useEffect(() => {
    const loadRSVPs = async () => {
      if (!apiClient.getRSVPs) {
        setIsLoadingRSVPs(false);
        return;
      }

      try {
        setIsLoadingRSVPs(true);
        const rsvpData = await apiClient.getRSVPs(event.id);
        setRsvps(rsvpData);
      } catch (error) {
        console.error('Failed to load RSVPs:', error);
      } finally {
        setIsLoadingRSVPs(false);
      }
    };

    loadRSVPs();
  }, [event.id, apiClient.getRSVPs]);

  const handleEdit = () => {
    onEdit?.(event.id);
  };

  const getRsvpStats = () => {
    if (!rsvps) return { total: 0 };
    return { total: rsvps.length };
  };

  const rsvpStats = getRsvpStats();

  return (
    <div className="space-y-8">
      {/* Header - Same style as other editors */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-2xl font-bold sm:text-3xl">Event Preview</h1>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button onClick={handleEdit} className="flex items-center gap-2">
            <Edit className="h-4 w-4" />
            Edit Event
          </Button>
        </div>
      </div>

      {/* Event Status and Info */}
      <div className="flex items-center gap-3">
        <Badge
          variant={
            event.status === "upcoming" ? "default" : event.status === "ongoing" ? "secondary" : "outline"
          }
          className="capitalize"
        >
          {event.status}
        </Badge>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          {rsvps?.length || 0} responses
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Event Details */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">{formatDateLong(event.startAt)}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatTimeShort(event.startAt)} - {formatTimeShort(event.endAt)}
                    </p>
                  </div>
                </div>

                {event.location && (
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">Location</p>
                      <p className="text-sm text-muted-foreground">{event.location}</p>
                    </div>
                  </div>
                )}
              </div>

              {event.meetingLink && (
                <div className="flex items-center gap-3 pt-2">
                  <Video className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Meeting Link</p>
                    <a
                      href={event.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      {event.meetingLink}
                    </a>
                  </div>
                </div>
              )}

              {event.description && (
                <div className="pt-4">
                  <h4 className="font-medium mb-2">Description</h4>
                  <div className="text-sm text-muted-foreground leading-relaxed">
                    {renderMarkdownText(event.description)}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recording Section */}
          {event.recordingUrl && (
            <Card>
              <CardContent className="p-6">
                <h4 className="font-medium mb-4">Recording</h4>
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <Play className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">Event Recording</p>
                      <p className="text-sm text-muted-foreground">Available for viewing</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" asChild>
                    <a href={event.recordingUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Slides Section */}
          {event.slidesUrl && (
            <Card>
              <CardContent className="p-6">
                <h4 className="font-medium mb-4">Event Slides</h4>
                <div className="flex items-center justify-between p-2 hover:bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="text-sm">Presentation Slides</span>
                  </div>
                  <Button size="sm" variant="ghost" asChild>
                    <a href={event.slidesUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* RSVP Sidebar */}
        <div className="space-y-6">
          {/* RSVP Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                RSVP Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="p-6 rounded-lg">
                  <div className="text-3xl font-bold">{rsvpStats.total}</div>
                  <div className="text-sm text-muted-foreground">Total Registrations</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* RSVP List */}
          <Card>
            <CardHeader>
              <CardTitle>Responses ({rsvps?.length || 0})</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingRSVPs ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading RSVPs...</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {rsvps?.map((rsvp) => (
                    <div key={rsvp.id} className="flex items-center gap-3 p-2 hover:bg-muted rounded-lg">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="/placeholder.svg" />
                        <AvatarFallback className="text-xs">{getInitials(rsvp.name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{rsvp.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{rsvp.email}</p>
                        {rsvp.comment && (
                          <p className="text-xs text-muted-foreground truncate italic">"{rsvp.comment}"</p>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {rsvp.registeredAt.toLocaleDateString()}
                      </div>
                    </div>
                  )) || <p className="text-sm text-muted-foreground text-center py-4">No responses yet</p>}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
