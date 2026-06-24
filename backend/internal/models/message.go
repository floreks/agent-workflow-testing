// Package models defines the core domain types for the application.
package models

import "time"

// Message represents a user-submitted message stored in the database.
type Message struct {
	ID        int       `json:"id"`
	Content   string    `json:"content"`
	Author    string    `json:"author,omitempty"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt,omitempty"`
}

// CreateMessageRequest is the payload accepted by the POST /api/messages endpoint.
type CreateMessageRequest struct {
	Content string `json:"content"`
	Author  string `json:"author,omitempty"`
}

// Validate returns a non-nil error string if the request is malformed.
func (r CreateMessageRequest) Validate() string {
	if r.Content == "" {
		return "content is required"
	}
	if len(r.Content) > 2000 {
		return "content exceeds maximum length of 2000 characters"
	}
	if len(r.Author) > 100 {
		return "author exceeds maximum length of 100 characters"
	}
	return ""
}

// HealthResponse is the payload returned by GET /api/health.
type HealthResponse struct {
	Status    string `json:"status"`
	Version   string `json:"version"`
	DBPingMs  int64  `json:"dbPingMs"`
	Timestamp int64  `json:"timestamp"`
}

// ErrorResponse is a standard JSON error envelope.
type ErrorResponse struct {
	Error   string `json:"error"`
	Code    int    `json:"code"`
	TraceID string `json:"traceId,omitempty"`
}
