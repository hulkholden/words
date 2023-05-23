package main

import (
	"embed"
	"log"
	"net/http"
	"os"
	"strings"
	"text/template"

	"github.com/hulkholden/words/data"
	"github.com/hulkholden/words/solver"
	"github.com/hulkholden/words/static"
)

var (
	//go:embed templates/*
	templatesFS embed.FS
	indexTmpl   = template.Must(template.ParseFS(templatesFS, "templates/index.html"))
)

type server struct {
	solver solver.Solver
}

func (s server) index(w http.ResponseWriter, r *http.Request) {
	// By default "/" matches any path - e.g. "/non-existent".
	// Is there a way to do this when the handler is registed?
	if r.URL.Path != "/" {
		http.NotFound(w, r)
		return
	}

	data := map[string]any{
		"WordCount": s.solver.WordCount(),
		"Words":     s.solver.Solve("bnasu", 'b'),
	}
	indexTmpl.Execute(w, data)
}

// makeGzipHandler returns a HTTP HanderFunc which serves a gzipped version of the content.
func makeGzipHandler(h http.Handler) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if !strings.Contains(r.Header.Get("Accept-Encoding"), "gzip") {
			h.ServeHTTP(w, r)
			return
		}
		w.Header().Set("Content-Encoding", "gzip")
		// TODO: figure this out from the underlying file if we use this for more than just the .wasm.
		w.Header().Set("Content-Type", "application/wasm")
		r.URL.Path += ".gz"
		r.URL.RawPath += ".gz"
		h.ServeHTTP(w, r)
	}
}

func main() {
	srv := server{
		solver: solver.New(data.Words),
	}

	http.HandleFunc("/", srv.index)

	staticHandler := http.FileServer(http.FS(static.FS))
	http.Handle("/static/", http.StripPrefix("/static/", staticHandler))
	// If client.wasm is requested, redirect to a gzipped version.
	http.Handle("/static/client.wasm", http.StripPrefix("/static/", makeGzipHandler(staticHandler)))

	if err := http.ListenAndServe(":9090", nil); err != nil {
		log.Println("Failed to start server", err)
		os.Exit(1)
	}
}
