// Package db handles PostgreSQL connectivity and schema management.
package db

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"os"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib"
)

// Config holds all database connection parameters.
type Config struct {
	Host            string
	Port            string
	User            string
	Password        string
	Name            string
	SSLMode         string
	MaxOpenConns    int
	MaxIdleConns    int
	ConnMaxLifetime time.Duration
	ConnectTimeout  time.Duration
}

// ConfigFromEnv builds a Config from environment variables with sensible defaults.
func ConfigFromEnv() Config {
	return Config{
		Host:            getenv("DB_HOST", "db"),
		Port:            getenv("DB_PORT", "5432"),
		User:            getenv("DB_USER", "app"),
		Password:        getenv("DB_PASSWORD", "app"),
		Name:            getenv("DB_NAME", "app"),
		SSLMode:         getenv("DB_SSLMODE", "disable"),
		MaxOpenConns:    25,
		MaxIdleConns:    10,
		ConnMaxLifetime: 30 * time.Minute,
		ConnectTimeout:  10 * time.Second,
	}
}

// DSN returns the PostgreSQL connection string for the given config.
func (c Config) DSN() string {
	return fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		c.Host, c.Port, c.User, c.Password, c.Name, c.SSLMode,
	)
}

// Connect opens and verifies a database connection with retries.
func Connect(ctx context.Context, cfg Config) (*sql.DB, error) {
	database, err := sql.Open("pgx", cfg.DSN())
	if err != nil {
		return nil, fmt.Errorf("open db: %w", err)
	}

	database.SetMaxOpenConns(cfg.MaxOpenConns)
	database.SetMaxIdleConns(cfg.MaxIdleConns)
	database.SetConnMaxLifetime(cfg.ConnMaxLifetime)

	const maxAttempts = 5
	for attempt := 1; attempt <= maxAttempts; attempt++ {
		pingCtx, cancel := context.WithTimeout(ctx, cfg.ConnectTimeout)
		err = database.PingContext(pingCtx)
		cancel()
		if err == nil {
			log.Printf("db: connected to %s:%s/%s (attempt %d)", cfg.Host, cfg.Port, cfg.Name, attempt)
			return database, nil
		}
		log.Printf("db: ping attempt %d/%d failed: %v", attempt, maxAttempts, err)
		select {
		case <-ctx.Done():
			_ = database.Close()
			return nil, ctx.Err()
		case <-time.After(time.Duration(attempt) * time.Second):
		}
	}

	_ = database.Close()
	return nil, fmt.Errorf("db: could not connect after %d attempts: %w", maxAttempts, err)
}

// EnsureSchema creates tables and indexes if they do not already exist.
func EnsureSchema(ctx context.Context, database *sql.DB) error {
	const migrations = `
CREATE TABLE IF NOT EXISTS messages (
	id         SERIAL PRIMARY KEY,
	content    TEXT        NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
	author     TEXT        NOT NULL DEFAULT '',
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages (created_at DESC);

CREATE TABLE IF NOT EXISTS schema_migrations (
	version    TEXT        PRIMARY KEY,
	applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO schema_migrations (version)
VALUES ('001_initial'), ('002_add_author'), ('003_add_updated_at')
ON CONFLICT (version) DO NOTHING;
`

	execCtx, cancel := context.WithTimeout(ctx, 15*time.Second)
	defer cancel()

	if _, err := database.ExecContext(execCtx, migrations); err != nil {
		return fmt.Errorf("schema migration failed: %w", err)
	}
	log.Println("db: schema is up to date")
	return nil
}

// Ping checks whether the database is reachable and returns the round-trip latency.
func Ping(ctx context.Context, database *sql.DB) (time.Duration, error) {
	start := time.Now()
	pingCtx, cancel := context.WithTimeout(ctx, 2*time.Second)
	defer cancel()
	err := database.PingContext(pingCtx)
	return time.Since(start), err
}

// Stats returns a snapshot of current connection pool metrics.
func Stats(database *sql.DB) sql.DBStats {
	return database.Stats()
}

func getenv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
