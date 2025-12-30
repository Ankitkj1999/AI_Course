# How to Run Tests

## Quick Start

### 1. Install Test Dependencies

From the `server` directory:

```bash
cd server
npm install
```

This will install jest, supertest, and @jest/globals as devDependencies.

### 2. Run Tests

```bash
npm test
```

Or from the root AiCourse directory:

```bash
cd server && npm test
```

## Test Commands

```bash
# Run all tests
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run specific test file
npm test -- utility-routes.test.js
```

## What Gets Tested

The test suite covers all migrated utility routes:
- ✅ Health check endpoint
- ✅ Email sending endpoints
- ✅ Public settings endpoint
- ✅ Contact form endpoint

## Expected Output

When tests run successfully, you should see:

```
PASS  tests/integration/utility-routes.test.js
  Utility Routes Integration Tests
    GET /api/health
      ✓ should return 200 and health check data
      ✓ should return valid timestamp format
      ✓ should return numeric uptime
    POST /api/data
      ✓ should accept email data with required fields
      ...
```

## Troubleshooting

### Issue: "Cannot find module"
**Solution**: Make sure you're in the `server` directory and have run `npm install`

### Issue: "Jest encountered an unexpected token"
**Solution**: This is normal with ES modules. The test script uses `--experimental-vm-modules` flag to handle this.

### Issue: Tests fail due to missing environment variables
**Solution**: Make sure your `.env` file is configured in the server directory

### Issue: Database connection errors
**Solution**: Tests use mocks, so database connection shouldn't be required. If you see this error, check the mock setup in the test files.

## Manual Testing Alternative

If automated tests don't work, you can use manual testing:

1. Start the server:
   ```bash
   npm start
   ```

2. Use the manual checklist in `tests/integration/utility-routes-simple.test.js`

3. Run CURL commands to test each endpoint

4. Verify responses match expected formats

## Test Files

- `tests/integration/utility-routes.test.js` - Automated Jest tests
- `tests/integration/utility-routes-simple.test.js` - Manual testing checklist
- `tests/setup.test.js` - Test utilities
- `jest.config.js` - Jest configuration

## Notes

- Tests use mocks for external dependencies (database, email, AI services)
- Tests verify API behavior preservation after migration
- Tests document expected API responses for future reference
