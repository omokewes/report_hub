import { useLocation } from "wouter";
import { DashboardBuilder } from "@/components/analytics/dashboard-builder";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function AnalyticsBuilder() {
  const [location, navigate] = useLocation();
  
  // In a real app, this would come from URL params or state
  // For demo purposes, we'll use mock data
  const dataSource = {
    id: "sample-data",
    name: "Sales Report 2024.xlsx",
    fileType: "xlsx"
  };

  return (
    <div className="p-8">
      <Header
        title="Analytics Dashboard Builder"
        description="Create interactive visualizations from your data"
      >
        <Button 
          variant="outline" 
          onClick={() => navigate("/analytics")}
          data-testid="button-back-to-analytics"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Analytics
        </Button>
      </Header>

      <DashboardBuilder dataSource={dataSource} />
    </div>
  );
}