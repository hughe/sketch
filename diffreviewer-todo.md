# DiffReviewer - Extraction Plan

## Overview

Extract Sketch's diff viewer into a standalone CLI tool called `diffreviewer` that displays git diffs in a web UI and allows users to make notes that are saved to a markdown file.

## Command Line Interface

```bash
diffreviewer [base-branch] <changed-branch> [options]

Options:
  --port, -p        Port number (default: 8000)
  --notes, -n       Notes file path (optional, if not specified notes go to stdout)
  --repo, -r        Repository path (default: current directory)

Defaults:
  base-branch       Defaults to "main" if not specified
```

Examples:
```bash
# Compare feature-branch to main, notes to file
diffreviewer feature-branch --notes review-notes.md

# Compare feature-branch to develop, notes to stdout
diffreviewer develop feature-branch

# Compare feature-branch to main on custom port
diffreviewer main feature-branch --notes review-notes.md --port 8080
```

## Architecture

### Backend (Go)
- Standalone HTTP server serving the web UI
- Git operations using existing git_tools package patterns
- API endpoints for diff data and notes
- Graceful shutdown on "Done" button

### Frontend (TypeScript/Lit)
- Simplified version of sketch-diff2-view
- Remove range picker (branches specified via CLI)
- Add notes UI with line-specific commenting
- Add "Done" button that calls shutdown endpoint
- Monaco editor for diff display with edit capability
- General notes text box at bottom (like chatInput) for overall review comments

### Notes Format
Markdown file with structured notes:
```markdown
# Diff Review Notes

## file/path/example.go
### Line 42
```
func processData(input string) error {
```
- This needs refactoring
- Consider error handling

### Line 100
```
return nil
```
- Good improvement!

## another/file.ts
### Line 15
```
const result = await fetchData();
```
- Question: Why was this changed?

## General Notes

Overall the changes look good. Need to verify test coverage
for the new functionality. Consider adding more documentation.
```

Each line-specific note includes the actual line content in triple backticks for context.
The "General Notes" section is populated from the text box at the bottom of the UI.

## Project Structure

```
diffreviewer/
├── cmd/
│   └── diffreviewer/
│       └── main.go              # CLI entry point
├── internal/
│   ├── server/
│   │   └── servero            # HTTP server
│   ├── git/
│   │   └── diff.go              # Git operations (extracted from git_tools)
│   ├── notes/
│   │   ├── notes.go             # Notes file I/O
│   │   └── markdown.go          # Markdown formatting
│   └── handlers/
│       ├── diff.go              # Diff API handlers
│       ├── notes.go             # Notes API handlers
│       └── shutdown.go          # Shutdown handler
├── web/
│   ├── src/
│   │   ├── components/
│   │   │   ├── diff-viewer.ts   # Main diff viewer (simplified)
│   │   │   ├── monaco-view.ts   # Monaco wrapper (extracted)
│   │   │   ├── notes-panel.ts   # Notes UI component
│   │   │   └── done-button.ts   # Done button component
│   │   ├── services/
│   │   │   ├── api.ts           # API client
│   │   │   └── notes.ts         # Notes service
│   │   ├── types.ts             # TypeScript types
│   │   └── main.ts              # App entry point
│   ├── static/
│   │   └── monaco/              # Monaco editor assets
│   ├── index.html               # Main HTML page
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts           # Build config
├── go.mod
├── go.sum
├── Makefile
└── README.md
```

## API Endpoints

### GET /api/diff
Returns diff files between the two branches
- Query params: none (branches specified at startup)
- Response: `DiffFile[]`

### GET /api/file-content
Returns file content by git hash
- Query params: `hash=<git-blob-hash>`
- Response: file content as text

### GET /api/notes
Returns current notes
- Response: `{lineNotes: Note[], generalNotes: string}` where Note is `{file: string, line: number, lineContent: string, text: string}`

### POST /api/notes
Add or update a line-specific note
- Body: `{file: string, line: number, lineContent: string, text: string}`
- Response: success/error

### DELETE /api/notes
Delete a line-specific note
- Body: `{file: string, line: number}`
- Response: success/error

### POST /api/general-notes
Update general notes text
- Body: `{text: string}`
- Response: success/error

### GET /api/general-notes
Get current general notes
- Response: `{text: string}`

### POST /api/save-file
Save edited file content back to working directory
- Body: `{path: string, content: string}`
- Response: success/error

### POST /api/shutdown
Trigger graceful shutdown
- Response: success message

## Key Differences from Sketch

### Removed Features
- Range picker (branches fixed at startup)
- Branch/commit timeline
- Untracked files notification
- Multiple view modes (only single file view)

### Added Features
- Line-specific notes with markdown export
- General notes text box for overall review comments
- "Done" button for exit that saves general notes
- Simplified UI focused on review workflow
- Notes persistence to markdown file or stdout
- Default base branch to "main" for convenience
- File editing capability (same as Sketch)

### Simplified Features
- No authentication/sessions
- Single repository context
- No dynamic branch switching

## Dependencies to Extract

### From Sketch Backend
- `git_tools/git_tools.go` → `internal/git/diff.go`
  - `GitRawDiff()` function
  - `parseRawDiff()` and related parsing
  - `DiffFile` struct

### From Sketch Frontend
- `sketch-diff2-view.ts` → `diff-viewer.ts` (simplified)
- `sketch-monaco-view.ts` → `monaco-view.ts` (keep editing capability)
- `git-data-service.ts` → `services/api.ts` (adapted, including save)
- `types.ts` → `types.ts` (DiffFile and related types)
- `sketch-tailwind-element.ts` → inline or remove (simplify styling)

### External Dependencies
- Monaco Editor (frontend)
- Lit (frontend web components)
- Tailwind CSS (frontend styling)
- Go standard library (backend, no external deps needed)

## Implementation Notes

### Key Architecture Decisions
- Using relative URLs (`./api/...`) for all API calls to ensure proper routing through proxies
- Notes are cached locally in the frontend for performance
- File editing capability is included (save edited files back to working directory)
- General notes separate from line-specific notes
- All API functions use proper TypeScript types

### Next Steps
- Backend: Git integration, HTTP server, handlers, notes persistence
- Frontend: Monaco component, diff viewer, notes UI, general notes input
- Integration: Embed frontend assets, test end-to-end

## Implementation Plan

### Phase 1: Project Setup
1. Create directory structure
2. Initialize Go module
3. Set up frontend build system (Vite)
4. Configure Tailwind CSS
5. Set up Makefile for builds

### Phase 2: Backend Core
1. Extract git diff functionality
2. Create basic HTTP server
3. Implement diff API endpoints
4. Add file content endpoint
5. Test with curl/Postman

### Phase 3: Notes System
1. Design notes data structure
2. Implement markdown file I/O
3. Create notes CRUD API
4. Add file locking for concurrent access
5. Test notes persistence

### Phase 4: Frontend Foundation
1. Extract Monaco wrapper component
2. Create simplified diff viewer component
3. Implement API service layer
4. Create basic layout with file selector
5. Test diff display

### Phase 5: Notes UI
1. Add notes panel component
2. Implement line-specific commenting in Monaco
3. Connect to notes API
4. Add UI for viewing/editing/deleting notes
5. Test notes workflow

### Phase 6: Polish
1. Add "Done" button and shutdown
2. Improve error handling
3. Add loading states
4. Refine UI/UX
5. Add keyboard shortcuts

### Phase 7: Documentation & Testing
1. Write README with usage examples
2. Add CLI help text
3. Test on multiple repositories
4. Test markdown output format
5. Handle edge cases (binary files, large diffs, etc.)

## Detailed TODO List

### Backend Tasks

#### Project Setup
- [x] Create `diffreviewer` directory structure
- [x] Initialize Go module (`go mod init diffreviewer`)
- [ ] Create `cmd/diffreviewer/main.go` with CLI parsing
- [ ] Add CLI flags: base-branch (optional, default "main"), changed-branch, port, notes (optional), repo
- [ ] Validate CLI arguments
- [ ] Add logic to write notes to stdout if --notes not specified

#### Git Integration
- [ ] Create `internal/git/diff.go`
- [ ] Extract `GitRawDiff()` from `git_tools/git_tools.go`
- [ ] Extract `parseRawDiff()` and `parseRawDiffWithNumstat()`
- [ ] Copy `DiffFile` struct definition
- [ ] Add function to get file content by git hash
- [ ] Add function to validate branch names
- [ ] Test git operations independently

#### HTTP Server
- [ ] Create `internal/server/server.go`
- [ ] Initialize HTTP server with configurable port
- [ ] Add static file serving for web UI
- [ ] Add graceful shutdown handling
- [ ] Add shutdown channel for "Done" button
- [ ] Add CORS headers for development

#### API Handlers - Diff
- [ ] Create `internal/handlers/diff.go`
- [ ] Implement `GET /api/diff` handler
- [ ] Implement `GET /api/file-content?hash=...` handler
- [ ] Implement `POST /api/save-file` handler (save edited content)
- [ ] Add error handling and proper HTTP status codes
- [ ] Add JSON response helpers
- [ ] Test handlers with sample repository
- [ ] Test file save functionality

#### Notes System
- [ ] Create `internal/notes/notes.go`
- [ ] Define `Note` struct: `{File string, Line int, LineContent string, Text string}`
- [ ] Add `GeneralNotes string` field to notes structure
- [ ] Implement `SaveNotes(filename, notes, generalNotes)` function
- [ ] Implement `SaveNotesToWriter(w io.Writer, notes, generalNotes)` for stdout support
- [ ] Create `internal/notes/markdown.go`
- [ ] Implement markdown formatting for notes with "General Notes" section
- [ ] Include line content in triple backticks before each note
- [ ] Test notes I/O with sample data
- [ ] Test notes output to stdout

#### API Handlers - Notes
- [ ] Create `internal/handlers/notes.go`
- [ ] Implement `GET /api/notes` handler (returns line notes and general notes)
- [ ] Implement `POST /api/notes` handler (add/update line note)
- [ ] Implement `DELETE /api/notes` handler (delete line note)
- [ ] Implement `POST /api/general-notes` handler (update general notes)
- [ ] Implement `GET /api/general-notes` handler (get general notes)
- [ ] Add validation for note data
- [ ] Thread-safe access to notes file
- [ ] Test concurrent note updates

#### Shutdown
- [ ] Create `internal/handlers/shutdown.go`
- [ ] Implement `POST /api/shutdown` handler
- [ ] Receive general notes text in shutdown request body
- [ ] Save general notes before shutdown
- [ ] Trigger graceful server shutdown
- [ ] Ensure all notes are flushed before exit (to file or stdout)
- [ ] Print notes to stdout if --notes not specified
- [ ] Print exit message

### Frontend Tasks

#### Project Setup
- [x] Create `web` directory structure
- [x] Initialize npm project (`npm init`)
- [x] Add dependencies: lit, monaco-editor, tailwindcss
- [x] Create `vite.config.ts` for build
- [x] Create `tsconfig.json` for TypeScript
- [x] Set up Tailwind CSS configuration
- [x] Create `index.html` template
- [x] Add build scripts to `package.json`

#### Type Definitions
- [x] Create `web/src/types.ts`
- [x] Extract `DiffFile` interface from Sketch
- [x] Add `Note` interface: `{file: string, line: number, lineContent: string, text: string}`
- [x] Add `NotesResponse` interface: `{lineNotes: Note[], generalNotes: string}`
- [x] Add API response types
- [x] Export all types

#### API Service
- [x] Create `web/src/services/api.ts`
- [x] Implement `fetchDiff()` function
- [x] Implement `fetchFileContent(hash)` function
- [x] Implement `saveFileContent(path, content)` function
- [x] Add error handling wrapper
- [x] Add TypeScript types for responses
- [x] Test API calls

#### Notes Service
- [x] Create `web/src/services/notes.ts`
- [x] Implement `fetchNotes()` function (returns line notes and general notes)
- [x] Implement `addNote(file, line, lineContent, text)` function
- [x] Implement `updateNote(file, line, lineContent, text)` function
- [x] Implement `deleteNote(file, line)` function
- [x] Implement `updateGeneralNotes(text)` function
- [x] Implement `fetchGeneralNotes()` function
- [x] Add local caching of notes
- [x] Test notes service

#### Monaco Component
- [x] Create `web/src/components/monaco-view.ts`
- [x] Extract from `sketch-monaco-view.ts`
- [x] Keep edit functionality on right side (modified code)
- [x] Keep diff display with syntax highlighting
- [x] Keep save handler (Cmd/Ctrl+S)
- [x] Add line click event for notes (include line content)
- [x] Add glyph decorations for lines with notes
- [x] Style notes indicators (e.g., comment icons)
- [x] Test Monaco integration
- [x] Test file editing and saving

#### Diff Viewer Component
- [x] Create `web/src/components/diff-viewer.ts`
- [x] Simplify from `sketch-diff2-view.ts`
- [x] Remove range picker (branches from backend)
- [x] Keep file selector dropdown
- [x] Add file statistics display (+/- counts)
- [x] Load diff on mount
- [x] Handle monaco-save events from Monaco component
- [x] Call save API on file edits
- [x] Handle loading and error states
- [x] Test file switching
- [x] Test file editing workflow

#### Notes Panel Component
- [x] Create `web/src/components/notes-panel.ts`
- [x] Add sidebar or overlay for notes
- [x] Display list of all notes grouped by file
- [x] Show file name, line number, and quoted line content for each note
- [ ] Add "Jump to line" functionality
- [x] Add edit/delete buttons for notes
- [ ] Add new note form
- [x] Style notes panel

#### Done Button Component
- [x] Create `web/src/components/done-button.ts`
- [x] Add prominent "Done" button in header
- [x] Get general notes text from text box on click
- [x] Send general notes text in shutdown API call
- [x] Show confirmation dialog
- [x] Display "Shutting down..." message
- [x] Style done button (prominent, hard to miss)

#### General Notes Text Box
- [x] Create `web/src/components/general-notes-input.ts` (or add to main app)
- [x] Add text box at bottom of screen (like chatInput)
- [x] Style similar to Sketch's chat input
- [x] Load existing general notes on mount
- [x] Auto-save general notes on change (debounced)
- [x] Provide textarea for multi-line input
- [x] Add placeholder text: "Add general review notes here..."
- [x] Make resizable

#### Main App
- [x] Create `web/src/main.ts`
- [x] Initialize app shell
- [x] Register all web components
- [x] Add global styles
- [x] Create app layout: header, diff view, notes panel, general notes input at bottom
- [x] Ensure general notes input is always visible at bottom
- [ ] Add dark mode support
- [x] Test overall integration

#### UI Polish
- [ ] Add loading spinners
- [ ] Add error messages with retry
- [ ] Add empty states (no diffs, no notes)
- [ ] Add keyboard shortcuts (j/k for navigation, n for note)
- [ ] Add tooltips and help text
- [ ] Test responsive layout
- [ ] Add Monaco line decorations for notes
- [ ] Add syntax highlighting for all file types

### Build & Integration

#### Build System
- [x] Create root `Makefile`
- [x] Add `make build-frontend` target (runs vite build)
- [x] Add `make build-backend` target (runs go build)
- [x] Add `make build` target (builds both)
- [ ] Embed frontend assets into Go binary
- [x] Add `make dev` target for development
- [x] Add `make clean` target
- [ ] Test build process

#### Integration
- [ ] Configure Go to serve embedded assets
- [ ] Test frontend loads correctly
- [ ] Test API calls work end-to-end
- [ ] Test notes persistence across restarts
- [ ] Test graceful shutdown
- [ ] Test with real git repositories

### Testing & Documentation

#### Testing
- [ ] Test with small diff (few files, few changes)
- [ ] Test with large diff (many files, many changes)
- [ ] Test with binary files in diff
- [ ] Test with renamed files
- [ ] Test with deleted files
- [ ] Test with added files
- [ ] Test file editing and saving
- [ ] Test save with Cmd/Ctrl+S keyboard shortcut
- [ ] Test editing multiple files
- [ ] Test notes on different lines
- [ ] Test concurrent note updates
- [ ] Test markdown output format
- [ ] Test invalid branch names
- [ ] Test missing notes file (create new)
- [ ] Test existing notes file (append)
- [ ] Test port already in use
- [ ] Test shutdown while loading

#### Documentation
- [ ] Write `README.md` with overview
- [ ] Add installation instructions
- [ ] Add usage examples
- [ ] Document CLI flags and defaults
- [ ] Add screenshots
- [ ] Document notes file format
- [ ] Document stdout notes output format
- [ ] Add troubleshooting section
- [ ] Document keyboard shortcuts
- [ ] Add contributing guidelines
- [ ] Add license file

#### Packaging
- [ ] Create release builds for Linux
- [ ] Create release builds for macOS
- [ ] Create release builds for Windows
- [ ] Add installation script
- [ ] Test on clean system

## Future Enhancements

- [ ] Add support for comparing commits instead of just branches
- [ ] Add filtering by file path/extension
- [ ] Add search within diffs
- [ ] Add note templates
- [ ] Export notes to other formats (JSON, HTML)
- [ ] Add note sharing via URL
- [ ] Add review checklist feature
- [ ] Add multi-user review support
- [ ] Add git integration (post notes as PR comments)
- [ ] Add statistics (files reviewed, notes made, time spent)

## Technical Decisions

### Why standalone binary?
- Easy distribution and installation
- No external dependencies to install
- Works offline
- Fast startup

### Why embed web assets?
- Single binary deployment
- No need to manage static file paths
- Reliable asset loading

### Why Lit for frontend?
- Lightweight (~5KB)
- Native web components
- Already used in Sketch
- Good TypeScript support

### Why Monaco Editor?
- Professional diff display
- Syntax highlighting
- Well-tested and maintained
- Already used in Sketch

### Why Markdown for notes?
- Human-readable
- Easy to edit manually
- Version control friendly
- Universal format
- Works well for both file and stdout output

## Success Criteria

1. ✅ CLI successfully parses arguments and starts server
2. ✅ Base branch defaults to "main" if not specified
3. ✅ Browser opens to correct URL
4. ✅ Diff displays correctly for given branches
5. ✅ User can navigate between files
6. ✅ User can edit files on the right side (modified code)
7. ✅ User can save file changes with Cmd/Ctrl+S
8. ✅ File changes persist to working directory
9. ✅ User can click line to add line-specific note
10. ✅ User can type general notes in text box at bottom
11. ✅ Line-specific notes save immediately (if --notes specified)
12. ✅ General notes auto-save on change
13. ✅ "Done" button saves general notes and exits gracefully
14. ✅ All notes print to stdout on exit (if --notes not specified)
15. ✅ Markdown output has correct format with file, line info, and general notes section
16. ✅ Program works on Linux, macOS, and Windows
17. ✅ Single binary with no external dependencies

## Current Implementation Status (Dec 20, 2025)

### Completed ✅
- **Project Setup**: Directory structure, Go module, Vite, Tailwind, Makefile
- **Frontend Components**: All UI components built (app-shell, diff-viewer, monaco-view, notes-panel, done-button, general-notes-input)
- **Frontend Services**: API and notes service layers with TypeScript types
- **Backend**: 
  - Git operations (diff, file content, branch validation)
  - HTTP server with all API handlers
  - Notes storage with markdown export
  - CLI parsing with proper arg handling
  - Graceful shutdown with notes output

### Working ✅
- Backend API fully functional (tested with curl)
- Frontend loads and initializes correctly
- File list and content fetching works
- All 10 commits on sketch-wip branch

### Blocked ⚠️
- Monaco Editor not rendering due to Vite bundling configuration
- Need to add `vite-plugin-monaco-editor` package and configure

### To Complete
1. Fix Monaco Editor bundling (add vite plugin)
2. Rebuild frontend with Monaco working
3. Test full workflow end-to-end
4. Test with sample diff and notes
5. Document usage in README

See `TESTING_NOTES.md` for detailed testing information.

## Recent Fix - Monaco CSS Not Loading (Dec 21, 2025)

### Problem
Monaco Editor was not rendering properly - no line numbers, no syntax highlighting, and broken layout. Investigation revealed that Vite was code-splitting the Monaco CSS (`monaco-editor/min/vs/editor/editor.main.css`) into a separate file (`editor-CLTksHtb.css`) that was not being referenced in the HTML.

### Root Cause
Vite's default behavior is to code-split CSS for dynamic imports. When Monaco Editor CSS was imported, it was extracted into a separate bundle that was built but not linked in the generated `index.html`.

### Solution
Set `cssCodeSplit: false` in `web/vite.config.ts` to disable CSS code splitting. This ensures all CSS (including Monaco's) is bundled into a single file that's properly linked in the HTML.

### Files Changed
- `diffreviewer/web/vite.config.ts`: Added `cssCodeSplit: false` to build config

### Verification
- Single CSS file now generated (`style-*.css` instead of `main-*.css` + `editor-*.css`)
- Monaco Editor renders correctly with line numbers and syntax highlighting
- All Monaco CSS styles properly applied

## CSS Shadow DOM Fix (Dec 21, 2025 - RESOLVED)

### Problem
Monaco Editor CSS issues:
1. Diff highlighting colors were appearing in wrong positions (offset by lines)
2. Line numbers were not visible
3. CSS from the bundled stylesheet couldn't reach Monaco elements inside shadow DOM

### Root Cause
Lit components use Shadow DOM by default, which creates a CSS boundary. Document-level CSS (including Monaco Editor styles) cannot penetrate into shadow DOM to style elements inside components.

### Solution: Disable Shadow DOM (Same as Sketch)
Followed Sketch's approach by disabling Shadow DOM for all Lit components:

1. **Created `BaseElement` class** (like Sketch's `SketchTailwindElement`):
   - Extends `LitElement`
   - Overrides `createRenderRoot()` to return `this` instead of creating shadow root
   - Allows document-level CSS to reach component internals

2. **Updated all components** to extend `BaseElement` instead of `LitElement`:
   - `app-shell.ts`
   - `diff-viewer.ts`
   - `monaco-view.ts`
   - `done-button.ts`
   - `general-notes-input.ts`
   - `notes-panel.ts`

3. **Moved component styles to global CSS**:
   - When Shadow DOM is disabled, Lit's `static styles` no longer apply
   - Moved all component layout and styling rules to `web/src/styles.css`
   - Added component-scoped selectors (e.g., `app-shell .header`, `diff-viewer .file-selector`)

### Result
✅ Monaco Editor renders correctly with:
- **Diff colors in correct positions** - no offset issues
- **Line numbers visible** - styled with teal color (#237893)
- **Character-level diffs** - darker green on word "Changed" (rgba(155, 185, 85, 0.4))
- **Line-level diffs** - lighter green on full line (rgba(155, 185, 85, 0.2))
- **Proper layout** - all components have correct heights and flexbox behavior

### Files Modified
- `diffreviewer/web/src/components/base-element.ts` - new base class (created)
- `diffreviewer/web/src/components/*.ts` - all components updated to extend BaseElement
- `diffreviewer/web/src/styles.css` - added all component styles with proper scoping
- `diffreviewer/web/vite.config.ts` - still has `cssCodeSplit: false` from earlier fix

### Why This Approach?
- **Consistency with Sketch**: Uses the same pattern Sketch uses for Tailwind integration
- **Simpler CSS**: No need to work around shadow boundaries
- **Monaco CSS works**: Document-level Monaco styles now reach editor elements
- **No CSS isolation needed**: DiffReviewer controls entire UI, doesn't need component encapsulation

### Verification
Tested with test repository comparing two commits:
- Diff colors appear on correct lines (no offset)
- Word "Changed" has darker green background
- Full line has lighter green background
- Line numbers visible with proper styling
- Layout renders correctly at full viewport height

## Known Issues

### ~~Lit Reactivity with Disabled Shadow DOM~~ (Dec 21, 2025 - RESOLVED)

**Problem**: Range picker component works correctly and dispatches range-change events, but the diff-viewer component doesn't automatically update when receiving the new range through Lit's property binding.

**Root Cause**: When Shadow DOM is disabled (by returning `this` from `createRenderRoot()`), Lit's reactive property system doesn't trigger re-renders the same way it does with Shadow DOM enabled.

**Solution Implemented** (Dec 21, 2025):
Used direct method calls instead of property binding:
1. Added public `loadDiffForRange(range)` method to `diff-viewer.ts`
2. Modified `app-shell.ts` to call this method directly when range changes
3. Added explicit `requestUpdate()` calls in range-picker component after state changes (toggleDropdown, closeDropdown, selectCommit)

**Result**: ✅ Range picker now works correctly:
- Dropdown opens/closes properly
- Selecting a commit updates the diff view immediately
- Console logs show correct range change events
- Diff content updates correctly

**Files Modified**:
- `diffreviewer/web/src/components/diff-viewer.ts` - Added `loadDiffForRange()` method
- `diffreviewer/web/src/components/app-shell.ts` - Changed to call method directly
- `diffreviewer/web/src/components/range-picker.ts` - Added `requestUpdate()` calls
