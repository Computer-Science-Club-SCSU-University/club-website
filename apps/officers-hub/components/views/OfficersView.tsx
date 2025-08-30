"use client";

import { useState } from "react";
import { Card, CardContent, Button, OfficerCard, OfficerCardSkeleton } from "@workspace/ui/components";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { 
  Plus, 
  User,
  Trash2,
} from "lucide-react";
import { useNavigation } from "@/components/navigation/NavigationContext";
import { useOfficers } from "@/hooks/useOfficers";
import { useApiClient } from "@/lib/api";
import OfficerCreateEditor from "@/components/editors/OfficerCreateEditor";
import OfficerEditEditor from "@/components/editors/OfficerEditEditor";
import { toast } from "sonner";

export default function OfficersView() {
  const { officers, loading, error, refetch } = useOfficers();
  const { currentView, setView } = useNavigation();
  const api = useApiClient();
  
  // Delete dialog state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [officerToDelete, setOfficerToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Check if we're in an editor sub-view
  if (currentView.main === 'officers' && currentView.sub === 'create') {
    return <OfficerCreateEditor />;
  }

  if (currentView.main === 'officers' && currentView.sub === 'edit' && currentView.params?.officerId) {
    return <OfficerEditEditor officerId={currentView.params.officerId} />;
  }

  const handleCreateOfficer = () => {
    setView('officers', 'create');
  };

  const handleEditOfficer = (officer: any) => {
    // officer.id is already the backend officer ID, no need to find it
    setView('officers', 'edit', { officerId: officer.id });
  };

  const handleDeleteOfficer = (officerId: string | number) => {
    const officer = officers.find(o => o.id === officerId);
    if (officer) {
      setOfficerToDelete(officer);
      setShowDeleteDialog(true);
    }
  };

  const handleConfirmDelete = async () => {
    if (!officerToDelete) return;

    try {
      setIsDeleting(true);
      await api.officers.delete(officerToDelete.id);
      
      toast.success('Officer deleted successfully');
      setShowDeleteDialog(false);
      setOfficerToDelete(null);
      refetch(); // Refresh the officers list
    } catch (error) {
      console.error('Failed to delete officer:', error);
      toast.error('Failed to delete officer');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteDialog(false);
    setOfficerToDelete(null);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Officers</h1>
          <Button disabled>
            <Plus className="h-4 w-4 mr-2" />
            Add Officer
          </Button>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <OfficerCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Officers</h1>
        </div>
        <div className="text-center py-12">
          <p className="text-red-600">Error loading officers: {error}</p>
          <Button onClick={refetch} className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Officers</h1>
        <Button onClick={handleCreateOfficer}>
          <Plus className="h-4 w-4 mr-2" />
          Add Officer
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {officers.map((backendOfficer) => (
          <OfficerCard
            key={backendOfficer.id}
            officer={{
              id: backendOfficer.id,
              name: backendOfficer.name,
              position: backendOfficer.position,
              bio: backendOfficer.bio || "",
              email: backendOfficer.email || undefined,
              image_url: backendOfficer.image_url || undefined,
              linkedin_url: backendOfficer.linkedin_url || undefined,
              order_index: backendOfficer.order_index,
            }}
            variant="hub"
            onEdit={handleEditOfficer}
            onDelete={handleDeleteOfficer}
          />
        ))}
      </div>

      {officers.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <User className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No officers yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Get started by adding your first officer to the club.
            </p>
            <Button onClick={handleCreateOfficer}>
              <Plus className="h-4 w-4 mr-2" />
              Add Officer
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Officer</DialogTitle>
            <DialogDescription className="mt-1">
              Are you sure you want to delete {officerToDelete?.name} from the officers list? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
            <Button 
              variant="outline" 
              onClick={handleCancelDelete}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete Officer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 
