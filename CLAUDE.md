# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

modlo is a dynamic module loader written in TypeScript that uses [fount](https://github.com/deftly/fount) for dependency injection. It discovers modules via glob patterns and npm module names, resolves their dependencies, and registers them with a fount container.

**Version 2.0+** is a pure ESM package requiring Node.js >=18. Source code is in TypeScript (`src/`), compiled output in `dist/`.

## Essential Commands

```bash
# Build TypeScript to JavaScript
npm run build

# Type check without emitting files
npm run type-check

# Lint TypeScript code
npm run lint

# Run all tests (Vitest)
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Create a new release (uses standard-version)
npm run release
```

## Architecture

### Core Flow (src/index.ts)

The main loading process follows this sequence:

1. **Module Discovery** (`getModuleList`) - Uses fast-glob to find files matching patterns
2. **Module Loading** (`getModuleInfo`) - Dynamically imports ESM or requires CommonJS modules, extracts metadata (name, dependencies, whether it's a function)
3. **Multi-pass Registration** (`registerAll`, `registerModules`) - Attempts to register modules with fount, retrying modules whose dependencies aren't yet available
4. **Dependency Resolution** (`tryRegistration`) - For functions, uses fount's dependency injection to resolve arguments and invoke the function

### Module Naming Convention

modlo determines module names using this precedence:
1. Explicit `name` property on the module/result
2. Function name (if module exports a named function)
3. File name (without extension, first part before `.`)

**Namespace resolution with underscores**: Module names containing `_` are treated specially. For example, `pluginOne_config` becomes `pluginOne.config` in fount, creating a namespaced container where `config` is registered under the `pluginOne` namespace.

### Dependency Injection Strategy

When a module exports a function, modlo attempts to resolve its arguments using this order of precedence:
1. Qualified name: `namespace.moduleName.argName` (e.g., `myTest.pluginOne.config`)
2. Namespace-scoped: `namespace.argName` (e.g., `myTest.config`)
3. Plain argument name: `argName` (e.g., `config`)

If all arguments can be resolved, the function is invoked and the result is registered. If not, the function itself is registered as a factory.

### Multi-pass Loading

The loader makes multiple passes over unregistered modules because:
- Modules may depend on each other
- Dependencies must exist in fount before a module can be initialized
- After 2 failed passes (no progress), remaining modules are registered as-is

### Module Loading Strategy

modlo supports loading both ESM and CommonJS modules:
- Attempts dynamic `import()` first for ESM modules
- Falls back to `require()` for CommonJS modules
- Handles both `export default` and named exports from ESM
- Extracts default export when present

## Key Dependencies

- **fount**: Dependency injection container (ESM, TypeScript) - all loaded modules are registered here
- **fast-glob**: Fast and efficient glob pattern matching for file discovery

## TypeScript

### Source Structure
- `src/index.ts` - Main loader implementation
- `src/utility.ts` - Utility functions for fount interaction
- `src/types.ts` - TypeScript type definitions
- `src/lib/module-parser.ts` - Function argument extraction

### Type Declarations
- Fount provides its own TypeScript declarations
- Core interfaces: `ModloConfig`, `ModuleInfo`, `LoadResult`, `ModloLoader`
- Strict TypeScript configuration with ES2022 target

## Testing

Tests use Node.js built-in test runner (`node:test`) with TypeScript via `tsx`. Test files are in `spec/`:
- `spec/index.spec.ts` - Main loader tests
- `spec/utility.spec.ts` - Utility function tests
- `spec/simple.spec.ts` - Simple module loading tests
- `spec/plugins/**/*.ts` - Test fixtures demonstrating plugin loading patterns (TypeScript/ESM)
- `spec/things/*.ts` - Test fixtures for dependency injection scenarios

Run tests with:
```bash
npm test                  # Run all tests once
npm run test:watch       # Run in watch mode
npm run test:coverage    # Run with coverage report (using c8)
```

## Code Style

This project uses TypeScript with ESLint and the TypeScript ESLint plugin. Linting configuration is in `.eslintrc.cjs`.
