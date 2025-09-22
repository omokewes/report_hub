import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { Plus, Users, FileText, Share, Eye, Star, Clock, Upload, BarChart3, UserPlus, TrendingUp, Activity } from "lucide-react";
import { UploadReportModal } from "@/components/modals/upload-report-modal";
import { InviteUserModal } from "@/components/modals/invite-user-modal";

export default function Dashboard() {
  const { user } = useAuth();
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);

  const { data: reports = [] } = useQuery({
    queryKey: ["/api/reports", { organizationId: user?.organizationId }],
    enabled: !!user?.organizationId,
  }) as { data: any[] };

  const { data: users = [] } = useQuery({
    queryKey: ["/api/users", { organizationId: user?.organizationId }],
    enabled: !!user?.organizationId && (user?.role === "admin" || user?.role === "superadmin"),
  }) as { data: any[] };

  const { data: activityLogs = [] } = useQuery({
    queryKey: ["/api/activity", { organizationId: user?.organizationId, limit: "10" }],
    enabled: !!user?.organizationId,
  }) as { data: any[] };

  const recentReports = reports
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4);

  const totalViews = reports.reduce((sum: number, report: any) => sum + report.viewCount, 0);
  const sharedReports = reports.filter((report: any) => report.createdBy !== user?.id).length;
  const teamMembers = users.length;

  const isAdmin = user?.role === "admin" || user?.role === "superadmin";
  const dashboardTitle = isAdmin ? "Admin Dashboard" : "Welcome back!";
  const dashboardDescription = isAdmin 
    ? "Overview of your organization's reports and team activity"
    : "Here's what's happening with your reports today";

  return (
    <div className="p-8">
      <Header
        title={dashboardTitle}
        description={dashboardDescription}
      >
        <div className="flex gap-3">
          {isAdmin && (
            <Button 
              variant="outline"
              onClick={() => setInviteModalOpen(true)}
              data-testid="button-manage-users"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Manage Users
            </Button>
          )}
          <Button 
            onClick={() => setUploadModalOpen(true)}
            data-testid="button-create-report"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Report
          </Button>
        </div>
      </Header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {isAdmin && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold" data-testid="stat-team-members">{teamMembers}</p>
                  <p className="text-sm text-muted-foreground">Team Members</p>
                  <p className="text-xs text-green-600">+3 this month</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="bg-green-50 p-3 rounded-lg">
                <FileText className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="stat-total-reports">{reports.length}</p>
                <p className="text-sm text-muted-foreground">Total Reports</p>
                <p className="text-xs text-green-600">+13 this week</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="bg-purple-50 p-3 rounded-lg">
                <Share className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="stat-shared-reports">{sharedReports}</p>
                <p className="text-sm text-muted-foreground">Shared Reports</p>
                <p className="text-xs text-green-600">+7 today</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="bg-orange-50 p-3 rounded-lg">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="stat-total-views">{totalViews.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Views This Month</p>
                <p className="text-xs text-green-600">+15% vs last month</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Reports */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Reports</CardTitle>
                  <p className="text-sm text-muted-foreground">Latest reports created by your team</p>
                </div>
                <Button variant="outline" size="sm" data-testid="button-view-all-reports">
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {recentReports.length > 0 ? (
                  recentReports.map((report: any) => (
                    <div key={report.id} className="flex items-center justify-between p-4 hover:bg-accent rounded-lg transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                          <FileText className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm" data-testid={`report-name-${report.id}`}>{report.name}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>by {report.createdBy === user?.id ? 'You' : 'Team Member'}</span>
                            <span>•</span>
                            <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                            <span>•</span>
                            <span>{report.viewCount} views</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {report.fileType.toUpperCase()}
                        </Badge>
                        <Button variant="ghost" size="sm" data-testid={`button-view-report-${report.id}`}>
                          View
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No reports yet</p>
                    <p className="text-sm text-muted-foreground">Upload your first report to get started</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Content */}
        <div className="space-y-6">
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Recent Activity
              </CardTitle>
              <p className="text-sm text-muted-foreground">Team activity in the last 24 hours</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activityLogs.length > 0 ? (
                  activityLogs.slice(0, 5).map((log: any, index: number) => (
                    <div key={log.id} className="flex gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm" data-testid={`activity-${index}`}>
                          <span className="font-medium">
                            {log.userId === user?.id ? 'You' : 'Team member'}
                          </span>{' '}
                          {log.action.replace(/_/g, ' ').toLowerCase()} {log.resource}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(log.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No recent activity
                  </p>
                )}
                {activityLogs.length > 5 && (
                  <Button variant="ghost" size="sm" className="w-full mt-4">
                    View Full Activity Log
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <p className="text-sm text-muted-foreground">Common administrative tasks</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start gap-3 h-10"
                  onClick={() => setUploadModalOpen(true)}
                  data-testid="button-upload-report"
                >
                  <Upload className="h-4 w-4" />
                  Upload New Report
                </Button>
                
                {isAdmin && (
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start gap-3 h-10"
                    onClick={() => setInviteModalOpen(true)}
                    data-testid="button-invite-team-member"
                  >
                    <UserPlus className="h-4 w-4" />
                    Invite Team Member
                  </Button>
                )}
                
                <Button 
                  variant="ghost" 
                  className="w-full justify-start gap-3 h-10"
                  data-testid="button-create-dashboard"
                >
                  <BarChart3 className="h-4 w-4" />
                  Create Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modals */}
      <UploadReportModal 
        open={uploadModalOpen} 
        onOpenChange={setUploadModalOpen} 
      />
      {isAdmin && (
        <InviteUserModal
          open={inviteModalOpen}
          onOpenChange={setInviteModalOpen}
        />
      )}
    </div>
  );
}
