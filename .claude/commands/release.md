# Create Release

Prepare and release a new version by converting [Unreleased] to a versioned release.

Follow these steps:

1. **Ask for version number**: Ask the user what version number to release (e.g., 0.1.2, 1.0.0)

2. **Verify [Unreleased] exists**: Check CHANGELOG.md has an [Unreleased] section with changes
   - If empty, warn the user there are no changes to release
   - If doesn't exist, inform the user to run `/changelog` first

3. **Update CHANGELOG.md**:
   - Get today's date in YYYY-MM-DD format
   - Rename `## [Unreleased]` to `## [x.y.z] - YYYY-MM-DD` (use the version and date)
   - Add a new empty `## [Unreleased]` section at the top (after the header)
   - Update version links at the bottom if they exist

4. **Show the user** what changed in the changelog and ask for confirmation to proceed

5. **Create git commit and tag**:

   ```bash
   git add CHANGELOG.md
   git commit -m "chore: release vx.y.z"
   git tag -a vx.y.z -m "Release x.y.z"
   ```

6. **Ask the user** if they want to push the changes and tags:
   - If yes: `git push && git push --tags`
   - If no: Remind them to run `git push && git push --tags` when ready

Remember: This creates a git tag that can be used for GitHub releases and deployment automation.
