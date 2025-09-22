import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { Report } from "@shared/schema";

interface ReportCardProps {
  report: Report;
  onStar?: (starred: boolean) => void;
  onView?: () => void;
  isStarred?: boolean;
}

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

function formatDate(date: Date): string {
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
}

export function ReportCard({ report, onStar, onView, isStarred }: ReportCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer" data-testid={`card-report-${report.id}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center text-lg", getFileColor(report.fileType))}>
              {getFileIcon(report.fileType)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate" data-testid={`text-report-name-${report.id}`}>{report.name}</p>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>by You</span>
                <span data-testid={`text-report-date-${report.id}`}>{formatDate(report.createdAt)}</span>
                {report.fileSize && (
                  <span>{formatFileSize(report.fileSize)}</span>
                )}
                <div className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  <span data-testid={`text-report-views-${report.id}`}>{report.viewCount}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onStar && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onStar(!isStarred)}
                className="h-8 w-8 p-0"
                data-testid={`button-star-${report.id}`}
              >
                <Star className={cn("h-4 w-4", isStarred ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground")} />
              </Button>
            )}
            {onView && (
              <Button 
                size="sm"
                onClick={onView}
                data-testid={`button-view-${report.id}`}
              >
                View
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
