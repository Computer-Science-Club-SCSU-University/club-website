"use client";

import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@club-website/ui/components/dialog';
import { Button } from '@club-website/ui/components/button';
import { Input } from '@club-website/ui/components/input';
import { Label } from '@club-website/ui/components/label';
import { Textarea } from '@club-website/ui/components/textarea';
import { toast } from 'sonner';
import type { ClubApiClient } from '@club-website/api-client';

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

interface RSVPDialogProps {
  event: Event;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  apiClient: ClubApiClient;
}

interface RSVPFormData {
  name: string;
  email: string;
  comment: string;
}

export function RSVPDialog({ 
  event, 
  isOpen, 
  onClose, 
  onSuccess,
  apiClient
}: RSVPDialogProps) {
  const [formData, setFormData] = useState<RSVPFormData>({
    name: '',
    email: '',
    comment: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<RSVPFormData>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<RSVPFormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    
    try {
      await apiClient.events.createRSVP(event.id, {
        name: formData.name.trim(),
        email: formData.email.trim(),
        comment: formData.comment.trim() || undefined,
      });

      toast.success('RSVP submitted successfully!');
      
      // Reset form
      setFormData({ name: '', email: '', comment: '' });
      setErrors({});
      
      onSuccess?.();
      onClose();
      
    } catch (error: any) {
      console.error('RSVP submission error:', error);
      
      // Handle specific error cases
      if (error?.status === 404) {
        toast.error('Event not found. The event may have been removed or is no longer accepting RSVPs.');
      } else if (error?.status === 409) {
        toast.error('You have already RSVP\'d to this event. Check your email for confirmation.');
      } else if (error?.status === 400) {
        const message = error?.message || 'Please check your information and try again.';
        toast.error(message);
      } else if (error?.status === 500) {
        toast.error('Server error. Please try again in a few moments.');
      } else if (error?.code === 'NETWORK_ERROR' || !navigator.onLine) {
        toast.error('Network error. Please check your connection and try again.');
      } else {
        toast.error('Failed to submit RSVP. Please try again or contact support if the problem persists.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof RSVPFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setFormData({ name: '', email: '', comment: '' });
      setErrors({});
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>RSVP for {event.title}</DialogTitle>
          <DialogDescription>
            Let us know you're coming! We'll send you event updates and reminders.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="rsvp-name">Name *</Label>
            <Input
              id="rsvp-name"
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Your full name"
              disabled={isLoading}
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="rsvp-email">Email *</Label>
            <Input
              id="rsvp-email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="your.email@example.com"
              disabled={isLoading}
              className={errors.email ? 'border-red-500' : ''}
            />
            {errors.email && (
              <p className="text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="rsvp-comment">Comment (optional)</Label>
            <Textarea
              id="rsvp-comment"
              value={formData.comment}
              onChange={(e) => handleInputChange('comment', e.target.value)}
              placeholder="Any questions or comments about the event?"
              rows={3}
              disabled={isLoading}
            />
          </div>

          <DialogFooter>
            <Button 
              type="button"
              variant="outline" 
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={isLoading || !formData.name.trim() || !formData.email.trim()}
            >
              {isLoading ? 'Submitting...' : 'Submit RSVP'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
