import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertOrganizationSchema, insertReportSchema, insertFolderSchema, insertReportPermissionSchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";

// Extend Request interface to include user property
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for file uploads
const storage_multer = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "..", "uploads"));
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage_multer,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow only specific file types for reports
    const allowedTypes = ['.pdf', '.docx', '.xlsx', '.csv', '.pptx'];
    const fileExt = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(fileExt)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOCX, XLSX, CSV, and PPTX files are allowed.'));
    }
  }
});

// Security configuration
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-in-production";

// Validate JWT secret in production
if (process.env.NODE_ENV === "production" && JWT_SECRET === "dev-secret-change-in-production") {
  console.error("SECURITY ERROR: Cannot use default JWT secret in production!");
  console.error("Set JWT_SECRET environment variable to a secure random value");
  process.exit(1);
}
const JWT_EXPIRES_IN = "24h";
const SALT_ROUNDS = 12;

// Validation schemas
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const inviteUserSchema = z.object({
  email: z.string().email(),
  role: z.enum(["admin", "user"]).default("user"),
});

const registerSchema = z.object({
  token: z.string(),
  password: z.string().min(8),
  name: z.string().min(1),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(8),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // JWT Authentication middleware
  const requireAuth = async (req: any, res: any, next: any) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: "Access token required" });
      }

      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      
      const user = await storage.getUser(decoded.userId);
      if (!user || !user.isActive) {
        return res.status(401).json({ message: "Invalid or inactive user" });
      }

      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({ message: "Invalid access token" });
    }
  };

  // Optional authentication middleware (for routes that work with or without auth)
  const optionalAuth = async (req: any, res: any, next: any) => {
    try {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        const user = await storage.getUser(decoded.userId);
        if (user && user.isActive) {
          req.user = user;
        }
      }
    } catch (error) {
      // Ignore auth errors for optional auth
    }
    next();
  };

  // Role-based access control middleware
  const requireRole = (roles: string[]) => {
    return (req: any, res: any, next: any) => {
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }
      next();
    };
  };

  // Multi-tenant isolation middleware - ensures data access is scoped by organization
  const requireOrganization = (req: any, res: any, next: any) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }
    // Superadmin can access all organizations, others are limited to their own
    if (req.user.role !== "superadmin" && !req.user.organizationId) {
      return res.status(403).json({ message: "No organization access" });
    }
    next();
  };

  // Secure file download endpoint with proper authorization
  app.get("/api/files/:fileId", requireAuth, async (req, res) => {
    try {
      const { fileId } = req.params;
      
      // Find the report that owns this file
      const report = await storage.getReport(fileId);
      if (!report) {
        return res.status(404).json({ message: "File not found" });
      }

      // Check if user has access to this organization's files
      if (req.user.role !== "superadmin" && req.user.organizationId !== report.organizationId) {
        return res.status(403).json({ message: "Access denied to this file" });
      }

      // Check if user has permission to view this specific report
      const permission = await storage.getUserReportPermission(report.id, req.user.id);
      if (!permission && req.user.role !== "superadmin" && req.user.id !== report.createdBy) {
        return res.status(403).json({ message: "No permission to access this file" });
      }

      // Stream the file securely
      if (report.filePath) {
        const filePath = path.join(__dirname, "..", report.filePath);
        res.download(filePath, report.name);
      } else {
        res.status(404).json({ message: "File path not found" });
      }
    } catch (error) {
      console.error("File access error:", error);
      res.status(500).json({ message: "Failed to access file" });
    }
  });

  // File upload route with authentication
  app.post("/api/upload", requireAuth, upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Validate file type and content
      const allowedMimetypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/csv',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      ];

      if (!allowedMimetypes.includes(req.file.mimetype)) {
        return res.status(400).json({ message: "Invalid file type" });
      }

      // Return safe file info with public URL instead of internal path
      const fileInfo = {
        originalName: req.file.originalname,
        filename: req.file.filename,
        url: `/uploads/${req.file.filename}`, // Public URL instead of internal path
        size: req.file.size,
        mimetype: req.file.mimetype,
        fileType: path.extname(req.file.originalname).substring(1).toLowerCase()
      };

      console.log(`[express] File uploaded: ${fileInfo.originalName} (${fileInfo.size} bytes)`);

      res.status(200).json({
        message: "File uploaded successfully",
        file: fileInfo
      });
    } catch (error) {
      console.error("[express] Upload error:", error);
      res.status(500).json({ message: "File upload failed" });
    }
  });

  // Multer error handling middleware
  app.use((error: any, req: any, res: any, next: any) => {
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'File too large. Maximum size is 10MB.' });
      }
      if (error.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({ message: 'Unexpected file field.' });
      }
      return res.status(400).json({ message: 'File upload error.' });
    }
    next(error);
  });

  // Authentication
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Verify password using bcrypt
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      if (!user.isActive) {
        return res.status(401).json({ message: "Account is inactive" });
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, organizationId: user.organizationId, role: user.role },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      // Update last active
      await storage.updateUser(user.id, { lastActiveAt: new Date() });

      // Log activity
      if (user.organizationId) {
        await storage.createActivityLog({
          userId: user.id,
          organizationId: user.organizationId,
          action: "login",
          resource: "auth",
          metadata: { ip: req.ip, userAgent: req.get('User-Agent') },
        });
      }

      const { password: _, ...userWithoutPassword } = user;
      res.json({ 
        user: userWithoutPassword, 
        token,
        expiresIn: JWT_EXPIRES_IN 
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  // User invitation system
  app.post("/api/auth/invite", requireAuth, requireRole(["admin", "superadmin"]), async (req, res) => {
    try {
      const { email, role } = inviteUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Check if there's already a pending invitation
      const existingInvitation = await storage.getUserInvitationByEmail?.(email);
      if (existingInvitation && !existingInvitation.isAccepted) {
        return res.status(400).json({ message: "Invitation already sent" });
      }

      // For superadmin, they can invite to any org (requires org ID in request)
      // For admin, they can only invite to their own organization
      let targetOrgId = req.user.organizationId;
      if (req.user.role === "superadmin") {
        if (!req.body.organizationId) {
          return res.status(400).json({ message: "Organization ID required for superadmin invites" });
        }
        targetOrgId = req.body.organizationId;
      }

      if (!targetOrgId) {
        return res.status(400).json({ message: "No target organization specified" });
      }

      // Create invitation
      const invitation = await storage.createUserInvitation({
        email,
        role: role as "admin" | "user",
        organizationId: targetOrgId,
        invitedBy: req.user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      });

      // Log activity
      await storage.createActivityLog({
        userId: req.user.id,
        organizationId: req.user.organizationId!,
        action: "invite_user",
        resource: "user",
        resourceId: invitation.id,
        metadata: { invitedEmail: email, role },
      });

      res.status(201).json({ 
        message: "Invitation sent successfully",
        invitation: {
          id: invitation.id,
          email: invitation.email,
          role: invitation.role,
          expiresAt: invitation.expiresAt
        }
      });
    } catch (error) {
      console.error("Invitation error:", error);
      res.status(400).json({ message: "Invalid invitation data" });
    }
  });

  // Accept invitation and register
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { token, password, name } = registerSchema.parse(req.body);
      
      // Find invitation by token
      const invitation = await storage.getUserInvitationByToken(token);
      if (!invitation) {
        return res.status(400).json({ message: "Invalid invitation token" });
      }

      if (invitation.isAccepted) {
        return res.status(400).json({ message: "Invitation already accepted" });
      }

      if (invitation.expiresAt < new Date()) {
        return res.status(400).json({ message: "Invitation expired" });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(invitation.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

      // Create user account
      const user = await storage.createUser({
        username: invitation.email.split('@')[0], // Use email prefix as username
        email: invitation.email,
        password: hashedPassword,
        name,
        role: invitation.role,
        organizationId: invitation.organizationId,
      });

      // Mark invitation as accepted
      await storage.updateUserInvitation(invitation.id, { isAccepted: true });

      // Log activity
      await storage.createActivityLog({
        userId: user.id,
        organizationId: user.organizationId!,
        action: "register",
        resource: "user",
        resourceId: user.id,
        metadata: {},
      });

      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json({ 
        user: userWithoutPassword,
        message: "Account created successfully" 
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(400).json({ message: "Registration failed" });
    }
  });

  // Forgot password
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = forgotPasswordSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        // Don't reveal if email exists or not for security
        return res.json({ message: "If the email exists, a reset link has been sent" });
      }

      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Create reset token invitation (the storage will generate the token)
      const resetInvitation = await storage.createUserInvitation({
        email: user.email,
        role: user.role,
        organizationId: user.organizationId!,
        invitedBy: user.id,
        expiresAt,
      });

      // In a real application, send email here
      console.log(`Password reset token for ${email}: ${resetInvitation.token}`);

      res.json({ message: "If the email exists, a reset link has been sent" });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(400).json({ message: "Invalid request" });
    }
  });

  // Reset password
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, password } = resetPasswordSchema.parse(req.body);
      
      // Find reset token
      const resetRequest = await storage.getUserInvitationByToken(token);
      if (!resetRequest) {
        return res.status(400).json({ message: "Invalid reset token" });
      }

      if (resetRequest.expiresAt < new Date()) {
        return res.status(400).json({ message: "Reset token expired" });
      }

      // Find user
      const user = await storage.getUserByEmail(resetRequest.email);
      if (!user) {
        return res.status(400).json({ message: "User not found" });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

      // Update password
      await storage.updateUser(user.id, { password: hashedPassword });

      // Invalidate reset token
      await storage.updateUserInvitation(resetRequest.id, { isAccepted: true });

      // Log activity
      await storage.createActivityLog({
        userId: user.id,
        organizationId: user.organizationId!,
        action: "password_reset",
        resource: "auth",
        metadata: { ip: req.ip },
      });

      res.json({ message: "Password reset successfully" });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(400).json({ message: "Password reset failed" });
    }
  });

  // Organizations
  app.get("/api/organizations", requireAuth, requireRole(["superadmin"]), async (req, res) => {
    try {
      const organizations = await storage.getAllOrganizations();
      res.json(organizations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch organizations" });
    }
  });

  app.get("/api/organizations/:id", requireAuth, requireRole(["superadmin"]), async (req, res) => {
    try {
      const organization = await storage.getOrganization(req.params.id);
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }
      res.json(organization);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch organization" });
    }
  });

  app.post("/api/organizations", requireAuth, requireRole(["superadmin"]), async (req, res) => {
    try {
      const { adminEmail, adminName, adminUsername, ...orgData } = req.body;
      
      // Validate organization data
      const validatedOrgData = insertOrganizationSchema.parse(orgData);
      
      // Validate admin data
      if (!adminEmail || !adminName || !adminUsername) {
        return res.status(400).json({ message: "Admin email, name, and username are required" });
      }
      
      // Check if admin email or username already exists
      const existingUser = await storage.getUserByEmail(adminEmail);
      if (existingUser) {
        return res.status(400).json({ message: "Admin email already exists" });
      }
      
      // Generate temporary password for admin
      const tempPassword = Math.random().toString(36).slice(-8);
      const hashedPassword = await bcrypt.hash(tempPassword, SALT_ROUNDS);
      
      // Create organization first
      const organization = await storage.createOrganization(validatedOrgData);
      
      try {
        // Create admin user for the organization
        const adminUser = await storage.createUser({
          email: adminEmail,
          name: adminName,
          username: adminUsername,
          password: hashedPassword,
          role: "admin",
          organizationId: organization.id
        });
        
        // Log activity
        await storage.logActivity({
          userId: adminUser.id,
          organizationId: organization.id,
          action: "organization_created",
          resource: "organization",
          resourceId: organization.id,
          metadata: { createdBy: req.user.id }
        });
        
        // Return organization and admin details (including temp password)
        const { password: _, ...adminWithoutPassword } = adminUser;
        res.status(201).json({ 
          organization,
          admin: {
            ...adminWithoutPassword,
            tempPassword
          },
          message: "Organization and admin user created successfully"
        });
        
      } catch (userError) {
        // If user creation fails, we should ideally rollback the organization creation
        // For now, we'll just return an error
        console.error("Failed to create admin user:", userError);
        res.status(500).json({ message: "Organization created but failed to create admin user" });
      }
      
    } catch (error) {
      console.error("Create organization error:", error);
      res.status(400).json({ message: "Invalid organization or admin data" });
    }
  });

  app.patch("/api/organizations/:id", requireAuth, requireRole(["superadmin"]), async (req, res) => {
    try {
      const data = insertOrganizationSchema.partial().parse(req.body);
      const organization = await storage.updateOrganization(req.params.id, data);
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }
      res.json(organization);
    } catch (error) {
      res.status(400).json({ message: "Invalid organization data" });
    }
  });

  app.delete("/api/organizations/:id", requireAuth, requireRole(["superadmin"]), async (req, res) => {
    try {
      const organization = await storage.getOrganization(req.params.id);
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }
      
      // Check if organization has users - prevent deletion if it does
      const users = await storage.getUsersByOrganization(req.params.id);
      if (users.length > 0) {
        return res.status(400).json({ 
          message: "Cannot delete organization with existing users. Please remove all users first." 
        });
      }
      
      // Soft delete by updating status instead of hard delete
      const updatedOrg = await storage.updateOrganization(req.params.id, { 
        name: `${organization.name} (Deleted)`,
        settings: { ...organization.settings, deleted: true, deletedAt: new Date().toISOString() }
      });
      
      res.json({ message: "Organization deleted successfully", organization: updatedOrg });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete organization" });
    }
  });

  // Users
  app.get("/api/users", requireAuth, requireRole(["admin", "superadmin"]), async (req: any, res) => {
    try {
      let targetOrgId;
      
      if (req.user.role === "superadmin") {
        // Superadmin can access users from any organization
        const { organizationId } = req.query;
        if (!organizationId || typeof organizationId !== "string") {
          return res.status(400).json({ message: "organizationId is required for superadmin" });
        }
        targetOrgId = organizationId;
      } else {
        // Admin can only access users from their own organization
        if (!req.user.organizationId) {
          return res.status(403).json({ message: "No organization access" });
        }
        targetOrgId = req.user.organizationId;
      }

      const users = await storage.getUsersByOrganization(targetOrgId);
      const usersWithoutPasswords = users.map(({ password, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post("/api/users", requireAuth, requireRole(["admin", "superadmin"]), async (req: any, res) => {
    try {
      // For admins, enforce their organization; for superadmin, allow specifying org
      let targetOrgId = req.user.organizationId;
      if (req.user.role === "superadmin") {
        if (req.body.organizationId) {
          targetOrgId = req.body.organizationId;
        } else if (!targetOrgId) {
          return res.status(400).json({ message: "Organization ID required for superadmin" });
        }
      }

      if (!targetOrgId) {
        return res.status(403).json({ message: "No organization access" });
      }

      // Prevent role escalation - admins cannot create superadmins
      if (req.user.role === "admin" && req.body.role === "superadmin") {
        return res.status(403).json({ message: "Cannot create superadmin users" });
      }

      const data = insertUserSchema.parse({
        ...req.body,
        organizationId: targetOrgId, // Use server-derived org ID
      });
      const user = await storage.createUser(data);
      
      // Log activity
      if (user.organizationId) {
        await storage.createActivityLog({
          userId: user.id,
          organizationId: user.organizationId,
          action: "user_created",
          resource: "user",
          resourceId: user.id,
          metadata: { name: user.name, role: user.role },
        });
      }

      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      res.status(400).json({ message: "Invalid user data" });
    }
  });

  // Folders
  app.get("/api/folders", requireAuth, async (req: any, res) => {
    try {
      let targetOrgId;
      
      if (req.user.role === "superadmin") {
        // Superadmin can access any organization's folders
        const { organizationId } = req.query;
        if (!organizationId || typeof organizationId !== "string") {
          return res.status(400).json({ message: "organizationId is required for superadmin" });
        }
        targetOrgId = organizationId;
      } else {
        // Regular users can only access their own organization's folders
        if (!req.user.organizationId) {
          return res.status(403).json({ message: "No organization access" });
        }
        targetOrgId = req.user.organizationId;
      }

      const folders = await storage.getFoldersByOrganization(targetOrgId);
      res.json(folders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch folders" });
    }
  });

  app.post("/api/folders", requireAuth, requireRole(["admin", "superadmin"]), async (req: any, res) => {
    try {
      const data = insertFolderSchema.parse({
        ...req.body,
        createdBy: req.user.id,
        organizationId: req.user.organizationId, // Use server-derived org ID
      });
      const folder = await storage.createFolder(data);
      
      // Log activity
      await storage.createActivityLog({
        userId: folder.createdBy,
        organizationId: folder.organizationId,
        action: "folder_created",
        resource: "folder",
        resourceId: folder.id,
        metadata: { name: folder.name },
      });

      res.status(201).json(folder);
    } catch (error) {
      res.status(400).json({ message: "Invalid folder data" });
    }
  });

  // Reports
  app.get("/api/reports", requireAuth, async (req: any, res) => {
    try {
      const { starred } = req.query;
      
      if (starred === "true") {
        // Get starred reports for the current user only
        const reports = await storage.getStarredReports(req.user.id);
        res.json(reports);
      } else {
        // Get reports from user's organization (or all if superadmin)
        let targetOrgId;
        
        if (req.user.role === "superadmin") {
          const { organizationId } = req.query;
          if (organizationId && typeof organizationId === "string") {
            targetOrgId = organizationId;
          } else {
            // Superadmin sees all reports if no org specified
            const reports = await storage.getAllReports();
            return res.json(reports);
          }
        } else {
          if (!req.user.organizationId) {
            return res.status(403).json({ message: "No organization access" });
          }
          targetOrgId = req.user.organizationId;
        }
        
        const reports = await storage.getReportsByOrganization(targetOrgId);
        res.json(reports);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reports" });
    }
  });

  app.get("/api/reports/:id", requireAuth, async (req: any, res) => {
    try {
      const report = await storage.getReport(req.params.id);
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }

      // Check organization access
      if (req.user.role !== "superadmin" && req.user.organizationId !== report.organizationId) {
        return res.status(403).json({ message: "Access denied to this report" });
      }

      // Check report permissions
      const permission = await storage.getUserReportPermission(report.id, req.user.id);
      if (!permission && req.user.role !== "superadmin" && req.user.id !== report.createdBy) {
        return res.status(403).json({ message: "No permission to view this report" });
      }

      // Increment view count
      await storage.updateReport(report.id, { viewCount: (report.viewCount || 0) + 1 });

      res.json(report);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch report" });
    }
  });

  app.post("/api/reports", requireAuth, async (req: any, res) => {
    try {
      const data = insertReportSchema.parse({
        ...req.body,
        createdBy: req.user.id, // Use server-derived user ID
        organizationId: req.user.organizationId, // Use server-derived org ID
      });
      const report = await storage.createReport(data);
      
      // Create owner permission
      await storage.createReportPermission({
        reportId: report.id,
        userId: report.createdBy,
        permission: "owner",
        grantedBy: report.createdBy,
      });

      // Log activity
      await storage.createActivityLog({
        userId: report.createdBy,
        organizationId: report.organizationId,
        action: "report_created",
        resource: "report",
        resourceId: report.id,
        metadata: { name: report.name, fileType: report.fileType },
      });

      res.status(201).json(report);
    } catch (error) {
      res.status(400).json({ message: "Invalid report data" });
    }
  });

  app.patch("/api/reports/:id/star", requireAuth, async (req: any, res) => {
    try {
      const { starred } = req.body;
      
      // First get the report to check permissions
      const report = await storage.getReport(req.params.id);
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }

      // Check organization access
      if (req.user.role !== "superadmin" && req.user.organizationId !== report.organizationId) {
        return res.status(403).json({ message: "Access denied to this report" });
      }

      // Check report permissions
      const permission = await storage.getUserReportPermission(report.id, req.user.id);
      if (!permission && req.user.role !== "superadmin" && req.user.id !== report.createdBy) {
        return res.status(403).json({ message: "No permission to star this report" });
      }

      const updatedReport = await storage.updateReport(req.params.id, { isStarred: Boolean(starred) });
      res.json(updatedReport);
    } catch (error) {
      res.status(500).json({ message: "Failed to update report" });
    }
  });

  // Report Permissions
  app.get("/api/reports/:id/permissions", requireAuth, async (req: any, res) => {
    try {
      // First get the report to check ownership and organization
      const report = await storage.getReport(req.params.id);
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }

      // Check organization access
      if (req.user.role !== "superadmin" && req.user.organizationId !== report.organizationId) {
        return res.status(403).json({ message: "Access denied to this report" });
      }

      // Check if user has permission to view permissions (must be owner, admin, or superadmin)
      const userPermission = await storage.getUserReportPermission(report.id, req.user.id);
      const isOwner = req.user.id === report.createdBy;
      const isAdmin = req.user.role === "admin" || req.user.role === "superadmin";
      
      if (!isOwner && !isAdmin && userPermission?.permission !== "owner") {
        return res.status(403).json({ message: "No permission to view report permissions" });
      }

      const permissions = await storage.getReportPermissions(req.params.id);
      res.json(permissions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch permissions" });
    }
  });

  app.post("/api/reports/:id/permissions", requireAuth, requireRole(["admin", "superadmin"]), async (req: any, res) => {
    try {
      // First get the report to check ownership and organization
      const report = await storage.getReport(req.params.id);
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }

      // Check organization access
      if (req.user.role !== "superadmin" && req.user.organizationId !== report.organizationId) {
        return res.status(403).json({ message: "Access denied to this report" });
      }

      // Ensure target user is in the same organization (unless superadmin)
      if (req.user.role !== "superadmin") {
        const targetUser = await storage.getUserById(req.body.userId);
        if (!targetUser || targetUser.organizationId !== req.user.organizationId) {
          return res.status(403).json({ message: "Cannot grant permissions to users outside your organization" });
        }
      }

      const data = insertReportPermissionSchema.parse({
        ...req.body,
        reportId: req.params.id,
        grantedBy: req.user.id, // Use server-derived user ID
      });
      
      const permission = await storage.createReportPermission(data);
      
      // Log activity
      await storage.createActivityLog({
        userId: req.user.id,
        organizationId: report.organizationId,
        action: "permission_granted",
        resource: "report",
        resourceId: report.id,
        metadata: { permission: data.permission, userId: data.userId },
      });

      res.status(201).json(permission);
    } catch (error) {
      res.status(400).json({ message: "Invalid permission data" });
    }
  });

  // Activity Logs
  app.get("/api/activity", requireAuth, requireRole(["admin", "superadmin"]), async (req: any, res) => {
    try {
      let targetOrgId;
      
      if (req.user.role === "superadmin") {
        // Superadmin can access activity from any organization
        const { organizationId } = req.query;
        if (!organizationId || typeof organizationId !== "string") {
          return res.status(400).json({ message: "organizationId is required for superadmin" });
        }
        targetOrgId = organizationId;
      } else {
        // Admin can only access activity from their own organization
        if (!req.user.organizationId) {
          return res.status(403).json({ message: "No organization access" });
        }
        targetOrgId = req.user.organizationId;
      }

      const { limit } = req.query;
      const limitNum = limit ? parseInt(limit as string) : undefined;
      const logs = await storage.getActivityLogsByOrganization(targetOrgId, limitNum);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch activity logs" });
    }
  });

  // User Invitations
  app.post("/api/invitations", requireAuth, requireRole(["admin", "superadmin"]), async (req: any, res) => {
    try {
      // For admins, enforce their organization; for superadmin, allow specifying org
      let targetOrgId = req.user.organizationId;
      if (req.user.role === "superadmin") {
        if (req.body.organizationId) {
          targetOrgId = req.body.organizationId;
        } else if (!targetOrgId) {
          return res.status(400).json({ message: "Organization ID required for superadmin" });
        }
      }

      if (!targetOrgId) {
        return res.status(403).json({ message: "No organization access" });
      }

      const data = {
        ...req.body,
        organizationId: targetOrgId, // Use server-derived org ID
        invitedBy: req.user.id, // Use server-derived user ID
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      };
      
      const invitation = await storage.createUserInvitation(data);
      
      // Log activity
      await storage.createActivityLog({
        userId: req.user.id,
        organizationId: targetOrgId,
        action: "user_invited",
        resource: "invitation",
        resourceId: invitation.id,
        metadata: { email: invitation.email, role: invitation.role },
      });

      res.status(201).json(invitation);
    } catch (error) {
      res.status(400).json({ message: "Invalid invitation data" });
    }
  });

  // System-wide metrics for super admins
  app.get("/api/system/metrics", requireAuth, requireRole(["superadmin"]), async (req, res) => {
    try {
      // Get all organizations with user and report counts
      const organizations = await storage.getAllOrganizations();
      
      let totalUsers = 0;
      let totalReports = 0;
      let organizationMetrics = [];

      for (const org of organizations) {
        const users = await storage.getUsersByOrganization(org.id);
        const reports = await storage.getReportsByOrganization(org.id);
        
        totalUsers += users.length;
        totalReports += reports.length;
        
        organizationMetrics.push({
          id: org.id,
          name: org.name,
          userCount: users.length,
          reportCount: reports.length,
          adminCount: users.filter(u => u.role === 'admin').length,
          createdAt: org.createdAt,
          domain: org.domain,
          industry: org.industry,
          size: org.size
        });
      }

      const systemMetrics = {
        totalOrganizations: organizations.length,
        totalUsers,
        totalReports,
        organizations: organizationMetrics,
        systemHealth: "99.9%",
        activeOrganizations: organizations.length,
      };

      res.json(systemMetrics);
    } catch (error) {
      console.error("System metrics error:", error);
      res.status(500).json({ message: "Failed to fetch system metrics" });
    }
  });

  // System-wide activity for super admins
  app.get("/api/system/activity", requireAuth, requireRole(["superadmin"]), async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      
      // Get activity logs from all organizations
      const organizations = await storage.getAllOrganizations();
      let allActivities: any[] = [];

      for (const org of organizations) {
        const orgActivities = await storage.getActivityLogsByOrganization(org.id, limit);
        // Add organization name to each activity
        const enrichedActivities = orgActivities.map(activity => ({
          ...activity,
          organizationName: org.name
        }));
        allActivities = allActivities.concat(enrichedActivities);
      }

      // Sort by created date and limit
      allActivities.sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
      allActivities = allActivities.slice(0, limit);

      res.json(allActivities);
    } catch (error) {
      console.error("System activity error:", error);
      res.status(500).json({ message: "Failed to fetch system activity" });
    }
  });

  // Analytics data sources
  app.get("/api/analytics/data-sources", requireAuth, async (req: any, res) => {
    try {
      if (!req.user.organizationId) {
        return res.status(403).json({ message: "No organization access" });
      }

      const reports = await storage.getReportsByOrganization(req.user.organizationId);
      const dataSourceReports = reports.filter(report => report.fileType === "csv" || report.fileType === "xlsx");
      res.json(dataSourceReports);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch data sources" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
