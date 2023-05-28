package solver

import (
	"testing"

	"github.com/google/go-cmp/cmp"
	"github.com/google/go-cmp/cmp/cmpopts"
)

func TestSolver_Solve(t *testing.T) {
	s := Solver{
		words: map[string]bool{
			"hello":  true,
			"ball":   true,
			"banana": true,
			"banaba": true,
		},
	}

	tests := map[string]struct {
		pattern  string
		valid    string
		required string
		want     []string
	}{
		"empty": {},
		"exact match": {
			pattern: "hello",
			want:    []string{"hello"},
		},
		"multiple matches": {
			pattern:  "______",
			valid:    "bna",
			required: "b",
			want:     []string{"banana", "banaba"},
		},
		"pattern is used": {
			pattern:  "____n_",
			valid:    "bna",
			required: "b",
			want:     []string{"banana"},
		},
		"required doesn't need to be in valid": {
			pattern:  "______",
			valid:    "na",
			required: "b",
			want:     []string{"banana", "banaba"},
		},
		"no required": {
			pattern:  "______",
			valid:    "bna",
			required: "",
			want:     []string{"banana", "banaba"},
		},
		"only required, matches": {
			pattern:  "______",
			required: "b",
			want:     []string{"banana", "banaba"},
		},
		"only required, no matches": {
			pattern:  "______",
			required: "l",
			want:     nil,
		},
		"pattern has letters not in valid": {
			pattern:  "b___",
			valid:    "al",
			required: "",
			want:     []string{"ball"},
		},
	}
	for tn, tc := range tests {
		t.Run(tn, func(t *testing.T) {
			cmpStrings := func(a, b string) bool { return a < b }
			if got := s.Solve(tc.pattern, tc.valid, tc.required); !cmp.Equal(got, tc.want, cmpopts.SortSlices(cmpStrings)) {
				t.Errorf("Solver.Solve(%q, %q, %q) = %v, want %v", tc.pattern, tc.valid, tc.required, got, tc.want)
			}
		})
	}
}
