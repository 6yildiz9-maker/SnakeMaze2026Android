# Release validation matrix

This checklist records reproducible acceptance steps. Automated checks are recorded by CI; device-only checks remain pending until run on the listed hardware and OS conditions. Do not treat an APK build as evidence of a device test.

## Clean-checkout and artifact checks

| Check | Acceptance criterion | Status |
|---|---|---|
| Android source in clean checkout | `npm ci`, `npm run build`, `npx cap sync android`, then Gradle `assembleDebug` complete without adding generated Capacitor assets or local SDK files to Git. | Local sync/build passed; clean-checkout CI pending |
| Play bundle | AAB builds only when the upload-key secrets are configured; signing materials are supplied from secrets and are absent from the repository. | Pending release secrets/workflow |
| Ad configuration | Debug uses Google test ad units. Play build uses configured production units and contains no test ad-unit IDs. | Run in CI/release review |
| Unit/type/build checks | `npm test`, `npm run lint`, and `npm run build` pass. | Run in CI |
| Native artifact review | App ID remains `com.aiwhishpers.snakemaze2026`; launcher/adaptive/monochrome icons, splash artwork, and displayed name use Pixelfang branding. | Source/build verified; visual asset review pending |

## Device acceptance checklist

| Device scenario | Acceptance criterion | Status |
|---|---|---|
| Phone and tablet layouts, including cutouts | Top score/HUD and controls remain visible, safe-area insets are respected, and the game remains usable in portrait and landscape. | Pending device run |
| 60 Hz and 120 Hz displays | Snake speed and queued rapid turns remain consistent; valid quick turns are not dropped. | Pending device run |
| Gameplay notices | A notice strip does not cover the score HUD and disappears after approximately five seconds. | Pending device run |
| Maze editor | Save, select, and play a custom maze; the snake and food start on open cells and a reachable food path remains available after obstacles spawn. | Pending device run |
| Special food | The entry-direction hint is visible and matches the final movement direction of the shortest route, including a route that wraps or avoids an obstacle. | Pending device run |
| Background, lock, and interruption | Music pauses when the app is backgrounded or locked and does not resume automatically; verify after a call/interruption. | Pending device run |
| Offline launch and persistence | Launch offline, save/resume a game, and confirm mode, food type, difficulty profile, speed, and remaining timer are restored. | Pending device run |
| Install and relaunch | Install the release candidate, inspect the launcher icon and splash, then relaunch and resume normally. | Debug APK installed/launched on SM-S918B (Android 17); visual assets and release candidate pending |
