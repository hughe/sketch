package main

import (
	"context"
	"embed"
	"flag"
	"fmt"
	"io/fs"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/hughe/diffreviewer/internal/git"
	"github.com/hughe/diffreviewer/internal/handlers"
	"github.com/hughe/diffreviewer/internal/notes"
)

//go:embed all:web
var webDist embed.FS

func main() {
	var (
		port          = flag.Int("port", 8000, "Port number")
		notesFile     = flag.String("notes", "", "Notes file path (optional, if not specified notes go to stdout)")
		repoDir       = flag.String("repo", ".", "Repository path")
		baseBranch    = flag.String("base", "main", "Base branch")
		changedBranch string
	)

	flag.Parse()

	// Get changed branch from remaining args
	args := flag.Args()
	if len(args) == 0 {
		fmt.Fprintf(os.Stderr, "Usage: diffreviewer [base-branch] <changed-branch> [options]\n")
		fmt.Fprintf(os.Stderr, "\nExamples:\n")
		fmt.Fprintf(os.Stderr, "  diffreviewer feature-branch              # compare to main\n")
		fmt.Fprintf(os.Stderr, "  diffreviewer develop feature-branch      # compare develop to feature-branch\n")
		fmt.Fprintf(os.Stderr, "  diffreviewer feature --notes notes.md    # save notes to file\n")
		flag.PrintDefaults()
		os.Exit(1)
	}

	if len(args) == 1 {
		// Only changed branch provided, use default base
		changedBranch = args[0]
	} else {
		// Both branches provided
		*baseBranch = args[0]
		changedBranch = args[1]
	}

	// Validate branches
	if err := git.ValidateBranch(*repoDir, *baseBranch); err != nil {
		log.Fatalf("Invalid base branch: %v", err)
	}
	if err := git.ValidateBranch(*repoDir, changedBranch); err != nil {
		log.Fatalf("Invalid changed branch: %v", err)
	}

	// Create notes storage
	notesStorage := notes.NewStorage(*notesFile)

	// Create shutdown channel
	shutdownChan := make(chan struct{})

	// Create handler config
	cfg := &handlers.Config{
		RepoDir:       *repoDir,
		BaseBranch:    *baseBranch,
		ChangedBranch: changedBranch,
		NotesStorage:  notesStorage,
		ShutdownChan:  shutdownChan,
	}

	// Set up HTTP routes
	mux := http.NewServeMux()

	// API routes
	mux.HandleFunc("/api/diff", handlers.HandleDiff(cfg))
	mux.HandleFunc("/api/file-content", handlers.HandleFileContent(cfg))
	mux.HandleFunc("/api/save-file", handlers.HandleSaveFile(cfg))
	mux.HandleFunc("/api/notes", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			handlers.HandleGetNotes(cfg)(w, r)
		case http.MethodPost:
			handlers.HandleAddOrUpdateNote(cfg)(w, r)
		case http.MethodDelete:
			handlers.HandleDeleteNote(cfg)(w, r)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})
	mux.HandleFunc("/api/general-notes", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			handlers.HandleGetGeneralNotes(cfg)(w, r)
		case http.MethodPost:
			handlers.HandleUpdateGeneralNotes(cfg)(w, r)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})
	mux.HandleFunc("/api/shutdown", handlers.HandleShutdown(cfg))

	// Serve embedded web files
	distFS, err := fs.Sub(webDist, "web")
	if err != nil {
		log.Fatal(err)
	}
	mux.Handle("/", http.FileServer(http.FS(distFS)))

	// Create HTTP server
	addr := fmt.Sprintf(":%d", *port)
	server := &http.Server{
		Addr:    addr,
		Handler: mux,
	}

	// Handle graceful shutdown
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, os.Interrupt, syscall.SIGTERM)

	go func() {
		select {
		case <-shutdownChan:
			fmt.Println("\nShutdown requested via API...")
		case <-sigChan:
			fmt.Println("\nShutdown signal received...")
		}

		// Write notes to stdout or file
		if *notesFile == "" {
			fmt.Println("\n" + strings.Repeat("=", 80))
			notesStorage.WriteToStdout()
			fmt.Println(strings.Repeat("=", 80) + "\n")
		} else {
			fmt.Printf("Notes saved to: %s\n", *notesFile)
		}

		// Shutdown server
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		if err := server.Shutdown(ctx); err != nil {
			log.Printf("Server shutdown error: %v", err)
		}
	}()

	fmt.Printf("DiffReviewer starting on http://localhost%s\n", addr)
	fmt.Printf("Comparing %s...%s\n", *baseBranch, changedBranch)
	if *notesFile != "" {
		fmt.Printf("Notes will be saved to: %s\n", *notesFile)
	} else {
		fmt.Println("Notes will be printed to stdout on exit")
	}

	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatal(err)
	}
}
