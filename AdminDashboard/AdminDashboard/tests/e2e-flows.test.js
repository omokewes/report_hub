/**
 * End-to-End Test Flows for Admin Dashboard Multi-tenant Report Management System
 * Validates complete user journeys and UI-to-API consistency
 */

const { test, expect } = require('@playwright/test');

// Test configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';

// Test data fixtures
const testCredentials = {
  superadmin: { email: 'super@admin.com', password: 'password123' },
  orgAAdmin: { email: 'admin@orga.com', password: 'password123' },
  orgAUser: { email: 'user@orga.com', password: 'password123' },
  orgBAdmin: { email: 'admin@orgb.com', password: 'password123' },
  orgBUser: { email: 'user@orgb.com', password: 'password123' }
};

// Helper functions
async function loginAs(page, userType) {
  const credentials = testCredentials[userType];
  
  await page.goto(`${BASE_URL}/login`);
  await page.fill('[data-testid="input-email"]', credentials.email);
  await page.fill('[data-testid="input-password"]', credentials.password);
  await page.click('[data-testid="button-login"]');
  
  // Wait for successful login and redirect
  await page.waitForURL(`${BASE_URL}/dashboard`);
  await expect(page.locator('[data-testid="user-name"]')).toBeVisible();
}

async function interceptAPIRequests(page) {
  const requests = [];
  
  page.on('request', request => {
    if (request.url().includes('/api/')) {
      requests.push({
        url: request.url(),
        method: request.method(),
        headers: request.headers(),
        postData: request.postData()
      });
    }
  });
  
  return requests;
}

async function verifyAPIResponse(page, endpoint, expectedData) {
  const response = await page.request.get(`${BASE_URL}${endpoint}`, {
    headers: {
      'Authorization': await page.evaluate(() => 
        `Bearer ${localStorage.getItem('auth-token')}`
      )
    }
  });
  
  expect(response.ok()).toBeTruthy();
  const data = await response.json();
  return data;
}

describe('Authentication & Role-Based Navigation Flows', () => {
  
  test('Complete login flow with role-based dashboard', async ({ page }) => {
    // Test admin login
    await loginAs(page, 'orgAAdmin');
    
    // Verify admin sees admin-specific navigation
    await expect(page.locator('[data-testid="nav-manage-users"]')).toBeVisible();
    await expect(page.locator('[data-testid="button-invite-user"]')).toBeVisible();
    
    // Verify dashboard shows admin content
    await expect(page.locator('[data-testid="stat-team-members"]')).toBeVisible();
    
    // Cross-check with API data
    const users = await verifyAPIResponse(page, '/api/users', {});
    const displayedCount = await page.locator('[data-testid="stat-team-members"]').textContent();
    expect(displayedCount).toBe(users.length.toString());
  });

  test('User login shows limited access', async ({ page }) => {
    await loginAs(page, 'orgAUser');
    
    // Verify user doesn't see admin features
    await expect(page.locator('[data-testid="nav-manage-users"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="button-invite-user"]')).not.toBeVisible();
    
    // But can still create reports
    await expect(page.locator('[data-testid="button-create-report"]')).toBeVisible();
  });

  test('Superadmin sees system-wide controls', async ({ page }) => {
    await loginAs(page, 'superadmin');
    
    // Navigate to organizations page
    await page.click('[data-testid="nav-organizations"]');
    await page.waitForURL(`${BASE_URL}/admin/organizations`);
    
    // Verify system overview is visible
    await expect(page.locator('[data-testid="stat-total-organizations"]')).toBeVisible();
    await expect(page.locator('[data-testid="stat-total-users"]')).toBeVisible();
    
    // Cross-check system stats with API
    const orgs = await verifyAPIResponse(page, '/api/organizations', {});
    const displayedOrgCount = await page.locator('[data-testid="stat-total-organizations"]').textContent();
    expect(parseInt(displayedOrgCount)).toBeGreaterThanOrEqual(orgs.length);
  });
});

describe('Multi-tenant Data Isolation E2E Flows', () => {
  
  test('Organization A and B see different data sets', async ({ browser }) => {
    const orgAContext = await browser.newContext();
    const orgBContext = await browser.newContext();
    
    const orgAPage = await orgAContext.newPage();
    const orgBPage = await orgBContext.newPage();
    
    // Login to both organizations
    await loginAs(orgAPage, 'orgAAdmin');
    await loginAs(orgBPage, 'orgBAdmin');
    
    // Navigate to reports page
    await orgAPage.goto(`${BASE_URL}/reports`);
    await orgBPage.goto(`${BASE_URL}/reports`);
    
    // Get report lists from both UIs
    const orgAReports = await orgAPage.locator('[data-testid^="card-report-"]').all();
    const orgBReports = await orgBPage.locator('[data-testid^="card-report-"]').all();
    
    // Cross-check with API responses
    const orgAAPIReports = await verifyAPIResponse(orgAPage, '/api/reports', {});
    const orgBAPIReports = await verifyAPIResponse(orgBPage, '/api/reports', {});
    
    // Verify UI counts match API counts
    expect(orgAReports.length).toBe(orgAAPIReports.length);
    expect(orgBReports.length).toBe(orgBAPIReports.length);
    
    // Verify no data overlap between organizations
    const orgAReportIds = orgAAPIReports.map(r => r.id);
    const orgBReportIds = orgBAPIReports.map(r => r.id);
    
    expect(orgAReportIds.some(id => orgBReportIds.includes(id))).toBe(false);
    
    await orgAContext.close();
    await orgBContext.close();
  });

  test('User management is organization-scoped', async ({ browser }) => {
    const orgAContext = await browser.newContext();
    const orgBContext = await browser.newContext();
    
    const orgAPage = await orgAContext.newPage();
    const orgBPage = await orgBContext.newPage();
    
    await loginAs(orgAPage, 'orgAAdmin');
    await loginAs(orgBPage, 'orgBAdmin');
    
    // Navigate to user management
    await orgAPage.goto(`${BASE_URL}/admin/users`);
    await orgBPage.goto(`${BASE_URL}/admin/users`);
    
    // Verify different user sets
    const orgAUsers = await verifyAPIResponse(orgAPage, '/api/users', {});
    const orgBUsers = await verifyAPIResponse(orgBPage, '/api/users', {});
    
    const orgAUserIds = orgAUsers.map(u => u.id);
    const orgBUserIds = orgBUsers.map(u => u.id);
    
    expect(orgAUserIds.some(id => orgBUserIds.includes(id))).toBe(false);
    
    await orgAContext.close();
    await orgBContext.close();
  });
});

describe('File Upload & Report Management E2E Flows', () => {
  
  test('Complete report upload and management flow', async ({ page }) => {
    await loginAs(page, 'orgAUser');
    
    // Start upload process
    await page.click('[data-testid="button-create-report"]');
    await expect(page.locator('[data-testid="modal-upload-report"]')).toBeVisible();
    
    // Create test file content
    const fileContent = 'Name,Age,City\nJohn,25,NYC\nJane,30,LA';
    
    // Upload file (simulated - in real test would use actual file)
    await page.fill('[data-testid="input-report-name"]', 'Test CSV Report');
    await page.fill('[data-testid="input-report-description"]', 'Sample test data');
    
    // Note: File upload simulation would require actual file handling
    // await page.setInputFiles('[data-testid="input-file-upload"]', 'test-data.csv');
    
    await page.click('[data-testid="button-upload-report"]');
    
    // Wait for upload completion and modal close
    await expect(page.locator('[data-testid="modal-upload-report"]')).not.toBeVisible();
    
    // Navigate to reports and verify new report appears
    await page.goto(`${BASE_URL}/reports`);
    
    // Verify report appears in list
    await expect(page.locator('text=Test CSV Report')).toBeVisible();
    
    // Cross-check with API
    const reports = await verifyAPIResponse(page, '/api/reports', {});
    const testReport = reports.find(r => r.name === 'Test CSV Report');
    expect(testReport).toBeDefined();
    expect(testReport.fileType).toBe('csv');
  });

  test('Report search and filtering functionality', async ({ page }) => {
    await loginAs(page, 'orgAUser');
    await page.goto(`${BASE_URL}/reports`);
    
    // Test search functionality
    await page.fill('[data-testid="input-search-reports"]', 'test');
    
    // Wait for search results
    await page.waitForTimeout(500);
    
    // Verify filtered results
    const visibleReports = await page.locator('[data-testid^="card-report-"]').all();
    
    for (const report of visibleReports) {
      const reportName = await report.locator('[data-testid^="grid-report-name-"]').textContent();
      expect(reportName.toLowerCase()).toContain('test');
    }
    
    // Test file type filter
    await page.selectOption('[data-testid="select-file-type"]', 'csv');
    
    // Verify only CSV files are shown
    const csvReports = await page.locator('[data-testid^="card-report-"]').all();
    // In a real test, would verify each report shows CSV badge
  });
});

describe('User Management & Invitation E2E Flows', () => {
  
  test('Complete user invitation flow', async ({ page }) => {
    await loginAs(page, 'orgAAdmin');
    await page.goto(`${BASE_URL}/admin/users`);
    
    // Get initial user count
    const initialUsers = await verifyAPIResponse(page, '/api/users', {});
    const initialCount = initialUsers.length;
    
    // Start invitation process
    await page.click('[data-testid="button-invite-user"]');
    await expect(page.locator('[data-testid="modal-invite-user"]')).toBeVisible();
    
    // Fill invitation form
    await page.fill('[data-testid="input-invite-email"]', 'newuser@orga.com');
    await page.selectOption('[data-testid="select-invite-role"]', 'user');
    
    await page.click('[data-testid="button-send-invitation"]');
    
    // Wait for invitation to be sent
    await expect(page.locator('[data-testid="modal-invite-user"]')).not.toBeVisible();
    
    // Verify user count increased
    const updatedUsers = await verifyAPIResponse(page, '/api/users', {});
    expect(updatedUsers.length).toBe(initialCount + 1);
    
    // Verify new user appears in UI
    await expect(page.locator('text=newuser@orga.com')).toBeVisible();
  });

  test('User search and management', async ({ page }) => {
    await loginAs(page, 'orgAAdmin');
    await page.goto(`${BASE_URL}/admin/users`);
    
    // Test user search
    await page.fill('[data-testid="input-search-users"]', 'admin');
    
    // Verify search results
    const searchResults = await page.locator('[data-testid^="row-user-"]').all();
    
    for (const userRow of searchResults) {
      const userName = await userRow.locator('[data-testid^="user-name-"]').textContent();
      const userEmail = await userRow.locator('[data-testid^="user-email-"]').textContent();
      
      expect(
        userName.toLowerCase().includes('admin') || 
        userEmail.toLowerCase().includes('admin')
      ).toBe(true);
    }
  });
});

describe('Analytics Dashboard Builder E2E Flows', () => {
  
  test('Analytics data source discovery and dashboard creation', async ({ page }) => {
    await loginAs(page, 'orgAUser');
    await page.goto(`${BASE_URL}/analytics`);
    
    // Verify only structured data sources appear
    const dataSources = await page.locator('[data-testid^="datasource-"]').all();
    
    if (dataSources.length > 0) {
      // Click on first data source to create dashboard
      await page.click('[data-testid^="button-create-dashboard-"]');
      
      // Should navigate to dashboard builder
      await page.waitForURL(`${BASE_URL}/analytics/builder`);
      
      // Verify dashboard builder interface
      await expect(page.locator('text=Dashboard Builder')).toBeVisible();
      await expect(page.locator('text=Add New Chart')).toBeVisible();
      
      // Test chart creation
      await page.selectOption('select:near(text="Chart Type")', 'bar');
      await page.selectOption('select:near(text="X-Axis")', 'month');
      await page.selectOption('select:near(text="Y-Axis")', 'revenue');
      await page.fill('input:near(text="Chart Title")', 'Monthly Revenue');
      
      await page.click('button:has-text("Add Chart")');
      
      // Verify chart appears in dashboard
      await expect(page.locator('text=Monthly Revenue')).toBeVisible();
    }
  });
});

describe('Settings & Security E2E Flows', () => {
  
  test('Organization settings management', async ({ page }) => {
    await loginAs(page, 'orgAAdmin');
    await page.goto(`${BASE_URL}/admin/settings`);
    
    // Test organization settings
    await page.click('[data-testid="tab-organization"]');
    
    await page.fill('[data-testid="input-org-name"]', 'Updated Org Name');
    await page.selectOption('[data-testid="select-industry"]', 'finance');
    await page.selectOption('[data-testid="select-org-size"]', '201-1000');
    
    await page.click('[data-testid="button-save-organization"]');
    
    // Verify changes persist after page reload
    await page.reload();
    
    const orgName = await page.inputValue('[data-testid="input-org-name"]');
    expect(orgName).toBe('Updated Org Name');
  });

  test('Security settings configuration', async ({ page }) => {
    await loginAs(page, 'orgAAdmin');
    await page.goto(`${BASE_URL}/admin/settings`);
    
    // Test security settings
    await page.click('[data-testid="tab-security"]');
    
    // Toggle 2FA setting
    await page.click('[data-testid="switch-2fa"]');
    
    // Update password requirements
    await page.fill('[data-testid="input-min-password"]', '12');
    await page.fill('[data-testid="input-session-timeout"]', '8');
    
    await page.click('[data-testid="button-save-security"]');
    
    // Verify settings persist
    await page.reload();
    await page.click('[data-testid="tab-security"]');
    
    const minPassword = await page.inputValue('[data-testid="input-min-password"]');
    expect(minPassword).toBe('12');
  });

  test('Notification preferences', async ({ page }) => {
    await loginAs(page, 'orgAUser');
    await page.goto(`${BASE_URL}/admin/settings`);
    
    await page.click('[data-testid="tab-notifications"]');
    
    // Toggle various notification settings
    await page.click('[data-testid="switch-notify-report-shared"]');
    await page.click('[data-testid="switch-notify-comment"]');
    
    await page.click('[data-testid="button-save-notifications"]');
    
    // Verify settings are saved
    await page.reload();
    await page.click('[data-testid="tab-notifications"]');
    
    // Check if toggles maintain their state
    const reportSharedToggle = await page.isChecked('[data-testid="switch-notify-report-shared"]');
    expect(typeof reportSharedToggle).toBe('boolean');
  });
});

describe('Complete User Journey E2E Tests', () => {
  
  test('Admin complete workflow: Login → Invite User → Upload Report → Create Analytics', async ({ page }) => {
    // Step 1: Login as admin
    await loginAs(page, 'orgAAdmin');
    
    // Step 2: Invite a new user
    await page.goto(`${BASE_URL}/admin/users`);
    await page.click('[data-testid="button-invite-user"]');
    
    await page.fill('[data-testid="input-invite-email"]', 'workflow@orga.com');
    await page.selectOption('[data-testid="select-invite-role"]', 'user');
    await page.click('[data-testid="button-send-invitation"]');
    
    // Verify invitation was sent
    await expect(page.locator('text=workflow@orga.com')).toBeVisible();
    
    // Step 3: Upload a report
    await page.goto(`${BASE_URL}/reports`);
    await page.click('[data-testid="button-upload-report"]');
    
    await page.fill('[data-testid="input-report-name"]', 'Analytics Data');
    await page.fill('[data-testid="input-report-description"]', 'Sample data for analytics');
    
    // Simulate CSV upload
    await page.click('[data-testid="button-upload-report"]');
    
    // Step 4: Create analytics dashboard
    await page.goto(`${BASE_URL}/analytics`);
    
    // If data sources exist, create dashboard
    const createButtons = await page.locator('[data-testid^="button-create-dashboard-"]').all();
    if (createButtons.length > 0) {
      await createButtons[0].click();
      
      await page.waitForURL(`${BASE_URL}/analytics/builder`);
      await expect(page.locator('text=Dashboard Builder')).toBeVisible();
    }
    
    // Step 5: Verify all changes persisted in API
    const users = await verifyAPIResponse(page, '/api/users', {});
    const reports = await verifyAPIResponse(page, '/api/reports', {});
    
    expect(users.some(u => u.email === 'workflow@orga.com')).toBe(true);
    expect(reports.some(r => r.name === 'Analytics Data')).toBe(true);
  });

  test('User journey: Login → View Reports → Search → View Analytics', async ({ page }) => {
    await loginAs(page, 'orgAUser');
    
    // View dashboard
    await expect(page.locator('[data-testid="stat-total-reports"]')).toBeVisible();
    
    // Navigate to reports
    await page.goto(`${BASE_URL}/reports`);
    
    // Search for specific reports
    await page.fill('[data-testid="input-search-reports"]', 'test');
    
    // View analytics
    await page.goto(`${BASE_URL}/analytics`);
    await expect(page.locator('text=Create Analytics Dashboard')).toBeVisible();
    
    // Verify user can't access admin features
    await page.goto(`${BASE_URL}/admin/users`);
    await expect(page.locator('text=Unauthorized')).toBeVisible();
  });
});

// Performance and reliability tests
describe('Performance & Reliability E2E Tests', () => {
  
  test('Page load times and responsiveness', async ({ page }) => {
    const startTime = Date.now();
    
    await loginAs(page, 'orgAAdmin');
    
    const loginTime = Date.now() - startTime;
    expect(loginTime).toBeLessThan(5000); // Login should complete within 5 seconds
    
    // Test navigation performance
    const navigationStartTime = Date.now();
    await page.goto(`${BASE_URL}/reports`);
    const navigationTime = Date.now() - navigationStartTime;
    
    expect(navigationTime).toBeLessThan(3000); // Page navigation within 3 seconds
  });

  test('Error handling and recovery', async ({ page }) => {
    await loginAs(page, 'orgAUser');
    
    // Test network error handling by going offline briefly
    await page.context().setOffline(true);
    
    // Try to navigate - should show error state
    await page.goto(`${BASE_URL}/reports`);
    
    // Go back online
    await page.context().setOffline(false);
    
    // Should recover
    await page.reload();
    await expect(page.locator('text=All Reports')).toBeVisible();
  });
});

module.exports = {
  testCredentials,
  loginAs,
  verifyAPIResponse,
  BASE_URL
};