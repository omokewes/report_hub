var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import express2 from "express";
import helmet from "helmet";
import compression from "compression";
import cors from "cors";

// server/routes.ts
import { createServer } from "http";

// server/storage.ts
import { randomUUID } from "crypto";

// server/db.ts
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  activityLogs: () => activityLogs,
  fileTypeEnum: () => fileTypeEnum,
  folders: () => folders,
  foldersRelations: () => foldersRelations,
  insertActivityLogSchema: () => insertActivityLogSchema,
  insertFolderSchema: () => insertFolderSchema,
  insertOrganizationSchema: () => insertOrganizationSchema,
  insertReportPermissionSchema: () => insertReportPermissionSchema,
  insertReportSchema: () => insertReportSchema,
  insertUserInvitationSchema: () => insertUserInvitationSchema,
  insertUserSchema: () => insertUserSchema,
  organizations: () => organizations,
  permissionEnum: () => permissionEnum,
  reportPermissions: () => reportPermissions,
  reports: () => reports,
  roleEnum: () => roleEnum,
  userInvitations: () => userInvitations,
  users: () => users
});
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, integer, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var roleEnum = pgEnum("role", ["superadmin", "admin", "user"]);
var permissionEnum = pgEnum("permission", ["owner", "editor", "commenter", "viewer"]);
var fileTypeEnum = pgEnum("file_type", ["pdf", "docx", "xlsx", "csv", "pptx"]);
var organizations = pgTable("organizations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  domain: text("domain"),
  industry: text("industry"),
  size: text("size"),
  settings: jsonb("settings").default({}),
  createdAt: timestamp("created_at").defaultNow()
});
var users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: roleEnum("role").notNull().default("user"),
  organizationId: varchar("organization_id").references(() => organizations.id),
  isActive: boolean("is_active").default(true),
  lastActiveAt: timestamp("last_active_at"),
  createdAt: timestamp("created_at").defaultNow()
});
var folders = pgTable("folders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  parentId: varchar("parent_id"),
  organizationId: varchar("organization_id").references(() => organizations.id).notNull(),
  createdBy: varchar("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow()
});
var foldersRelations = {
  parent: folders.parentId
};
var reports = pgTable("reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  fileType: fileTypeEnum("file_type").notNull(),
  fileSize: integer("file_size"),
  filePath: text("file_path"),
  folderId: varchar("folder_id").references(() => folders.id),
  organizationId: varchar("organization_id").references(() => organizations.id).notNull(),
  createdBy: varchar("created_by").references(() => users.id).notNull(),
  isStarred: boolean("is_starred").default(false),
  viewCount: integer("view_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var reportPermissions = pgTable("report_permissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reportId: varchar("report_id").references(() => reports.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  permission: permissionEnum("permission").notNull(),
  grantedBy: varchar("granted_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow()
});
var activityLogs = pgTable("activity_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  organizationId: varchar("organization_id").references(() => organizations.id).notNull(),
  action: text("action").notNull(),
  resource: text("resource"),
  resourceId: varchar("resource_id"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow()
});
var userInvitations = pgTable("user_invitations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull(),
  role: roleEnum("role").notNull().default("user"),
  organizationId: varchar("organization_id").references(() => organizations.id).notNull(),
  invitedBy: varchar("invited_by").references(() => users.id).notNull(),
  token: text("token").notNull().unique(),
  isAccepted: boolean("is_accepted").default(false),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow()
});
var insertOrganizationSchema = createInsertSchema(organizations).omit({
  id: true,
  createdAt: true
});
var insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  lastActiveAt: true
}).extend({
  password: z.string().min(8)
});
var insertFolderSchema = createInsertSchema(folders).omit({
  id: true,
  createdAt: true
});
var insertReportSchema = createInsertSchema(reports).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  viewCount: true
});
var insertReportPermissionSchema = createInsertSchema(reportPermissions).omit({
  id: true,
  createdAt: true
});
var insertActivityLogSchema = createInsertSchema(activityLogs).omit({
  id: true,
  createdAt: true
});
var insertUserInvitationSchema = createInsertSchema(userInvitations).omit({
  id: true,
  createdAt: true,
  token: true
});

// server/db.ts
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}
var sql2 = neon(process.env.DATABASE_URL, {
  fetchOptions: {
    cache: "no-store"
  }
});
var db = drizzle(sql2, { schema: schema_exports });

// server/storage.ts
import { eq, and, desc } from "drizzle-orm";
var PostgreSQLStorage = class {
  // Users
  async getUser(id) {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }
  async getUserByEmail(email) {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result[0];
  }
  async getUsersByOrganization(organizationId) {
    return await db.select().from(users).where(eq(users.organizationId, organizationId));
  }
  async createUser(insertUser) {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }
  async updateUser(id, updates) {
    const result = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return result[0];
  }
  // Organizations
  async getOrganization(id) {
    const result = await db.select().from(organizations).where(eq(organizations.id, id));
    return result[0];
  }
  async getAllOrganizations() {
    return await db.select().from(organizations);
  }
  async createOrganization(insertOrg) {
    const result = await db.insert(organizations).values(insertOrg).returning();
    return result[0];
  }
  async updateOrganization(id, updates) {
    const result = await db.update(organizations).set(updates).where(eq(organizations.id, id)).returning();
    return result[0];
  }
  // Folders
  async getFoldersByOrganization(organizationId) {
    return await db.select().from(folders).where(eq(folders.organizationId, organizationId));
  }
  async createFolder(insertFolder) {
    const result = await db.insert(folders).values(insertFolder).returning();
    return result[0];
  }
  // Reports
  async getReport(id) {
    const result = await db.select().from(reports).where(eq(reports.id, id));
    return result[0];
  }
  async getReportsByOrganization(organizationId) {
    return await db.select().from(reports).where(eq(reports.organizationId, organizationId)).orderBy(desc(reports.createdAt));
  }
  async getReportsByUser(userId) {
    return await db.select().from(reports).where(eq(reports.createdBy, userId)).orderBy(desc(reports.createdAt));
  }
  async getStarredReports(userId) {
    return await db.select().from(reports).where(and(eq(reports.createdBy, userId), eq(reports.isStarred, true))).orderBy(desc(reports.createdAt));
  }
  async getAllReports() {
    return await db.select().from(reports).orderBy(desc(reports.createdAt));
  }
  async createReport(insertReport) {
    const result = await db.insert(reports).values(insertReport).returning();
    return result[0];
  }
  async updateReport(id, updates) {
    const updateData = {
      ...updates,
      updatedAt: /* @__PURE__ */ new Date()
    };
    const result = await db.update(reports).set(updateData).where(eq(reports.id, id)).returning();
    return result[0];
  }
  // Report Permissions
  async getReportPermissions(reportId) {
    return await db.select().from(reportPermissions).where(eq(reportPermissions.reportId, reportId));
  }
  async getUserReportPermission(reportId, userId) {
    const result = await db.select().from(reportPermissions).where(and(eq(reportPermissions.reportId, reportId), eq(reportPermissions.userId, userId)));
    return result[0];
  }
  async createReportPermission(insertPermission) {
    const result = await db.insert(reportPermissions).values(insertPermission).returning();
    return result[0];
  }
  async updateReportPermission(id, permission) {
    const result = await db.update(reportPermissions).set({ permission }).where(eq(reportPermissions.id, id)).returning();
    return result[0];
  }
  // Activity Logs
  async createActivityLog(insertLog) {
    const result = await db.insert(activityLogs).values(insertLog).returning();
    return result[0];
  }
  async getActivityLogsByOrganization(organizationId, limit = 50) {
    return await db.select().from(activityLogs).where(eq(activityLogs.organizationId, organizationId)).orderBy(desc(activityLogs.createdAt)).limit(limit);
  }
  // User Invitations
  async createUserInvitation(insertInvitation) {
    const invitation = {
      ...insertInvitation,
      token: randomUUID(),
      expiresAt: insertInvitation.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1e3)
      // 7 days default
    };
    const result = await db.insert(userInvitations).values(invitation).returning();
    return result[0];
  }
  async getUserInvitationByToken(token) {
    const result = await db.select().from(userInvitations).where(eq(userInvitations.token, token));
    return result[0];
  }
  async getUserInvitationByEmail(email) {
    const result = await db.select().from(userInvitations).where(and(eq(userInvitations.email, email), eq(userInvitations.isAccepted, false)));
    return result[0];
  }
  async updateUserInvitation(id, updates) {
    const result = await db.update(userInvitations).set(updates).where(eq(userInvitations.id, id)).returning();
    return result[0];
  }
};
var storage = new PostgreSQLStorage();
async function initializeDatabase() {
  try {
    const existingOrgs = await storage.getAllOrganizations();
    if (existingOrgs.length === 0) {
      console.log("Seeding database with initial data...");
      const org = await storage.createOrganization({
        name: "Acme Corporation",
        domain: "acme.com",
        industry: "Technology",
        size: "51-200 employees",
        settings: {}
      });
      const superadmin = await storage.createUser({
        username: "superadmin",
        email: "superadmin@demo.com",
        password: "$2b$12$LRnBnMt0ch.sB.3rI0ncJ.j4fYQGe9YMlq.ujiHsQidIYjCgU6/Fq",
        // hashed "password"
        name: "Super Admin",
        role: "superadmin",
        organizationId: null
      });
      const admin = await storage.createUser({
        username: "admin",
        email: "admin@acme.com",
        password: "$2b$12$nTshWglFT3R6kVfH/L3BHO8KEFA06XNKV5qAha1B2YFszJtfCXKQO",
        // hashed "password"
        name: "John Doe",
        role: "admin",
        organizationId: org.id
      });
      const user = await storage.createUser({
        username: "user1",
        email: "user@acme.com",
        password: "$2b$12$IGSbvybiFD.DRbF5F.yiYubeXKkDzM8clshTA1FBWbQRxbsCTJkqe",
        // hashed "password"
        name: "Anna Smith",
        role: "user",
        organizationId: org.id
      });
      const financialFolder = await storage.createFolder({
        name: "Financial Reports",
        parentId: null,
        organizationId: org.id,
        createdBy: admin.id
      });
      const marketingFolder = await storage.createFolder({
        name: "Marketing",
        parentId: null,
        organizationId: org.id,
        createdBy: admin.id
      });
      await storage.createReport({
        name: "Q4 Financial Report.pdf",
        fileType: "pdf",
        fileSize: 24e5,
        filePath: "/uploads/q4-financial.pdf",
        folderId: financialFolder.id,
        organizationId: org.id,
        createdBy: admin.id
      });
      await storage.createReport({
        name: "Marketing Analysis.xlsx",
        fileType: "xlsx",
        fileSize: 18e5,
        filePath: "/uploads/marketing-analysis.xlsx",
        folderId: marketingFolder.id,
        organizationId: org.id,
        createdBy: user.id
      });
      console.log("Database seeded successfully with sample data");
    } else {
      console.log("Database already contains data, skipping seed");
    }
  } catch (error) {
    console.error("Database initialization failed:", error);
    throw error;
  }
}

// server/routes.ts
import { z as z2 } from "zod";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var storage_multer = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "..", "uploads"));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  }
});
var upload = multer({
  storage: storage_multer,
  limits: {
    fileSize: 10 * 1024 * 1024
    // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [".pdf", ".docx", ".xlsx", ".csv", ".pptx"];
    const fileExt = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(fileExt)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only PDF, DOCX, XLSX, CSV, and PPTX files are allowed."));
    }
  }
});
var JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-in-production";
if (process.env.NODE_ENV === "production" && JWT_SECRET === "dev-secret-change-in-production") {
  console.error("SECURITY ERROR: Cannot use default JWT secret in production!");
  console.error("Set JWT_SECRET environment variable to a secure random value");
  process.exit(1);
}
var JWT_EXPIRES_IN = "24h";
var SALT_ROUNDS = 12;
var loginSchema = z2.object({
  email: z2.string().email(),
  password: z2.string()
});
var inviteUserSchema = z2.object({
  email: z2.string().email(),
  role: z2.enum(["admin", "user"]).default("user")
});
var registerSchema = z2.object({
  token: z2.string(),
  password: z2.string().min(8),
  name: z2.string().min(1)
});
var forgotPasswordSchema = z2.object({
  email: z2.string().email()
});
var resetPasswordSchema = z2.object({
  token: z2.string(),
  password: z2.string().min(8)
});
async function registerRoutes(app2) {
  const requireAuth = async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Access token required" });
      }
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, JWT_SECRET);
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
  const optionalAuth = async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await storage.getUser(decoded.userId);
        if (user && user.isActive) {
          req.user = user;
        }
      }
    } catch (error) {
    }
    next();
  };
  const requireRole = (roles) => {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }
      next();
    };
  };
  const requireOrganization = (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }
    if (req.user.role !== "superadmin" && !req.user.organizationId) {
      return res.status(403).json({ message: "No organization access" });
    }
    next();
  };
  app2.get("/api/files/:fileId", requireAuth, async (req, res) => {
    try {
      const { fileId } = req.params;
      const report = await storage.getReport(fileId);
      if (!report) {
        return res.status(404).json({ message: "File not found" });
      }
      if (req.user.role !== "superadmin" && req.user.organizationId !== report.organizationId) {
        return res.status(403).json({ message: "Access denied to this file" });
      }
      const permission = await storage.getUserReportPermission(report.id, req.user.id);
      if (!permission && req.user.role !== "superadmin" && req.user.id !== report.createdBy) {
        return res.status(403).json({ message: "No permission to access this file" });
      }
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
  app2.post("/api/upload", requireAuth, upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      const allowedMimetypes = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "text/csv",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation"
      ];
      if (!allowedMimetypes.includes(req.file.mimetype)) {
        return res.status(400).json({ message: "Invalid file type" });
      }
      const fileInfo = {
        originalName: req.file.originalname,
        filename: req.file.filename,
        url: `/uploads/${req.file.filename}`,
        // Public URL instead of internal path
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
  app2.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ message: "File too large. Maximum size is 10MB." });
      }
      if (error.code === "LIMIT_UNEXPECTED_FILE") {
        return res.status(400).json({ message: "Unexpected file field." });
      }
      return res.status(400).json({ message: "File upload error." });
    }
    next(error);
  });
  app2.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      if (!user.isActive) {
        return res.status(401).json({ message: "Account is inactive" });
      }
      const token = jwt.sign(
        { userId: user.id, organizationId: user.organizationId, role: user.role },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );
      await storage.updateUser(user.id, { lastActiveAt: /* @__PURE__ */ new Date() });
      if (user.organizationId) {
        await storage.createActivityLog({
          userId: user.id,
          organizationId: user.organizationId,
          action: "login",
          resource: "auth",
          metadata: { ip: req.ip, userAgent: req.get("User-Agent") }
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
  app2.post("/api/auth/invite", requireAuth, requireRole(["admin", "superadmin"]), async (req, res) => {
    try {
      const { email, role } = inviteUserSchema.parse(req.body);
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }
      const existingInvitation = await storage.getUserInvitationByEmail?.(email);
      if (existingInvitation && !existingInvitation.isAccepted) {
        return res.status(400).json({ message: "Invitation already sent" });
      }
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
      const invitation = await storage.createUserInvitation({
        email,
        role,
        organizationId: targetOrgId,
        invitedBy: req.user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1e3)
        // 7 days
      });
      await storage.createActivityLog({
        userId: req.user.id,
        organizationId: req.user.organizationId,
        action: "invite_user",
        resource: "user",
        resourceId: invitation.id,
        metadata: { invitedEmail: email, role }
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
  app2.post("/api/auth/register", async (req, res) => {
    try {
      const { token, password, name } = registerSchema.parse(req.body);
      const invitation = await storage.getUserInvitationByToken(token);
      if (!invitation) {
        return res.status(400).json({ message: "Invalid invitation token" });
      }
      if (invitation.isAccepted) {
        return res.status(400).json({ message: "Invitation already accepted" });
      }
      if (invitation.expiresAt < /* @__PURE__ */ new Date()) {
        return res.status(400).json({ message: "Invitation expired" });
      }
      const existingUser = await storage.getUserByEmail(invitation.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }
      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
      const user = await storage.createUser({
        username: invitation.email.split("@")[0],
        // Use email prefix as username
        email: invitation.email,
        password: hashedPassword,
        name,
        role: invitation.role,
        organizationId: invitation.organizationId
      });
      await storage.updateUserInvitation(invitation.id, { isAccepted: true });
      await storage.createActivityLog({
        userId: user.id,
        organizationId: user.organizationId,
        action: "register",
        resource: "user",
        resourceId: user.id,
        metadata: {}
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
  app2.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = forgotPasswordSchema.parse(req.body);
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.json({ message: "If the email exists, a reset link has been sent" });
      }
      const expiresAt = new Date(Date.now() + 60 * 60 * 1e3);
      const resetInvitation = await storage.createUserInvitation({
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
        invitedBy: user.id,
        expiresAt
      });
      console.log(`Password reset token for ${email}: ${resetInvitation.token}`);
      res.json({ message: "If the email exists, a reset link has been sent" });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(400).json({ message: "Invalid request" });
    }
  });
  app2.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, password } = resetPasswordSchema.parse(req.body);
      const resetRequest = await storage.getUserInvitationByToken(token);
      if (!resetRequest) {
        return res.status(400).json({ message: "Invalid reset token" });
      }
      if (resetRequest.expiresAt < /* @__PURE__ */ new Date()) {
        return res.status(400).json({ message: "Reset token expired" });
      }
      const user = await storage.getUserByEmail(resetRequest.email);
      if (!user) {
        return res.status(400).json({ message: "User not found" });
      }
      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
      await storage.updateUser(user.id, { password: hashedPassword });
      await storage.updateUserInvitation(resetRequest.id, { isAccepted: true });
      await storage.createActivityLog({
        userId: user.id,
        organizationId: user.organizationId,
        action: "password_reset",
        resource: "auth",
        metadata: { ip: req.ip }
      });
      res.json({ message: "Password reset successfully" });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(400).json({ message: "Password reset failed" });
    }
  });
  app2.get("/api/organizations", requireAuth, requireRole(["superadmin"]), async (req, res) => {
    try {
      const organizations2 = await storage.getAllOrganizations();
      res.json(organizations2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch organizations" });
    }
  });
  app2.get("/api/organizations/:id", requireAuth, requireRole(["superadmin"]), async (req, res) => {
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
  app2.post("/api/organizations", requireAuth, requireRole(["superadmin"]), async (req, res) => {
    try {
      const { adminEmail, adminName, adminUsername, ...orgData } = req.body;
      const validatedOrgData = insertOrganizationSchema.parse(orgData);
      if (!adminEmail || !adminName || !adminUsername) {
        return res.status(400).json({ message: "Admin email, name, and username are required" });
      }
      const existingUser = await storage.getUserByEmail(adminEmail);
      if (existingUser) {
        return res.status(400).json({ message: "Admin email already exists" });
      }
      const tempPassword = Math.random().toString(36).slice(-8);
      const hashedPassword = await bcrypt.hash(tempPassword, SALT_ROUNDS);
      const organization = await storage.createOrganization(validatedOrgData);
      try {
        const adminUser = await storage.createUser({
          email: adminEmail,
          name: adminName,
          username: adminUsername,
          password: hashedPassword,
          role: "admin",
          organizationId: organization.id
        });
        await storage.logActivity({
          userId: adminUser.id,
          organizationId: organization.id,
          action: "organization_created",
          resource: "organization",
          resourceId: organization.id,
          metadata: { createdBy: req.user.id }
        });
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
        console.error("Failed to create admin user:", userError);
        res.status(500).json({ message: "Organization created but failed to create admin user" });
      }
    } catch (error) {
      console.error("Create organization error:", error);
      res.status(400).json({ message: "Invalid organization or admin data" });
    }
  });
  app2.patch("/api/organizations/:id", requireAuth, requireRole(["superadmin"]), async (req, res) => {
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
  app2.delete("/api/organizations/:id", requireAuth, requireRole(["superadmin"]), async (req, res) => {
    try {
      const organization = await storage.getOrganization(req.params.id);
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }
      const users2 = await storage.getUsersByOrganization(req.params.id);
      if (users2.length > 0) {
        return res.status(400).json({
          message: "Cannot delete organization with existing users. Please remove all users first."
        });
      }
      const updatedOrg = await storage.updateOrganization(req.params.id, {
        name: `${organization.name} (Deleted)`,
        settings: { ...organization.settings, deleted: true, deletedAt: (/* @__PURE__ */ new Date()).toISOString() }
      });
      res.json({ message: "Organization deleted successfully", organization: updatedOrg });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete organization" });
    }
  });
  app2.get("/api/users", requireAuth, requireRole(["admin", "superadmin"]), async (req, res) => {
    try {
      let targetOrgId;
      if (req.user.role === "superadmin") {
        const { organizationId } = req.query;
        if (!organizationId || typeof organizationId !== "string") {
          return res.status(400).json({ message: "organizationId is required for superadmin" });
        }
        targetOrgId = organizationId;
      } else {
        if (!req.user.organizationId) {
          return res.status(403).json({ message: "No organization access" });
        }
        targetOrgId = req.user.organizationId;
      }
      const users2 = await storage.getUsersByOrganization(targetOrgId);
      const usersWithoutPasswords = users2.map(({ password, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });
  app2.post("/api/users", requireAuth, requireRole(["admin", "superadmin"]), async (req, res) => {
    try {
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
      if (req.user.role === "admin" && req.body.role === "superadmin") {
        return res.status(403).json({ message: "Cannot create superadmin users" });
      }
      const data = insertUserSchema.parse({
        ...req.body,
        organizationId: targetOrgId
        // Use server-derived org ID
      });
      const user = await storage.createUser(data);
      if (user.organizationId) {
        await storage.createActivityLog({
          userId: user.id,
          organizationId: user.organizationId,
          action: "user_created",
          resource: "user",
          resourceId: user.id,
          metadata: { name: user.name, role: user.role }
        });
      }
      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      res.status(400).json({ message: "Invalid user data" });
    }
  });
  app2.get("/api/folders", requireAuth, async (req, res) => {
    try {
      let targetOrgId;
      if (req.user.role === "superadmin") {
        const { organizationId } = req.query;
        if (!organizationId || typeof organizationId !== "string") {
          return res.status(400).json({ message: "organizationId is required for superadmin" });
        }
        targetOrgId = organizationId;
      } else {
        if (!req.user.organizationId) {
          return res.status(403).json({ message: "No organization access" });
        }
        targetOrgId = req.user.organizationId;
      }
      const folders2 = await storage.getFoldersByOrganization(targetOrgId);
      res.json(folders2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch folders" });
    }
  });
  app2.post("/api/folders", requireAuth, requireRole(["admin", "superadmin"]), async (req, res) => {
    try {
      const data = insertFolderSchema.parse({
        ...req.body,
        createdBy: req.user.id,
        organizationId: req.user.organizationId
        // Use server-derived org ID
      });
      const folder = await storage.createFolder(data);
      await storage.createActivityLog({
        userId: folder.createdBy,
        organizationId: folder.organizationId,
        action: "folder_created",
        resource: "folder",
        resourceId: folder.id,
        metadata: { name: folder.name }
      });
      res.status(201).json(folder);
    } catch (error) {
      res.status(400).json({ message: "Invalid folder data" });
    }
  });
  app2.get("/api/reports", requireAuth, async (req, res) => {
    try {
      const { starred } = req.query;
      if (starred === "true") {
        const reports2 = await storage.getStarredReports(req.user.id);
        res.json(reports2);
      } else {
        let targetOrgId;
        if (req.user.role === "superadmin") {
          const { organizationId } = req.query;
          if (organizationId && typeof organizationId === "string") {
            targetOrgId = organizationId;
          } else {
            const reports3 = await storage.getAllReports();
            return res.json(reports3);
          }
        } else {
          if (!req.user.organizationId) {
            return res.status(403).json({ message: "No organization access" });
          }
          targetOrgId = req.user.organizationId;
        }
        const reports2 = await storage.getReportsByOrganization(targetOrgId);
        res.json(reports2);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reports" });
    }
  });
  app2.get("/api/reports/:id", requireAuth, async (req, res) => {
    try {
      const report = await storage.getReport(req.params.id);
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }
      if (req.user.role !== "superadmin" && req.user.organizationId !== report.organizationId) {
        return res.status(403).json({ message: "Access denied to this report" });
      }
      const permission = await storage.getUserReportPermission(report.id, req.user.id);
      if (!permission && req.user.role !== "superadmin" && req.user.id !== report.createdBy) {
        return res.status(403).json({ message: "No permission to view this report" });
      }
      await storage.updateReport(report.id, { viewCount: (report.viewCount || 0) + 1 });
      res.json(report);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch report" });
    }
  });
  app2.post("/api/reports", requireAuth, async (req, res) => {
    try {
      const data = insertReportSchema.parse({
        ...req.body,
        createdBy: req.user.id,
        // Use server-derived user ID
        organizationId: req.user.organizationId
        // Use server-derived org ID
      });
      const report = await storage.createReport(data);
      await storage.createReportPermission({
        reportId: report.id,
        userId: report.createdBy,
        permission: "owner",
        grantedBy: report.createdBy
      });
      await storage.createActivityLog({
        userId: report.createdBy,
        organizationId: report.organizationId,
        action: "report_created",
        resource: "report",
        resourceId: report.id,
        metadata: { name: report.name, fileType: report.fileType }
      });
      res.status(201).json(report);
    } catch (error) {
      res.status(400).json({ message: "Invalid report data" });
    }
  });
  app2.patch("/api/reports/:id/star", requireAuth, async (req, res) => {
    try {
      const { starred } = req.body;
      const report = await storage.getReport(req.params.id);
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }
      if (req.user.role !== "superadmin" && req.user.organizationId !== report.organizationId) {
        return res.status(403).json({ message: "Access denied to this report" });
      }
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
  app2.get("/api/reports/:id/permissions", requireAuth, async (req, res) => {
    try {
      const report = await storage.getReport(req.params.id);
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }
      if (req.user.role !== "superadmin" && req.user.organizationId !== report.organizationId) {
        return res.status(403).json({ message: "Access denied to this report" });
      }
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
  app2.post("/api/reports/:id/permissions", requireAuth, requireRole(["admin", "superadmin"]), async (req, res) => {
    try {
      const report = await storage.getReport(req.params.id);
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }
      if (req.user.role !== "superadmin" && req.user.organizationId !== report.organizationId) {
        return res.status(403).json({ message: "Access denied to this report" });
      }
      if (req.user.role !== "superadmin") {
        const targetUser = await storage.getUserById(req.body.userId);
        if (!targetUser || targetUser.organizationId !== req.user.organizationId) {
          return res.status(403).json({ message: "Cannot grant permissions to users outside your organization" });
        }
      }
      const data = insertReportPermissionSchema.parse({
        ...req.body,
        reportId: req.params.id,
        grantedBy: req.user.id
        // Use server-derived user ID
      });
      const permission = await storage.createReportPermission(data);
      await storage.createActivityLog({
        userId: req.user.id,
        organizationId: report.organizationId,
        action: "permission_granted",
        resource: "report",
        resourceId: report.id,
        metadata: { permission: data.permission, userId: data.userId }
      });
      res.status(201).json(permission);
    } catch (error) {
      res.status(400).json({ message: "Invalid permission data" });
    }
  });
  app2.get("/api/activity", requireAuth, requireRole(["admin", "superadmin"]), async (req, res) => {
    try {
      let targetOrgId;
      if (req.user.role === "superadmin") {
        const { organizationId } = req.query;
        if (!organizationId || typeof organizationId !== "string") {
          return res.status(400).json({ message: "organizationId is required for superadmin" });
        }
        targetOrgId = organizationId;
      } else {
        if (!req.user.organizationId) {
          return res.status(403).json({ message: "No organization access" });
        }
        targetOrgId = req.user.organizationId;
      }
      const { limit } = req.query;
      const limitNum = limit ? parseInt(limit) : void 0;
      const logs = await storage.getActivityLogsByOrganization(targetOrgId, limitNum);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch activity logs" });
    }
  });
  app2.post("/api/invitations", requireAuth, requireRole(["admin", "superadmin"]), async (req, res) => {
    try {
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
        organizationId: targetOrgId,
        // Use server-derived org ID
        invitedBy: req.user.id,
        // Use server-derived user ID
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1e3)
        // 7 days
      };
      const invitation = await storage.createUserInvitation(data);
      await storage.createActivityLog({
        userId: req.user.id,
        organizationId: targetOrgId,
        action: "user_invited",
        resource: "invitation",
        resourceId: invitation.id,
        metadata: { email: invitation.email, role: invitation.role }
      });
      res.status(201).json(invitation);
    } catch (error) {
      res.status(400).json({ message: "Invalid invitation data" });
    }
  });
  app2.get("/api/system/metrics", requireAuth, requireRole(["superadmin"]), async (req, res) => {
    try {
      const organizations2 = await storage.getAllOrganizations();
      let totalUsers = 0;
      let totalReports = 0;
      let organizationMetrics = [];
      for (const org of organizations2) {
        const users2 = await storage.getUsersByOrganization(org.id);
        const reports2 = await storage.getReportsByOrganization(org.id);
        totalUsers += users2.length;
        totalReports += reports2.length;
        organizationMetrics.push({
          id: org.id,
          name: org.name,
          userCount: users2.length,
          reportCount: reports2.length,
          adminCount: users2.filter((u) => u.role === "admin").length,
          createdAt: org.createdAt,
          domain: org.domain,
          industry: org.industry,
          size: org.size
        });
      }
      const systemMetrics = {
        totalOrganizations: organizations2.length,
        totalUsers,
        totalReports,
        organizations: organizationMetrics,
        systemHealth: "99.9%",
        activeOrganizations: organizations2.length
      };
      res.json(systemMetrics);
    } catch (error) {
      console.error("System metrics error:", error);
      res.status(500).json({ message: "Failed to fetch system metrics" });
    }
  });
  app2.get("/api/system/activity", requireAuth, requireRole(["superadmin"]), async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit) : 20;
      const organizations2 = await storage.getAllOrganizations();
      let allActivities = [];
      for (const org of organizations2) {
        const orgActivities = await storage.getActivityLogsByOrganization(org.id, limit);
        const enrichedActivities = orgActivities.map((activity) => ({
          ...activity,
          organizationName: org.name
        }));
        allActivities = allActivities.concat(enrichedActivities);
      }
      allActivities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      allActivities = allActivities.slice(0, limit);
      res.json(allActivities);
    } catch (error) {
      console.error("System activity error:", error);
      res.status(500).json({ message: "Failed to fetch system activity" });
    }
  });
  app2.get("/api/analytics/data-sources", requireAuth, async (req, res) => {
    try {
      if (!req.user.organizationId) {
        return res.status(403).json({ message: "No organization access" });
      }
      const reports2 = await storage.getReportsByOrganization(req.user.organizationId);
      const dataSourceReports = reports2.filter((report) => report.fileType === "csv" || report.fileType === "xlsx");
      res.json(dataSourceReports);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch data sources" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path3 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path2 from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      ),
      await import("@replit/vite-plugin-dev-banner").then(
        (m) => m.devBanner()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path2.resolve(import.meta.dirname, "client", "src"),
      "@shared": path2.resolve(import.meta.dirname, "shared"),
      "@assets": path2.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path2.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path2.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    sourcemap: process.env.NODE_ENV !== "production",
    minify: "esbuild",
    cssMinify: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          ui: ["@radix-ui/react-dialog", "@radix-ui/react-dropdown-menu", "@radix-ui/react-select"],
          utils: ["clsx", "tailwind-merge", "date-fns"]
        }
      }
    },
    chunkSizeWarningLimit: 1e3
  },
  server: {
    host: "0.0.0.0",
    port: 5e3,
    allowedHosts: true,
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path3.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path3.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path3.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
if (process.env.NODE_ENV === "production") {
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"]
      }
    },
    crossOriginEmbedderPolicy: false
  }));
  app.use(compression());
  app.use(cors({
    origin: process.env.FRONTEND_URL || true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"]
  }));
} else {
  app.use(cors());
}
app.use(express2.json({ limit: "10mb" }));
app.use(express2.urlencoded({ extended: false, limit: "10mb" }));
app.use((req, res, next) => {
  const start = Date.now();
  const path4 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path4.startsWith("/api")) {
      let logLine = `${req.method} ${path4} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  await initializeDatabase();
  const server = await registerRoutes(app);
  app.use((err, req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    if (process.env.NODE_ENV === "production") {
      console.error(`Error ${status} on ${req.method} ${req.path}:`, err.message);
      const message = status < 500 ? err.message : "Internal Server Error";
      res.status(status).json({ message });
    } else {
      console.error(`Error ${status} on ${req.method} ${req.path}:`, err);
      res.status(status).json({
        message: err.message || "Internal Server Error",
        stack: err.stack
      });
    }
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
