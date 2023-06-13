package main

import "testing"

func Test_canonicalizeBasePath(t *testing.T) {
	tests := map[string]struct {
		s    string
		want string
	}{
		"empty":         {"", "/"},
		"simple":        {"foo", "/foo/"},
		"with leading":  {"/foo", "/foo/"},
		"with trailing": {"foo/", "/foo/"},
		"slash":         {"/", "/"},
	}
	for tn, tc := range tests {
		t.Run(tn, func(t *testing.T) {
			if got := canonicalizeBasePath(tc.s); got != tc.want {
				t.Errorf("canonicalizeBasePath(%q) = %v, want %v", tc.s, got, tc.want)
			}
		})
	}
}
