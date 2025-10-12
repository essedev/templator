# Update Changelog

Review the recent work and update CHANGELOG.md with the changes in the [Unreleased] section.

Follow these steps:

1. **Check recent changes**: Run git status and git diff to see what files were modified

2. **Identify the type of changes**:
   - Added: New features, files, or functionality
   - Changed: Updates to existing features
   - Fixed: Bug fixes
   - Removed: Deleted features or files
   - Security: Security improvements

3. **Update CHANGELOG.md**:
   - If [Unreleased] section exists: Add entries there
   - If [Unreleased] section doesn't exist: Create it at the top of the changelog (after the header, before the first version)
   - Format:

     ```markdown
     ## [Unreleased]

     ### Added

     - New feature description

     ### Changed

     - Change description
     ```

4. **Format properly**:
   - Use clear, concise descriptions
   - Be specific about what changed and why it matters
   - Follow existing changelog style

Remember: Changes always go in [Unreleased] during development. When releasing a version, the user will rename [Unreleased] to the version number with date.
