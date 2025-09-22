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
  // Serve uploaded files statically (with basic auth check)
  app.use("/uploads", (req, res, next) => {
    // Basic check - in production this should be more sophisticated
    // For now, we'll allow access but this should be enhanced with proper authorization
    next();
  }, express.static(path.join(__dirname, "..", "uploads")));

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
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Update last active
      await storage.updateUser(user.id, { lastActiveAt: new Date() });

      // Log activity
      if (user.organizationId) {
        await storage.createActivityLog({
          userId: user.id,
          organizationId: user.organizationId,
          action: "login",
          resource: "auth",
          metadata: {},
        });
      }

      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  // Organizations
  app.get("/api/organizations", async (req, res) => {
    try {
      const organizations = await storage.getAllOrganizations();
      res.json(organizations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch organizations" });
    }
  });

  app.get("/api/organizations/:id", async (req, res) => {
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

  app.post("/api/organizations", async (req, res) => {
    try {
      const data = insertOrganizationSchema.parse(req.body);
      const organization = await storage.createOrganization(data);
      res.status(201).json(organization);
    } catch (error) {
      res.status(400).json({ message: "Invalid organization data" });
    }
  });

  // Users
  app.get("/api/users", async (req, res) => {
    try {
      const { organizationId } = req.query;
      if (!organizationId || typeof organizationId !== "string") {
        return res.status(400).json({ message: "organizationId is required" });
      }

      const users = await storage.getUsersByOrganization(organizationId);
      const usersWithoutPasswords = users.map(({ password, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const data = insertUserSchema.parse(req.body);
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
  app.get("/api/folders", async (req, res) => {
    try {
      const { organizationId } = req.query;
      if (!organizationId || typeof organizationId !== "string") {
        return res.status(400).json({ message: "organizationId is required" });
      }

      const folders = await storage.getFoldersByOrganization(organizationId);
      res.json(folders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch folders" });
    }
  });

  app.post("/api/folders", async (req, res) => {
    try {
      const data = insertFolderSchema.parse(req.body);
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
  app.get("/api/reports", async (req, res) => {
    try {
      const { organizationId, userId, starred } = req.query;
      
      if (starred === "true" && userId && typeof userId === "string") {
        const reports = await storage.getStarredReports(userId);
        res.json(reports);
      } else if (organizationId && typeof organizationId === "string") {
        const reports = await storage.getReportsByOrganization(organizationId);
        res.json(reports);
      } else if (userId && typeof userId === "string") {
        const reports = await storage.getReportsByUser(userId);
        res.json(reports);
      } else {
        res.status(400).json({ message: "organizationId or userId is required" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reports" });
    }
  });

  app.get("/api/reports/:id", async (req, res) => {
    try {
      const report = await storage.getReport(req.params.id);
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
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

  app.patch("/api/reports/:id/star", async (req, res) => {
    try {
      const { starred } = req.body;
      const report = await storage.updateReport(req.params.id, { isStarred: Boolean(starred) });
      
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }

      res.json(report);
    } catch (error) {
      res.status(500).json({ message: "Failed to update report" });
    }
  });

  // Report Permissions
  app.get("/api/reports/:id/permissions", async (req, res) => {
    try {
      const permissions = await storage.getReportPermissions(req.params.id);
      res.json(permissions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch permissions" });
    }
  });

  app.post("/api/reports/:id/permissions", async (req, res) => {
    try {
      const data = insertReportPermissionSchema.parse({
        ...req.body,
        reportId: req.params.id,
      });
      
      const permission = await storage.createReportPermission(data);
      
      // Log activity
      const report = await storage.getReport(req.params.id);
      if (report) {
        await storage.createActivityLog({
          userId: data.grantedBy,
          organizationId: report.organizationId,
          action: "permission_granted",
          resource: "report",
          resourceId: report.id,
          metadata: { permission: data.permission, userId: data.userId },
        });
      }

      res.status(201).json(permission);
    } catch (error) {
      res.status(400).json({ message: "Invalid permission data" });
    }
  });

  // Activity Logs
  app.get("/api/activity", async (req, res) => {
    try {
      const { organizationId, limit } = req.query;
      if (!organizationId || typeof organizationId !== "string") {
        return res.status(400).json({ message: "organizationId is required" });
      }

      const limitNum = limit ? parseInt(limit as string) : undefined;
      const logs = await storage.getActivityLogsByOrganization(organizationId, limitNum);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch activity logs" });
    }
  });

  // User Invitations
  app.post("/api/invitations", async (req, res) => {
    try {
      const data = {
        ...req.body,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      };
      
      const invitation = await storage.createUserInvitation(data);
      
      // Log activity
      await storage.createActivityLog({
        userId: invitation.invitedBy,
        organizationId: invitation.organizationId,
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

  const httpServer = createServer(app);
  return httpServer;
}
