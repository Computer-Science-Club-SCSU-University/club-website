"use client";

import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@club-website/ui/components/dialog';
import { Button } from '@club-website/ui/components/button';
import { Card, CardContent } from '@club-website/ui/components/card';
import { 
  Calendar, 
  MapPin, 
  Video, 
  FileText, 
  ExternalLink,
  Play,
  UserPlus,
  Download
} from 'lucide-react';
import { useEventPreview } from '@club-website/ui/components/events/EventPreviewContext';
import { RSVPDialog } from '@club-website/ui/components/events/RSVPDialog';
import type { ClubApiClient } from '@club-website/api-client';

// Simple markdown-like text renderer for basic formatting (copied from AnnouncementPreview)
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

interface EventPreviewProps {
  apiClient: ClubApiClient;
}

export function EventPreview({ apiClient }: EventPreviewProps) {
  const { isOpen, event, closePreview } = useEventPreview();
  const [recordingsExpanded, setRecordingsExpanded] = useState(false);
  const [slidesExpanded, setSlidesExpanded] = useState(false);
  const [isRSVPDialogOpen, setIsRSVPDialogOpen] = useState(false);

  if (!event) return null;

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

  const addToCalendar = () => {
    // Check if we have valid dates
    if (!event.startAt || !event.endAt) {
      console.warn('Cannot create calendar event: missing start or end date');
      return;
    }
    
    // Format dates for ICS (YYYYMMDDTHHMMSSZ)
    const startDate = event.startAt.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const endDate = event.endAt.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const now = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    
    // Generate a unique ID for the event
    const uid = `${event.id}-${Date.now()}@club-website.com`;
    
    // Create ICS content
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//CS Club//Event Calendar//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${now}`,
      `DTSTART:${startDate}`,
      `DTEND:${endDate}`,
      `SUMMARY:${event.title}`,
      event.description ? `DESCRIPTION:${event.description.replace(/\n/g, '\\n')}` : '',
      event.location ? `LOCATION:${event.location}` : '',
      'STATUS:CONFIRMED',
      'TRANSP:OPAQUE',
      'END:VEVENT',
      'END:VCALENDAR'
    ].filter(line => line !== '').join('\r\n');
    
    // Create and download the ICS file
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleJoinMeeting = () => {
    if (event.meetingLink) {
      window.open(event.meetingLink, '_blank');
    }
  };

  const handleViewSlides = () => {
    if (event.slidesUrl) {
      window.open(event.slidesUrl, '_blank');
    }
  };

  const handleViewRecording = () => {
    if (event.recordingUrl) {
      window.open(event.recordingUrl, '_blank');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closePreview()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <DialogTitle className="text-2xl font-bold text-balance">{event.title}</DialogTitle>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
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

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            {/* Join Meeting - Show if meeting link exists */}
            {event.meetingLink && (
              <Button onClick={handleJoinMeeting} className="flex items-center gap-2">
                <Video className="h-4 w-4" />
                Join Meeting
              </Button>
            )}

            {/* Add to Calendar - Always show for events with valid dates */}
            {event.startAt && event.endAt && (
              <Button variant="outline" onClick={addToCalendar} className="flex items-center gap-2 bg-transparent">
                <Calendar className="h-4 w-4" />
                Add to Calendar
              </Button>
            )}

            {/* RSVP - Show if RSVP is allowed */}
            {event.canRsvp && (
              <Button 
                variant="outline" 
                onClick={() => setIsRSVPDialogOpen(true)} 
                className="flex items-center gap-2 bg-transparent"
              >
                <UserPlus className="h-4 w-4" />
                RSVP
              </Button>
            )}
          </div>


          {/* Recordings Section - Only show if recording exists */}
          {event.recordingUrl && (
            <Card>
              <CardContent className="p-6">
                <h4 className="font-medium mb-4">Recording</h4>
                <div className="flex items-center justify-between p-2 hover:bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <Play className="h-4 w-4 text-primary" />
                    <span className="text-sm">Event Recording</span>
                  </div>
                  <Button size="sm" variant="ghost" onClick={handleViewRecording}>
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Slides Section - Only show if slides exist */}
          {event.slidesUrl && (
            <Card>
              <CardContent className="p-6">
                <h4 className="font-medium mb-4">Event Slides</h4>
                <div className="flex items-center justify-between p-2 hover:bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="text-sm">Presentation Slides</span>
                  </div>
                  <Button size="sm" variant="ghost" onClick={handleViewSlides}>
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>

      {/* RSVP Dialog */}
      {event && (
        <RSVPDialog
          event={event}
          isOpen={isRSVPDialogOpen}
          onClose={() => setIsRSVPDialogOpen(false)}
          onSuccess={() => {
            setIsRSVPDialogOpen(false);
            // Optionally refresh event data or show success message
          }}
          apiClient={apiClient}
        />
      )}
    </Dialog>
  );
}