package main

import (
	"encoding/csv"
	"flag"
	"fmt"
	"log"
	"os"
	"regexp"
	"strconv"
	"strings"

	"golang.org/x/exp/maps"
	"golang.org/x/exp/slices"
)

var (
	sourceWords       = flag.String("source_words", "", "input path of source words, one per newline")
	profanityWordsCSV = flag.String("profanity_words_csv", "", "input path of profanity words")
	frequencyCSV      = flag.String("frequency_csv", "", "input path of word frequency")

	validWordRE = regexp.MustCompile("^[a-z]+$")
)

func parseWords(data string) []string {
	words := make(map[string]bool)
	for _, word := range strings.Split(data, "\n") {
		words[word] = true
	}
	return maps.Keys(words)
}

func parseCSV(filePath string) ([][]string, error) {
	f, err := os.Open(filePath)
	if err != nil {
		return nil, fmt.Errorf("reading input file: %v", err)
	}
	defer f.Close()

	csvReader := csv.NewReader(f)
	records, err := csvReader.ReadAll()
	if err != nil {
		return nil, fmt.Errorf("parsing CSV: %v", err)
	}
	return records, nil
}

func parseProfanityRecords(records [][]string) map[string]bool {
	if len(records) == 0 {
		return nil
	}
	headers := records[0]

	textIdx := slices.Index(headers, "text")
	severityIdx := slices.Index(headers, "severity_rating")

	words := make(map[string]bool)
	for _, record := range records[1:] {
		if textIdx >= len(record) || severityIdx >= len(record) {
			continue
		}
		word := record[textIdx]
		severityText := record[severityIdx]
		severity, err := strconv.ParseFloat(severityText, 64)
		if err != nil {
			fmt.Fprintf(os.Stderr, "Couldn't parse %q as a float: %v\n", severityText, err)
			continue
		}

		// Allow mild words.
		if severity <= 1 {
			continue
		}

		words[word] = true
	}
	return words
}

func parseFrequencyRecords(records [][]string) map[string]int {
	if len(records) == 0 {
		return nil
	}
	headers := records[0]

	wordIdx := slices.Index(headers, "word")
	countIdx := slices.Index(headers, "count")

	// In theory the data shouldn't have dupes but add to a map to ensure that.
	counts := make(map[string]int64)
	for _, record := range records[1:] {
		if wordIdx >= len(record) || countIdx >= len(record) {
			continue
		}
		word := record[wordIdx]
		countText := record[countIdx]

		count, err := strconv.ParseInt(countText, 10, 64)
		if err != nil {
			fmt.Fprintf(os.Stderr, "Couldn't parse %q as a int: %v\n", countText, err)
			continue
		}
		// If there are dupes, pick the largest count.
		if count > counts[word] {
			counts[word] = count
		}
	}

	// Sort by frequency.
	type wordCount struct {
		word  string
		count int64
	}
	var wordCounts []wordCount
	for w, c := range counts {
		wordCounts = append(wordCounts, wordCount{w, c})
	}
	slices.SortFunc(wordCounts, func(a, b wordCount) bool {
		if d := a.count - b.count; d != 0 {
			return d > 0
		}
		return a.word < b.word
	})

	results := make(map[string]int)
	for rank, wc := range wordCounts {
		results[wc.word] = rank
	}
	return results
}

func filterWords(words []string, badWords map[string]bool, wordRanks map[string]int) []string {
	var results []string
	for _, word := range words {
		if !validWordRE.MatchString(word) {
			//fmt.Printf("Filtering %q - fails regexp\n", word)
			continue
		}
		if badWords[word] {
			// fmt.Printf("Filtering %q - bad word\n", word)
			continue
		}
		if wordRanks[word] == 0 {
			//fmt.Printf("Filtering %q - frequency is zero\n", word)
			continue
		}
		results = append(results, word)
	}
	return results
}

func main() {
	flag.Parse()

	if *sourceWords == "" {
		log.Fatalf("Expecting --source_words")
	}
	if *profanityWordsCSV == "" {
		log.Fatalf("Expecting --profanity_words_csv")
	}
	if *frequencyCSV == "" {
		log.Fatalf("Expecting --frequency_csv")
	}

	wordData, err := os.ReadFile(*sourceWords)
	if err != nil {
		log.Fatalf("Error reading source words %q: %v", *sourceWords, err)
	}
	unfilteredWords := parseWords(string(wordData))

	profanityRecords, err := parseCSV(*profanityWordsCSV)
	if err != nil {
		log.Fatalf("Error reading profanity words %q: %v", *profanityWordsCSV, err)
	}
	badWords := parseProfanityRecords(profanityRecords)

	frequencyRecords, err := parseCSV(*frequencyCSV)
	if err != nil {
		log.Fatalf("Error reading word frequency %q: %v", *frequencyCSV, err)
	}
	wordRanks := parseFrequencyRecords(frequencyRecords)

	filteredWords := filterWords(unfilteredWords, badWords, wordRanks)

	slices.Sort(filteredWords)
	for _, word := range filteredWords {
		fmt.Println(word)
	}
}
