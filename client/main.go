package main

import (
	"log"
	"syscall/js"

	"github.com/hulkholden/words/data"
	"github.com/hulkholden/words/solver"
)

func exportSolve() {
	s := solver.New(data.Words)

	fn := js.FuncOf(func(this js.Value, args []js.Value) any {
		if len(args) < 3 {
			// Log error?
			return nil
		}
		pattern := args[0].String()
		valid := args[1].String()
		required := args[2].String()
		log.Printf("Solving %q %q %q", pattern, valid, required)
		results := s.Solve(pattern, valid, required)
		return convertSlice(results)
	})

	js.Global().Get("window").Set("solve", fn)
}

// convertSlice converts a slice of any concrete type into a []any.
// This is necessary because js.go only handles []any, not []string and so on.
func convertSlice[T any](a []T) []any {
	anySlice := make([]any, len(a))
	for i, s := range a {
		anySlice[i] = s
	}
	return anySlice
}

func main() {
	log.Println("Started client!")

	exportSolve()
	<-make(chan bool)
}
