import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { 
  FolderPlus, 
  Upload, 
  Search, 
  Grid3X3, 
  List, 
  Folder,
  FileText,
  MoreHorizontal
} from "lucide-react";

function getFileIcon(fileType: string) {
  switch (fileType) {
    case "pdf":
      return "📄";
    case "xlsx":
    case "csv":
      return "📊";
    case "docx":
      return "📝";
    case "pptx":
      return "📽️";
    default:
      return "📄";
  }
}

function getFileColor(fileType: string) {
  switch (fileType) {
    case "pdf":
      return "bg-red-100 text-red-600";
    case "xlsx":
    case "csv":
      return "bg-green-100 text-green-600";
    case "docx":
      return "bg-blue-100 text-blue-600";
    case "pptx":
      return "bg-orange-100 text-orange-600";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function getAccessBadgeColor(access: string) {
  switch (access) {
    case "owner":
      return "bg-purple-100 text-purple-700";
    case "editor":
      return "bg-green-100 text-green-700";
    case "commenter":
      return "bg-yellow-100 text-yellow-700";
    case "viewer":
      return "bg-blue-100 text-blue-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

export default function Reports() {
  const [searchTerm, setSearchTerm] = useState("");
  const [fileTypeFilter, setFileTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const { user } = useAuth();

  const { data: reports = [] } = useQuery({
    queryKey: ["/api/reports", { organizationId: user?.organizationId }],
    enabled: !!user?.organizationId,
  });

  const { data: folders = [] } = useQuery({
    queryKey: ["/api/folders", { organizationId: user?.organizationId }],
    enabled: !!user?.organizationId,
  });

  const filteredReports = reports.filter((report: any) => {
    const matchesSearch = report.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = fileTypeFilter === "all" || report.fileType === fileTypeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="p-8">
      <Header
        title="All Reports"
        description="Manage and organize your organization's reports"
      >
        <div className="flex gap-3">
          <Button variant="secondary" data-testid="button-new-folder">
            <FolderPlus className="h-4 w-4 mr-2" />
            New Folder
          </Button>
          <Button data-testid="button-upload-report">
            <Upload className="h-4 w-4 mr-2" />
            Upload
          </Button>
        </div>
      </Header>

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search reports, files, and folders..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                data-testid="input-search-reports"
              />
            </div>
            <div className="flex gap-3">
              <Select value={fileTypeFilter} onValueChange={setFileTypeFilter}>
                <SelectTrigger className="w-[120px]" data-testid="select-file-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="xlsx">Excel</SelectItem>
                  <SelectItem value="docx">Word</SelectItem>
                  <SelectItem value="pptx">PowerPoint</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[100px]" data-testid="select-sort-by">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="size">Size</SelectItem>
                  <SelectItem value="owner">Owner</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex bg-secondary rounded-lg p-1">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="px-3"
                  data-testid="button-grid-view"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="px-3"
                  data-testid="button-list-view"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Folder Structure */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {folders.map((folder: any) => (
          <Card key={folder.id} className="hover:shadow-lg transition-shadow cursor-pointer" data-testid={`folder-${folder.id}`}>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Folder className="h-8 w-8 text-blue-500" />
                <div>
                  <h3 className="font-semibold" data-testid={`folder-name-${folder.id}`}>{folder.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {reports.filter((r: any) => r.folderId === folder.id).length} reports
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Reports */}
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Reports</CardTitle>
          <p className="text-sm text-muted-foreground">{filteredReports.length} items</p>
        </CardHeader>
        
        {viewMode === "list" ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Modified</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Access</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReports.map((report: any) => (
                  <TableRow key={report.id} data-testid={`row-report-${report.id}`}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded flex items-center justify-center text-sm ${getFileColor(report.fileType)}`}>
                          {getFileIcon(report.fileType)}
                        </div>
                        <span className="font-medium" data-testid={`report-name-${report.id}`}>{report.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {report.createdBy === user?.id ? "You" : "Other User"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(report.updatedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {report.fileSize ? formatFileSize(report.fileSize) : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge className={getAccessBadgeColor("owner")}>
                        owner
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" data-testid={`button-actions-${report.id}`}>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredReports.map((report: any) => (
                <Card key={report.id} className="hover:shadow-lg transition-shadow cursor-pointer" data-testid={`card-report-${report.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${getFileColor(report.fileType)}`}>
                        {getFileIcon(report.fileType)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate" data-testid={`grid-report-name-${report.id}`}>{report.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {report.fileSize ? formatFileSize(report.fileSize) : "Unknown size"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge className={getAccessBadgeColor("owner")}>
                        owner
                      </Badge>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {filteredReports.length === 0 && (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No reports found</p>
                <p className="text-sm text-muted-foreground">Try adjusting your search or filters</p>
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
}
