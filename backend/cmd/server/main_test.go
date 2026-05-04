package main

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
)

func TestHandleMessageDeleteInvalidId(t *testing.T) {
	_, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock.New: %v", err)
	}
	t.Cleanup(func() { _ = mock.ExpectationsWereMet() })

	s := &server{db: nil}

	for _, path := range []string{"/api/messages/", "/api/messages/nope", "/api/messages/0", "/api/messages/1/extra"} {
		req := httptest.NewRequest(http.MethodDelete, path, nil)
		rr := httptest.NewRecorder()

		s.handleMessage(rr, req)
		if rr.Code != http.StatusBadRequest {
			t.Fatalf("path %q: expected 400, got %d", path, rr.Code)
		}
	}
}

func TestHandleMessageDeleteNotFound(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock.New: %v", err)
	}
	t.Cleanup(func() {
		_ = db.Close()
		if err := mock.ExpectationsWereMet(); err != nil {
			t.Fatalf("expectations: %v", err)
		}
	})

	s := &server{db: db}

	mock.ExpectExec("DELETE FROM messages WHERE id = \$1").
		WithArgs(123).
		WillReturnResult(sqlmock.NewResult(0, 0))

	req := httptest.NewRequest(http.MethodDelete, "/api/messages/123", nil)
	rr := httptest.NewRecorder()

	s.handleMessage(rr, req)
	if rr.Code != http.StatusNotFound {
		t.Fatalf("expected 404, got %d", rr.Code)
	}
}

func TestHandleMessageDeleteSuccess(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("sqlmock.New: %v", err)
	}
	t.Cleanup(func() {
		_ = db.Close()
		if err := mock.ExpectationsWereMet(); err != nil {
			t.Fatalf("expectations: %v", err)
		}
	})

	s := &server{db: db}

	mock.ExpectExec("DELETE FROM messages WHERE id = \$1").
		WithArgs(5).
		WillReturnResult(sqlmock.NewResult(0, 1))

	req := httptest.NewRequest(http.MethodDelete, "/api/messages/5", nil).WithContext(context.Background())
	rr := httptest.NewRecorder()

	s.handleMessage(rr, req)
	if rr.Code != http.StatusNoContent {
		t.Fatalf("expected 204, got %d", rr.Code)
	}
}
