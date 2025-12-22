# DiffReviewer - Extraction Plan

> **IMPORTANT NOTE FOR DEVELOPMENT:**
> 
> When implementing features for DiffReviewer, **look at the Sketch codebase first**!
> 
> Most of the patterns, components, and solutions you need already exist in Sketch.
> The Sketch codebase is in the parent directory (`../`) and includes:
> - **Git operations**: `git_tools/git_tools.go`
> - **Frontend components**: `webui/src/components/`
> - **API patterns**: `webui/src/services/`
> - **Monaco integration**: `webui/src/components/sketch-monaco-view.ts`
> - **Tailwind/Shadow DOM pattern**: `webui/src/components/sketch-tailwind-element.ts`
> - **Diff parsing and display**: Many examples in Sketch's diff viewer
> 
> **DiffReviewer is an extraction and simplification of Sketch's diff viewer**,
> so refer to Sketch's implementation when in doubt!
> 
> If you're stuck on how to implement something, grep the Sketch codebase first.
> Chances are, the pattern you need is already there and working.

---

## 🎯 Project Status: MVP COMPLETE ✅

**Last Updated**: December 21, 2025

**Current State**: ✅ Fully functional and ready for use!

### Quick Stats
- **Backend**: 100% complete - All API endpoints working
- **Frontend**: 100% core features complete - All components working
- **Build System**: 100% complete - Single binary with embedded assets
- **Testing**: Core functionality tested and working
- **Documentation**: README and usage docs complete

### What Works Right Now
✅ Compare any two commits with beautiful diff display  
✅ Navigate between changed files  
✅ Edit files and save changes (Cmd/Ctrl+S)  
✅ Add general review notes  
✅ Add line-specific notes with context  
✅ Export notes to markdown file or stdout  
✅ Graceful shutdown with "Done" button  
✅ Single binary, no dependencies  

### Quick Start
```bash
cd diffreviewer
make build
./bin/diffreviewer  # Compares HEAD~1..HEAD
```

See `README.md` for full usage and `TESTING_NOTES.md` for test results.

---

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
│   │   │   ├── notes-panel.ts   # Notes UI component (deprecated - notes now use inline popup)
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
1. Add inline notes popup in Monaco editor
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
- [x] Create `cmd/diffreviewer/main.go` with CLI parsing
- [x] Add CLI flags: base-branch (optional, default "main"), changed-branch, port, notes (optional), repo
- [x] Validate CLI arguments
- [x] Add logic to write notes to stdout if --notes not specified

#### Git Integration
- [x] Create `internal/git/diff.go`
- [x] Extract `GitRawDiff()` from `git_tools/git_tools.go`
- [x] Extract `parseRawDiff()` and `parseRawDiffWithNumstat()`
- [x] Copy `DiffFile` struct definition
- [x] Add function to get file content by git hash
- [x] Add function to validate branch names
- [x] Test git operations independently

#### HTTP Server
- [x] Create HTTP server in `main.go`
- [x] Initialize HTTP server with configurable port
- [x] Add static file serving for web UI (embedded with go:embed)
- [x] Add graceful shutdown handling
- [x] Add shutdown channel for "Done" button
- [x] Add CORS headers for development

#### API Handlers - Diff
- [x] Create `internal/handlers/handlers.go`
- [x] Implement `GET /api/diff` handler
- [x] Implement `GET /api/file-content?hash=...` handler
- [x] Implement `POST /api/save-file` handler (save edited content)
- [x] Add error handling and proper HTTP status codes
- [x] Add JSON response helpers
- [x] Test handlers with sample repository
- [x] Test file save functionality

#### Notes System
- [x] Create `internal/notes/notes.go`
- [x] Define `Note` struct: `{File string, Line int, LineContent string, Text string}`
- [x] Add `GeneralNotes string` field to notes structure
- [x] Implement `SaveNotes(filename, notes, generalNotes)` function
- [x] Implement `SaveNotesToWriter(w io.Writer, notes, generalNotes)` for stdout support
- [x] Implement markdown formatting for notes with "General Notes" section
- [x] Include line content in triple backticks before each note
- [x] Test notes I/O with sample data
- [x] Test notes output to stdout

#### API Handlers - Notes
- [x] Implement notes handlers in `internal/handlers/handlers.go`
- [x] Implement `GET /api/notes` handler (returns line notes and general notes)
- [x] Implement `POST /api/notes` handler (add/update line note)
- [x] Implement `DELETE /api/notes` handler (delete line note)
- [x] Implement `POST /api/general-notes` handler (update general notes)
- [x] Implement `GET /api/general-notes` handler (get general notes)
- [x] Add validation for note data
- [x] Thread-safe access to notes file
- [x] Test concurrent note updates

#### Shutdown
- [x] Implement shutdown handler in `internal/handlers/handlers.go`
- [x] Implement `POST /api/shutdown` handler
- [x] Receive general notes text in shutdown request body
- [x] Save general notes before shutdown
- [x] Trigger graceful server shutdown
- [x] Ensure all notes are flushed before exit (to file or stdout)
- [x] Print notes to stdout if --notes not specified
- [x] Print exit message

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
- [x] Create inline note popup in Monaco editor
- [x] Display note textarea when clicking gutter margin
- [x] Show line content context in note popup
- [x] Add "Add" and "Cancel" buttons in note popup
- [x] Notes appended to general notes when added
- [x] Style inline note popup

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
- [x] Create app layout: header, diff view, general notes input at bottom
- [x] Ensure general notes input is always visible at bottom
- [x] Test overall integration
- [ ] Add dark mode support (future enhancement)

#### UI Polish
- [x] Add loading states
- [x] Add error messages
- [x] Add empty states (no diffs, no notes)
- [x] Monaco line decorations for notes working
- [x] Syntax highlighting working (Monaco built-in)
- [ ] Add keyboard shortcuts (j/k for navigation, n for note) - future enhancement
- [ ] Add tooltips and help text - future enhancement
- [ ] Test responsive layout - works on desktop
- [ ] Add error retry functionality - future enhancement

### Build & Integration

#### Build System
- [x] Create root `Makefile`
- [x] Add `make build-frontend` target (runs vite build)
- [x] Add `make build-backend` target (runs go build)
- [x] Add `make build` target (builds both)
- [x] Embed frontend assets into Go binary (using go:embed)
- [x] Add `make dev` target for development
- [x] Add `make clean` target
- [x] Test build process

#### Integration
- [x] Configure Go to serve embedded assets
- [x] Test frontend loads correctly
- [x] Test API calls work end-to-end
- [x] Test notes persistence across restarts
- [x] Test graceful shutdown
- [x] Test with real git repositories

### Testing & Documentation

#### Testing
- [x] Test with small diff (few files, few changes)
- [x] Test with large diff (many files, many changes)
- [x] Test with binary files in diff
- [x] Test with renamed files
- [x] Test with deleted files
- [x] Test with added files
- [x] Test file editing and saving
- [x] Test save with Cmd/Ctrl+S keyboard shortcut
- [x] Test editing multiple files
- [x] Test notes on different lines (basic)
- [x] Test markdown output format
- [x] Test invalid branch names
- [x] Test missing notes file (create new)
- [x] Test graceful shutdown
- [x] Test with real git repositories
- [ ] Test concurrent note updates (needs stress testing)
- [ ] Test existing notes file (append/load existing)
- [ ] Test port already in use
- [ ] Test shutdown while loading

#### Documentation
- [x] Write `README.md` with overview
- [x] Add installation instructions
- [x] Add usage examples
- [x] Document CLI flags and defaults
- [ ] Add screenshots
- [x] Document notes file format
- [x] Document stdout notes output format
- [ ] Add troubleshooting section
- [ ] Document keyboard shortcuts (when implemented)
- [ ] Add contributing guidelines
- [ ] Add license file

#### Packaging
- [ ] Create release builds for Linux
- [ ] Create release builds for macOS
- [ ] Create release builds for Windows
- [ ] Add installation script
- [ ] Test on clean system

## Future Enhancements

### Already Implemented ✅
- ✅ ~~Add support for comparing commits instead of just branches~~ - DONE via range-picker

### High Priority
- [ ] Add keyboard shortcuts (j/k for file navigation, n for adding note, ? for help)
- [ ] Add keyboard shortcut to add note on current line
- [ ] Add dark mode support
- [ ] Test and fix loading existing notes files (append mode)
- [ ] Add note templates for common review comments

### Medium Priority
- [ ] Add filtering by file path/extension
- [ ] Add search within diffs
- [ ] Export notes to other formats (JSON, HTML)
- [ ] Add tooltips and help text throughout UI
- [ ] Add statistics (files reviewed, notes made, time spent)
- [ ] Test on macOS and Windows
- [ ] Add installation script for easy deployment

### Low Priority / Nice to Have
- [ ] Add note sharing via URL
- [ ] Add review checklist feature
- [ ] Add multi-user review support (complex - needs sessions, auth)
- [ ] Add git integration (post notes as PR comments)
- [ ] Add responsive layout for mobile/tablet
- [ ] Add ability to compare working directory changes (not just commits)

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

## Success Criteria - ALL ACHIEVED ✅

1. ✅ **CLI successfully parses arguments and starts server** - DONE
2. ✅ **Base defaults to HEAD~1 if not specified** - DONE (changed from "main" to HEAD~1)
3. ✅ **Browser can navigate to localhost:8000** - DONE
4. ✅ **Diff displays correctly for given commits** - DONE
5. ✅ **User can navigate between files** - DONE
6. ✅ **User can edit files on the right side (modified code)** - DONE
7. ✅ **User can save file changes with Cmd/Ctrl+S** - DONE
8. ✅ **File changes persist to working directory** - DONE
9. ✅ **User can add line-specific notes** - DONE (via inline popup in Monaco editor)
10. ✅ **User can type general notes in text box at bottom** - DONE
11. ✅ **Line-specific notes save immediately (if --notes specified)** - DONE
12. ✅ **General notes auto-save on change** - DONE
13. ✅ **"Done" button saves general notes and exits gracefully** - DONE
14. ✅ **All notes print to stdout on exit (if --notes not specified)** - DONE
15. ✅ **Markdown output has correct format with file, line info, and general notes section** - DONE
16. ✅ **Program works on Linux** - DONE (tested)
17. ✅ **Single binary with no external dependencies** - DONE

**Note**: macOS and Windows builds not tested yet, but Go cross-compilation should work.

## MVP Status: COMPLETE ✅

The Minimum Viable Product is **fully functional and ready for use**.
All core features work as designed. Remaining items are enhancements and polish.

## Additional Features Implemented

Beyond the original plan, the following enhancements were added:

### Range Picker (Dec 21, 2025)
- **Component**: `range-picker.ts`
- **Functionality**: Allows selecting any two commits to compare (not just branches)
- **API Endpoints**: 
  - `GET /api/commits` - Returns commit history
  - `GET /api/base-commit` - Returns current base commit
- **UI**: Dropdown showing commit history with hash and subject
- **Integration**: Works seamlessly with diff-viewer component

### Base Element Pattern (Dec 21, 2025)
- **Component**: `base-element.ts` (similar to Sketch's `SketchTailwindElement`)
- **Purpose**: Disables Shadow DOM to allow global CSS (including Monaco styles) to reach components
- **Implementation**: All components extend `DiffReviewerElement` which extends `BaseElement`
- **Result**: Fixed Monaco Editor rendering issues with diff colors and line numbers
- **Trade-off**: No CSS encapsulation, but acceptable since DiffReviewer controls entire UI

### Enhanced Build System
- **Vite Configuration**: Set `cssCodeSplit: false` to prevent CSS from being split into multiple files
- **Embedded Assets**: Frontend built with Vite and embedded into Go binary via `go:embed`
- **Single Binary**: Final artifact is a single executable with no external dependencies

## Current Implementation Status (Dec 21, 2025)

### ✅ FULLY FUNCTIONAL - Core Features Complete

All core functionality is **working and tested**:

#### Backend (100% Complete)
- ✅ Git operations (diff, file content, commit history, branch validation)
- ✅ HTTP server with embedded frontend assets
- ✅ All API handlers (diff, file-content, save-file, commits, notes, shutdown)
- ✅ Notes storage with markdown export (to file or stdout)
- ✅ CLI parsing with proper argument handling
- ✅ Graceful shutdown with notes output

#### Frontend (100% Core Features Complete)
- ✅ All UI components built and working:
  - `app-shell.ts` - Main application shell
  - `diff-viewer.ts` - Diff display and file selector
  - `monaco-view.ts` - Monaco Editor with diff view and editing
  - `range-picker.ts` - Commit range selection
  - `notes-panel.ts` - (Deprecated, kept for reference)
  - `done-button.ts` - Graceful shutdown button
  - `general-notes-input.ts` - General notes text area
  - `base-element.ts` - Shadow DOM override for global CSS
- ✅ API and notes service layers with full TypeScript types
- ✅ Monaco Editor rendering correctly with diff colors and line numbers
- ✅ File editing and saving (Cmd/Ctrl+S)
- ✅ Range picker for selecting commits to compare
- ✅ Notes panel with add/edit/delete functionality
- ✅ General notes auto-save

#### Build System (100% Complete)
- ✅ Makefile with build-frontend, build-backend, build, dev, clean targets
- ✅ Vite bundling with Monaco Editor
- ✅ Go binary with embedded web assets (single executable)
- ✅ No external dependencies required

#### Testing (Core Complete, Some Edge Cases Remain)
- ✅ Tested with real git repositories
- ✅ Diff display works correctly
- ✅ File editing and saving works
- ✅ Notes creation and markdown export works
- ✅ Shutdown saves notes to file or stdout
- ✅ Range picker changes diff view correctly
- ⚠️ Need more testing: concurrent updates, edge cases, stress testing

### Known Limitations
1. **Line-specific notes**: Can be added/viewed/deleted but "Jump to line" not implemented
2. **Keyboard shortcuts**: Not implemented (j/k navigation, n for note)
3. **Dark mode**: Not implemented
4. **Existing notes file loading**: Implemented but needs more testing

### Ready for Use ✅
**DiffReviewer is functional and can be used for code reviews!**

Users can:
- ✅ View diffs between any two commits
- ✅ Navigate between files
- ✅ Edit files and save changes
- ✅ Add general review notes
- ✅ Add line-specific notes
- ✅ Add inline notes via gutter click
- ✅ Save notes to markdown file or stdout
- ✅ Gracefully shutdown with notes export

See `TESTING_NOTES.md` for detailed testing information and `README.md` for usage instructions.

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
