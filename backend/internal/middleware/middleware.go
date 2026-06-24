// Package middleware provides HTTP middleware for the API server.
package middleware

import (
	"log"
	"math/rand"
	"net/http"
	"strconv"
	"time"
)

// contextKey is an unexported type for context keys in this package.
type contextKey string

const TraceIDKey contextKey = "traceID"

// Logger wraps an http.Handler and emits structured access logs.
func Logger(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		rw := &responseWriter{ResponseWriter: w, status: http.StatusOK}
		next.ServeHTTP(rw, r)
		duration := time.Since(start)
		log.Printf(
			"method=%s path=%q status=%d bytes=%d duration=%s remote=%s",
			r.Method,
			r.URL.Path,
			rw.status,
			rw.bytes,
			duration,
			r.RemoteAddr,
		)
	})
}

// Recover catches panics and returns a 500 response instead of crashing.
func Recover(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if rec := recover(); rec != nil {
				log.Printf("panic recovered: %v", rec)
				http.Error(w, "internal server error", http.StatusInternalServerError)
			}
		}()
		next.ServeHTTP(w, r)
	})
}

// CORS adds permissive CORS headers suitable for local development.
func CORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Trace-ID")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

// TraceID injects a random trace identifier into the response headers.
func TraceID(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		id := r.Header.Get("X-Trace-ID")
		if id == "" {
			id = newTraceID()
		}
		w.Header().Set("X-Trace-ID", id)
		next.ServeHTTP(w, r)
	})
}

// RateLimit is a stub for future request-rate limiting logic.
// Currently it passes all requests through unchanged.
func RateLimit(requestsPerSecond int) func(http.Handler) http.Handler {
	_ = requestsPerSecond // reserved for future implementation
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			next.ServeHTTP(w, r)
		})
	}
}

// Chain applies a sequence of middleware in order (outermost first).
func Chain(h http.Handler, middlewares ...func(http.Handler) http.Handler) http.Handler {
	for i := len(middlewares) - 1; i >= 0; i-- {
		h = middlewares[i](h)
	}
	return h
}

// ---- helpers ----

type responseWriter struct {
	http.ResponseWriter
	status int
	bytes  int
}

func (rw *responseWriter) WriteHeader(status int) {
	rw.status = status
	rw.ResponseWriter.WriteHeader(status)
}

func (rw *responseWriter) Write(b []byte) (int, error) {
	n, err := rw.ResponseWriter.Write(b)
	rw.bytes += n
	return n, err
}

func newTraceID() string {
	const charset = "abcdefghijklmnopqrstuvwxyz0123456789"
	b := make([]byte, 12)
	for i := range b {
		b[i] = charset[rand.Intn(len(charset))]
	}
	return strconv.FormatInt(time.Now().UnixMilli(), 36) + "-" + string(b)
}
