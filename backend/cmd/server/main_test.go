package main

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestHandleDeleteMessageValidatesPath(t *testing.T) {
	app := &server{db: nil}

	cases := []struct {
		name   string
		path   string
		status int
	}{
		{name: "missing id", path: "/api/messages", status: http.StatusBadRequest},
		{name: "missing id with slash", path: "/api/messages/", status: http.StatusBadRequest},
		{name: "non-numeric id", path: "/api/messages/nope", status: http.StatusBadRequest},
		{name: "negative id", path: "/api/messages/-1", status: http.StatusBadRequest},
		{name: "nested path", path: "/api/messages/123/extra", status: http.StatusBadRequest},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodDelete, tc.path, nil)
			rr := httptest.NewRecorder()

			app.handleDeleteMessage(rr, req)
			if rr.Code != tc.status {
				t.Fatalf("expected status %d, got %d", tc.status, rr.Code)
			}
		})
	}
}
