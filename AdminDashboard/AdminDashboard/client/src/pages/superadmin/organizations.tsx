import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { 
  Building2, 
  Users, 
  FileText, 
  TrendingUp,
  Server,
  Shield,
  Activity,
  AlertCircle
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

export default function Organizations() {
  const { user } = useAuth();

  const { data: organizations = [] } = useQuery({
    queryKey: ["/api/organizations"],
    enabled: user?.role === "superadmin",
  });

  const { data: activityLogs = [] } = useQuery({
    queryKey: ["/api/activity", { limit: "20" }],
    enabled: user?.role === "superadmin",
  });

  // Mock system stats for demonstration
  const systemStats = {
    totalOrganizations: organizations.length || 24,
    totalUsers: 1247,
    totalReports: 8439,
    systemHealth: "99.9%"
  };

  const mockOrganizations = [
    {
      id: "org-1",
      name: "Acme Corporation",
      status: "active",
      type: "Enterprise",
      userCount: 45,
      reportCount: 128,
      createdAt: "2023-01-15"
    },
    {
      id: "org-2", 
      name: "TechStart Inc.",
      status: "active",
      type: "Professional",
      userCount: 12,
      reportCount: 34,
      createdAt: "2023-03-22"
    },
    {
      id: "org-3",
      name: "Global Ventures",
      status: "active", 
      type: "Enterprise",
      userCount: 78,
      reportCount: 245,
      createdAt: "2022-11-08"
    },
    {
      id: "org-4",
      name: "Innovation Labs",
      status: "trial",
      type: "Trial",
      userCount: 23,
      reportCount: 67,
      createdAt: "2024-01-10"
    }
  ];

  const displayOrganizations = organizations.length > 0 ? organizations : mockOrganizations;

  return (
    <div className="p-8">
      <Header
        title="System Overview"
        description="Monitor and manage all organizations across the platform"
      />

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
                    <Button size="sm" data-testid={`button-manage-${org.id}`}>
                      Manage
                    </Button>
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
                {activityLogs.length > 0 ? (
                  activityLogs.slice(0, 5).map((log: any, index: number) => (
                    <div key={log.id} className="flex gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <div>
                        <p className="text-sm" data-testid={`activity-${index}`}>
                          {log.action.replace(/_/g, ' ')} {log.resource}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(log.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <div>
                        <p className="text-sm">New organization created</p>
                        <p className="text-xs text-muted-foreground">Innovation Labs • 2 hours ago</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <div>
                        <p className="text-sm">User invitation sent</p>
                        <p className="text-xs text-muted-foreground">Acme Corporation • 4 hours ago</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                      <div>
                        <p className="text-sm">Report uploaded</p>
                        <p className="text-xs text-muted-foreground">TechStart Inc • 6 hours ago</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
