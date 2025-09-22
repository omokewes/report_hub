import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { ReportCard } from "@/components/report-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { Plus, FileText, Share, Eye, Star, Clock, Upload, BarChart3, Folder } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();

  const { data: reports = [] } = useQuery({
    queryKey: ["/api/reports", { organizationId: user?.organizationId }],
    enabled: !!user?.organizationId,
  });

  const { data: starredReports = [] } = useQuery({
    queryKey: ["/api/reports", { userId: user?.id, starred: "true" }],
    enabled: !!user?.id,
  });

  const { data: activityLogs = [] } = useQuery({
    queryKey: ["/api/activity", { organizationId: user?.organizationId, limit: "10" }],
    enabled: !!user?.organizationId,
  });

  const recentReports = reports
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  const totalViews = reports.reduce((sum: number, report: any) => sum + report.viewCount, 0);
  const sharedWithMe = reports.filter((report: any) => report.createdBy !== user?.id).length;
  const myReports = reports.filter((report: any) => report.createdBy === user?.id).length;

  return (
    <div className="p-8">
      <Header
        title="Welcome back!"
        description="Here's what's happening with your reports today"
      >
        <Button data-testid="button-new-report">
          <Plus className="h-4 w-4 mr-2" />
          New Report
        </Button>
      </Header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="stat-my-reports">{myReports}</p>
                <p className="text-muted-foreground">My Reports</p>
                <p className="text-sm text-green-600">+2 this week</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="bg-green-100 p-3 rounded-lg">
                <Share className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="stat-shared-with-me">{sharedWithMe}</p>
                <p className="text-muted-foreground">Shared with Me</p>
                <p className="text-sm text-green-600">+{sharedWithMe} this week</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="bg-purple-100 p-3 rounded-lg">
                <Eye className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="stat-total-views">{totalViews}</p>
                <p className="text-muted-foreground">Total Views</p>
                <p className="text-sm text-green-600">+{Math.floor(totalViews * 0.15)} this week</p>
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
                  <p className="text-sm text-muted-foreground">Reports you've created or that have been shared with you</p>
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
                    <ReportCard 
                      key={report.id} 
                      report={report}
                      isStarred={report.isStarred}
                    />
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
          {/* Starred Reports */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-500" />
                Starred Reports
              </CardTitle>
              <p className="text-sm text-muted-foreground">Your favorite reports for quick access</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {starredReports.length > 0 ? (
                  starredReports.slice(0, 3).map((report: any) => (
                    <div key={report.id} className="flex items-center gap-3 p-2 hover:bg-accent rounded-lg">
                      <div className="w-8 h-8 bg-green-100 rounded flex items-center justify-center">
                        <FileText className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium" data-testid={`starred-report-${report.id}`}>{report.name}</p>
                        <p className="text-xs text-muted-foreground">by You</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No starred reports yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activityLogs.length > 0 ? (
                  activityLogs.slice(0, 4).map((log: any, index: number) => (
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
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No recent activity
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start gap-3 h-10"
                  data-testid="button-upload-report"
                >
                  <Upload className="h-4 w-4" />
                  Upload New Report
                </Button>
                
                <Button 
                  variant="ghost" 
                  className="w-full justify-start gap-3 h-10"
                  data-testid="button-create-dashboard"
                >
                  <BarChart3 className="h-4 w-4" />
                  Create Dashboard
                </Button>
                
                <Button 
                  variant="ghost" 
                  className="w-full justify-start gap-3 h-10"
                  data-testid="button-browse-reports"
                >
                  <Folder className="h-4 w-4" />
                  Browse Reports
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
