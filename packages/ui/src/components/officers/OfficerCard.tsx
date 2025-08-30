"use client";

import * as React from "react";
import { Mail, Linkedin, Edit, Trash2 } from "lucide-react";
import { Card, CardContent } from "@workspace/ui/components/card";
import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components/avatar";
import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";

export interface OfficerCardProps {
  officer: {
    id: string | number;
    name: string;
    position?: string;
    bio: string;
    email?: string;
    image_url?: string;
    linkedin_url?: string;
    order_index?: number;
  };
  variant?: "public" | "hub";
  onEdit?: (officer: OfficerCardProps['officer']) => void;
  onDelete?: (officerId: string | number) => void;
  className?: string;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function OfficerCard({ 
  officer, 
  variant = "public", 
  onEdit, 
  onDelete, 
  className 
}: OfficerCardProps) {
  const isHub = variant === "hub";
  
  // Normalize properties for both variants
  const position = officer.position || "Member";
  const imageUrl = officer.image_url;
  const linkedinUrl = officer.linkedin_url;
  const initials = getInitials(officer.name);

  return (
    <Card className={cn("group relative overflow-hidden border-border bg-card transition-all duration-300 hover:shadow-lg hover:-translate-y-1", className)}>
      {/* Action buttons - only show for hub variant */}
      {isHub && (onEdit || onDelete) && (
        <div className="absolute top-3 right-3 flex gap-1 z-10">
          {onEdit && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onEdit(officer)}
              className="h-8 w-8 p-0 shadow-sm"
              aria-label={`Edit ${officer.name}`}
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onDelete(officer.id)}
              className="h-8 w-8 p-0 shadow-sm text-destructive hover:text-destructive hover:bg-destructive/10"
              aria-label={`Delete ${officer.name}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}

      <CardContent className="p-6">
        <div className="flex flex-col items-center text-center space-y-4">
          {/* Profile Image */}
          <Avatar className="h-24 w-24 ring-2 ring-muted transition-all duration-300 flex-shrink-0">
            <AvatarImage src={imageUrl} alt={officer.name} className="object-cover" />
            <AvatarFallback className="bg-primary text-primary-foreground text-lg font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>

          {/* Name */}
          <h3 className="text-xl font-bold text-foreground text-balance flex-shrink-0">{officer.name}</h3>

          {/* Position */}
          <p className="text-sm font-medium text-primary flex-shrink-0">{position}</p>

          {/* Social Links */}
          {(linkedinUrl || officer.email) && (
            <div className="flex items-center gap-2 pt-2 flex-shrink-0">
              {linkedinUrl && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 p-0 text-muted-foreground hover:text-primary hover:bg-primary/10"
                  asChild
                >
                  <a
                    href={linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${officer.name}'s LinkedIn profile`}
                  >
                    <Linkedin className="h-4 w-4" />
                  </a>
                </Button>
              )}
              {officer.email && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 p-0 text-muted-foreground hover:text-primary hover:bg-primary/10"
                  asChild
                >
                  <a href={`mailto:${officer.email}`} aria-label={`Email ${officer.name}`}>
                    <Mail className="h-4 w-4" />
                  </a>
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}