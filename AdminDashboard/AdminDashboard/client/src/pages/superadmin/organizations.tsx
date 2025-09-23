import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { 
  Building2, 
  Users, 
  FileText, 
  TrendingUp,
  Server,
  Shield,
  Activity,
  AlertCircle,
  Plus,
  Edit,
  Trash2
} from "lucide-react";

function getOrganizationTypeColor(size: string) {
  switch (size) {
    case "Enterprise":
      return "bg-purple-100 text-purple-700";
    case "Professional":
      return "bg-blue-100 text-blue-700";
    case "Trial":
      return "bg-gray-100 text-gray-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-700";
    case "trial":
      return "bg-yellow-100 text-yellow-700";
    case "suspended":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

function CreateOrganizationModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [formData, setFormData] = useState({
    name: "",
    domain: "",
    industry: "",
    size: ""
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createOrgMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch("/api/organizations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error("Failed to create organization");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/system/metrics"] });
      toast({
        title: "Success",
        description: "Organization created successfully",
      });
      setFormData({ name: "", domain: "", industry: "", size: "" });
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create organization",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.size) {
      toast({
        title: "Error",
        description: "Please fill in required fields",
        variant: "destructive",
      });
      return;
    }
    createOrgMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Organization</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Organization Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter organization name"
              required
            />
          </div>
          <div>
            <Label htmlFor="domain">Domain</Label>
            <Input
              id="domain"
              value={formData.domain}
              onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
              placeholder="example.com"
            />
          </div>
          <div>
            <Label htmlFor="industry">Industry</Label>
            <Input
              id="industry"
              value={formData.industry}
              onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
              placeholder="Technology, Finance, Healthcare, etc."
            />
          </div>
          <div>
            <Label htmlFor="size">Organization Size *</Label>
            <Select value={formData.size} onValueChange={(value) => setFormData({ ...formData, size: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select organization size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Trial">Trial (1-10 users)</SelectItem>
                <SelectItem value="Professional">Professional (11-100 users)</SelectItem>
                <SelectItem value="Enterprise">Enterprise (100+ users)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createOrgMutation.isPending}>
              {createOrgMutation.isPending ? "Creating..." : "Create Organization"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function Organizations() {
  const { user } = useAuth();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteOrgMutation = useMutation({
    mutationFn: async (orgId: string) => {
      const response = await fetch(`/api/organizations/${orgId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete organization");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/system/metrics"] });
      toast({
        title: "Success",
        description: "Organization deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete organization",
        variant: "destructive",
      });
    },
  });

  const { data: systemMetrics, isLoading: metricsLoading } = useQuery({
    queryKey: ["/api/system/metrics"],
    enabled: user?.role === "superadmin",
  });

  const { data: systemActivity = [], isLoading: activityLoading } = useQuery({
    queryKey: ["/api/system/activity", { limit: "20" }],
    enabled: user?.role === "superadmin",
  });

  // Use real system data
  const systemStats = systemMetrics ? {
    totalOrganizations: systemMetrics.totalOrganizations,
    totalUsers: systemMetrics.totalUsers,
    totalReports: systemMetrics.totalReports,
    systemHealth: systemMetrics.systemHealth
  } : {
    totalOrganizations: 0,
    totalUsers: 0,
    totalReports: 0,
    systemHealth: "Loading..."
  };

  // Use real organization data with proper status mapping
  const displayOrganizations = systemMetrics?.organizations?.map((org: any) => ({
    id: org.id,
    name: org.name,
    status: "active", // All existing orgs are active
    type: org.size || "Professional", // Map size to type
    userCount: org.userCount,
    reportCount: org.reportCount,
    createdAt: new Date(org.createdAt).toLocaleDateString()
  })) || [];

  return (
    <div className="p-8">
      <Header
        title="System Overview"
        description="Monitor and manage all organizations across the platform"
      >
        <Button onClick={() => setCreateModalOpen(true)} data-testid="button-create-organization">
          <Plus className="h-4 w-4 mr-2" />
          Create Organization
        </Button>
      </Header>

      {/* System Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Building2 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="stat-total-organizations">{systemStats.totalOrganizations}</p>
                <p className="text-muted-foreground">Total Organizations</p>
                <p className="text-sm text-green-600">+3 this month</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="bg-green-100 p-3 rounded-lg">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="stat-total-users">{systemStats.totalUsers}</p>
                <p className="text-muted-foreground">Total Users</p>
                <p className="text-sm text-green-600">+89 this month</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="bg-purple-100 p-3 rounded-lg">
                <FileText className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="stat-total-reports">{systemStats.totalReports}</p>
                <p className="text-muted-foreground">Total Reports</p>
                <p className="text-sm text-green-600">+254 this week</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="bg-emerald-100 p-3 rounded-lg">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="stat-system-health">{systemStats.systemHealth}</p>
                <p className="text-muted-foreground">System Health</p>
                <p className="text-sm text-green-600">All systems operational</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Organizations List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="border-b">
              <CardTitle>Organizations</CardTitle>
              <p className="text-muted-foreground">Manage and monitor all organizations</p>
            </CardHeader>
            
            <CardContent className="p-6">
              <div className="space-y-4">
                {displayOrganizations.map((org: any) => (
                  <div key={org.id} className="flex items-center justify-between p-4 bg-muted rounded-lg" data-testid={`org-card-${org.id}`}>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Building2 className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold" data-testid={`org-name-${org.id}`}>{org.name}</h4>
                          <Badge className={getStatusColor(org.status)} data-testid={`org-status-${org.id}`}>
                            {org.status}
                          </Badge>
                          <Badge className={getOrganizationTypeColor(org.type)} data-testid={`org-type-${org.id}`}>
                            {org.type}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span><Users className="h-3 w-3 inline mr-1" /> {org.userCount} users</span>
                          <span><FileText className="h-3 w-3 inline mr-1" /> {org.reportCount} reports</span>
                          <span>Created {org.createdAt}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" data-testid={`button-edit-${org.id}`}>
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="destructive" data-testid={`button-delete-${org.id}`}>
                            <Trash2 className="h-3 w-3 mr-1" />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Organization</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{org.name}"? This action cannot be undone.
                              The organization will be marked as deleted and all users will lose access.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => deleteOrgMutation.mutate(org.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              {deleteOrgMutation.isPending ? "Deleting..." : "Delete Organization"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Status & Security */}
        <div className="space-y-6">
          {/* System Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-4 w-4" />
                System Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">API Server</span>
                  <Badge className="bg-green-100 text-green-700" data-testid="status-api-server">Online</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Database</span>
                  <Badge className="bg-green-100 text-green-700" data-testid="status-database">Healthy</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">File Storage</span>
                  <Badge className="bg-green-100 text-green-700" data-testid="status-file-storage">Online</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Analytics Engine</span>
                  <Badge className="bg-green-100 text-green-700" data-testid="status-analytics">Running</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Security Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Failed Login Attempts</span>
                  <span className="font-medium" data-testid="security-failed-logins">23 (24h)</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Active Sessions</span>
                  <span className="font-medium" data-testid="security-active-sessions">445</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Security Alerts</span>
                  <span className="font-medium" data-testid="security-alerts">0 pending</span>
                </div>
                
                <Button 
                  variant="ghost" 
                  className="w-full text-left justify-start p-0 h-auto text-primary hover:underline" 
                  data-testid="button-view-security-logs"
                >
                  View Security Logs
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {!activityLoading && systemActivity.length > 0 ? (
                  systemActivity.slice(0, 5).map((log: any, index: number) => (
                    <div key={log.id} className="flex gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <div>
                        <p className="text-sm" data-testid={`activity-${index}`}>
                          {log.action.replace(/_/g, ' ')} {log.resource}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {log.organizationName} • {new Date(log.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {activityLoading ? "Loading activity..." : "No recent system activity"}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <CreateOrganizationModal 
        open={createModalOpen} 
        onOpenChange={setCreateModalOpen} 
      />
    </div>
  );
}
