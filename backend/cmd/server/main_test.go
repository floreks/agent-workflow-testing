package main

import (
	"bytes"
	"database/sql"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/DATA-DOG/go-sqlmock"
)

func TestHandleHealth(t *testing.T) {
	db, mock := newMockDB(t)
	defer db.Close()

	mock.ExpectPing()

	app := &server{db: db}
	req := httptest.NewRequest(http.MethodGet, "/api/health", nil)
	res := httptest.NewRecorder()
	app.handleHealth(res, req)

	if res.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d", http.StatusOK, res.Code)
	}

	var payload map[string]string
	if err := json.NewDecoder(res.Body).Decode(&payload); err != nil {
		t.Fatalf("decode json: %v", err)
	}

	if payload["status"] != "ok" {
		t.Fatalf("expected status ok, got %q", payload["status"])
	}
	if payload["version"] == "" {
		t.Fatalf("expected non-empty version")
	}

	assertMockExpectations(t, mock)
}

func TestHandleHealth_MethodNotAllowed(t *testing.T) {
	db, mock := newMockDB(t)
	defer db.Close()

	app := &server{db: db}
	req := httptest.NewRequest(http.MethodPost, "/api/health", nil)
	res := httptest.NewRecorder()
	app.handleHealth(res, req)

	if res.Code != http.StatusMethodNotAllowed {
		t.Fatalf("expected status %d, got %d", http.StatusMethodNotAllowed, res.Code)
	}

	assertMockExpectations(t, mock)
}

func TestHandleListMessages(t *testing.T) {
	db, mock := newMockDB(t)
	defer db.Close()

	createdAt := time.Date(2026, 4, 30, 12, 0, 0, 0, time.UTC)
	rows := sqlmock.NewRows([]string{"id", "content", "created_at"}).AddRow(1, "hello", createdAt)

	mock.ExpectQuery("SELECT id, content, created_at FROM messages").WillReturnRows(rows)

	app := &server{db: db}
	req := httptest.NewRequest(http.MethodGet, "/api/messages", nil)
	res := httptest.NewRecorder()
	app.handleListMessages(res, req)

	if res.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d", http.StatusOK, res.Code)
	}

	var payload []message
	if err := json.NewDecoder(res.Body).Decode(&payload); err != nil {
		t.Fatalf("decode json: %v", err)
	}
	if len(payload) != 1 {
		t.Fatalf("expected 1 message, got %d", len(payload))
	}
	if payload[0].ID != 1 || payload[0].Content != "hello" {
		t.Fatalf("unexpected message: %+v", payload[0])
	}

	assertMockExpectations(t, mock)
}

func TestHandleCreateMessage(t *testing.T) {
	db, mock := newMockDB(t)
	defer db.Close()

	createdAt := time.Date(2026, 4, 30, 12, 0, 0, 0, time.UTC)
	rows := sqlmock.NewRows([]string{"id", "content", "created_at"}).AddRow(42, "hi", createdAt)

	mock.ExpectQuery(`INSERT INTO messages \(content\) VALUES \(\$1\) RETURNING id, content, created_at`).
		WithArgs("hi").
		WillReturnRows(rows)

	app := &server{db: db}
	body := bytes.NewBufferString(`{"content":"hi"}`)
	req := httptest.NewRequest(http.MethodPost, "/api/messages", body)
	res := httptest.NewRecorder()
	app.handleCreateMessage(res, req)

	if res.Code != http.StatusCreated {
		t.Fatalf("expected status %d, got %d", http.StatusCreated, res.Code)
	}

	var payload message
	if err := json.NewDecoder(res.Body).Decode(&payload); err != nil {
		t.Fatalf("decode json: %v", err)
	}
	if payload.ID != 42 || payload.Content != "hi" {
		t.Fatalf("unexpected message: %+v", payload)
	}

	assertMockExpectations(t, mock)
}

func TestHandleCreateMessage_InvalidJSON(t *testing.T) {
	db, mock := newMockDB(t)
	defer db.Close()

	app := &server{db: db}
	req := httptest.NewRequest(http.MethodPost, "/api/messages", bytes.NewBufferString("{"))
	res := httptest.NewRecorder()
	app.handleCreateMessage(res, req)

	if res.Code != http.StatusBadRequest {
		t.Fatalf("expected status %d, got %d", http.StatusBadRequest, res.Code)
	}

	assertMockExpectations(t, mock)
}

func TestHandleCreateMessage_EmptyContent(t *testing.T) {
	db, mock := newMockDB(t)
	defer db.Close()

	app := &server{db: db}
	body := bytes.NewBufferString(`{"content":""}`)
	req := httptest.NewRequest(http.MethodPost, "/api/messages", body)
	res := httptest.NewRecorder()
	app.handleCreateMessage(res, req)

	if res.Code != http.StatusBadRequest {
		t.Fatalf("expected status %d, got %d", http.StatusBadRequest, res.Code)
	}

	assertMockExpectations(t, mock)
}

func newMockDB(t *testing.T) (*sql.DB, sqlmock.Sqlmock) {
	t.Helper()

	db, mock, err := sqlmock.New(sqlmock.MonitorPingsOption(true))
	if err != nil {
		t.Fatalf("sqlmock new: %v", err)
	}
	return db, mock
}

func assertMockExpectations(t *testing.T, mock sqlmock.Sqlmock) {
	t.Helper()
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet sqlmock expectations: %v", err)
	}
}
