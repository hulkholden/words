package main

import (
	"embed"
	"log"
	"net/http"
	"os"
	"strings"
	"text/template"

	"github.com/hulkholden/words/solver"
	"github.com/hulkholden/words/static"
)

var (
	//go:embed templates/*
	templatesFS embed.FS
	indexTmpl   = template.Must(template.ParseFS(templatesFS, "templates/index.html"))

	//go:embed words.txt
	words string
)

func parseWords(data string) map[string]bool {
	words := make(map[string]bool)
	for _, word := range strings.Split(data, "\n") {
		words[word] = true
	}
	return words
}

type server struct {
	wordMap map[string]bool
	solver  solver.Solver
}

func (s server) index(w http.ResponseWriter, r *http.Request) {
	// By default "/" matches any path - e.g. "/non-existent".
	// Is there a way to do this when the handler is registed?
	if r.URL.Path != "/" {
		http.NotFound(w, r)
		return
	}

	data := map[string]any{
		"WordCount": len(s.wordMap),
		"Words":     s.solver.Solve("bnasu", 'b'),
	}
	indexTmpl.Execute(w, data)
}

func main() {
	wordMap := parseWords(words)
	srv := server{
		wordMap: wordMap,
		solver:  solver.New(wordMap),
	}

	http.HandleFunc("/", srv.index)

	staticHandler := http.FileServer(http.FS(static.FS))
	http.Handle("/static/", http.StripPrefix("/static/", staticHandler))

	if err := http.ListenAndServe(":9090", nil); err != nil {
		log.Println("Failed to start server", err)
		os.Exit(1)
	}
}
