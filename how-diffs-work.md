# How Diffs Work in Sketch

The diff display functionality in Sketch is organized across frontend and backend layers:

## Frontend Components (TypeScript/Lit)

### 1. `webui/src/web-components/sketch-diff2-view.ts` - Main diff viewer component
- Renders diffs using Monaco editor with range and file pickers
- Handles file selection, view modes (single file)
- Shows additions/deletions statistics
- Supports expand/collapse of unchanged regions
- Handles editable diffs for unstaged changes
- Displays untracked files notification

### 2. `webui/src/web-components/mobile-diff.ts` - Mobile-optimized diff viewer
- Simplified UI for mobile screens
- Similar functionality to main diff view but with reduced UI elements
- Supports inline and side-by-side view toggle
- Smaller Monaco editor gutters for mobile

### 3. `webui/src/web-components/sketch-monaco-view.ts` - Monaco editor wrapper
- Wraps Monaco's `createDiffEditor()` for diff rendering
- Handles syntax highlighting, theming
- Supports inline and side-by-side diff modes
- Enables advanced diff algorithm with move detection
- Handles comment decorations and save events

### 4. `webui/src/web-components/git-data-service.ts` - Data service layer
- Interface for fetching Git data from backend
- Methods: `getDiff()`, `getCommitDiff()`, `getFileContent()`, etc.
- Calls backend API endpoints like `git/rawdiff`

## Backend (Go)

### 5. `git_tools/git_tools.go` - Core Git diff implementation
- `GitRawDiff()` - Executes `git diff --raw` and `git diff --numstat`
- Parses git output into structured `DiffFile` format
- Returns file paths, status (A/M/D/R), additions/deletions counts
- Handles rename/copy detection with `-M`, `-C` flags

### 6. `webui/src/types.ts` - TypeScript type definitions
- Defines `DiffFile` structure with all diff metadata

## Flow of Diff Display

```
User selects range → sketch-diff2-view.loadDiffData()
                  ↓
          git-data-service.getDiff(from, to)
                  ↓
          Backend API: git/rawdiff?from=X&to=Y
                  ↓
          git_tools.GitRawDiff() executes git commands
                  ↓
          Returns DiffFile[] with paths, hashes, stats
                  ↓
          sketch-diff2-view loads file contents
                  ↓
          sketch-monaco-view renders diff with Monaco
```

## Key Features

- **Range selection**: Diff between any two commits or refs
- **Unstaged changes**: Show working directory changes (when `to=""`)
- **File statistics**: Display +/- line counts per file
- **Status indicators**: Added (A), Modified (M), Deleted (D), Renamed (R)
- **Editable diffs**: Can edit right side of unstaged changes
- **Monaco integration**: Professional diff rendering with syntax highlighting
- **Mobile support**: Responsive design with mobile-specific component

The code uses Monaco Editor's built-in diff capabilities for the actual visual rendering, while the Sketch code handles fetching, organizing, and managing the diff data.
