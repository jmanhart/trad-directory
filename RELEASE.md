# Release Management

This project uses semantic versioning (SemVer) for releases, which automatically integrates with Sentry for error tracking and performance monitoring.

## Version Format

Releases follow the format: `MAJOR.MINOR.PATCH`

- **PATCH** (0.1.0 → 0.1.1): Bug fixes and minor improvements
- **MINOR** (0.1.0 → 0.2.0): New features, backward compatible
- **MAJOR** (0.1.0 → 1.0.0): Breaking changes

## Quick Release Commands

### Using the release script (Recommended)

```bash
# Create a patch release (0.1.0 → 0.1.1)
npm run release patch

# Create a minor release (0.1.0 → 0.2.0)
npm run release minor

# Create a major release (0.1.0 → 1.0.0)
npm run release major
```

### Using npm scripts

```bash
# Update version and build
npm run release:patch    # 0.1.0 → 0.1.1
npm run release:minor    # 0.1.0 → 0.2.0
npm run release:major    # 0.1.0 → 1.0.0

# Update version only
npm run version:patch
npm run version:minor
npm run version:major
```

## What Happens During Release

1. **Version Update**: Package.json version is automatically incremented
2. **Build**: Project is built with the new version
3. **Git Commit**: Changes are committed with a descriptive message
4. **Git Tag**: A version tag is created (e.g., `v0.1.1`)
5. **Sentry Integration**: The new version is automatically sent to Sentry

## Sentry Release Tracking

Each release automatically:

- Creates a new release in Sentry
- Associates errors and performance data with the specific version
- Enables better debugging by correlating issues with releases
- Provides release-specific analytics and monitoring

## Manual Release Process

If you prefer to manage releases manually:

1. Update version in `package.json`
2. Build the project: `npm run build`
3. Commit changes: `git add . && git commit -m "chore: release version X.Y.Z"`
4. Create tag: `git tag -a vX.Y.Z -m "Release version X.Y.Z"`
5. Push changes: `git push origin main && git push origin vX.Y.Z`

## Environment Variables

The following environment variables are automatically injected during build:

- `__SENTRY_RELEASE__`: Current package version (e.g., "0.1.0")
- `__APP_VERSION__`: Current package version for general use
- `__SENTRY_ENVIRONMENT__`: Build environment (development/production)

## Best Practices

1. **Use semantic versioning** - increment the appropriate version number based on changes
2. **Create releases frequently** - smaller, more frequent releases are easier to debug
3. **Test before release** - ensure the build works before creating a release
4. **Document changes** - update changelog or commit messages with meaningful descriptions
5. **Deploy after release** - deploy the new version to production after creating the release

## Troubleshooting

### Version not updating in Sentry

- Ensure the build completed successfully
- Check that `__SENTRY_RELEASE__` is properly injected
- Verify Sentry DSN is correct

### Build errors during release

- Check for TypeScript/ESLint errors
- Ensure all dependencies are installed
- Verify build configuration is correct
