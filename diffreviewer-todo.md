# DiffReviewer - Extraction Plan

## Overview

Extract Sketch's diff viewer into a standalone CLI tool called `diffreviewer` that displays git diffs in a web UI and allows users to make notes that are saved to a markdown file.

## Command Line Interface

```bash
diffreviewer <base-branch> <changed-branch> [options]

Options:
  --port, -p        Port number (default: 8000)
  --notes, -n       Notes file path (required)
  --repo, -r        Repository path (default: current directory)
```

Example:
```bash
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
- Monaco editor for diff display

### Notes Format
Markdown file with structured notes:
```markdown
# Diff Review Notes

## file/path/example.go
### Line 42
- This needs refactoring
- Consider error handling

### Line 100
- Good improvement!

## another/file.ts
### Line 15
- Question: Why was this changed?
```

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
- Response: `Note[]` with structure: `{file: string, line: number, text: string}`

### POST /api/notes
Add or update a note
- Body: `{file: string, line: number, text: string}`
- Response: success/error

### DELETE /api/notes
Delete a note
- Body: `{file: string, line: number}`
- Response: success/error

### POST /api/shutdown
Trigger graceful shutdown
- Response: success message

## Key Differences from Sketch

### Removed Features
- Range picker (branches fixed at startup)
- Branch/commit timeline
- Editable diffs (read-only review mode)
- Untracked files notification
- Multiple view modes (only single file view)
- Save functionality

### Added Features
- Line-specific notes with markdown export
- "Done" button for exit
- Simplified UI focused on review workflow
- Notes persistence to markdown file

### Simplified Features
- No authentication/sessions
- Single repository context
- No dynamic branch switching
- No file editing

## Dependencies to Extract

### From Sketch Backend
- `git_tools/git_tools.go` → `internal/git/diff.go`
  - `GitRawDiff()` function
  - `parseRawDiff()` and related parsing
  - `DiffFile` struct

### From Sketch Frontend
- `sketch-diff2-view.ts` → `diff-viewer.ts` (simplified)
- `sketch-monaco-view.ts` → `monaco-view.ts` (no editing)
- `git-data-service.ts` → `services/api.ts` (adapted)
- `types.ts` → `types.ts` (DiffFile and related types)
- `sketch-tailwind-element.ts` → inline or remove (simplify styling)

### External Dependencies
- Monaco Editor (frontend)
- Lit (frontend web components)
- Tailwind CSS (frontend styling)
- Go standard library (backend, no external deps needed)

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
- [ ] Create `diffreviewer` directory structure
- [ ] Initialize Go module (`go mod init diffreviewer`)
- [ ] Create `cmd/diffreviewer/main.go` with CLI parsing
- [ ] Add CLI flags: base-branch, changed-branch, port, notes, repo
- [ ] Validate CLI arguments

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
- [ ] Add error handling and proper HTTP status codes
- [ ] Add JSON response helpers
- [ ] Test handlers with sample repository

#### Notes System
- [ ] Create `internal/notes/notes.go`
- [ ] Define `Note` struct: `{File string, Line int, Text string}`
- [ ] Implement `LoadNotes(filename)` function
- [ ] Implement `SaveNotes(filename, notes)` function
- [ ] Add file locking mechanism
- [ ] Create `internal/notes/markdown.go`
- [ ] Implement markdown formatting for notes
- [ ] Parse existing markdown notes file if it exists
- [ ] Test notes I/O with sample data

#### API Handlers - Notes
- [ ] Create `internal/handlers/notes.go`
- [ ] Implement `GET /api/notes` handler
- [ ] Implement `POST /api/notes` handler (add/update)
- [ ] Implement `DELETE /api/notes` handler
- [ ] Add validation for note data
- [ ] Thread-safe access to notes file
- [ ] Test concurrent note updates

#### Shutdown
- [ ] Create `internal/handlers/shutdown.go`
- [ ] Implement `POST /api/shutdown` handler
- [ ] Trigger graceful server shutdown
- [ ] Ensure notes are flushed before exit
- [ ] Print exit message

### Frontend Tasks

#### Project Setup
- [ ] Create `web` directory structure
- [ ] Initialize npm project (`npm init`)
- [ ] Add dependencies: lit, monaco-editor, tailwindcss
- [ ] Create `vite.config.ts` for build
- [ ] Create `tsconfig.json` for TypeScript
- [ ] Set up Tailwind CSS configuration
- [ ] Create `index.html` template
- [ ] Add build scripts to `package.json`

#### Type Definitions
- [ ] Create `web/src/types.ts`
- [ ] Extract `DiffFile` interface from Sketch
- [ ] Add `Note` interface: `{file: string, line: number, text: string}`
- [ ] Add API response types
- [ ] Export all types

#### API Service
- [ ] Create `web/src/services/api.ts`
- [ ] Implement `fetchDiff()` function
- [ ] Implement `fetchFileContent(hash)` function
- [ ] Add error handling wrapper
- [ ] Add TypeScript types for responses
- [ ] Test API calls

#### Notes Service
- [ ] Create `web/src/services/notes.ts`
- [ ] Implement `fetchNotes()` function
- [ ] Implement `addNote(file, line, text)` function
- [ ] Implement `updateNote(file, line, text)` function
- [ ] Implement `deleteNote(file, line)` function
- [ ] Add local caching of notes
- [ ] Test notes service

#### Monaco Component
- [ ] Create `web/src/components/monaco-view.ts`
- [ ] Extract from `sketch-monaco-view.ts`
- [ ] Remove edit functionality (read-only)
- [ ] Keep diff display with syntax highlighting
- [ ] Add line click event for notes
- [ ] Add glyph decorations for lines with notes
- [ ] Style notes indicators (e.g., comment icons)
- [ ] Test Monaco integration

#### Diff Viewer Component
- [ ] Create `web/src/components/diff-viewer.ts`
- [ ] Simplify from `sketch-diff2-view.ts`
- [ ] Remove range picker (branches from backend)
- [ ] Keep file selector dropdown
- [ ] Add file statistics display (+/- counts)
- [ ] Load diff on mount
- [ ] Handle loading and error states
- [ ] Test file switching

#### Notes Panel Component
- [ ] Create `web/src/components/notes-panel.ts`
- [ ] Add sidebar or overlay for notes
- [ ] Display list of all notes grouped by file
- [ ] Show file name and line number for each note
- [ ] Add "Jump to line" functionality
- [ ] Add edit/delete buttons for notes
- [ ] Add new note form
- [ ] Style notes panel

#### Done Button Component
- [ ] Create `web/src/components/done-button.ts`
- [ ] Add prominent "Done" button in header
- [ ] Call shutdown API on click
- [ ] Show confirmation dialog
- [ ] Display "Shutting down..." message
- [ ] Style done button (prominent, hard to miss)

#### Main App
- [ ] Create `web/src/main.ts`
- [ ] Initialize app shell
- [ ] Register all web components
- [ ] Add global styles
- [ ] Create app layout: header, diff view, notes panel
- [ ] Add dark mode support
- [ ] Test overall integration

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
- [ ] Create root `Makefile`
- [ ] Add `make build-frontend` target (runs vite build)
- [ ] Add `make build-backend` target (runs go build)
- [ ] Add `make build` target (builds both)
- [ ] Embed frontend assets into Go binary
- [ ] Add `make dev` target for development
- [ ] Add `make clean` target
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
- [ ] Document CLI flags
- [ ] Add screenshots
- [ ] Document notes file format
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

## Success Criteria

1. ✅ CLI successfully parses arguments and starts server
2. ✅ Browser opens to correct URL
3. ✅ Diff displays correctly for given branches
4. ✅ User can navigate between files
5. ✅ User can click line to add note
6. ✅ Notes save to markdown file immediately
7. ✅ Markdown file has correct format with file and line info
8. ✅ "Done" button exits program gracefully
9. ✅ Program works on Linux, macOS, and Windows
10. ✅ Single binary with no external dependencies
