# Testing Setup Instructions

## Overview

Integration tests have been created for the utility routes migration. To run these tests, you need to install testing dependencies.

## Installation

Run the following command in the `server` directory:

```bash
npm install --save-dev jest supertest @jest/globals
```

Or if using the root directory:

```bash
cd server && npm install --save-dev jest supertest @jest/globals
```

## Package.json Updates

Add the following to `server/package.json`:

```json
{
  "scripts": {
    "test": "node --experimental-vm-modules node_modules/jest/bin/jest.js",
    "test:watch": "node --experimental-vm-modules node_modules/jest/bin/jest.js --watch",
    "test:coverage": "node --experimental-vm-modules node_modules/jest/bin/jest.js --coverage"
  },
  "devDependencies": {
    "jest": "^29.7.0",
    "supertest": "^6.3.3",
    "@jest/globals": "^29.7.0"
  }
}
```

## Running Tests

After installation, run tests with:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- utility-routes.test.js
```

## Test Files Created

1. **tests/integration/utility-routes.test.js**
   - Integration tests for all utility routes
   - Tests health check, email, settings, and contact endpoints
   - Verifies response formats, status codes, and error handling

2. **tests/setup.test.js**
   - Test utilities and environment setup
   - Mock helpers and response comparison utilities

3. **jest.config.js**
   - Jest configuration for ES modules
   - Test patterns and coverage settings

## What the Tests Cover

### Health Check (`/api/health`)
- ✅ Returns 200 status code
- ✅ Includes all required fields (status, timestamp, uptime, services, memory)
- ✅ Valid timestamp format
- ✅ Numeric uptime value

### Email Routes (`/api/data`, `/api/sendcertificate`)
- ✅ Accepts email data with required fields
- ✅ Returns success/error messages
- ✅ Handles missing fields gracefully
- ✅ Validates request body structure

### Public Settings (`/api/public/settings`)
- ✅ Returns public settings only
- ✅ Excludes secret settings
- ✅ Returns proper JSON format

### Contact Form (`/api/contact`)
- ✅ Accepts contact form submissions
- ✅ Returns success messages
- ✅ Handles missing required fields
- ✅ Validates email format

### Error Handling
- ✅ Handles malformed JSON
- ✅ Handles empty request bodies
- ✅ Returns consistent error formats
- ✅ Sets appropriate content-type headers

## Mocking Strategy

The tests use Jest mocks for:
- Database models (Settings, Contact)
- External services (nodemailer, Google AI)
- Settings cache

This allows tests to run without:
- Database connection
- Email service configuration
- API keys

## Next Steps

1. Install dependencies: `npm install --save-dev jest supertest @jest/globals`
2. Run tests: `npm test`
3. Review test output
4. Add more tests as needed for other route batches

## Notes

- Tests are designed to verify API behavior preservation after migration
- Mocks prevent external dependencies from affecting test results
- Tests document expected API behavior for future reference
- Coverage reports help identify untested code paths
