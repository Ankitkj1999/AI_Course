/**
 * Test Setup for Route Migration
 * 
 * This file sets up the testing environment for verifying route migration.
 * It provides utilities for baseline testing and migration verification.
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';

describe('Test Environment Setup', () => {
  it('should have test environment configured', () => {
    expect(process.env.NODE_ENV).toBeDefined();
  });

  it('should be able to import required testing libraries', () => {
    expect(describe).toBeDefined();
    expect(it).toBeDefined();
    expect(expect).toBeDefined();
  });
});

// Export test utilities
export const testUtils = {
  /**
   * Compare two API responses for equality
   */
  compareResponses(baseline, current) {
    return {
      statusMatch: baseline.status === current.status,
      bodyMatch: JSON.stringify(baseline.body) === JSON.stringify(current.body),
      headersMatch: this.compareHeaders(baseline.headers, current.headers)
    };
  },

  /**
   * Compare response headers (ignoring dynamic headers like Date, X-Request-Id)
   */
  compareHeaders(baselineHeaders, currentHeaders) {
    const ignoredHeaders = ['date', 'x-request-id', 'x-response-time'];
    const filteredBaseline = Object.keys(baselineHeaders)
      .filter(key => !ignoredHeaders.includes(key.toLowerCase()))
      .reduce((obj, key) => {
        obj[key] = baselineHeaders[key];
        return obj;
      }, {});
    
    const filteredCurrent = Object.keys(currentHeaders)
      .filter(key => !ignoredHeaders.includes(key.toLowerCase()))
      .reduce((obj, key) => {
        obj[key] = currentHeaders[key];
        return obj;
      }, {});

    return JSON.stringify(filteredBaseline) === JSON.stringify(filteredCurrent);
  },

  /**
   * Create a mock request object
   */
  createMockRequest(options = {}) {
    return {
      body: options.body || {},
      params: options.params || {},
      query: options.query || {},
      headers: options.headers || {},
      user: options.user || null,
      ...options
    };
  },

  /**
   * Create a mock response object
   */
  createMockResponse() {
    const res = {
      statusCode: 200,
      headers: {},
      body: null
    };

    res.status = (code) => {
      res.statusCode = code;
      return res;
    };

    res.json = (data) => {
      res.body = data;
      return res;
    };

    res.send = (data) => {
      res.body = data;
      return res;
    };

    res.setHeader = (key, value) => {
      res.headers[key] = value;
      return res;
    };

    return res;
  }
};
