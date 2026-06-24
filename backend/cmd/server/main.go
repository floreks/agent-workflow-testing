// Command server is the entry point for the Agent Workflow Testing API.
package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"agent-workflow-testing/backend/internal/api"
	"agent-workflow-testing/backend/internal/db"
	"agent-workflow-testing/shared/version"
)

func main() {
	log.SetFlags(log.Ldate | log.Ltime | log.Lmicroseconds | log.LUTC)
	log.Printf("starting agent-workflow-testing backend v%s", version.FullVersion())

	cfg := db.ConfigFromEnv()

	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	database, err := db.Connect(ctx, cfg)
	if err != nil {
		log.Fatalf("db connect: %v", err)
	}
	defer database.Close()
	log.Println("db: connection pool established")

	if err := db.EnsureSchema(ctx, database); err != nil {
		log.Fatalf("db schema: %v", err)
	}

	router := api.NewRouter(database)

	addr := getenv("APP_ADDR", ":8080")
	httpServer := &http.Server{
		Addr:              addr,
		Handler:           router,
		ReadTimeout:       15 * time.Second,
		WriteTimeout:      15 * time.Second,
		IdleTimeout:       60 * time.Second,
		ReadHeaderTimeout: 5 * time.Second,
		MaxHeaderBytes:    1 << 20, // 1 MiB
	}

	serverErr := make(chan error, 1)
	go func() {
		log.Printf("http: listening on %s", addr)
		if err := httpServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			serverErr <- err
		}
	}()

	select {
	case err := <-serverErr:
		log.Fatalf("http server fatal error: %v", err)
	case <-ctx.Done():
		log.Println("shutdown signal received")
	}

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := httpServer.Shutdown(shutdownCtx); err != nil {
		log.Printf("http server shutdown error: %v", err)
	} else {
		log.Println("http server stopped cleanly")
	}

	stats := db.Stats(database)
	log.Printf("db stats at shutdown: open=%d in_use=%d idle=%d",
		stats.OpenConnections, stats.InUse, stats.Idle)
}

func getenv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
