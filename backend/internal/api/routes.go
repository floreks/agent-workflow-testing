// Package api wires together all HTTP routes and middleware into a single http.Handler.
package api

import (
	"database/sql"
	"net/http"

	"agent-workflow-testing/backend/internal/handlers"
	"agent-workflow-testing/backend/internal/middleware"
)

// NewRouter returns the root http.Handler for the application.
// It registers all API routes and wraps the mux with standard middleware.
func NewRouter(db *sql.DB) http.Handler {
	h := handlers.New(db)
	mux := http.NewServeMux()

	// Health & observability
	mux.HandleFunc("/api/health", h.HandleHealth)
	mux.HandleFunc("/api/stats", h.HandleStats)

	// Messages resource
	mux.HandleFunc("/api/messages", h.HandleMessages)
	mux.HandleFunc("/api/messages/", h.HandleMessage)

	// Readiness probe (alias for health)
	mux.HandleFunc("/api/ready", h.HandleHealth)

	// Not-found fallback for /api/*
	mux.HandleFunc("/api/", func(w http.ResponseWriter, r *http.Request) {
		http.Error(w, `{"error":"not found","code":404}`, http.StatusNotFound)
	})

	return middleware.Chain(
		mux,
		middleware.Recover,
		middleware.TraceID,
		middleware.CORS,
		middleware.Logger,
		middleware.RateLimit(200),
	)
}
