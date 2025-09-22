import { apiRequest } from "./queryClient";

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  name: string;
  role: "superadmin" | "admin" | "user";
  organizationId: string | null;
  isActive: boolean;
  lastActiveAt: Date | null;
  createdAt: Date;
}

export async function login(email: string, password: string): Promise<{ user: AuthUser; token: string }> {
  const response = await apiRequest("POST", "/api/auth/login", { email, password });
  const data = await response.json();
  
  // Store the JWT token
  if (data.token) {
    localStorage.setItem("auth-token", data.token);
  }
  
  return { user: data.user, token: data.token };
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map(part => part.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function getRoleColor(role: string): string {
  switch (role) {
    case "superadmin":
      return "bg-red-100 text-red-700";
    case "admin":
      return "bg-purple-100 text-purple-700";
    case "user":
      return "bg-blue-100 text-blue-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}
