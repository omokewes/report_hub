import { type User, type InsertUser, type Organization, type InsertOrganization, type Report, type InsertReport, type Folder, type InsertFolder, type ReportPermission, type InsertReportPermission, type ActivityLog, type InsertActivityLog, type UserInvitation, type InsertUserInvitation } from "@shared/schema";
import { randomUUID } from "crypto";
// import { db } from "./db";
import * as schema from "@shared/schema";
// import { eq, and } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUsersByOrganization(organizationId: string): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;

  // Organizations
  getOrganization(id: string): Promise<Organization | undefined>;
  getAllOrganizations(): Promise<Organization[]>;
  createOrganization(org: InsertOrganization): Promise<Organization>;
  updateOrganization(id: string, updates: Partial<Organization>): Promise<Organization | undefined>;

  // Folders
  getFoldersByOrganization(organizationId: string): Promise<Folder[]>;
  createFolder(folder: InsertFolder): Promise<Folder>;

  // Reports
  getReport(id: string): Promise<Report | undefined>;
  getReportsByOrganization(organizationId: string): Promise<Report[]>;
  getReportsByUser(userId: string): Promise<Report[]>;
  getStarredReports(userId: string): Promise<Report[]>;
  createReport(report: InsertReport): Promise<Report>;
  updateReport(id: string, updates: Partial<Report>): Promise<Report | undefined>;

  // Report Permissions
  getReportPermissions(reportId: string): Promise<ReportPermission[]>;
  getUserReportPermission(reportId: string, userId: string): Promise<ReportPermission | undefined>;
  createReportPermission(permission: InsertReportPermission): Promise<ReportPermission>;
  updateReportPermission(id: string, permission: "owner" | "editor" | "commenter" | "viewer"): Promise<ReportPermission | undefined>;

  // Activity Logs
  createActivityLog(log: InsertActivityLog): Promise<ActivityLog>;
  getActivityLogsByOrganization(organizationId: string, limit?: number): Promise<ActivityLog[]>;

  // User Invitations
  createUserInvitation(invitation: InsertUserInvitation): Promise<UserInvitation>;
  getUserInvitationByToken(token: string): Promise<UserInvitation | undefined>;
  updateUserInvitation(id: string, updates: Partial<UserInvitation>): Promise<UserInvitation | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private organizations: Map<string, Organization> = new Map();
  private folders: Map<string, Folder> = new Map();
  private reports: Map<string, Report> = new Map();
  private reportPermissions: Map<string, ReportPermission> = new Map();
  private activityLogs: Map<string, ActivityLog> = new Map();
  private userInvitations: Map<string, UserInvitation> = new Map();

  constructor() {
    this.seedData();
  }

  private seedData() {
    // Create default organization
    const org: Organization = {
      id: "org-1",
      name: "Acme Corporation",
      domain: "acme.com",
      industry: "Technology",
      size: "51-200 employees",
      settings: {},
      createdAt: new Date(),
    };
    this.organizations.set(org.id, org);

    // Create default users
    const superadmin: User = {
      id: "user-superadmin",
      username: "superadmin",
      email: "superadmin@demo.com",
      password: "password",
      name: "Super Admin",
      role: "superadmin",
      organizationId: null,
      isActive: true,
      lastActiveAt: new Date(),
      createdAt: new Date(),
    };

    const admin: User = {
      id: "user-admin",
      username: "admin",
      email: "admin@acme.com",
      password: "password",
      name: "John Doe",
      role: "admin",
      organizationId: org.id,
      isActive: true,
      lastActiveAt: new Date(),
      createdAt: new Date(),
    };

    const user: User = {
      id: "user-1",
      username: "user1",
      email: "user@acme.com",
      password: "password",
      name: "Anna Smith",
      role: "user",
      organizationId: org.id,
      isActive: true,
      lastActiveAt: new Date(),
      createdAt: new Date(),
    };

    this.users.set(superadmin.id, superadmin);
    this.users.set(admin.id, admin);
    this.users.set(user.id, user);

    // Create sample folders
    const financialFolder: Folder = {
      id: "folder-1",
      name: "Financial Reports",
      parentId: null,
      organizationId: org.id,
      createdBy: admin.id,
      createdAt: new Date(),
    };

    const marketingFolder: Folder = {
      id: "folder-2",
      name: "Marketing",
      parentId: null,
      organizationId: org.id,
      createdBy: admin.id,
      createdAt: new Date(),
    };

    this.folders.set(financialFolder.id, financialFolder);
    this.folders.set(marketingFolder.id, marketingFolder);

    // Create sample reports
    const report1: Report = {
      id: "report-1",
      name: "Q4 Financial Report.pdf",
      fileType: "pdf",
      fileSize: 2400000,
      filePath: "/uploads/q4-financial.pdf",
      folderId: financialFolder.id,
      organizationId: org.id,
      createdBy: admin.id,
      isStarred: false,
      viewCount: 25,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    };

    const report2: Report = {
      id: "report-2",
      name: "Marketing Analysis.xlsx",
      fileType: "xlsx",
      fileSize: 1800000,
      filePath: "/uploads/marketing-analysis.xlsx",
      folderId: marketingFolder.id,
      organizationId: org.id,
      createdBy: user.id,
      isStarred: true,
      viewCount: 12,
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
    };

    this.reports.set(report1.id, report1);
    this.reports.set(report2.id, report2);

    // Create sample permissions
    const permission1: ReportPermission = {
      id: "perm-1",
      reportId: report1.id,
      userId: admin.id,
      permission: "owner",
      grantedBy: admin.id,
      createdAt: new Date(),
    };

    const permission2: ReportPermission = {
      id: "perm-2",
      reportId: report1.id,
      userId: user.id,
      permission: "viewer",
      grantedBy: admin.id,
      createdAt: new Date(),
    };

    this.reportPermissions.set(permission1.id, permission1);
    this.reportPermissions.set(permission2.id, permission2);
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async getUsersByOrganization(organizationId: string): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => user.organizationId === organizationId);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      ...insertUser,
      id,
      isActive: true,
      lastActiveAt: new Date(),
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getOrganization(id: string): Promise<Organization | undefined> {
    return this.organizations.get(id);
  }

  async getAllOrganizations(): Promise<Organization[]> {
    return Array.from(this.organizations.values());
  }

  async createOrganization(insertOrg: InsertOrganization): Promise<Organization> {
    const id = randomUUID();
    const org: Organization = {
      ...insertOrg,
      id,
      createdAt: new Date(),
    };
    this.organizations.set(id, org);
    return org;
  }

  async updateOrganization(id: string, updates: Partial<Organization>): Promise<Organization | undefined> {
    const org = this.organizations.get(id);
    if (!org) return undefined;
    
    const updatedOrg = { ...org, ...updates };
    this.organizations.set(id, updatedOrg);
    return updatedOrg;
  }

  async getFoldersByOrganization(organizationId: string): Promise<Folder[]> {
    return Array.from(this.folders.values()).filter(folder => folder.organizationId === organizationId);
  }

  async createFolder(insertFolder: InsertFolder): Promise<Folder> {
    const id = randomUUID();
    const folder: Folder = {
      ...insertFolder,
      id,
      createdAt: new Date(),
    };
    this.folders.set(id, folder);
    return folder;
  }

  async getReport(id: string): Promise<Report | undefined> {
    return this.reports.get(id);
  }

  async getReportsByOrganization(organizationId: string): Promise<Report[]> {
    return Array.from(this.reports.values()).filter(report => report.organizationId === organizationId);
  }

  async getReportsByUser(userId: string): Promise<Report[]> {
    return Array.from(this.reports.values()).filter(report => report.createdBy === userId);
  }

  async getStarredReports(userId: string): Promise<Report[]> {
    const userReports = await this.getReportsByUser(userId);
    return userReports.filter(report => report.isStarred);
  }

  async createReport(insertReport: InsertReport): Promise<Report> {
    const id = randomUUID();
    const report: Report = {
      ...insertReport,
      id,
      isStarred: false,
      viewCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.reports.set(id, report);
    return report;
  }

  async updateReport(id: string, updates: Partial<Report>): Promise<Report | undefined> {
    const report = this.reports.get(id);
    if (!report) return undefined;
    
    const updatedReport = { ...report, ...updates, updatedAt: new Date() };
    this.reports.set(id, updatedReport);
    return updatedReport;
  }

  async getReportPermissions(reportId: string): Promise<ReportPermission[]> {
    return Array.from(this.reportPermissions.values()).filter(perm => perm.reportId === reportId);
  }

  async getUserReportPermission(reportId: string, userId: string): Promise<ReportPermission | undefined> {
    return Array.from(this.reportPermissions.values()).find(perm => 
      perm.reportId === reportId && perm.userId === userId
    );
  }

  async createReportPermission(insertPermission: InsertReportPermission): Promise<ReportPermission> {
    const id = randomUUID();
    const permission: ReportPermission = {
      ...insertPermission,
      id,
      createdAt: new Date(),
    };
    this.reportPermissions.set(id, permission);
    return permission;
  }

  async updateReportPermission(id: string, permission: "owner" | "editor" | "commenter" | "viewer"): Promise<ReportPermission | undefined> {
    const perm = this.reportPermissions.get(id);
    if (!perm) return undefined;
    
    const updatedPerm = { ...perm, permission };
    this.reportPermissions.set(id, updatedPerm);
    return updatedPerm;
  }

  async createActivityLog(insertLog: InsertActivityLog): Promise<ActivityLog> {
    const id = randomUUID();
    const log: ActivityLog = {
      ...insertLog,
      id,
      createdAt: new Date(),
    };
    this.activityLogs.set(id, log);
    return log;
  }

  async getActivityLogsByOrganization(organizationId: string, limit = 50): Promise<ActivityLog[]> {
    const logs = Array.from(this.activityLogs.values())
      .filter(log => log.organizationId === organizationId)
      .sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime())
      .slice(0, limit);
    return logs;
  }

  async createUserInvitation(insertInvitation: InsertUserInvitation): Promise<UserInvitation> {
    const id = randomUUID();
    const token = randomUUID();
    const invitation: UserInvitation = {
      ...insertInvitation,
      id,
      token,
      isAccepted: false,
      createdAt: new Date(),
    };
    this.userInvitations.set(id, invitation);
    return invitation;
  }

  async getUserInvitationByToken(token: string): Promise<UserInvitation | undefined> {
    return Array.from(this.userInvitations.values()).find(inv => inv.token === token);
  }

  async updateUserInvitation(id: string, updates: Partial<UserInvitation>): Promise<UserInvitation | undefined> {
    const invitation = this.userInvitations.get(id);
    if (!invitation) return undefined;
    
    const updatedInvitation = { ...invitation, ...updates };
    this.userInvitations.set(id, updatedInvitation);
    return updatedInvitation;
  }
}

export const storage = new MemStorage();
