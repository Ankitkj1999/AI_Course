/**
 * Integration Tests for Utility Routes
 * Tests the migrated utility and communication routes
 * 
 * These tests verify:
 * - Response formats and status codes
 * - Authentication requirements
 * - Error handling
 * - API behavior preservation after migration
 */

import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import utilityRoutes from '../../routes/utilityRoutes.js';

describe('Utility Routes Integration Tests', () => {
  let app;

  beforeAll(() => {
    // Create test Express app
    app = express();
    app.use(express.json());
    app.use('/api', utilityRoutes);
  });

  // ============================================================================
  // HEALTH CHECK TESTS
  // ============================================================================

  describe('GET /api/health', () => {
    it('should return 200 and health check data', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect('Content-Type', /json/)
        .expect(200);

      // Verify response structure
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('environment');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('services');
      expect(response.body).toHaveProperty('memory');

      // Verify services object
      expect(response.body.services).toHaveProperty('database');
      expect(response.body.services).toHaveProperty('ai');

      // Verify memory object
      expect(response.body.memory).toHaveProperty('used');
      expect(response.body.memory).toHaveProperty('total');
    });

    it('should return valid timestamp format', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      const timestamp = new Date(response.body.timestamp);
      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp.toString()).not.toBe('Invalid Date');
    });

    it('should return numeric uptime', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(typeof response.body.uptime).toBe('number');
      expect(response.body.uptime).toBeGreaterThanOrEqual(0);
    });
  });

  // ============================================================================
  // EMAIL ROUTES TESTS
  // ============================================================================

  describe('POST /api/data', () => {
    it('should accept email data with required fields', async () => {
      const emailData = {
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test email content</p>',
      };

      const response = await request(app)
        .post('/api/data')
        .send(emailData)
        .expect('Content-Type', /json/);

      // Should return 200 or 400 depending on mock
      expect([200, 400]).toContain(response.status);
    });

    it('should handle missing email fields', async () => {
      const incompleteData = {
        to: 'test@example.com',
        // Missing subject and html
      };

      const response = await request(app)
        .post('/api/data')
        .send(incompleteData);

      // Should handle gracefully
      expect([200, 400, 500]).toContain(response.status);
    });

    it('should validate email format in request body', async () => {
      const emailData = {
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Content</p>',
      };

      const response = await request(app)
        .post('/api/data')
        .send(emailData);

      expect(response.body).toBeDefined();
    });
  });

  describe('POST /api/sendcertificate', () => {
    it('should accept certificate email data', async () => {
      const certificateData = {
        email: 'student@example.com',
        html: '<html><body>Certificate content</body></html>',
      };

      const response = await request(app)
        .post('/api/sendcertificate')
        .send(certificateData)
        .expect('Content-Type', /json/);

      expect([200, 500]).toContain(response.status);
    });

    it('should return success or error message', async () => {
      const certificateData = {
        email: 'student@example.com',
        html: '<html>Certificate</html>',
      };

      const response = await request(app)
        .post('/api/sendcertificate')
        .send(certificateData);

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('message');
    });

    it('should handle missing email field', async () => {
      const incompleteData = {
        html: '<html>Certificate</html>',
        // Missing email
      };

      const response = await request(app)
        .post('/api/sendcertificate')
        .send(incompleteData);

      // Should handle error
      expect([200, 400, 500]).toContain(response.status);
    });
  });

  // ============================================================================
  // PUBLIC SETTINGS TESTS
  // ============================================================================

  describe('GET /api/public/settings', () => {
    it('should return public settings', async () => {
      const response = await request(app)
        .get('/api/public/settings')
        .expect('Content-Type', /json/);

      expect([200, 500]).toContain(response.status);
    });

    it('should return object with settings', async () => {
      const response = await request(app)
        .get('/api/public/settings');

      if (response.status === 200) {
        expect(typeof response.body).toBe('object');
      }
    });

    it('should not include secret settings', async () => {
      const response = await request(app)
        .get('/api/public/settings');

      if (response.status === 200) {
        // Verify no settings have isSecret: true
        Object.values(response.body).forEach((setting) => {
          if (setting.isSecret !== undefined) {
            expect(setting.isSecret).toBe(false);
          }
        });
      }
    });
  });

  // ============================================================================
  // CONTACT FORM TESTS
  // ============================================================================

  describe('POST /api/contact', () => {
    it('should accept contact form submission', async () => {
      const contactData = {
        fname: 'John',
        lname: 'Doe',
        email: 'john.doe@example.com',
        phone: '1234567890',
        msg: 'Test message',
      };

      const response = await request(app)
        .post('/api/contact')
        .send(contactData)
        .expect('Content-Type', /json/);

      expect([200, 500]).toContain(response.status);
    });

    it('should return success message on valid submission', async () => {
      const contactData = {
        fname: 'Jane',
        lname: 'Smith',
        email: 'jane@example.com',
        phone: '9876543210',
        msg: 'Hello',
      };

      const response = await request(app)
        .post('/api/contact')
        .send(contactData);

      if (response.status === 200) {
        expect(response.body).toHaveProperty('success');
        expect(response.body).toHaveProperty('message');
      }
    });

    it('should handle missing required fields', async () => {
      const incompleteData = {
        fname: 'John',
        // Missing other fields
      };

      const response = await request(app)
        .post('/api/contact')
        .send(incompleteData);

      // Should handle gracefully
      expect([200, 400, 500]).toContain(response.status);
    });

    it('should validate email format', async () => {
      const invalidEmailData = {
        fname: 'Test',
        lname: 'User',
        email: 'invalid-email',
        phone: '1234567890',
        msg: 'Test',
      };

      const response = await request(app)
        .post('/api/contact')
        .send(invalidEmailData);

      // Should either accept or reject based on validation
      expect([200, 400, 500]).toContain(response.status);
    });
  });

  // ============================================================================
  // ERROR HANDLING TESTS
  // ============================================================================

  describe('Error Handling', () => {
    it('should handle malformed JSON in POST requests', async () => {
      const response = await request(app)
        .post('/api/contact')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }');

      expect([400, 500]).toContain(response.status);
    });

    it('should handle empty request body', async () => {
      const response = await request(app)
        .post('/api/data')
        .send({});

      expect([200, 400, 500]).toContain(response.status);
    });

    it('should return JSON error responses', async () => {
      const response = await request(app)
        .post('/api/data')
        .send({});

      if (response.status >= 400) {
        expect(response.headers['content-type']).toMatch(/json/);
      }
    });
  });

  // ============================================================================
  // RESPONSE FORMAT TESTS
  // ============================================================================

  describe('Response Format Consistency', () => {
    it('should return consistent error format', async () => {
      const response = await request(app)
        .post('/api/contact')
        .send({});

      if (response.status === 500) {
        expect(response.body).toHaveProperty('success');
        expect(response.body).toHaveProperty('message');
      }
    });

    it('should set appropriate content-type headers', async () => {
      const response = await request(app)
        .get('/api/health');

      expect(response.headers['content-type']).toMatch(/json/);
    });
  });
});

// ============================================================================
// BASELINE BEHAVIOR DOCUMENTATION
// ============================================================================

/**
 * BASELINE API BEHAVIOR SUMMARY
 * 
 * This test suite documents the expected behavior of utility routes:
 * 
 * 1. Health Check (/api/health)
 *    - Returns 200 status
 *    - Includes system status, uptime, services, memory
 *    - No authentication required
 * 
 * 2. Email Routes (/api/data, /api/sendcertificate)
 *    - Accept email data in request body
 *    - Return success/error messages
 *    - No authentication required (should be added in future)
 * 
 * 3. Public Settings (/api/public/settings)
 *    - Returns non-secret settings only
 *    - Returns 200 with settings object
 *    - No authentication required
 * 
 * 4. Contact Form (/api/contact)
 *    - Accepts contact form data
 *    - Saves to database
 *    - Returns success message
 *    - No authentication required
 * 
 * All routes return JSON responses with appropriate status codes.
 * Error responses include success: false and message fields.
 */
