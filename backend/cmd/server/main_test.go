package main

import (
	"bytes"
	"context"
	"database/sql"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib"
)

// newRequest is a test helper that builds an httptest.Request.
func newRequest(method, target string, body []byte) *http.Request {
	if body != nil {
		r := httptest.NewRequest(method, target, bytes.NewReader(body))
		r.Header.Set("Content-Type", "application/json")
		return r
	}
	return httptest.NewRequest(method, target, nil)
}

// unreachableDB returns a *sql.DB configured to connect to a non-existent
// address so that every database call will return a connection error.
func unreachableDB(t *testing.T) *sql.DB {
	t.Helper()
	db, err := sql.Open("pgx", "host=127.0.0.1 port=1 user=x password=x dbname=x sslmode=disable")
	if err != nil {
		t.Fatalf("sql.Open: %v", err)
	}
	db.SetMaxOpenConns(1)
	db.SetConnMaxLifetime(1 * time.Millisecond)
	t.Cleanup(func() { _ = db.Close() })
	return db
}

// ---- helper / utility tests --------------------------------------------------

func TestGetenv(t *testing.T) {
	t.Setenv("TEST_GETENV_KEY", "hello")
	if got := getenv("TEST_GETENV_KEY", "default"); got != "hello" {
		t.Fatalf("expected hello, got %s", got)
	}
	if got := getenv("TEST_GETENV_UNSET", "fallback"); got != "fallback" {
		t.Fatalf("expected fallback, got %s", got)
	}
}

func TestWriteJSON_StatusAndContentType(t *testing.T) {
	w := httptest.NewRecorder()
	writeJSON(w, http.StatusCreated, map[string]string{"k": "v"})

	res := w.Result()
	if res.StatusCode != http.StatusCreated {
		t.Fatalf("expected 201, got %d", res.StatusCode)
	}
	if ct := res.Header.Get("Content-Type"); ct != "application/json" {
		t.Fatalf("expected application/json, got %s", ct)
	}
	var out map[string]string
	if err := json.NewDecoder(res.Body).Decode(&out); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if out["k"] != "v" {
		t.Fatalf("unexpected payload: %v", out)
	}
}

func TestMessageJSONRoundTrip(t *testing.T) {
	now := time.Date(2024, 6, 1, 12, 0, 0, 0, time.UTC)
	orig := message{ID: 7, Content: "test content", CreatedAt: now}
	b, err := json.Marshal(orig)
	if err != nil {
		t.Fatalf("marshal: %v", err)
	}
	var decoded message
	if err := json.Unmarshal(b, &decoded); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	if decoded.ID != 7 || decoded.Content != "test content" {
		t.Fatalf("roundtrip mismatch: %+v", decoded)
	}
}

func TestLogRequestsMiddleware(t *testing.T) {
	inner := http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
	})
	w := httptest.NewRecorder()
	logRequests(inner).ServeHTTP(w, newRequest(http.MethodGet, "/ping", nil))
	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}
}

// ---- handleHealth ------------------------------------------------------------

func TestHandleHealth_MethodNotAllowed(t *testing.T) {
	s := &server{db: nil}
	w := httptest.NewRecorder()
	s.handleHealth(w, newRequest(http.MethodPost, "/api/health", nil))
	if w.Code != http.StatusMethodNotAllowed {
		t.Fatalf("expected 405, got %d", w.Code)
	}
}

func TestHandleHealth_DBError(t *testing.T) {
	s := &server{db: unreachableDB(t)}
	w := httptest.NewRecorder()
	r := newRequest(http.MethodGet, "/api/health", nil)
	// Supply a context so the ping can time out quickly.
	ctx, cancel := context.WithTimeout(r.Context(), 2*time.Second)
	defer cancel()
	s.handleHealth(w, r.WithContext(ctx))
	if w.Code != http.StatusInternalServerError {
		t.Fatalf("expected 500 on db error, got %d", w.Code)
	}
}

// ---- handleMessages (routing) ------------------------------------------------

func TestHandleMessages_MethodNotAllowed(t *testing.T) {
	s := &server{db: nil}
	w := httptest.NewRecorder()
	s.handleMessages(w, newRequest(http.MethodPut, "/api/messages", nil))
	if w.Code != http.StatusMethodNotAllowed {
		t.Fatalf("expected 405, got %d", w.Code)
	}
}

// ---- handleCreateMessage -----------------------------------------------------

func TestHandleCreateMessage_InvalidJSON(t *testing.T) {
	s := &server{db: nil}
	w := httptest.NewRecorder()
	s.handleCreateMessage(w, newRequest(http.MethodPost, "/api/messages", []byte(`not json`)))
	if w.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", w.Code)
	}
}

func TestHandleCreateMessage_EmptyContent(t *testing.T) {
	s := &server{db: nil}
	w := httptest.NewRecorder()
	body, _ := json.Marshal(map[string]string{"content": ""})
	s.handleCreateMessage(w, newRequest(http.MethodPost, "/api/messages", body))
	if w.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", w.Code)
	}
}

func TestHandleCreateMessage_DBError(t *testing.T) {
	s := &server{db: unreachableDB(t)}
	w := httptest.NewRecorder()
	body, _ := json.Marshal(map[string]string{"content": "hello"})
	r := newRequest(http.MethodPost, "/api/messages", body)
	ctx, cancel := context.WithTimeout(r.Context(), 2*time.Second)
	defer cancel()
	s.handleCreateMessage(w, r.WithContext(ctx))
	if w.Code != http.StatusInternalServerError {
		t.Fatalf("expected 500 on db error, got %d", w.Code)
	}
}

// ---- handleListMessages ------------------------------------------------------

func TestHandleListMessages_DBError(t *testing.T) {
	s := &server{db: unreachableDB(t)}
	w := httptest.NewRecorder()
	r := newRequest(http.MethodGet, "/api/messages", nil)
	ctx, cancel := context.WithTimeout(r.Context(), 2*time.Second)
	defer cancel()
	s.handleListMessages(w, r.WithContext(ctx))
	if w.Code != http.StatusInternalServerError {
		t.Fatalf("expected 500 on db error, got %d", w.Code)
	}
}

// ---- handleMessageByID -------------------------------------------------------

func TestHandleMessageByID_InvalidIDs(t *testing.T) {
	cases := []struct {
		name string
		path string
	}{
		{"non-numeric", "/api/messages/abc"},
		{"zero", "/api/messages/0"},
		{"negative", "/api/messages/-5"},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			s := &server{db: nil}
			w := httptest.NewRecorder()
			s.handleMessageByID(w, newRequest(http.MethodDelete, tc.path, nil))
			if w.Code != http.StatusBadRequest {
				t.Fatalf("%s: expected 400, got %d", tc.name, w.Code)
			}
		})
	}
}

func TestHandleMessageByID_MethodNotAllowed(t *testing.T) {
	s := &server{db: nil}
	w := httptest.NewRecorder()
	// Only DELETE is allowed on /api/messages/{id}
	s.handleMessageByID(w, newRequest(http.MethodGet, "/api/messages/1", nil))
	if w.Code != http.StatusMethodNotAllowed {
		t.Fatalf("expected 405, got %d", w.Code)
	}
}

// ---- handleDeleteMessage -----------------------------------------------------

func TestHandleDeleteMessage_DBError(t *testing.T) {
	s := &server{db: unreachableDB(t)}
	w := httptest.NewRecorder()
	r := newRequest(http.MethodDelete, "/api/messages/1", nil)
	ctx, cancel := context.WithTimeout(r.Context(), 2*time.Second)
	defer cancel()
	s.handleDeleteMessage(w, r.WithContext(ctx), 1)
	if w.Code != http.StatusInternalServerError {
		t.Fatalf("expected 500 on db error, got %d", w.Code)
	}
}
