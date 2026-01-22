# Contributing to Spare Parts Manager

Thank you for your interest in contributing to Spare Parts Manager! This document provides guidelines and instructions for contributing.

## Code of Conduct

Please be respectful and constructive in all interactions. We welcome contributors of all experience levels.

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in [Issues](https://github.com/7kylor/electron-spare-parts-manager/issues)
2. If not, create a new issue with:
   - A clear, descriptive title
   - Steps to reproduce the bug
   - Expected vs actual behavior
   - Your environment (OS, app version)
   - Screenshots if applicable
   - Relevant log files (Settings > Open Logs Folder)

### Suggesting Features

1. Check existing issues for similar suggestions
2. Create a new issue with the "enhancement" label
3. Describe the feature and its use case
4. Explain why it would benefit users

### Pull Requests

1. Fork the repository
2. Create a feature branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Make your changes following our coding standards
4. Test your changes thoroughly
5. Commit with clear, descriptive messages
6. Push to your fork and create a Pull Request

## Development Setup

### Prerequisites

- [Bun](https://bun.sh/) v1.0+
- [Node.js](https://nodejs.org/) v18+ (for native module rebuilding)
- Git

### Getting Started

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/electron-spare-parts-manager.git
cd electron-spare-parts-manager

# Install dependencies
bun install

# Rebuild native modules
npx electron-rebuild -f -w better-sqlite3

# Start development
bun run dev
```

### Project Structure

```
src/
├── main/           # Electron main process (Node.js)
│   ├── database/   # SQLite + Drizzle ORM
│   └── ipc/        # IPC handlers
├── preload/        # Preload scripts (context bridge)
├── renderer/       # React frontend
│   ├── pages/      # Page components
│   ├── components/ # Reusable components
│   └── stores/     # Zustand stores
└── shared/         # Shared types
```

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Define proper types; avoid `any`
- Use interfaces for object shapes
- Export types from `src/shared/types.ts` for shared types

### React

- Use functional components with hooks
- Keep components focused and small
- Use Zustand for state management
- Follow the existing component patterns

### Styling

- Use Tailwind CSS classes
- Follow the existing design system
- Support both light and dark themes

### Commits

- Write clear, concise commit messages
- Use present tense ("Add feature" not "Added feature")
- Reference issues when applicable (#123)

## Testing

Before submitting a PR:

1. Run type checking:
   ```bash
   bun run typecheck
   ```

2. Test the application manually:
   - Test on your development platform
   - Test both light and dark themes
   - Test with different user roles

3. Build and verify:
   ```bash
   bun run build
   ```

## Building

### Development Build
```bash
bun run dev
```

### Production Build
```bash
# macOS
bun run build:mac

# Windows
bun run build:win

# Linux
bun run build:linux
```

## Need Help?

- Check the [README](README.md) for setup instructions
- Open an issue for questions
- Review existing code for patterns and examples

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
