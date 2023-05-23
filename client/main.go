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
		if len(args) < 2 {
			// Log error?
			return nil
		}
		pattern := args[0].String()
		valid := args[1].String()
		required := args[2].String()
		log.Printf("Solving %q %q %q", pattern, valid, required)
		results := s.Solve(pattern, valid, required)

		// js.go only handles []any, not []Type.
		anySlice := make([]any, len(results))
		for i, s := range results {
			anySlice[i] = s
		}
		return anySlice
	})

	js.Global().Get("window").Set("solve", fn)
}

func main() {
	log.Println("Started client!")

	exportSolve()
	<-make(chan bool)
}
