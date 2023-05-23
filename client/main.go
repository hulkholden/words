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
		valid := args[0].String()
		required := args[1].String()
		if len(required) != 1 {
			log.Printf("Expecting 1 char for required, got %q", required)
			return nil
		}
		log.Printf("Solving %q %q", valid, required)
		results := s.Solve(valid, []rune(required)[0])

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
