import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Upload, FileText, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folderId?: string;
}

export function UploadReportModal({ open, onOpenChange, folderId }: UploadReportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [reportName, setReportName] = useState("");
  const [description, setDescription] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const allowedTypes = ['pdf', 'docx', 'xlsx', 'csv', 'pptx'];

  const createReportMutation = useMutation({
    mutationFn: async (reportData: any) => {
      const response = await apiRequest("POST", "/api/reports", reportData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Report uploaded successfully",
        description: "Your report has been uploaded and is now available.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
      onOpenChange(false);
      resetForm();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create report. Please try again.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFile(null);
    setReportName("");
    setDescription("");
    setIsUploading(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const fileExt = selectedFile.name.split('.').pop()?.toLowerCase();
      if (fileExt && allowedTypes.includes(fileExt)) {
        setFile(selectedFile);
        if (!reportName) {
          // Auto-fill report name with filename (without extension)
          const nameWithoutExt = selectedFile.name.substring(0, selectedFile.name.lastIndexOf('.'));
          setReportName(nameWithoutExt);
        }
      } else {
        toast({
          title: "Invalid file type",
          description: "Please select a PDF, DOCX, XLSX, CSV, or PPTX file.",
          variant: "destructive",
        });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !user?.organizationId) return;

    setIsUploading(true);

    try {
      // Upload file first
      const formData = new FormData();
      formData.append('file', file);

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('File upload failed');
      }

      const uploadResult = await uploadResponse.json();

      // Create report with uploaded file info
      await createReportMutation.mutateAsync({
        name: reportName,
        description,
        filePath: uploadResult.file.path,
        fileType: uploadResult.file.fileType,
        fileSize: uploadResult.file.size,
        createdBy: user.id,
        organizationId: user.organizationId,
        folderId: folderId || null,
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = () => {
    setFile(null);
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf': return '📄';
      case 'docx': return '📝';
      case 'xlsx': case 'csv': return '📊';
      case 'pptx': return '📽️';
      default: return '📄';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" data-testid="modal-upload-report">
        <DialogHeader>
          <DialogTitle>Upload Report</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* File Upload Area */}
          <div>
            <Label>File</Label>
            {!file ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  accept=".pdf,.docx,.xlsx,.csv,.pptx"
                  onChange={handleFileChange}
                  data-testid="input-file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    PDF, DOCX, XLSX, CSV, PPTX (max 10MB)
                  </p>
                </label>
              </div>
            ) : (
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getFileIcon(file.name)}</span>
                    <div>
                      <p className="font-medium text-sm">{file.name}</p>
                      <p className="text-xs text-gray-500">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={removeFile}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Report Name */}
          <div>
            <Label htmlFor="reportName">Report Name</Label>
            <Input
              id="reportName"
              placeholder="Enter report name"
              value={reportName}
              onChange={(e) => setReportName(e.target.value)}
              required
              data-testid="input-report-name"
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Input
              id="description"
              placeholder="Enter report description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              data-testid="input-report-description"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              type="submit"
              className="flex-1"
              disabled={!file || !reportName || isUploading}
              data-testid="button-upload-report"
            >
              {isUploading ? "Uploading..." : "Upload Report"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              data-testid="button-cancel-upload"
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}