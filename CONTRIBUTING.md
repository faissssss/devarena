# Contributing to DevArena Platform

Thank you for your interest in contributing to DevArena! This document provides guidelines and instructions for contributing to the project.

## Development Setup

1. Fork the repository
2. Clone your fork: `git clone <your-fork-url>`
3. Install dependencies: `npm run install:all`
4. Copy `.env.example` to `.env` and configure your environment variables
5. Create a feature branch: `git checkout -b feature/your-feature-name`

## Code Style

We use ESLint and Prettier to maintain consistent code style across the project.

### Before Committing

Always run these commands before committing:

```bash
# Format code
npm run format

# Lint code
npm run lint

# Run tests
npm test
```

### Code Style Guidelines

- Use ES6+ features (arrow functions, destructuring, async/await)
- Use meaningful variable and function names
- Write comments for complex logic
- Keep functions small and focused
- Follow the existing code structure

## Commit Messages

Follow the conventional commits specification:

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, missing semicolons, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

Example:
```
feat: add competition filtering by category
fix: resolve JWT token expiration issue
docs: update API endpoint documentation
```

## Testing

- Write unit tests for all new functions and components
- Write integration tests for API endpoints
- Ensure all tests pass before submitting a PR
- Aim for at least 85% code coverage

### Running Tests

```bash
# Run all tests
npm test

# Run frontend tests
npm test --workspace=frontend

# Run backend tests
npm test --workspace=backend

# Run tests in watch mode
npm run test:watch --workspace=backend

# Run end-to-end coverage
npm run test:e2e
```

## Pull Request Process

1. Update the README.md with details of changes if applicable
2. Ensure all tests pass and code is properly formatted
3. Update documentation for any API changes
4. Request review from maintainers
5. Address any feedback from code review
6. Once approved, your PR will be merged

## Project Structure

```
devarena-platform/
├── frontend/
│   ├── src/
│   │   ├── components/    # Reusable React components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API service functions
│   │   ├── utils/         # Utility functions
│   │   └── test/          # Test setup and utilities
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── routes/        # Express route handlers
│   │   ├── services/      # Business logic services
│   │   ├── middleware/    # Express middleware
│   │   ├── parsers/       # API response parsers
│   │   └── utils/         # Utility functions
│   └── package.json
└── package.json           # Root package.json (monorepo)
```

## Questions?

If you have questions or need help, please:
- Open an issue with the `question` label
- Reach out to the maintainers

Manual verification reference:
- [MANUAL_TEST_CHECKLIST.md](/c:/antigravity/dev-arena/MANUAL_TEST_CHECKLIST.md)

Thank you for contributing! 🎉
