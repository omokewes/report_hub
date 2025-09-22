import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/auth";
import { Users } from "lucide-react";

interface ShareReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportId: string;
}

export function ShareReportModal({ open, onOpenChange, reportId }: ShareReportModalProps) {
  const [email, setEmail] = useState("");
  const [permission, setPermission] = useState<"viewer" | "commenter" | "editor">("viewer");
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: permissions = [] } = useQuery({
    queryKey: ["/api/reports", reportId, "permissions"],
    enabled: open && !!reportId,
  });

  const { data: users = [] } = useQuery({
    queryKey: ["/api/users", { organizationId: user?.organizationId }],
    enabled: open && !!user?.organizationId,
  });

  const shareReportMutation = useMutation({
    mutationFn: async (data: { userId: string; permission: string; grantedBy: string }) => {
      const response = await apiRequest("POST", `/api/reports/${reportId}/permissions`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Report shared",
        description: "The user now has access to this report.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/reports", reportId, "permissions"] });
      setEmail("");
      setPermission("viewer");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to share report. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const targetUser = users.find((u: any) => u.email === email);
    if (!targetUser) {
      toast({
        title: "User not found",
        description: "The user must be part of your organization to share reports.",
        variant: "destructive",
      });
      return;
    }

    shareReportMutation.mutate({
      userId: targetUser.id,
      permission,
      grantedBy: user.id,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" data-testid="modal-share-report">
        <DialogHeader>
          <DialogTitle>Share Report</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Add people or groups</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                data-testid="input-share-email"
              />
            </div>
            <div>
              <Label htmlFor="permission">Permission</Label>
              <Select value={permission} onValueChange={(value: "viewer" | "commenter" | "editor") => setPermission(value)}>
                <SelectTrigger data-testid="select-share-permission">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">Viewer</SelectItem>
                  <SelectItem value="commenter">Commenter</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={shareReportMutation.isPending}
              data-testid="button-share-report"
            >
              {shareReportMutation.isPending ? "Sharing..." : "Share"}
            </Button>
          </form>

          {permissions.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium">Current Access</h4>
              {permissions.map((perm: any) => {
                const permUser = users.find((u: any) => u.id === perm.userId);
                if (!permUser) return null;

                return (
                  <div key={perm.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>{getInitials(permUser.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{permUser.name}</p>
                        <p className="text-sm text-muted-foreground">{permUser.email}</p>
                      </div>
                    </div>
                    <div className="text-sm capitalize">{perm.permission}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
