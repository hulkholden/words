package main

import (
	"log"
	"time"
)

func run() {
	tick := time.Tick(1 * time.Second)
	for range tick {
		log.Printf("Tick")
	}
}

func main() {
	log.Println("Started client!")

	go run()
	<-make(chan bool)
}
