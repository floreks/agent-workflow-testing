package main

import (
	"math/rand"
	"net/http"
)

type joke struct {
	ID     int    `json:"id"`
	Setup  string `json:"setup"`
	Punchline string `json:"punchline"`
}

var jokes = []joke{
	{1, "Why don't scientists trust atoms?", "Because they make up everything!"},
	{2, "Why did the scarecrow win an award?", "Because he was outstanding in his field!"},
	{3, "Why don't eggs tell jokes?", "They'd crack each other up!"},
	{4, "What do you call a fish without eyes?", "A fsh!"},
	{5, "Why did the bicycle fall over?", "Because it was two-tired!"},
	{6, "What do you call cheese that isn't yours?", "Nacho cheese!"},
	{7, "Why can't you give Elsa a balloon?", "Because she'll let it go!"},
	{8, "What do you call a fake noodle?", "An impasta!"},
	{9, "Why did the math book look so sad?", "Because it had too many problems!"},
	{10, "What do you call a sleeping dinosaur?", "A dino-snore!"},
	{11, "Why did the golfer bring an extra pair of pants?", "In case he got a hole in one!"},
	{12, "What do you call a bear with no teeth?", "A gummy bear!"},
	{13, "Why did the programmer quit his job?", "Because he didn't get arrays!"},
	{14, "How do you organize a space party?", "You planet!"},
	{15, "Why did the coffee file a police report?", "It got mugged!"},
}

func (s *server) handleJokes(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// If ?random=true, return a single random joke
	if r.URL.Query().Get("random") == "true" {
		idx := rand.Intn(len(jokes))
		writeJSON(w, http.StatusOK, jokes[idx])
		return
	}

	writeJSON(w, http.StatusOK, jokes)
}
