package main

import (
	"embed"
	"log"
	"net/http"
	"os"
	"text/template"

	"github.com/hulkholden/words/static"
)

var (
	//go:embed templates/*
	templatesFS embed.FS
	indexTmpl   = template.Must(template.ParseFS(templatesFS, "templates/index.html"))
)

func index(w http.ResponseWriter, r *http.Request) {
	// By default "/" matches any path - e.g. "/non-existent".
	// Is there a way to do this when the handler is registed?
	if r.URL.Path != "/" {
		http.NotFound(w, r)
		return
	}

	data := map[string]any{}
	indexTmpl.Execute(w, data)
}

func main() {
	http.HandleFunc("/", index)

	staticHandler := http.FileServer(http.FS(static.FS))
	http.Handle("/static/", http.StripPrefix("/static/", staticHandler))

	if err := http.ListenAndServe(":9090", nil); err != nil {
		log.Println("Failed to start server", err)
		os.Exit(1)
	}
}
