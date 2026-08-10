package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strconv"
	"syscall"
	"time"

	"agent-workflow-testing/backend/internal/db"
	"agent-workflow-testing/shared/version"
)

type message struct {
	ID        int       `json:"id"`
	Content   string    `json:"content"`
	CreatedAt time.Time `json:"createdAt"`
}

type server struct {
	db *sql.DB
}

func main() {
	cfg := db.ConfigFromEnv()

	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	database, err := db.Connect(ctx, cfg)
	if err != nil {
		log.Fatalf("db connect failed: %v", err)
	}
	defer database.Close()

	if err := db.EnsureSchema(ctx, database); err != nil {
		log.Fatalf("db schema failed: %v", err)
	}

	app := &server{db: database}

	mux := http.NewServeMux()
	mux.HandleFunc("GET /api/health", app.handleHealth)
	mux.HandleFunc("GET /api/messages", app.handleListMessages)
	mux.HandleFunc("POST /api/messages", app.handleCreateMessage)
	mux.HandleFunc("DELETE /api/messages/{id}", app.handleDeleteMessage)

	addr := getenv("APP_ADDR", ":8080")
	server := &http.Server{
		Addr:              addr,
		Handler:           logRequests(mux),
		ReadHeaderTimeout: 5 * time.Second,
	}

	go func() {
		log.Printf("backend listening on %s", addr)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("server error: %v", err)
		}
	}()

	<-ctx.Done()

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := server.Shutdown(shutdownCtx); err != nil {
		log.Printf("server shutdown error: %v", err)
	}
}

func (s *server) handleHealth(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	if err := s.db.PingContext(r.Context()); err != nil {
		http.Error(w, "database ping failed", http.StatusInternalServerError)
		return
	}

	payload := map[string]string{
		"status":  "ok",
		"version": version.AppVersion,
	}

	writeJSON(w, http.StatusOK, payload)
}

func (s *server) handleDeleteMessage(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "invalid id", http.StatusBadRequest)
		return
	}

	if err := db.DeleteMessage(r.Context(), s.db, id); err != nil {
		if err == sql.ErrNoRows {
			http.Error(w, "message not found", http.StatusNotFound)
			return
		}
		log.Printf("delete failed: %v", err)
		http.Error(w, "delete failed", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (s *server) handleListMessages(w http.ResponseWriter, r *http.Request) {
	rows, err := s.db.QueryContext(r.Context(), `SELECT id, content, created_at FROM messages ORDER BY created_at DESC LIMIT 20`)
	if err != nil {
		http.Error(w, "query failed", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var results []message
	for rows.Next() {
		var msg message
		if err := rows.Scan(&msg.ID, &msg.Content, &msg.CreatedAt); err != nil {
			http.Error(w, "scan failed", http.StatusInternalServerError)
			return
		}
		results = append(results, msg)
	}
	if err := rows.Err(); err != nil {
		http.Error(w, "rows failed", http.StatusInternalServerError)
		return
	}

	writeJSON(w, http.StatusOK, results)
}

func (s *server) handleCreateMessage(w http.ResponseWriter, r *http.Request) {
	var payload struct {
		Content string `json:"content"`
	}
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, "invalid json", http.StatusBadRequest)
		return
	}
	if payload.Content == "" {
		http.Error(w, "content required", http.StatusBadRequest)
		return
	}

	var msg message
	row := s.db.QueryRowContext(r.Context(), `INSERT INTO messages (content) VALUES ($1) RETURNING id, content, created_at`, payload.Content)
	if err := row.Scan(&msg.ID, &msg.Content, &msg.CreatedAt); err != nil {
		http.Error(w, "insert failed", http.StatusInternalServerError)
		return
	}

	writeJSON(w, http.StatusCreated, msg)
}

func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(payload); err != nil {
		log.Printf("write json error: %v", err)
	}
}

func logRequests(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		next.ServeHTTP(w, r)
		log.Printf("%s %s %s", r.Method, r.URL.Path, time.Since(start))
	})
}

func getenv(key, fallback string) string {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}
	return value
}
