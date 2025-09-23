"use client";

import { useState, useRef, useCallback, useEffect } from "react";
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
import { useEvents, type Event } from "@/hooks/useEvents";
import { useNavigation } from "@/components/navigation/NavigationContext";
import { UnsavedChangesDialog } from "./UnsavedChangesDialog";
import { toEventFormData } from "@/lib/adapters";
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

interface EventEditEditorProps {
  eventId: string;
}

export default function EventEditEditor({ eventId }: EventEditEditorProps) {
  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [endTime, setEndTime] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [slidesUrl, setSlidesUrl] = useState("");
  const [recordingUrl, setRecordingUrl] = useState("");
  
  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);
  const [event, setEvent] = useState<Event | null>(null);

  // Store original values to detect changes
  const [originalValues, setOriginalValues] = useState({
    title: "",
    description: "",
    location: "",
    startDate: undefined as Date | undefined,
    startTime: "",
    endDate: undefined as Date | undefined,
    endTime: "",
    meetingLink: "",
    slidesUrl: "",
    recordingUrl: "",
  });

  // Hooks following established pattern
  const { getEventById, updateEvent } = useEvents();
  const { setView, goBack } = useNavigation();

  // Load existing event
  useEffect(() => {
    const loadEvent = async () => {
      try {
        setIsLoading(true);
        const eventData = await getEventById(eventId);
        setEvent(eventData);
        
        // Transform event to form data using adapter
        const formData = toEventFormData(eventData);
        
        // Set form values
        setTitle(formData.title);
        setDescription(formData.description);
        setLocation(formData.location);
        setStartDate(formData.startDate);
        setStartTime(formData.startTime);
        setEndDate(formData.endDate);
        setEndTime(formData.endTime);
        setMeetingLink(formData.meetingLink);
        setSlidesUrl(formData.slidesUrl);
        setRecordingUrl(formData.recordingUrl);
        
        // Store original values
        setOriginalValues(formData);
      } catch (error) {
        console.error('Failed to load event:', error);
        toast.error('Failed to load event');
      } finally {
        setIsLoading(false);
      }
    };

    loadEvent();
  }, [eventId, getEventById]);

  // Track changes
  const handleFieldChange = useCallback((setter: (value: any) => void, field: string) => (value: any) => {
    setter(value);
    setHasUnsavedChanges(true);
  }, []);

  // Check if field can be edited based on event status
  const canEditField = (field: string): boolean => {
    if (!event) return true;
    
    // For past events, only recording URL can be edited
    if (event.status === 'past') {
      return field === 'recordingUrl';
    }
    
    // For ongoing events, only meeting link can be edited
    if (event.status === 'ongoing') {
      return field === 'meetingLink';
    }
    
    // For upcoming events, all fields except recording URL can be edited
    return field !== 'recordingUrl';
  };

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

  // Helper function to compare datetime values properly
  const isSameDateTime = (date1: Date | undefined, time1: string, date2: Date | undefined, time2: string): boolean => {
    if (!date1 || !date2) return date1 === date2 && time1 === time2;

    const [h1, m1] = time1.split(':').map(Number) as [number, number];
    const [h2, m2] = time2.split(':').map(Number) as [number, number];
    
    const dt1 = new Date(date1);
    dt1.setHours(h1, m1, 0, 0);
    
    const dt2 = new Date(date2);
    dt2.setHours(h2, m2, 0, 0);
    
    return dt1.getTime() === dt2.getTime();
  };

  const handleSave = useCallback(async () => {
    if (!validateForm()) return;

    try {
      setIsSaving(true);
      
      // Only include changed fields
      const changes: any = {};
      
      if (title !== originalValues.title) changes.title = title.trim();
      if (description !== originalValues.description) changes.description = description.trim();
      if (location !== originalValues.location) changes.location = location.trim();
      
      // Fix: Proper datetime comparison instead of Date object reference comparison
      if (!isSameDateTime(startDate, startTime, originalValues.startDate, originalValues.startTime)) {
        changes.startDate = startDate;
        changes.startTime = startTime;
      }
      
      if (!isSameDateTime(endDate, endTime, originalValues.endDate, originalValues.endTime)) {
        changes.endDate = endDate;
        changes.endTime = endTime;
      }
      
      if (meetingLink !== originalValues.meetingLink) changes.meetingLink = meetingLink.trim();
      if (slidesUrl !== originalValues.slidesUrl) changes.slidesUrl = slidesUrl.trim();
      if (recordingUrl !== originalValues.recordingUrl) changes.recordingUrl = recordingUrl.trim();

      // Debug: Log detected changes
      console.log('EventEditEditor: Detected changes:', Object.keys(changes));
      
      // Only proceed if there are actual changes
      if (Object.keys(changes).length === 0) {
        toast.info('No changes detected');
        setIsSaving(false);
        return;
      }

      await updateEvent(eventId, changes);
      
      // Update original values
      setOriginalValues({
        title,
        description,
        location,
        startDate,
        startTime,
        endDate,
        endTime,
        meetingLink,
        slidesUrl,
        recordingUrl,
      });
      
      toast.success('Event updated successfully!');
      setHasUnsavedChanges(false);
      setView('events');
    } catch (error) {
      console.error('Failed to update event:', error);
      toast.error('Failed to update event');
    } finally {
      setIsSaving(false);
    }
  }, [eventId, title, description, location, startDate, startTime, endDate, endTime, meetingLink, slidesUrl, recordingUrl, originalValues, updateEvent, setView]);

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading event...</p>
        </div>
      </div>
    );
  }

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
              <h1 className="text-2xl font-bold sm:text-3xl">Edit Event</h1>
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
              {isSaving ? 'Saving...' : 'Save Changes'}
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
                onChange={(e) => handleFieldChange(setTitle, 'title')(e.target.value)}
                disabled={!canEditField('title')}
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
                onChange={(e) => handleFieldChange(setDescription, 'description')(e.target.value)}
                disabled={!canEditField('description')}
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
                onChange={(e) => handleFieldChange(setLocation, 'location')(e.target.value)}
                disabled={!canEditField('location')}
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
                        disabled={!canEditField('startDate')}
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
                          handleFieldChange(setStartDate, 'startDate')(date);
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
                    onChange={(e) => handleFieldChange(setStartTime, 'startTime')(e.target.value)}
                    disabled={!canEditField('startTime')}
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
                        disabled={!canEditField('endDate')}
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
                          handleFieldChange(setEndDate, 'endDate')(date);
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
                    onChange={(e) => handleFieldChange(setEndTime, 'endTime')(e.target.value)}
                    disabled={!canEditField('endTime')}
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
                onChange={(e) => handleFieldChange(setMeetingLink, 'meetingLink')(e.target.value)}
                disabled={!canEditField('meetingLink')}
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
                onChange={(e) => handleFieldChange(setSlidesUrl, 'slidesUrl')(e.target.value)}
                disabled={!canEditField('slidesUrl')}
              />
            </div>

            {/* Recording URL - Only show for past events */}
            {event?.status === 'past' && (
              <div className="space-y-2">
                <Label htmlFor="recording-url">Recording URL</Label>
                <Input
                  id="recording-url"
                  type="url"
                  placeholder="https://..."
                  value={recordingUrl}
                  onChange={(e) => handleFieldChange(setRecordingUrl, 'recordingUrl')(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Right side - Event Preview */}
          <div className="border border-border rounded-lg overflow-hidden flex flex-col min-h-[500px]">
            <div className="px-4 py-3 border-b bg-muted/50 flex items-center gap-2">
              <div className="flex items-center gap-2">
                <div className="inline-flex items-center px-2 py-1 text-xs font-medium text-orange-600 bg-orange-100 rounded-full">
                  Editing
                </div>
                {event && (
                  <div className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                    event.status === 'upcoming' ? 'text-blue-600 bg-blue-100' :
                    event.status === 'ongoing' ? 'text-green-600 bg-green-100' :
                    'text-gray-600 bg-gray-100'
                  }`}>
                    {event.status}
                  </div>
                )}
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

                {recordingUrl && (
                  <div className="flex items-center gap-2">
                    <Video className="h-4 w-4 text-primary" />
                    <span className="text-muted-foreground">Recording available</span>
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
