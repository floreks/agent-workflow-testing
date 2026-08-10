package db

import (
	"os"
	"testing"
)

func TestConfigFromEnv(t *testing.T) {
	// Save current env and defer restore
	originalHost := os.Getenv("DB_HOST")
	defer func() {
		if originalHost != "" {
			os.Setenv("DB_HOST", originalHost)
		} else {
			os.Unsetenv("DB_HOST")
		}
	}()

	// Test default values
	os.Unsetenv("DB_HOST")
	cfg := ConfigFromEnv()
	if cfg.Host != "db" {
		t.Errorf("expected default Host 'db', got '%s'", cfg.Host)
	}

	// Test custom values
	os.Setenv("DB_HOST", "custom-host")
	cfg = ConfigFromEnv()
	if cfg.Host != "custom-host" {
		t.Errorf("expected Host 'custom-host', got '%s'", cfg.Host)
	}
}
