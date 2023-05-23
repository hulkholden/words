package static

import "embed"

//go:embed *.css *.js *.wasm
var FS embed.FS
