package static

import "embed"

//go:embed *.css *.gz *.js *.svg *.wasm
var FS embed.FS
