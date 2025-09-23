"use client"

import { useClerk, useUser } from "@clerk/nextjs"
import {
  LogOut,
  Settings,
  User,
  ChevronsUpDown,
} from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@club-website/ui/components/avatar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@club-website/ui/components/popover"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@club-website/ui/components/sidebar"
import { Button } from "@club-website/ui/components/button"
import { Separator } from "@club-website/ui/components/separator"

export function NavUser() {
  const { isMobile } = useSidebar()
  const { signOut } = useClerk()
  const { user } = useUser()

  const handleSignOut = () => {
    signOut()
  }

  // Truncate email with ellipsis if too long (for sidebar display)
  const truncateEmail = (email: string, maxLength: number = 20) => {
    if (email.length <= maxLength) return email
    return email.substring(0, maxLength - 3) + "..."
  }

  if (!user) return null

  // Extract user data from Clerk JWT
  const firstName = user.firstName || ""
  const lastName = user.lastName || ""
  const fullName = user.fullName || `${firstName} ${lastName}`.trim() || "Officer"
  const email = user.primaryEmailAddress?.emailAddress || "No email"
  const displayName = firstName || fullName.split(' ')[0] || "Officer"

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <Popover>
          <PopoverTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={user.imageUrl} alt={fullName} />
                <AvatarFallback className="rounded-lg">
                  {firstName?.[0]?.toUpperCase()}{lastName?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">
                  {displayName}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {email !== "No email" ? truncateEmail(email) : "No email"}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </PopoverTrigger>
          <PopoverContent
            className="w-72 rounded-lg p-0"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <div className="p-4">
              <div className="flex items-start gap-3">
                <Avatar className="h-12 w-12 rounded-lg flex-shrink-0">
                  <AvatarImage src={user.imageUrl} alt={fullName} />
                  <AvatarFallback className="rounded-lg text-lg">
                    {firstName?.[0]?.toUpperCase()}{lastName?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="font-semibold text-sm leading-tight">
                    {fullName}
                  </p>
                  <p className="text-xs text-muted-foreground break-all leading-relaxed">
                    {email}
                  </p>
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div className="p-2">
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 h-9 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                size="sm"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
