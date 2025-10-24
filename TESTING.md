# Testing Guide

This document provides comprehensive information about the testing setup and guidelines for the Carbon Intelligence MSME Platform.

## Test Structure

The test suite is organized into several categories:

### 1. Component Tests (`src/components/__tests__/`)
- **Header.test.tsx** - Tests for the main navigation header
- **ErrorBoundary.test.tsx** - Tests for error boundary component
- **LoadingSpinner.test.tsx** - Tests for loading spinner component
- **CarbonFootprint.test.tsx** - Tests for carbon footprint assessment form
- **Dashboard.test.tsx** - Tests for the main dashboard
- **MSMERegistration.test.tsx** - Tests for MSME registration form
- **Recommendations.test.tsx** - Tests for recommendations component
- **CarbonSavings.test.tsx** - Tests for carbon savings dashboard

### 2. Service Tests (`src/services/__tests__/`)
- **api.test.ts** - Tests for the main API service
- **documentService.test.ts** - Tests for document management service

### 3. Integration Tests (`src/__tests__/integration/`)
- **app-flow.test.tsx** - End-to-end application flow tests

### 4. Test Utilities (`src/__tests__/test-utils.tsx`)
- Common test utilities and mock data
- Custom render function with providers
- Mock data for MSME, carbon assessment, and recommendations

## Running Tests

### All Tests
```bash
npm test
```

### Watch Mode
```bash
npm run test:watch
```

### Coverage Report
```bash
npm run test:coverage
```

### CI Mode (no watch)
```bash
npm run test:ci
```

### Specific Test Categories
```bash
# Component tests only
npm run test:components

# Service tests only
npm run test:services

# Integration tests only
npm run test:integration
```

## Test Configuration

### Jest Configuration (`jest.config.js`)
- **Test Environment**: jsdom (for DOM testing)
- **Coverage Threshold**: 70% for branches, functions, lines, and statements
- **Setup Files**: `src/setupTests.ts`
- **Module Mapping**: Supports `@/` imports
- **Transform**: TypeScript files are transformed using ts-jest

### Setup Files
- **`src/setupTests.ts`**: Jest DOM matchers setup
- **`src/__tests__/test-utils.tsx`**: Custom render function and utilities

## Testing Guidelines

### 1. Component Testing
- Test component rendering with different props
- Test user interactions (clicks, form submissions)
- Test conditional rendering based on state
- Test error states and loading states
- Test accessibility features

### 2. Service Testing
- Mock external dependencies (API calls, localStorage)
- Test success and error scenarios
- Test data transformation and validation
- Test edge cases and error handling

### 3. Integration Testing
- Test complete user workflows
- Test navigation between components
- Test data persistence
- Test error handling across components

### 4. Mock Data
Use the provided mock data from `test-utils.tsx`:
- `mockMSMEData` - Complete MSME registration data
- `mockCarbonAssessmentData` - Carbon assessment form data
- `mockRecommendationsData` - Recommendations data
- `mockCarbonSavingsData` - Carbon savings dashboard data

### 5. Best Practices
- Use descriptive test names
- Test one thing per test case
- Use `beforeEach` and `afterEach` for setup/cleanup
- Mock external dependencies
- Test both happy path and error scenarios
- Use `waitFor` for async operations
- Clean up after tests (localStorage, mocks)

## Coverage Goals

The project aims for 70% code coverage across:
- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

## Test Data Management

### Local Storage
- Always clear localStorage in `beforeEach`
- Use `mockLocalStorage()` utility for complex scenarios
- Test data persistence and retrieval

### API Mocking
- Mock fetch/axios calls
- Test different response scenarios
- Test error handling

### Form Testing
- Test validation rules
- Test form submission
- Test field interactions
- Test error messages

## Debugging Tests

### Common Issues
1. **Async operations**: Use `waitFor` or `findBy` queries
2. **Component not found**: Check if component is conditionally rendered
3. **Mock not working**: Ensure mocks are set up before component render
4. **localStorage issues**: Clear localStorage in `beforeEach`

### Debug Commands
```bash
# Run specific test file
npm test Header.test.tsx

# Run tests in debug mode
npm test -- --verbose

# Run tests with coverage for specific file
npm test -- --coverage --testPathPattern=Header.test.tsx
```

## Continuous Integration

Tests are configured to run in CI mode with:
- No watch mode
- Coverage reporting
- Pass with no tests (for empty test suites)
- Coverage thresholds enforced

## Adding New Tests

1. Create test file in appropriate directory
2. Import necessary testing utilities
3. Use `render` from `test-utils.tsx` for consistent setup
4. Follow naming convention: `ComponentName.test.tsx`
5. Add test cases for all major functionality
6. Ensure tests are isolated and don't depend on each other

## Test Maintenance

- Update tests when components change
- Add tests for new features
- Remove tests for deprecated functionality
- Keep mock data up to date
- Review and update coverage thresholds as needed
EOF
