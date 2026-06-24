// Package handlers contains HTTP handler implementations for all API routes.
package handlers

import (
	"context"
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"agent-workflow-testing/backend/internal/models"
	"agent-workflow-testing/shared/version"
)

// API groups all handler dependencies.
type API struct {
	DB *sql.DB
}

// New returns a configured API handler group.
func New(db *sql.DB) *API {
	return &API{DB: db}
}

// HandleHealth responds to GET /api/health with database ping metrics.
func (a *API) HandleHealth(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeError(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	latency, err := pingDB(r.Context(), a.DB)
	if err != nil {
		writeError(w, "database unreachable", http.StatusServiceUnavailable)
		return
	}

	WriteJSON(w, http.StatusOK, models.HealthResponse{
		Status:    "ok",
		Version:   version.FullVersion(),
		DBPingMs:  latency.Milliseconds(),
		Timestamp: time.Now().UnixMilli(),
	})
}

// HandleMessages dispatches GET and POST requests for /api/messages.
func (a *API) HandleMessages(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		a.listMessages(w, r)
	case http.MethodPost:
		a.createMessage(w, r)
	default:
		writeError(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}

// HandleMessage dispatches DELETE for /api/messages/{id}.
func (a *API) HandleMessage(w http.ResponseWriter, r *http.Request) {
	idStr := strings.TrimPrefix(r.URL.Path, "/api/messages/")
	id, err := strconv.Atoi(idStr)
	if err != nil || id < 1 {
		writeError(w, "invalid message id", http.StatusBadRequest)
		return
	}

	switch r.Method {
	case http.MethodDelete:
		a.deleteMessage(w, r, id)
	default:
		writeError(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}

// HandleStats returns database connection pool statistics.
func (a *API) HandleStats(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeError(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	stats := a.DB.Stats()
	WriteJSON(w, http.StatusOK, map[string]any{
		"openConnections": stats.OpenConnections,
		"inUse":           stats.InUse,
		"idle":            stats.Idle,
		"waitCount":       stats.WaitCount,
		"waitDuration":    stats.WaitDuration.String(),
	})
}

// ---- private helpers ----

func (a *API) listMessages(w http.ResponseWriter, r *http.Request) {
	limitStr := r.URL.Query().Get("limit")
	limit := 20
	if limitStr != "" {
		if parsed, err := strconv.Atoi(limitStr); err == nil && parsed > 0 && parsed <= 100 {
			limit = parsed
		}
	}

	rows, err := a.DB.QueryContext(
		r.Context(),
		`SELECT id, content, author, created_at, updated_at
		 FROM messages
		 ORDER BY created_at DESC
		 LIMIT $1`,
		limit,
	)
	if err != nil {
		log.Printf("listMessages query error: %v", err)
		writeError(w, "query failed", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var results []models.Message
	for rows.Next() {
		var msg models.Message
		if err := rows.Scan(&msg.ID, &msg.Content, &msg.Author, &msg.CreatedAt, &msg.UpdatedAt); err != nil {
			writeError(w, "scan failed", http.StatusInternalServerError)
			return
		}
		results = append(results, msg)
	}
	if err := rows.Err(); err != nil {
		writeError(w, "rows error", http.StatusInternalServerError)
		return
	}
	if results == nil {
		results = []models.Message{}
	}

	WriteJSON(w, http.StatusOK, results)
}

func (a *API) createMessage(w http.ResponseWriter, r *http.Request) {
	var req models.CreateMessageRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, "invalid json body", http.StatusBadRequest)
		return
	}

	if errMsg := req.Validate(); errMsg != "" {
		writeError(w, errMsg, http.StatusUnprocessableEntity)
		return
	}

	var msg models.Message
	row := a.DB.QueryRowContext(
		r.Context(),
		`INSERT INTO messages (content, author)
		 VALUES ($1, $2)
		 RETURNING id, content, author, created_at, updated_at`,
		strings.TrimSpace(req.Content),
		strings.TrimSpace(req.Author),
	)
	if err := row.Scan(&msg.ID, &msg.Content, &msg.Author, &msg.CreatedAt, &msg.UpdatedAt); err != nil {
		log.Printf("createMessage insert error: %v", err)
		writeError(w, "insert failed", http.StatusInternalServerError)
		return
	}

	WriteJSON(w, http.StatusCreated, msg)
}

func (a *API) deleteMessage(w http.ResponseWriter, r *http.Request, id int) {
	result, err := a.DB.ExecContext(
		r.Context(),
		`DELETE FROM messages WHERE id = $1`,
		id,
	)
	if err != nil {
		log.Printf("deleteMessage error: %v", err)
		writeError(w, "delete failed", http.StatusInternalServerError)
		return
	}
	rows, _ := result.RowsAffected()
	if rows == 0 {
		writeError(w, "message not found", http.StatusNotFound)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// WriteJSON serialises payload to JSON and writes it to w.
func WriteJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(payload); err != nil {
		log.Printf("writeJSON encode error: %v", err)
	}
}

func writeError(w http.ResponseWriter, message string, status int) {
	WriteJSON(w, status, models.ErrorResponse{
		Error: message,
		Code:  status,
	})
}

func pingDB(ctx context.Context, db *sql.DB) (time.Duration, error) {
	start := time.Now()
	err := db.PingContext(ctx)
	return time.Since(start), err
}
