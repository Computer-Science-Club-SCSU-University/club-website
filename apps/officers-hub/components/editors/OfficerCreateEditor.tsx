"use client";

import { useState, useRef } from "react";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Textarea } from "@workspace/ui/components/textarea";
import { 
  X, 
  Save, 
  User,
  Mail,
  Upload,
  Linkedin,
  Image as ImageIcon,
  AlertCircle
} from "lucide-react";
import { useApiClient } from "@/lib/api";
import { useNavigation } from "@/components/navigation/NavigationContext";
import { UnsavedChangesDialog } from "./UnsavedChangesDialog";
import { OfficerCard } from "@workspace/ui/components/officers/OfficerCard";
import { toast } from "sonner";

interface OfficerFormData {
  name: string;
  position: string;
  bio: string;
  image_url: string;
  linkedin_url: string;
  email: string;
  order_index: number;
}

export default function OfficerCreateEditor() {
  const [formData, setFormData] = useState<OfficerFormData>({
    name: "",
    position: "",
    bio: "",
    image_url: "",
    linkedin_url: "",
    email: "",
    order_index: 0,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const api = useApiClient();
  const { setView, goBack } = useNavigation();

  // Track changes
  const handleFieldChange = (field: keyof OfficerFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }

      setSelectedFile(file);
      setHasUnsavedChanges(true);

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setPreviewUrl(result);
        setFormData(prev => ({ ...prev, image_url: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUpload = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setPreviewUrl("");
    setFormData(prev => ({ ...prev, image_url: "" }));
    setHasUnsavedChanges(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Name is required');
      return;
    }
    if (!formData.position.trim()) {
      toast.error('Position is required');
      return;
    }

    try {
      setIsSaving(true);
      
      const officerData = {
        name: formData.name,
        position: formData.position,
        bio: formData.bio,
        image_url: formData.image_url,
        linkedin_url: formData.linkedin_url,
        email: formData.email,
        order_index: formData.order_index,
      };

      await api.officers.create(officerData);
      
      toast.success('Officer created successfully');
      setHasUnsavedChanges(false);
      setView('officers');
    } catch (error) {
      console.error('Failed to create officer:', error);
      toast.error('Failed to create officer');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedDialog(true);
    } else {
      goBack();
    }
  };

  const handleConfirmLeave = () => {
    setShowUnsavedDialog(false);
    goBack();
  };

  const handleCancelLeave = () => {
    setShowUnsavedDialog(false);
  };

  return (
    <>
      <div className="space-y-8">
        {/* Header - Same style as announcement editors */}
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
              <User className="h-5 w-5 text-muted-foreground" />
              <h1 className="text-2xl font-bold sm:text-3xl">Create Officer</h1>
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
              disabled={!formData.name.trim() || !formData.position.trim() || isSaving}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              {isSaving ? 'Creating...' : 'Create Officer'}
            </Button>
          </div>
        </div>

        {/* Editor Grid - Same layout as announcement editors */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left side - Form */}
          <div className="space-y-6 flex flex-col">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Display Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="e.g., John Smith, Jane Doe..."
                value={formData.name}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                className="text-lg font-semibold"
              />
              <p className="text-xs text-muted-foreground">
                The name that will be displayed publicly for this officer
              </p>
            </div>

            {/* Position */}
            <div className="space-y-2">
              <Label htmlFor="position">
                Position <span className="text-destructive">*</span>
              </Label>
              <Input
                id="position"
                placeholder="e.g., President, VP of Technology, Treasurer..."
                value={formData.position}
                onChange={(e) => handleFieldChange('position', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                The officer's role or position in the organization
              </p>
            </div>

            {/* Profile Image */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <ImageIcon className="h-4 w-4" />
                Profile Image
              </Label>
              
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleImageUpload}
                    className="flex items-center gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    {selectedFile ? 'Change Image' : 'Upload Image'}
                  </Button>
                  {selectedFile && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={handleRemoveImage}
                      className="text-muted-foreground"
                    >
                      Remove
                    </Button>
                  )}
                </div>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                {selectedFile && (
                  <p className="text-xs text-muted-foreground">
                    Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>
              
              <p className="text-xs text-muted-foreground">
                Upload a profile photo for this officer (optional, max 5MB)
              </p>
            </div>

            {/* Bio */}
            <div className="flex-1 flex flex-col space-y-2 min-h-[200px]">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                placeholder="Tell us about this officer..."
                value={formData.bio}
                onChange={(e) => handleFieldChange('bio', e.target.value)}
                className="flex-1 resize-none"
              />
              <p className="text-xs text-muted-foreground">
                A brief description about the officer (optional)
              </p>
            </div>

            {/* Contact Info */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  Contact Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="officer@example.com"
                  value={formData.email}
                  onChange={(e) => handleFieldChange('email', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="linkedin_url" className="flex items-center gap-1">
                  <Linkedin className="h-4 w-4" />
                  LinkedIn Profile
                </Label>
                <Input
                  id="linkedin_url"
                  type="url"
                  placeholder="https://linkedin.com/in/username"
                  value={formData.linkedin_url}
                  onChange={(e) => handleFieldChange('linkedin_url', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="order_index">Display Order</Label>
                <Input
                  id="order_index"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={formData.order_index}
                  onChange={(e) => handleFieldChange('order_index', parseInt(e.target.value) || 0)}
                />
                <p className="text-xs text-muted-foreground">
                  Lower numbers appear first in the officers list (0 = first)
                </p>
              </div>
            </div>
          </div>

          {/* Right side - Preview */}
          <div className="border border-border rounded-lg overflow-hidden flex flex-col min-h-[500px]">
            <div className="px-4 py-3 border-b bg-muted/50 flex items-center gap-2">
              <div className="flex items-center gap-2">
                <div className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded-full">
                  New Officer
                </div>
              </div>
              <span className="text-sm font-medium text-muted-foreground">Preview</span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {/* Officer Card Preview using actual component */}
              <OfficerCard
                officer={{
                  id: "preview",
                  name: formData.name || "Officer Name",
                  position: formData.position || "Position",
                  bio: formData.bio || "Officer bio will appear here...",
                  email: formData.email || undefined,
                  image_url: formData.image_url || undefined,
                  linkedin_url: formData.linkedin_url || undefined,
                  order_index: formData.order_index,
                }}
                variant="public"
              />
              
              {/* Order Index info */}
              {formData.order_index > 0 && (
                <div className="text-center pt-4">
                  <span className="text-xs text-muted-foreground">
                    Display order: {formData.order_index}
                  </span>
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
