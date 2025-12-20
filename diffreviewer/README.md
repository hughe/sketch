# DiffReviewer

A standalone CLI tool for reviewing git diffs with a web UI and markdown notes export.

## Status

🚧 **Under Development** - Project setup completed

## Project Structure

```
diffreviewer/
├── cmd/diffreviewer/       # CLI entry point
├── internal/               # Internal packages
│   ├── server/            # HTTP server
│   ├── git/               # Git operations
│   ├── notes/             # Notes management
│   └── handlers/          # HTTP handlers
├── web/                   # Frontend (TypeScript/Lit/Vite)
│   ├── src/
│   │   ├── components/   # Web components
│   │   └── services/     # API services
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
├── Makefile              # Build system
└── go.mod               # Go module
```

## Building

```bash
# Build both frontend and backend
make build

# Build frontend only
make build-frontend

# Build backend only
make build-backend

# Clean build artifacts
make clean

# Development mode (frontend only)
make dev
```

## Development Status

### Completed
- ✅ Directory structure
- ✅ Go module initialization
- ✅ Frontend build system (Vite)
- ✅ Tailwind CSS configuration
- ✅ Makefile for builds

### TODO
- See `../diffreviewer-todo.md` for detailed implementation plan
