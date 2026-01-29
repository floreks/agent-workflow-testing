package db

import (
	"context"
	"database/sql"
	"fmt"
	"os"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib"
)

type Config struct {
	Host     string
	Port     string
	User     string
	Password string
	Name     string
	SSLMode  string
}

func ConfigFromEnv() Config {
	return Config{
		Host:     getenv("DB_HOST", "db"),
		Port:     getenv("DB_PORT", "5432"),
		User:     getenv("DB_USER", "app"),
		Password: getenv("DB_PASSWORD", "app"),
		Name:     getenv("DB_NAME", "app"),
		SSLMode:  getenv("DB_SSLMODE", "disable"),
	}
}

func Connect(ctx context.Context, cfg Config) (*sql.DB, error) {
	dsn := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=%s", cfg.Host, cfg.Port, cfg.User, cfg.Password, cfg.Name, cfg.SSLMode)

	db, err := sql.Open("pgx", dsn)
	if err != nil {
		return nil, err
	}

	db.SetMaxOpenConns(10)
	db.SetMaxIdleConns(5)
	db.SetConnMaxLifetime(30 * time.Minute)

	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	if err := db.PingContext(ctx); err != nil {
		_ = db.Close()
		return nil, err
	}

	return db, nil
}

func EnsureSchema(ctx context.Context, db *sql.DB) error {
	const stmt = `
CREATE TABLE IF NOT EXISTS messages (
	id SERIAL PRIMARY KEY,
	content TEXT NOT NULL,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
`

	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	_, err := db.ExecContext(ctx, stmt)
	return err
}

func getenv(key, fallback string) string {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}
	return value
}
