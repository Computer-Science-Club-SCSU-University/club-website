"use client";

import { useNavigation } from "@/components/navigation/NavigationContext";
import { AnnouncementPreviewProvider } from "@workspace/ui/components/announcements/AnnouncementPreviewContext";
import { AnnouncementPreview } from "@workspace/ui/components/announcements/AnnouncementPreview";

// Views
import DashboardView from "@/components/views/DashboardView";
import AnnouncementsView from "@/components/views/AnnouncementsView";
import EventsView from "@/components/views/EventsView";
import OfficersView from "@/components/views/OfficersView";

// Editors
import AnnouncementCreateEditor from "@/components/editors/AnnouncementCreateEditor";
import AnnouncementEditEditor from "@/components/editors/AnnouncementEditEditor";

// Update the component to accept props
interface AnnouncementEditEditorProps {
  announcementId?: string;
}

import OfficerCreateEditor from "@/components/editors/OfficerCreateEditor";
import OfficerEditEditor from "@/components/editors/OfficerEditEditor";

export default function RootPage() {
  const { currentView } = useNavigation();

  // Handle sub-views (editors)
  if (currentView.sub) {
    switch (currentView.main) {
      case 'announcements':
        return (
          <AnnouncementPreviewProvider>
            {currentView.sub === 'create' && <AnnouncementCreateEditor />}
            {currentView.sub === 'edit' && <AnnouncementEditEditor />}
            <AnnouncementPreview />
          </AnnouncementPreviewProvider>
        );
      case 'events':
        if (currentView.sub === 'create') {
          return <div>Event Create Editor (TODO)</div>;
        }
        if (currentView.sub === 'edit') {
          return <div>Event Edit Editor (TODO)</div>;
        }
        break;
      case 'officers':
        if (currentView.sub === 'create') {
          return <OfficerCreateEditor />;
        }
        if (currentView.sub === 'edit' && currentView.params?.officerId) {
          return <OfficerEditEditor officerId={currentView.params.officerId} />;
        }
        break;
    }
  }

  // Handle main views
  switch (currentView.main) {
    case 'dashboard':
      return <DashboardView />;
    case 'announcements':
      return <AnnouncementsView />;
    case 'events':
      return <EventsView />;
    case 'officers':
      return <OfficersView />;
    default:
      return <DashboardView />;
  }
}
