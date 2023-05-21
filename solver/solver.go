package solver

import (
	"sort"
	"strings"
)

type Solver struct {
	words map[string]bool
}

func New(words map[string]bool) Solver {
	return Solver{
		words: words,
	}
}

func (s Solver) Solve(valid string, required rune) []string {
	invalid := ""
	for r := 'a'; r <= 'z'; r++ {
		if !strings.ContainsRune(valid, r) {
			invalid += string(r)
		}
	}

	var results []string
	for word := range s.words {
		if len(word) <= 3 {
			continue
		}

		if !strings.ContainsRune(word, required) {
			continue
		}
		if strings.ContainsAny(word, invalid) {
			continue
		}

		results = append(results, word)
	}
	sort.Strings(results)
	return results
}
