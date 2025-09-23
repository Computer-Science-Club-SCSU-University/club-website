"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@club-website/ui/components/button";
import { Input } from "@club-website/ui/components/input";
import { Label } from "@club-website/ui/components/label";
import { Textarea } from "@club-website/ui/components/textarea";
import { Calendar } from "@club-website/ui/components/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@club-website/ui/components/popover";
import { 
  X, 
  Save, 
  Calendar as CalendarIcon,
  AlertCircle,
  ChevronDown,
  MapPin,
  Video,
  FileText
} from "lucide-react";
import { useEvents } from "@/hooks/useEvents";
import { useNavigation } from "@/components/navigation/NavigationContext";
import { UnsavedChangesDialog } from "./UnsavedChangesDialog";
import { toast } from "sonner";

// Simple markdown-like text renderer for live preview
function renderMarkdownText(text: string) {
  if (!text.trim()) return null;
  
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
    } else if (line.startsWith('> ')) {
      // Blockquotes
      elements.push(
        <blockquote key={index} className="border-l-4 border-muted pl-4 my-2 italic text-muted-foreground">
          {line.slice(2)}
        </blockquote>
      );
    } else {
      // Regular paragraph
      let processedLine = line;
      
      // Handle bold text **text**
      processedLine = processedLine.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      
      // Handle italic text *text*
      processedLine = processedLine.replace(/\*(.*?)\*/g, '<em>$1</em>');
      
      // Handle inline code `code`
      processedLine = processedLine.replace(/`(.*?)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-sm font-mono">$1</code>');
      
      // Handle links [text](url)
      processedLine = processedLine.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary underline hover:no-underline" target="_blank" rel="noopener noreferrer">$1</a>');
      
      elements.push(
        <p 
          key={index} 
          className="mb-2 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: processedLine }}
        />
      );
    }
  });
  
  return <div className="prose prose-sm max-w-none dark:prose-invert">{elements}</div>;
}

// Format event date and time with proper formatting
function formatEventDateTime(startDate: Date | undefined, startTime: string | undefined, endDate: Date | undefined, endTime: string | undefined): string {
  if (!startDate || !startTime) {
    return 'Date & time to be set';
  }
  
  // Ensure we have valid time strings
  if (!startTime.trim()) {
    return 'Date & time to be set';
  }
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const date = new Date();
    date.setHours(parseInt(hours || '0'), parseInt(minutes || '0'));
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };
  
  const startDateStr = formatDate(startDate);
  const startTimeStr = formatTime(startTime);
  
  // Check if event spans multiple days
  if (endDate && endTime && endTime.trim() && 
      (startDate.toDateString() !== endDate.toDateString())) {
    const endDateStr = formatDate(endDate);
    const endTimeStr = formatTime(endTime);
    return `${startDateStr}, ${startTimeStr} - ${endDateStr}, ${endTimeStr}`;
  } else if (endTime && endTime.trim()) {
    const endTimeStr = formatTime(endTime);
    return `${startDateStr}, ${startTimeStr} - ${endTimeStr}`;
  } else {
    return `${startDateStr}, ${startTimeStr}`;
  }
}

export default function EventCreateEditor() {
  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [startTime, setStartTime] = useState("09:00");
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [endTime, setEndTime] = useState("17:00");
  const [meetingLink, setMeetingLink] = useState("");
  const [slidesUrl, setSlidesUrl] = useState("");
  
  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);

  // Hooks following established pattern
  const { createEvent } = useEvents();
  const { setView, goBack } = useNavigation();

  // Track changes
  const handleFieldChange = useCallback((setter: (value: any) => void) => (value: any) => {
    setter(value);
    setHasUnsavedChanges(true);
  }, []);

  const validateForm = () => {
    if (!title.trim()) {
      toast.error('Event title is required');
      return false;
    }
    
    if (!startDate) {
      toast.error('Start date is required');
      return false;
    }
    
    if (!startTime) {
      toast.error('Start time is required');
      return false;
    }
    
    if (!endDate) {
      toast.error('End date is required');
      return false;
    }
    
    if (!endTime) {
      toast.error('End time is required');
      return false;
    }
    
    // Validate that end time is after start time
    if (!startTime || !endTime) {
      toast.error('Please select both start and end times');
      return;
    }
    
    const [startHour, startMin] = startTime.split(':').map(Number) as [number, number];;
    const [endHour, endMin] = endTime.split(':').map(Number) as [number, number];;

    const startDateTime = new Date(startDate);
    startDateTime.setHours(startHour, startMin);

    const endDateTime = new Date(endDate);
    endDateTime.setHours(endHour, endMin);
    
    if (startDateTime >= endDateTime) {
      toast.error('End time must be after start time');
      return false;
    }
    
    return true;
  };

  const handleSave = useCallback(async () => {
    if (!validateForm()) return;

    try {
      setIsSaving(true);
      
      const eventData = {
        title: title.trim(),
        description: description.trim() || undefined,
        location: location.trim() || undefined,
        startDate: startDate!,
        startTime,
        endDate: endDate!,
        endTime,
        meetingLink: meetingLink.trim() || undefined,
        slidesUrl: slidesUrl.trim() || undefined,
      };

      await createEvent(eventData);
      
      toast.success('Event created successfully!');
      setHasUnsavedChanges(false);
      setView('events');
    } catch (error) {
      console.error('Failed to create event:', error);
      toast.error('Failed to create event');
    } finally {
      setIsSaving(false);
    }
  }, [title, description, location, startDate, startTime, endDate, endTime, meetingLink, slidesUrl, createEvent, setView]);

  const handleCancel = useCallback(() => {
    if (hasUnsavedChanges) {
      setShowUnsavedDialog(true);
    } else {
      goBack();
    }
  }, [hasUnsavedChanges, goBack]);

  const handleConfirmLeave = useCallback(() => {
    setShowUnsavedDialog(false);
    goBack();
  }, [goBack]);

  const handleCancelLeave = useCallback(() => {
    setShowUnsavedDialog(false);
  }, []);

  return (
    <>
      <div className="space-y-8">
        {/* Header - Same style as other editors */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-muted-foreground" />
              <h1 className="text-2xl font-bold sm:text-3xl">Create Event</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {hasUnsavedChanges && (
              <div className="flex items-center gap-2 text-sm text-orange-600">
                <AlertCircle className="h-3 w-3" />
                Unsaved changes
              </div>
            )}
            
            <Button
              onClick={handleSave}
              disabled={!title.trim() || !startDate || !endDate || !startTime || !endTime || isSaving}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              {isSaving ? 'Creating...' : 'Create Event'}
            </Button>
          </div>
        </div>

        {/* Form */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left side - All Form Fields */}
          <div className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">
                Event Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                placeholder="Enter event title..."
                value={title}
                onChange={(e) => handleFieldChange(setTitle)(e.target.value)}
                className="text-lg font-semibold"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe your event..."
                value={description}
                onChange={(e) => handleFieldChange(setDescription)(e.target.value)}
                className="min-h-[120px] resize-none"
              />
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="Event location..."
                value={location}
                onChange={(e) => handleFieldChange(setLocation)(e.target.value)}
              />
            </div>

            {/* Start Date & Time */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Start Date & Time <span className="text-destructive">*</span>
              </Label>
              <div className="flex gap-4">
                <div className="flex flex-col gap-3">
                  <Label htmlFor="start-date-picker" className="px-1 text-sm">
                    Date
                  </Label>
                  <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        id="start-date-picker"
                        className="w-32 justify-between font-normal"
                      >
                        {startDate ? startDate.toLocaleDateString() : "Select date"}
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        captionLayout="dropdown"
                        onSelect={(date: Date | undefined) => {
                          handleFieldChange(setStartDate)(date);
                          setStartDateOpen(false);
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="flex flex-col gap-3">
                  <Label htmlFor="start-time-picker" className="px-1 text-sm">
                    Time
                  </Label>
                  <Input
                    type="time"
                    id="start-time-picker"
                    placeholder="09:00"
                    value={startTime}
                    onChange={(e) => handleFieldChange(setStartTime)(e.target.value)}
                    className="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                  />
                </div>
              </div>
            </div>

            {/* End Date & Time */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                End Date & Time <span className="text-destructive">*</span>
              </Label>
              <div className="flex gap-4">
                <div className="flex flex-col gap-3">
                  <Label htmlFor="end-date-picker" className="px-1 text-sm">
                    Date
                  </Label>
                  <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        id="end-date-picker"
                        className="w-32 justify-between font-normal"
                      >
                        {endDate ? endDate.toLocaleDateString() : "Select date"}
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        captionLayout="dropdown"
                        onSelect={(date: Date | undefined) => {
                          handleFieldChange(setEndDate)(date);
                          setEndDateOpen(false);
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="flex flex-col gap-3">
                  <Label htmlFor="end-time-picker" className="px-1 text-sm">
                    Time
                  </Label>
                  <Input
                    type="time"
                    id="end-time-picker"
                    placeholder="17:00"
                    value={endTime}
                    onChange={(e) => handleFieldChange(setEndTime)(e.target.value)}
                    className="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                  />
                </div>
              </div>
            </div>

            {/* Meeting Link */}
            <div className="space-y-2">
              <Label htmlFor="meeting-link">Meeting Link</Label>
              <Input
                id="meeting-link"
                type="url"
                placeholder="https://..."
                value={meetingLink}
                onChange={(e) => handleFieldChange(setMeetingLink)(e.target.value)}
              />
            </div>

            {/* Slides URL */}
            <div className="space-y-2">
              <Label htmlFor="slides-url">Slides URL</Label>
              <Input
                id="slides-url"
                type="url"
                placeholder="https://..."
                value={slidesUrl}
                onChange={(e) => handleFieldChange(setSlidesUrl)(e.target.value)}
              />
            </div>

            {/* Note: Recording URL is not available during creation - only for past events */}
          </div>

          {/* Right side - Event Preview */}
          <div className="border border-border rounded-lg overflow-hidden flex flex-col min-h-[500px]">
            <div className="px-4 py-3 border-b bg-muted/50 flex items-center gap-2">
              <div className="flex items-center gap-2">
                <div className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded-full">
                  New Event
                </div>
              </div>
              <span className="text-sm font-medium text-muted-foreground">Preview</span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {/* Event Title */}
              <h1 className="text-2xl font-bold mb-4">
                {title || "Event Title"}
              </h1>
              
              {/* Event Details */}
              <div className="space-y-3 text-sm mb-6">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-primary" />
                  <span className="text-muted-foreground">
                    {formatEventDateTime(startDate, startTime, endDate, endTime)}
                  </span>
                </div>
                
                {location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span className="text-muted-foreground">{location}</span>
                  </div>
                )}
                
                {meetingLink && (
                  <div className="flex items-center gap-2">
                    <Video className="h-4 w-4 text-primary" />
                    <span className="text-muted-foreground">Meeting link available</span>
                  </div>
                )}
                
                {slidesUrl && (
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="text-muted-foreground">Slides available</span>
                  </div>
                )}
              </div>
              
              {/* Event Description with Markdown */}
              {description.trim() ? (
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Description</h4>
                  {renderMarkdownText(description)}
                </div>
              ) : (
                <div className="border-t pt-4">
                  <div className="text-muted-foreground italic">
                    Add a description to see the preview...
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Unsaved Changes Dialog */}
      <UnsavedChangesDialog
        open={showUnsavedDialog}
        onOpenChange={setShowUnsavedDialog}
        onConfirm={handleConfirmLeave}
        onCancel={handleCancelLeave}
      />
    </>
  );
}
