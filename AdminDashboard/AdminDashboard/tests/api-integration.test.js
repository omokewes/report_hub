/**
 * API Integration Tests for Admin Dashboard Multi-tenant Report Management System
 * Validates critical server-side behaviors and security controls
 */

const request = require('supertest');
const jwt = require('jsonwebtoken');

// Test configuration
const API_BASE = process.env.API_URL || 'http://localhost:3000';
const JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

// Test fixtures - mock users for different organizations and roles
const testUsers = {
  superadmin: {
    id: 'super-1',
    email: 'super@admin.com',
    name: 'Super Admin',
    role: 'superadmin',
    organizationId: null,
    isActive: true
  },
  orgAAdmin: {
    id: 'admin-a',
    email: 'admin@orga.com', 
    name: 'Org A Admin',
    role: 'admin',
    organizationId: 'org-a',
    isActive: true
  },
  orgAUser: {
    id: 'user-a',
    email: 'user@orga.com',
    name: 'Org A User', 
    role: 'user',
    organizationId: 'org-a',
    isActive: true
  },
  orgBAdmin: {
    id: 'admin-b',
    email: 'admin@orgb.com',
    name: 'Org B Admin',
    role: 'admin', 
    organizationId: 'org-b',
    isActive: true
  },
  orgBUser: {
    id: 'user-b',
    email: 'user@orgb.com',
    name: 'Org B User',
    role: 'user',
    organizationId: 'org-b', 
    isActive: true
  },
  inactiveUser: {
    id: 'inactive-1',
    email: 'inactive@test.com',
    name: 'Inactive User',
    role: 'user',
    organizationId: 'org-a',
    isActive: false
  }
};

// Helper function to generate JWT tokens for testing
function generateToken(user) {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '1h' });
}

describe('Authentication & Authorization Tests', () => {
  
  describe('JWT Authentication', () => {
    test('Valid token allows access to protected routes', async () => {
      const token = generateToken(testUsers.orgAUser);
      const response = await request(API_BASE)
        .get('/api/reports')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });

    test('Invalid token returns 401', async () => {
      await request(API_BASE)
        .get('/api/reports')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    test('Missing token returns 401', async () => {
      await request(API_BASE)
        .get('/api/reports')
        .expect(401);
    });

    test('Expired token returns 401', async () => {
      const expiredToken = jwt.sign(testUsers.orgAUser, JWT_SECRET, { expiresIn: '-1h' });
      await request(API_BASE)
        .get('/api/reports')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);
    });

    test('Inactive user is blocked', async () => {
      const token = generateToken(testUsers.inactiveUser);
      await request(API_BASE)
        .get('/api/reports')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });
  });

  describe('Role-Based Access Control Matrix', () => {
    const testCases = [
      // Route, Method, Superadmin, Admin, User, Expected for each role
      ['/api/organizations', 'GET', 200, 403, 403],
      ['/api/organizations', 'POST', 200, 403, 403],
      ['/api/users', 'GET', 200, 200, 403],
      ['/api/users', 'POST', 200, 200, 403],
      ['/api/invitations', 'POST', 200, 200, 403],
      ['/api/reports', 'GET', 200, 200, 200],
      ['/api/reports', 'POST', 200, 200, 200],
      ['/api/folders', 'GET', 200, 200, 200],
      ['/api/folders', 'POST', 200, 200, 403],
      ['/api/activity', 'GET', 200, 200, 200],
    ];

    testCases.forEach(([route, method, superadminExpected, adminExpected, userExpected]) => {
      test(`${method} ${route} - Role access validation`, async () => {
        // Test superadmin access
        const superToken = generateToken(testUsers.superadmin);
        await request(API_BASE)
          [method.toLowerCase()](route)
          .set('Authorization', `Bearer ${superToken}`)
          .expect(superadminExpected);

        // Test admin access
        const adminToken = generateToken(testUsers.orgAAdmin);
        await request(API_BASE)
          [method.toLowerCase()](route)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(adminExpected);

        // Test user access
        const userToken = generateToken(testUsers.orgAUser);
        await request(API_BASE)
          [method.toLowerCase()](route)
          .set('Authorization', `Bearer ${userToken}`)
          .expect(userExpected);
      });
    });
  });
});

describe('Multi-tenant Data Isolation Tests', () => {
  
  test('Users can only see reports from their organization', async () => {
    const orgAToken = generateToken(testUsers.orgAUser);
    const orgBToken = generateToken(testUsers.orgBUser);

    // Org A user gets their reports
    const orgAReports = await request(API_BASE)
      .get('/api/reports')
      .set('Authorization', `Bearer ${orgAToken}`)
      .expect(200);

    // Org B user gets their reports  
    const orgBReports = await request(API_BASE)
      .get('/api/reports')
      .set('Authorization', `Bearer ${orgBToken}`)
      .expect(200);

    // Verify no data cross-contamination
    const orgAReportIds = orgAReports.body.map(r => r.id);
    const orgBReportIds = orgBReports.body.map(r => r.id);
    
    expect(orgAReportIds.some(id => orgBReportIds.includes(id))).toBe(false);
  });

  test('Attempting to override organizationId in request is ignored', async () => {
    const orgAToken = generateToken(testUsers.orgAUser);
    
    // Try to force access to Org B data by manipulating query params
    const response = await request(API_BASE)
      .get('/api/reports?organizationId=org-b')
      .set('Authorization', `Bearer ${orgAToken}`)
      .expect(200);

    // Should still only get Org A reports despite query param
    expect(response.body.every(report => 
      report.organizationId === 'org-a' || !report.organizationId
    )).toBe(true);
  });

  test('Users list is scoped to organization', async () => {
    const orgAAdminToken = generateToken(testUsers.orgAAdmin);
    const orgBAdminToken = generateToken(testUsers.orgBAdmin);

    const orgAUsers = await request(API_BASE)
      .get('/api/users')
      .set('Authorization', `Bearer ${orgAAdminToken}`)
      .expect(200);

    const orgBUsers = await request(API_BASE)
      .get('/api/users')
      .set('Authorization', `Bearer ${orgBAdminToken}`)
      .expect(200);

    // Verify users don't see cross-tenant users
    const orgAUserIds = orgAUsers.body.map(u => u.id);
    const orgBUserIds = orgBUsers.body.map(u => u.id);
    
    expect(orgAUserIds.some(id => orgBUserIds.includes(id))).toBe(false);
  });

  test('Activity logs are organization-scoped', async () => {
    const orgAToken = generateToken(testUsers.orgAAdmin);
    
    const response = await request(API_BASE)
      .get('/api/activity')
      .set('Authorization', `Bearer ${orgAToken}`)
      .expect(200);

    // All activity should be from the same organization
    expect(response.body.every(activity => 
      !activity.organizationId || activity.organizationId === 'org-a'
    )).toBe(true);
  });
});

describe('File Upload Security Tests', () => {
  
  test('Allowed file types are accepted', async () => {
    const token = generateToken(testUsers.orgAUser);
    const allowedTypes = ['pdf', 'docx', 'xlsx', 'csv', 'pptx'];
    
    for (const type of allowedTypes) {
      await request(API_BASE)
        .post('/api/upload')
        .set('Authorization', `Bearer ${token}`)
        .attach('file', Buffer.from('test content'), `test.${type}`)
        .expect(200);
    }
  });

  test('Disallowed file types are rejected', async () => {
    const token = generateToken(testUsers.orgAUser);
    const disallowedTypes = ['exe', 'js', 'php', 'sh', 'bat'];
    
    for (const type of disallowedTypes) {
      await request(API_BASE)
        .post('/api/upload')
        .set('Authorization', `Bearer ${token}`)
        .attach('file', Buffer.from('malicious content'), `malicious.${type}`)
        .expect(400);
    }
  });

  test('MIME type spoofing is detected', async () => {
    const token = generateToken(testUsers.orgAUser);
    
    // Try uploading executable with PDF extension
    await request(API_BASE)
      .post('/api/upload')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.from('MZ\x90\x00'), 'fake.pdf') // PE header
      .expect(400);
  });

  test('File size limits are enforced', async () => {
    const token = generateToken(testUsers.orgAUser);
    const oversizedContent = Buffer.alloc(11 * 1024 * 1024); // 11MB
    
    await request(API_BASE)
      .post('/api/upload')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', oversizedContent, 'large.pdf')
      .expect(413);
  });

  test('Uploaded files have correct metadata', async () => {
    const token = generateToken(testUsers.orgAUser);
    
    const uploadResponse = await request(API_BASE)
      .post('/api/upload')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.from('test content'), 'test.pdf')
      .expect(200);

    // Create report with uploaded file
    const reportResponse = await request(API_BASE)
      .post('/api/reports')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Test Report',
        filePath: uploadResponse.body.file.url,
        fileType: 'pdf',
        fileSize: uploadResponse.body.file.size
      })
      .expect(200);

    // Verify metadata
    expect(reportResponse.body.organizationId).toBe('org-a');
    expect(reportResponse.body.createdBy).toBe('user-a');
    expect(reportResponse.body.fileType).toBe('pdf');
  });
});

describe('User Invitation Security Tests', () => {
  
  test('Valid invitation creates user correctly', async () => {
    const adminToken = generateToken(testUsers.orgAAdmin);
    
    const response = await request(API_BASE)
      .post('/api/invitations')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        email: 'newuser@orga.com',
        role: 'user',
        organizationId: 'org-a',
        invitedBy: 'admin-a'
      })
      .expect(200);

    expect(response.body.email).toBe('newuser@orga.com');
    expect(response.body.role).toBe('user');
    expect(response.body.organizationId).toBe('org-a');
  });

  test('Duplicate email invitations are rejected', async () => {
    const adminToken = generateToken(testUsers.orgAAdmin);
    
    await request(API_BASE)
      .post('/api/invitations')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        email: 'user@orga.com', // Existing user
        role: 'user',
        organizationId: 'org-a',
        invitedBy: 'admin-a'
      })
      .expect(409); // Conflict
  });

  test('Cross-tenant invitations are blocked', async () => {
    const orgAAdminToken = generateToken(testUsers.orgAAdmin);
    
    // Org A admin tries to invite to Org B
    await request(API_BASE)
      .post('/api/invitations')
      .set('Authorization', `Bearer ${orgAAdminToken}`)
      .send({
        email: 'hacker@orgb.com',
        role: 'admin',
        organizationId: 'org-b', // Different org
        invitedBy: 'admin-a'
      })
      .expect(403);
  });

  test('Role escalation via invitation is prevented', async () => {
    const adminToken = generateToken(testUsers.orgAAdmin);
    
    // Admin tries to create superadmin
    await request(API_BASE)
      .post('/api/invitations')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        email: 'newsuper@orga.com',
        role: 'superadmin',
        organizationId: 'org-a',
        invitedBy: 'admin-a'
      })
      .expect(403);
  });
});

describe('Analytics Data Source Security Tests', () => {
  
  test('Only CSV/XLSX files appear as data sources', async () => {
    const token = generateToken(testUsers.orgAUser);
    
    const response = await request(API_BASE)
      .get('/api/reports?fileType=csv,xlsx')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    // All results should be structured data types
    expect(response.body.every(report => 
      ['csv', 'xlsx'].includes(report.fileType)
    )).toBe(true);
  });

  test('Analytics data sources respect organization boundaries', async () => {
    const orgAToken = generateToken(testUsers.orgAUser);
    const orgBToken = generateToken(testUsers.orgBUser);

    const orgADataSources = await request(API_BASE)
      .get('/api/reports?fileType=csv,xlsx')
      .set('Authorization', `Bearer ${orgAToken}`)
      .expect(200);

    const orgBDataSources = await request(API_BASE)
      .get('/api/reports?fileType=csv,xlsx')
      .set('Authorization', `Bearer ${orgBToken}`)
      .expect(200);

    // Verify no cross-tenant data sources
    const orgAIds = orgADataSources.body.map(ds => ds.id);
    const orgBIds = orgBDataSources.body.map(ds => ds.id);
    
    expect(orgAIds.some(id => orgBIds.includes(id))).toBe(false);
  });
});

describe('Database Security & Integrity Tests', () => {
  
  test('Unique constraints are enforced', async () => {
    const adminToken = generateToken(testUsers.orgAAdmin);
    
    // Try creating user with duplicate email
    await request(API_BASE)
      .post('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        email: 'user@orga.com', // Duplicate
        name: 'Duplicate User',
        role: 'user'
      })
      .expect(409);
  });

  test('API returns structured error responses', async () => {
    const response = await request(API_BASE)
      .post('/api/reports')
      .send({ invalid: 'data' })
      .expect(400);

    expect(response.body).toHaveProperty('error');
    expect(typeof response.body.error).toBe('string');
  });

  test('Foreign key relationships are maintained', async () => {
    const token = generateToken(testUsers.orgAUser);
    
    // Try creating report with invalid organizationId
    await request(API_BASE)
      .post('/api/reports')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Test Report',
        organizationId: 'invalid-org-id',
        createdBy: 'user-a'
      })
      .expect(400);
  });
});

// Export test suite for CI/CD integration
module.exports = {
  testUsers,
  generateToken,
  API_BASE
};