package solver

import (
	"sort"
	"strings"
)

type Solver struct {
	words map[string]bool
}

func New(data string) Solver {
	return Solver{
		words: parseWords(data),
	}
}

func parseWords(data string) map[string]bool {
	words := make(map[string]bool)
	for _, word := range strings.Split(data, "\n") {
		words[word] = true
	}
	return words
}

func (s Solver) WordCount() int {
	return len(s.words)
}

func (s Solver) Solve(pattern, valid, required string) []string {
	invalid := ""
	if valid != "" {
		for r := 'a'; r <= 'z'; r++ {
			if !strings.ContainsRune(valid, r) {
				invalid += string(r)
			}
		}
	}

	var results []string
	for word := range s.words {
		if len(word) != len(pattern) {
			continue
		}

		if !matchesPattern(word, pattern) {
			continue
		}
		if !containsAll(word, required) {
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

func matchesPattern(s, p string) bool {
	for i := range p {
		pc := p[i]
		sc := s[i]
		if pc != '_' && sc != pc {
			return false
		}
	}
	return true
}

func containsAll(s string, required string) bool {
	for _, r := range required {
		if !strings.ContainsRune(s, r) {
			return false
		}
	}
	return true
}
