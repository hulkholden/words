package static

import "embed"

//go:embed *.css *.gz *.js *.wasm
var FS embed.FS
