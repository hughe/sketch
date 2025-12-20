package main

import (
	"embed"
	"fmt"
	"io/fs"
	"log"
	"net/http"
)

//go:embed all:web
var webDist embed.FS

func main() {
	port := ":8000"

	// Serve embedded web files
	distFS, err := fs.Sub(webDist, "web")
	if err != nil {
		log.Fatal(err)
	}

	http.Handle("/", http.FileServer(http.FS(distFS)))

	fmt.Printf("\nDiffReviewer starting on http://localhost%s\n", port)
	if err := http.ListenAndServe(port, nil); err != nil {
		log.Fatal(err)
	}
}
