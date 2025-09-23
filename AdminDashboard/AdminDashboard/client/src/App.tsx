import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout/sidebar";

// Pages
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Reports from "@/pages/reports";
import Analytics from "@/pages/analytics";
import AnalyticsBuilder from "@/pages/analytics/builder";
import Users from "@/pages/admin/users";
import Settings from "@/pages/admin/settings";
import Organizations from "@/pages/superadmin/organizations";
import NotFound from "@/pages/not-found";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Login />;
  }
  
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}

function RoleBasedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) {
  const { user, isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Login />;
  }
  
  if (!user || !allowedRoles.includes(user.role)) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <NotFound />
        </main>
      </div>
    );
  }
  
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}

function Router() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <Switch>
      <Route path="/dashboard">
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Route>
      
      <Route path="/reports">
        <RoleBasedRoute allowedRoles={["admin", "user"]}>
          <Reports />
        </RoleBasedRoute>
      </Route>
      
      <Route path="/analytics">
        <RoleBasedRoute allowedRoles={["admin", "user"]}>
          <Analytics />
        </RoleBasedRoute>
      </Route>
      
      <Route path="/analytics/builder">
        <RoleBasedRoute allowedRoles={["admin", "user"]}>
          <AnalyticsBuilder />
        </RoleBasedRoute>
      </Route>
      
      <Route path="/admin/users">
        <RoleBasedRoute allowedRoles={["admin"]}>
          <Users />
        </RoleBasedRoute>
      </Route>
      
      <Route path="/admin/settings">
        <ProtectedRoute>
          <Settings />
        </ProtectedRoute>
      </Route>
      
      <Route path="/superadmin/organizations">
        <RoleBasedRoute allowedRoles={["superadmin"]}>
          <Organizations />
        </RoleBasedRoute>
      </Route>
      
      <Route path="/">
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Route>
      
      <Route>
        <ProtectedRoute>
          <NotFound />
        </ProtectedRoute>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
