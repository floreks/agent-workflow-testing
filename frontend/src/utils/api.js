/**
 * api.js – thin fetch wrapper for the backend REST API.
 * All functions throw on non-2xx responses so callers can catch uniformly.
 */

const BASE = import.meta.env.VITE_API_BASE || "";

/**
 * Generic request helper.
 * @param {string} path
 * @param {RequestInit} [options]
 * @returns {Promise<any>} Parsed JSON body (or null for 204 responses).
 */
async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  if (res.status === 204) return null;

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    const message = body?.error ?? `HTTP ${res.status}`;
    const err = new Error(message);
    err.status = res.status;
    err.body = body;
    throw err;
  }

  return body;
}

// ── Health ──────────────────────────────────────────────────────────────────

/** @returns {Promise<{ status: string, version: string, dbPingMs: number, timestamp: number }>} */
export function getHealth() {
  return request("/api/health");
}

// ── Messages ─────────────────────────────────────────────────────────────────

/**
 * Fetch the most recent messages.
 * @param {{ limit?: number }} [params]
 * @returns {Promise<Array<{ id: number, content: string, author: string, createdAt: string }>>}
 */
export function getMessages(params = {}) {
  const qs = params.limit ? `?limit=${params.limit}` : "";
  return request(`/api/messages${qs}`);
}

/**
 * Post a new message.
 * @param {{ content: string, author?: string }} payload
 */
export function createMessage(payload) {
  return request("/api/messages", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * Delete a message by ID.
 * @param {number} id
 */
export function deleteMessage(id) {
  return request(`/api/messages/${id}`, { method: "DELETE" });
}

// ── Stats ────────────────────────────────────────────────────────────────────

/** @returns {Promise<{ openConnections: number, inUse: number, idle: number }>} */
export function getStats() {
  return request("/api/stats");
}
