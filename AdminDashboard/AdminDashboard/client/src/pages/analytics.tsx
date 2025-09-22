import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { 
  ArrowLeft, 
  Search, 
  ArrowRight,
  FileSpreadsheet,
  BarChart3,
  PieChart,
  TrendingUp
} from "lucide-react";

function getFileIcon(fileType: string) {
  switch (fileType) {
    case "xlsx":
    case "csv":
      return <FileSpreadsheet className="h-6 w-6 text-green-600" />;
    default:
      return <FileSpreadsheet className="h-6 w-6 text-gray-600" />;
  }
}

export default function Analytics() {
  const { user } = useAuth();
  const [location, navigate] = useLocation();

  const { data: reports = [] } = useQuery({
    queryKey: ["/api/reports", { organizationId: user?.organizationId }],
    enabled: !!user?.organizationId,
  });

  // Filter reports that can be used for analytics (CSV, Excel)
  const dataSourceReports = reports.filter((report: any) => 
    report.fileType === "csv" || report.fileType === "xlsx"
  );

  return (
    <div className="p-8">
      <Header
        title="Create Analytics Dashboard"
        description="Select a data source to create visualizations and dashboards"
      >
        <Button variant="outline" data-testid="button-back">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </Header>

      {/* Dashboard Builder Info */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Dashboard Builder</CardTitle>
          <p className="text-muted-foreground">
            Transform your data into interactive visualizations. Only reports with structured data (CSV, Excel) can be used to create dashboards.
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="bg-green-100 p-2 rounded">
                <FileSpreadsheet className="h-4 w-4 text-green-600" />
              </div>
              <span className="font-medium">CSV Support</span>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="bg-green-100 p-2 rounded">
                <FileSpreadsheet className="h-4 w-4 text-green-600" />
              </div>
              <span className="font-medium">Excel Support</span>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="bg-purple-100 p-2 rounded">
                <BarChart3 className="h-4 w-4 text-purple-600" />
              </div>
              <span className="font-medium">Interactive Charts</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Available Data Sources */}
      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Available Data Sources</CardTitle>
              <p className="text-muted-foreground">
                Reports with structured data that can be used for analytics
              </p>
            </div>
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search data sources..."
                className="pl-10 w-64"
                data-testid="input-search-datasources"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <div className="space-y-4">
            {dataSourceReports.length > 0 ? (
              dataSourceReports.map((report: any) => (
                <div key={report.id} className="flex items-center justify-between p-4 bg-muted rounded-lg hover:bg-accent transition-colors" data-testid={`datasource-${report.id}`}>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      {getFileIcon(report.fileType)}
                    </div>
                    <div>
                      <h4 className="font-medium" data-testid={`datasource-name-${report.id}`}>{report.name}</h4>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>by {report.createdBy === user?.id ? "You" : "Other User"}</span>
                        <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                        <span>{report.fileSize ? `${Math.round(report.fileSize / 1024)} KB` : "Unknown size"}</span>
                        <Badge className="bg-green-100 text-green-700">Data Source</Badge>
                      </div>
                    </div>
                  </div>
                  <Button 
                    onClick={() => navigate("/analytics/builder")}
                    data-testid={`button-create-dashboard-${report.id}`}
                  >
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Create Dashboard
                  </Button>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <div className="flex justify-center gap-4 mb-6">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <BarChart3 className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="bg-green-100 p-3 rounded-lg">
                    <PieChart className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="bg-purple-100 p-3 rounded-lg">
                    <TrendingUp className="h-8 w-8 text-purple-600" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold mb-2">No Data Sources Available</h3>
                <p className="text-muted-foreground mb-4">
                  Upload CSV or Excel files to create interactive dashboards and visualizations.
                </p>
                <Button 
                  onClick={() => navigate("/reports")}
                  data-testid="button-upload-datasource"
                >
                  Upload Data Source
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
