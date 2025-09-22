import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { getRoleColor, getInitials } from "@/lib/auth";
import { 
  Home, 
  FileText, 
  BarChart3, 
  Building2, 
  Users, 
  Settings, 
  LogOut,
  ChartBar
} from "lucide-react";
import { Button } from "@/components/ui/button";

const navigationItems = [
  { path: "/dashboard", icon: Home, label: "Dashboard", roles: ["superadmin", "admin", "user"] },
  { path: "/reports", icon: FileText, label: "Reports", roles: ["superadmin", "admin", "user"] },
  { path: "/analytics", icon: BarChart3, label: "Analytics", roles: ["superadmin", "admin", "user"] },
  { path: "/admin/organizations", icon: Building2, label: "Organizations", roles: ["superadmin"] },
  { path: "/admin/users", icon: Users, label: "Manage Users", roles: ["admin"] },
  { path: "/admin/settings", icon: Settings, label: "Settings", roles: ["superadmin", "admin", "user"] },
];

export function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  if (!user) return null;

  const allowedItems = navigationItems.filter(item => 
    item.roles.includes(user.role)
  );

  return (
    <div className="w-64 bg-card border-r border-border flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="bg-primary rounded-lg p-2">
            <ChartBar className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-semibold text-foreground">ReportHub</h1>
            <p className="text-sm text-muted-foreground">
              {user.organizationId ? "Acme Corporation" : "System Admin"}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {allowedItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;
            
            return (
              <li key={item.path}>
                <Link href={item.path}>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start gap-3 h-10",
                      isActive && "bg-accent text-accent-foreground"
                    )}
                    data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Button>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <span className="text-primary-foreground text-sm font-medium">
              {getInitials(user.name)}
            </span>
          </div>
          <div className="flex-1">
            <p className="font-medium text-sm" data-testid="user-name">{user.name}</p>
            <p className="text-xs text-muted-foreground" data-testid="user-email">{user.email}</p>
          </div>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className={cn("px-2 py-1 rounded", getRoleColor(user.role))} data-testid="user-role">
            {user.role}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="h-6 w-6 p-0"
            data-testid="button-logout"
          >
            <LogOut className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}
