import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent 
} from "@/components/ui/chart";
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid,
  ResponsiveContainer 
} from "recharts";
import { 
  BarChart3, 
  LineChart as LineChartIcon, 
  PieChart as PieChartIcon,
  TrendingUp,
  Download,
  Share,
  Settings,
  Plus,
  Trash2
} from "lucide-react";

interface ChartWidget {
  id: string;
  type: 'bar' | 'line' | 'pie';
  title: string;
  dataKey: string;
  valueKey: string;
  color: string;
}

interface DashboardBuilderProps {
  dataSource: {
    id: string;
    name: string;
    fileType: string;
  };
  sampleData?: any[];
}

// Sample data columns that would come from CSV/Excel parsing
const sampleColumns = [
  { key: 'month', label: 'Month', type: 'string' },
  { key: 'revenue', label: 'Revenue', type: 'number' },
  { key: 'customers', label: 'Customers', type: 'number' },
  { key: 'region', label: 'Region', type: 'string' },
  { key: 'product', label: 'Product', type: 'string' },
  { key: 'growth', label: 'Growth %', type: 'number' }
];

const sampleData = [
  { month: 'Jan', revenue: 12000, customers: 240, region: 'North', product: 'Widget A', growth: 12 },
  { month: 'Feb', revenue: 15000, customers: 300, region: 'South', product: 'Widget B', growth: 25 },
  { month: 'Mar', revenue: 18000, customers: 360, region: 'East', product: 'Widget A', growth: 20 },
  { month: 'Apr', revenue: 22000, customers: 440, region: 'West', product: 'Widget C', growth: 22 },
  { month: 'May', revenue: 25000, customers: 500, region: 'North', product: 'Widget B', growth: 14 },
  { month: 'Jun', revenue: 28000, customers: 560, region: 'South', product: 'Widget A', growth: 12 }
];

const chartColors = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#f97316', // orange
];

const chartTypes = [
  { value: 'bar', label: 'Bar Chart', icon: BarChart3 },
  { value: 'line', label: 'Line Chart', icon: LineChartIcon },
  { value: 'pie', label: 'Pie Chart', icon: PieChartIcon },
];

export function DashboardBuilder({ dataSource }: DashboardBuilderProps) {
  const [widgets, setWidgets] = useState<ChartWidget[]>([]);
  const [selectedChartType, setSelectedChartType] = useState<'bar' | 'line' | 'pie'>('bar');
  const [selectedDataKey, setSelectedDataKey] = useState('');
  const [selectedValueKey, setSelectedValueKey] = useState('');
  const [chartTitle, setChartTitle] = useState('');
  const [dashboardTitle, setDashboardTitle] = useState('');

  const stringColumns = sampleColumns.filter(col => col.type === 'string');
  const numberColumns = sampleColumns.filter(col => col.type === 'number');

  const addWidget = () => {
    if (!selectedDataKey || !selectedValueKey || !chartTitle) return;

    const newWidget: ChartWidget = {
      id: `widget-${Date.now()}`,
      type: selectedChartType,
      title: chartTitle,
      dataKey: selectedDataKey,
      valueKey: selectedValueKey,
      color: chartColors[widgets.length % chartColors.length]
    };

    setWidgets([...widgets, newWidget]);
    setChartTitle('');
    setSelectedDataKey('');
    setSelectedValueKey('');
  };

  const removeWidget = (id: string) => {
    setWidgets(widgets.filter(w => w.id !== id));
  };

  const renderChart = (widget: ChartWidget) => {
    const chartConfig = {
      [widget.valueKey]: {
        label: numberColumns.find(col => col.key === widget.valueKey)?.label || widget.valueKey,
        color: widget.color,
      },
    };

    switch (widget.type) {
      case 'bar':
        return (
          <ChartContainer config={chartConfig} className="h-[300px]">
            <BarChart data={sampleData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={widget.dataKey} />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey={widget.valueKey} fill={widget.color} />
            </BarChart>
          </ChartContainer>
        );
      
      case 'line':
        return (
          <ChartContainer config={chartConfig} className="h-[300px]">
            <LineChart data={sampleData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={widget.dataKey} />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line 
                type="monotone" 
                dataKey={widget.valueKey} 
                stroke={widget.color} 
                strokeWidth={2}
              />
            </LineChart>
          </ChartContainer>
        );
      
      case 'pie':
        return (
          <ChartContainer config={chartConfig} className="h-[300px]">
            <PieChart>
              <Pie
                data={sampleData}
                dataKey={widget.valueKey}
                nameKey={widget.dataKey}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill={widget.color}
              >
                {sampleData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                ))}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
            </PieChart>
          </ChartContainer>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Dashboard Builder</CardTitle>
              <p className="text-muted-foreground">
                Creating dashboard from: <Badge variant="secondary">{dataSource.name}</Badge>
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm">
                <Share className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button size="sm">
                Save Dashboard
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Label htmlFor="dashboard-title">Dashboard Title:</Label>
            <Input
              id="dashboard-title"
              placeholder="Enter dashboard title..."
              value={dashboardTitle}
              onChange={(e) => setDashboardTitle(e.target.value)}
              className="max-w-md"
            />
          </div>
        </CardContent>
      </Card>

      {/* Chart Builder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add New Chart
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <Label>Chart Type</Label>
              <Select value={selectedChartType} onValueChange={(value: 'bar' | 'line' | 'pie') => setSelectedChartType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {chartTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <type.icon className="h-4 w-4" />
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>X-Axis (Category)</Label>
              <Select value={selectedDataKey} onValueChange={setSelectedDataKey}>
                <SelectTrigger>
                  <SelectValue placeholder="Select column..." />
                </SelectTrigger>
                <SelectContent>
                  {stringColumns.map(col => (
                    <SelectItem key={col.key} value={col.key}>
                      {col.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Y-Axis (Value)</Label>
              <Select value={selectedValueKey} onValueChange={setSelectedValueKey}>
                <SelectTrigger>
                  <SelectValue placeholder="Select column..." />
                </SelectTrigger>
                <SelectContent>
                  {numberColumns.map(col => (
                    <SelectItem key={col.key} value={col.key}>
                      {col.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Chart Title</Label>
              <Input
                placeholder="Enter chart title..."
                value={chartTitle}
                onChange={(e) => setChartTitle(e.target.value)}
              />
            </div>

            <div className="flex items-end">
              <Button 
                onClick={addWidget}
                disabled={!selectedDataKey || !selectedValueKey || !chartTitle}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Chart
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dashboard Preview */}
      <Card>
        <CardHeader>
          <CardTitle>
            {dashboardTitle || 'Untitled Dashboard'}
          </CardTitle>
          <p className="text-muted-foreground">
            {widgets.length} chart{widgets.length !== 1 ? 's' : ''}
          </p>
        </CardHeader>
        <CardContent>
          {widgets.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {widgets.map((widget) => (
                <Card key={widget.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{widget.title}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => removeWidget(widget.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {renderChart(widget)}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="flex justify-center gap-4 mb-6">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <BarChart3 className="h-8 w-8 text-blue-600" />
                </div>
                <div className="bg-green-100 p-3 rounded-lg">
                  <LineChartIcon className="h-8 w-8 text-green-600" />
                </div>
                <div className="bg-purple-100 p-3 rounded-lg">
                  <PieChartIcon className="h-8 w-8 text-purple-600" />
                </div>
              </div>
              <h3 className="text-lg font-semibold mb-2">Start Building Your Dashboard</h3>
              <p className="text-muted-foreground">
                Add charts above to visualize your data. Choose from bar charts, line charts, and pie charts.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Data Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Data Preview</CardTitle>
          <p className="text-muted-foreground">
            Sample data from {dataSource.name} ({sampleData.length} rows)
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  {sampleColumns.map(col => (
                    <th key={col.key} className="border border-gray-200 px-4 py-2 text-left font-medium">
                      {col.label}
                      <Badge variant="outline" className="ml-2 text-xs">
                        {col.type}
                      </Badge>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sampleData.slice(0, 5).map((row, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    {sampleColumns.map(col => (
                      <td key={col.key} className="border border-gray-200 px-4 py-2">
                        {row[col.key as keyof typeof row]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {sampleData.length > 5 && (
              <p className="text-sm text-muted-foreground mt-2">
                Showing 5 of {sampleData.length} rows
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}