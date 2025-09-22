import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { InviteUserModal } from "@/components/modals/invite-user-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { getInitials, getRoleColor } from "@/lib/auth";
import { UserPlus, Search, MoreHorizontal, Users as UsersIcon, Loader2, AlertCircle } from "lucide-react";

// TypeScript interfaces for type safety
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  lastActiveAt: string | null;
  createdAt: string;
  organizationId: string;
}

interface Report {
  id: string;
  createdBy: string;
  createdAt: string;
  [key: string]: any; // Allow for additional report properties
}

function getStatusColor(isActive: boolean) {
  return isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700";
}

function formatLastActive(lastActiveAt: string | Date | null): string {
  if (!lastActiveAt) return "Never";
  
  try {
    const date = new Date(lastActiveAt);
    if (isNaN(date.getTime())) return "Never";
    
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffHours < 1) {
      return "Just now";
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    } else {
      return date.toLocaleDateString();
    }
  } catch {
    return "Never";
  }
}

export default function Users() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const { user } = useAuth();

  const { data: users = [], isLoading: usersLoading, error: usersError } = useQuery<User[]>({
    queryKey: ["/api/users", { organizationId: user?.organizationId }],
    enabled: !!user?.organizationId,
  });

  const { data: reports = [], isLoading: reportsLoading, error: reportsError } = useQuery<Report[]>({
    queryKey: ["/api/reports", { organizationId: user?.organizationId }],
    enabled: !!user?.organizationId,
  });

  const filteredUsers = users.filter((u: User) =>
    u?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Precompute report counts for performance (O(R) instead of O(U×R))
  const reportCountsByUser = React.useMemo(() => {
    const counts = new Map<string, number>();
    reports.forEach((report: Report) => {
      if (report?.createdBy) {
        counts.set(report.createdBy, (counts.get(report.createdBy) || 0) + 1);
      }
    });
    return counts;
  }, [reports]);

  const getUserReportCount = (userId: string) => {
    return reportCountsByUser.get(userId) || 0;
  };

  // Loading state
  if (usersLoading || reportsLoading) {
    return (
      <div className="p-8">
        <Header
          title="User Management"
          description="Manage users and permissions for your organization"
        >
          <Button disabled>
            <UserPlus className="h-4 w-4 mr-2" />
            Invite User
          </Button>
        </Header>
        
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <UsersIcon className="h-5 w-5 text-gray-600" />
            <div className="h-8 w-12 bg-gray-200 rounded animate-pulse"></div>
            <span className="text-gray-600">Total Users</span>
          </div>
        </div>

        <Card>
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <CardTitle>Organization Users</CardTitle>
              <div className="h-10 w-64 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
              <span className="ml-3 text-gray-500">Loading users...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (usersError || reportsError) {
    return (
      <div className="p-8">
        <Header
          title="User Management"
          description="Manage users and permissions for your organization"
        >
          <Button onClick={() => setShowInviteModal(true)} data-testid="button-invite-user">
            <UserPlus className="h-4 w-4 mr-2" />
            Invite User
          </Button>
        </Header>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center py-12 text-red-600">
              <AlertCircle className="h-8 w-8" />
              <span className="ml-3">Failed to load user data. Please try refreshing the page.</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8">
      <Header
        title="User Management"
        description="Manage users and permissions for your organization"
      >
        <Button onClick={() => setShowInviteModal(true)} data-testid="button-invite-user">
          <UserPlus className="h-4 w-4 mr-2" />
          Invite User
        </Button>
      </Header>

      {/* User Stats */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-right">
          <UsersIcon className="h-5 w-5 text-gray-600" />
          <span className="text-2xl font-bold">{users.length}</span>
          <span className="text-gray-600">Total Users</span>
          {searchTerm && (
            <span className="text-sm text-muted-foreground ml-2">
              ({filteredUsers.length} matching)
            </span>
          )}
        </div>
      </div>

      {/* Users List */}
      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Organization Users</CardTitle>
            </div>
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search users by name or email..."
                className="pl-10 w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                data-testid="input-search-users"
              />
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <div className="divide-y">
            {filteredUsers.map((u: User) => (
              <div key={u.id} className="p-6 hover:bg-accent/50 transition-colors" data-testid={`row-user-${u.id}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold">
                        {getInitials(u?.name || 'Unknown User')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <p className="font-medium text-lg" data-testid={`user-name-${u.id}`}>
                          {u?.name || 'Unknown User'}
                        </p>
                        <Badge className={getRoleColor(u?.role || 'user')} data-testid={`user-role-${u.id}`}>
                          {u?.role || 'user'}
                        </Badge>
                        <Badge className={getStatusColor(u?.isActive ?? true)} data-testid={`user-status-${u.id}`}>
                          {u?.isActive ? "active" : "inactive"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span data-testid={`user-email-${u.id}`}>{u?.email || 'No email'}</span>
                        <span>•</span>
                        <span>
                          {u?.createdAt ? `Joined ${new Date(u.createdAt).toLocaleDateString()}` : 'Recently joined'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="font-semibold text-lg">{getUserReportCount(u.id)} reports</p>
                      <p className="text-sm text-muted-foreground" data-testid={`user-last-active-${u.id}`}>
                        Last active: {formatLastActive(u.lastActiveAt)}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" data-testid={`button-user-actions-${u.id}`}>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <UserPlus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No users found</p>
            <p className="text-sm text-muted-foreground">
              {searchTerm ? "Try adjusting your search term" : "Invite users to get started"}
            </p>
          </div>
        )}
      </Card>

      <InviteUserModal
        open={showInviteModal}
        onOpenChange={setShowInviteModal}
      />
    </div>
  );
}
