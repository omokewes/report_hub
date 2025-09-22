import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { InviteUserModal } from "@/components/modals/invite-user-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { getInitials, getRoleColor } from "@/lib/auth";
import { UserPlus, Search, MoreHorizontal } from "lucide-react";

function getStatusColor(isActive: boolean) {
  return isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700";
}

function formatLastActive(lastActiveAt: Date | null) {
  if (!lastActiveAt) return "Never";
  
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - new Date(lastActiveAt).getTime());
  const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffHours < 1) {
    return "Just now";
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  } else {
    return new Date(lastActiveAt).toLocaleDateString();
  }
}

export default function Users() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const { user } = useAuth();

  const { data: users = [] } = useQuery({
    queryKey: ["/api/users", { organizationId: user?.organizationId }],
    enabled: !!user?.organizationId,
  });

  const filteredUsers = users.filter((u: any) =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8">
      <Header
        title="Manage Users"
        description="Invite and manage users in your organization"
      >
        <Button onClick={() => setShowInviteModal(true)} data-testid="button-invite-user">
          <UserPlus className="h-4 w-4 mr-2" />
          Invite User
        </Button>
      </Header>

      {/* Users Table */}
      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Organization Users</CardTitle>
              <p className="text-muted-foreground">Manage user access and permissions</p>
            </div>
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                className="pl-10 w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                data-testid="input-search-users"
              />
            </div>
          </div>
        </CardHeader>
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Active</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((u: any) => (
                <TableRow key={u.id} data-testid={`row-user-${u.id}`}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>{getInitials(u.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium" data-testid={`user-name-${u.id}`}>{u.name}</p>
                        <p className="text-sm text-muted-foreground" data-testid={`user-email-${u.id}`}>{u.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getRoleColor(u.role)} data-testid={`user-role-${u.id}`}>
                      {u.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(u.isActive)} data-testid={`user-status-${u.id}`}>
                      {u.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground" data-testid={`user-last-active-${u.id}`}>
                    {formatLastActive(u.lastActiveAt)}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" data-testid={`button-user-actions-${u.id}`}>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

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
