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
	validRunes := make(map[rune]bool)
	if valid != "" {
		for r := 'a'; r <= 'z'; r++ {
			if strings.ContainsRune(valid, r) || strings.ContainsRune(required, r) {
				validRunes[r] = true
			}
		}
	}

	var results []string
	for word := range s.words {
		if !matchesPattern(word, pattern, validRunes) {
			continue
		}
		if !containsAll(word, required) {
			continue
		}
		results = append(results, word)
	}
	sort.Strings(results)
	return results
}

func matchesPattern(candidate, pattern string, validRunes map[rune]bool) bool {
	if len(candidate) != len(pattern) {
		return false
	}

	for i := range pattern {
		pc := pattern[i]
		cc := candidate[i]
		if pc == '_' {
			if len(validRunes) > 0 && !validRunes[rune(cc)] {
				return false
			}
		} else {
			if cc != pc {
				return false
			}
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
