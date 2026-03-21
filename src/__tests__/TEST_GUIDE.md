# Jest Test Suite Documentation

## Overview

This document provides a comprehensive guide to the Jest test suite for the Skills Market application. The test suite covers all major user flows including authentication, onboarding, client operations, talent operations, workspaces, and end-to-end integration tests.

## Test Structure

```
src/__tests__/
├── auth/
│   └── authFlow.test.ts           # Authentication tests
├── onboarding/
│   └── onboardingFlow.test.ts      # Onboarding tests
├── client/
│   └── clientOperations.test.ts    # Client workflow tests
├── talent/
│   └── talentOperations.test.ts    # Talent workflow tests
├── workspace/
│   └── workspaceFlow.test.ts       # Workspace lifecycle tests
├── api/
│   └── apiEndpoints.test.ts        # API endpoint tests
├── integration/
│   └── endToEnd.test.ts            # End-to-end integration tests
└── testUtils.ts                    # Shared test utilities
```

## Test Files

### 1. **authFlow.test.ts** (Authentication)
Tests user authentication workflows including:
- **Signup validation**: Email format, password strength, role selection
- **Login**: Credential validation, token generation, session management
- **Password reset**: Email verification, token validation, password update
- **Session management**: Token persistence, expiration handling

**Run:** `npm test -- authFlow.test.ts`

### 2. **onboardingFlow.test.ts** (Onboarding)
Tests the onboarding process for new users:
- **Role selection**: Client vs Talent selection
- **Profile setup**: Display name, bio, profile picture upload
- **Talent onboarding**: Skills selection, hourly rate, portfolio links
- **Client onboarding**: Company info, project categories, verification
- **Progress tracking**: Step/back navigation, progress saving

**Run:** `npm test -- onboardingFlow.test.ts`

### 3. **clientOperations.test.ts** (Client Workflows)
Tests all client-side operations:
- **Gig posting**: Title, description, category, budget, budget type (fixed/hourly)
- **Browse talent**: Search, filter, sort, view profiles and portfolios
- **Workspace management**: Creation, messaging, milestone setup
- **Deliverable review**: Request revisions, approve work
- **Payment**: Release payment, verify completion
- **Reviews**: Post reviews with ratings, track talent ratings

**Run:** `npm test -- clientOperations.test.ts`

### 4. **talentOperations.test.ts** (Talent Workflows)
Tests all talent-side operations:
- **Gig discovery**: Search, filter by category/budget/skills, sort
- **Applications**: Cover letters, bidding, proposal submission
- **Offer negotiation**: Accept/decline, counter offers
- **Workspace collaboration**: Messages, files, milestone tracking
- **Deliverables**: File uploads, revisions, submission notes
- **Payments**: Payment acceptance, wallet management, payouts
- **Reviews**: Receive reviews, reply, post client reviews

**Run:** `npm test -- talentOperations.test.ts`

### 5. **workspaceFlow.test.ts** (Workspace Lifecycle)
Tests workspace management and project workflows:
- **Creation**: Workspace initialization with client and talent
- **Communication**: Messaging, file attachments, message history
- **Milestones**: Creation, tracking, partial payment on completion
- **Hour tracking**: Timer start/stop, hours calculation, time logs
- **Status transitions**: Active → Delivered → Approved → Completed
- **Completion**: Verification, certificate generation, feedback
- **Payouts**: Final settlement, payout request, fulfillment tracking

**Run:** `npm test -- workspaceFlow.test.ts`

### 6. **apiEndpoints.test.ts** (API Testing)
Tests all major API endpoints:
- **Auth API**: Signup, login, logout, password reset
- **User Profile API**: Get, update, avatar upload
- **Gig API**: Create, list, get, update, delete
- **Proposals API**: Submit proposals, fetch details
- **Workspace API**: Create, get, update status
- **Messages API**: Send, fetch messages
- **Reviews API**: Post, fetch reviews
- **Payment API**: Initiate, verify, release payments
- **Disputes API**: Create, fetch, resolve
- **Error handling**: 401, 404, 400, 500 responses

**Run:** `npm test -- apiEndpoints.test.ts`

### 7. **endToEnd.test.ts** (Integration Tests)
Tests complete user journeys:
- **Client flow**: Signup → Onboarding → Post Gig → Hire → Approve → Pay → Review
- **Talent flow**: Signup → Onboarding → Search → Apply → Accept → Complete → Get Paid → Review
- **Multi-milestone projects**: Multiple milestones sequentially completed
- **Dispute resolution**: Raise → Evidence → Resolve
- **Sequential workflows**: Multiple projects by same client/talent
- **Concurrent operations**: Simultaneous messages and file uploads
- **Error recovery**: Retry payment/submission failures

**Run:** `npm test -- endToEnd.test.ts`

## Installation & Setup

### 1. Install Jest and dependencies
```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom @types/jest
npm install --save-dev ts-jest @types/node
```

### 2. Verify configuration files
Ensure these files exist in project root:
- `jest.config.js` - Jest configuration
- `jest.setup.js` - Global mocks and setup
- `src/__tests__/testUtils.ts` - Test utilities

### 3. Add test scripts to package.json
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:auth": "jest authFlow.test.ts",
    "test:onboarding": "jest onboardingFlow.test.ts",
    "test:client": "jest clientOperations.test.ts",
    "test:talent": "jest talentOperations.test.ts",
    "test:workspace": "jest workspaceFlow.test.ts",
    "test:api": "jest apiEndpoints.test.ts",
    "test:e2e": "jest endToEnd.test.ts"
  }
}
```

## Running Tests

### Run all tests
```bash
npm test
```

### Run specific test suite
```bash
npm test -- authFlow.test.ts
npm test -- clientOperations.test.ts
npm test -- talentOperations.test.ts
```

### Run in watch mode
```bash
npm test -- --watch
```

### Generate coverage report
```bash
npm test -- --coverage
```

### Run tests matching pattern
```bash
npm test -- --testNamePattern="Client Flow"
npm test -- --testNamePattern="Talent"
```

## Test Utilities

### Mock Data Factories (testUtils.ts)

**createMockUser()**
```typescript
const user = createMockUser({
  displayName: 'John Developer',
  role: 'talent'
});
```

**createMockWorkspace()**
```typescript
const workspace = createMockWorkspace({
  clientId: 'client-123',
  talentId: 'talent-456'
});
```

**createMockGig()**
```typescript
const gig = createMockGig({
  title: 'Website Design',
  budget: 1000
});
```

**createMockReview()**
```typescript
const review = createMockReview({
  rating: 5,
  comment: 'Amazing work!'
});
```

### Async Helpers

**waitFor()** - Wait for condition with timeout
```typescript
await waitFor(() => {
  expect(element).toBeInTheDocument();
}, 5000);
```

**mockFetch()** - Mock API calls
```typescript
const mockFetch = jest.fn().mockResolvedValue({
  ok: true,
  json: () => ({ success: true })
});
```

## Test Categories

### Unit Tests
- Individual validation functions
- Data transformation functions
- Utility functions

### Integration Tests
- Multi-step workflows
- API + Business logic
- State management

### End-to-End Tests
- Complete user journeys
- Real workflow scenarios
- Error recovery flows

## Mock Data

All tests use mock data factories that generate realistic test data:
- Users with proper profiles
- Gigs with complete details
- Workspaces with both parties
- Reviews with ratings
- Transactions with payment info

## Coverage Goals

```
Statements   : 80%+
Branches     : 75%+
Functions    : 80%+
Lines        : 80%+
```

## Best Practices

### 1. Test organization
- Group related tests with `describe()` blocks
- Use descriptive test names with `it()` or `test()`
- Follow AAA pattern: Arrange, Act, Assert

### 2. Mock management
- Use provided test utilities for mock data
- Keep mocks focused and minimal
- Avoid testing implementation details

### 3. Assertions
- Test behavior, not implementation
- Include multiple assertions per test
- Use meaningful matcher messages

### 4. Performance
- Keep tests fast (< 100ms ideal)
- Avoid unnecessary dependencies
- Mock external services

## Troubleshooting

### Tests not found
```bash
npm test -- --showConfig | grep testMatch
```

### TypeScript errors
```bash
npm test -- --no-coverage
```

### Timeout errors
Increase timeout for specific tests:
```typescript
it('slow test', async () => {
  // test code
}, 10000); // 10 second timeout
```

### Mock issues
Clear mocks between tests:
```typescript
afterEach(() => {
  jest.clearAllMocks();
});
```

## Continuous Integration

### GitHub Actions example
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm test -- --coverage
      - uses: codecov/codecov-action@v2
```

## Future Enhancements

- [ ] Add React component snapshot tests
- [ ] Add visual regression tests
- [ ] Add performance benchmarks
- [ ] Add accessibility tests
- [ ] Add security tests
- [ ] Add GraphQL query tests
- [ ] Add WebSocket/real-time tests

## References

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Firebase Testing Guide](https://firebase.google.com/docs/emulator-suite/connect_emulator)
- [Next.js Testing](https://nextjs.org/docs/testing)

## Support

For issues or questions about the test suite, please:
1. Check the test output for specific error messages
2. Review the jest.config.js for configuration
3. Verify mock data in testUtils.ts
4. Check the specific test file for implementation details
