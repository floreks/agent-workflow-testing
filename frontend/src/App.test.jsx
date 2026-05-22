import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";

// ---------------------------------------------------------------------------
// Global fetch mock helpers
// ---------------------------------------------------------------------------

function mockFetch(handlers) {
  global.fetch = vi.fn(async (url, options = {}) => {
    const method = (options.method || "GET").toUpperCase();
    const key = `${method} ${url}`;

    for (const [pattern, handler] of Object.entries(handlers)) {
      if (key === pattern || url === pattern || url.startsWith(pattern)) {
        return handler(url, options);
      }
    }
    return { ok: false, status: 404, json: async () => ({}) };
  });
}

function jsonResponse(data, status = 200) {
  return { ok: status < 400, status, json: async () => data };
}

const HEALTH_OK = jsonResponse({ status: "ok", version: "1.0.0" });
const EMPTY_MESSAGES = jsonResponse([]);

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("App", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the heading", async () => {
    mockFetch({
      "/api/health": () => HEALTH_OK,
      "/api/messages": () => EMPTY_MESSAGES
    });

    render(<App />);
    expect(screen.getByRole("heading", { name: /message board/i })).toBeInTheDocument();
  });

  it("displays health status badge", async () => {
    mockFetch({
      "/api/health": () => jsonResponse({ status: "ok" }),
      "/api/messages": () => EMPTY_MESSAGES
    });

    render(<App />);
    await waitFor(() => {
      expect(screen.getByText("ok")).toBeInTheDocument();
    });
  });

  it("shows 'No messages yet' when message list is empty", async () => {
    mockFetch({
      "/api/health": () => HEALTH_OK,
      "/api/messages": () => EMPTY_MESSAGES
    });

    render(<App />);
    await waitFor(() => {
      expect(screen.getByText(/no messages yet/i)).toBeInTheDocument();
    });
  });

  it("displays messages loaded from the API", async () => {
    const messages = [
      { id: 1, content: "First message", createdAt: new Date().toISOString() },
      { id: 2, content: "Second message", createdAt: new Date().toISOString() }
    ];
    mockFetch({
      "/api/health": () => HEALTH_OK,
      "/api/messages": () => jsonResponse(messages)
    });

    render(<App />);
    await waitFor(() => {
      expect(screen.getByText("First message")).toBeInTheDocument();
      expect(screen.getByText("Second message")).toBeInTheDocument();
    });
  });

  it("renders a Delete button for each message", async () => {
    const messages = [
      { id: 1, content: "Msg A", createdAt: new Date().toISOString() },
      { id: 2, content: "Msg B", createdAt: new Date().toISOString() }
    ];
    mockFetch({
      "/api/health": () => HEALTH_OK,
      "/api/messages": () => jsonResponse(messages)
    });

    render(<App />);
    const buttons = await screen.findAllByRole("button", { name: /delete/i });
    expect(buttons).toHaveLength(2);
  });

  it("calls DELETE /api/messages/:id when delete button is clicked", async () => {
    const messages = [{ id: 42, content: "To delete", createdAt: new Date().toISOString() }];
    let fetchCalls = [];

    global.fetch = vi.fn(async (url, options = {}) => {
      fetchCalls.push({ url, method: options.method || "GET" });
      if (url === "/api/messages" && !options.method) {
        return jsonResponse(messages);
      }
      if (url === "/api/health") return HEALTH_OK;
      if (url === "/api/messages/42" && options.method === "DELETE") {
        return { ok: true, status: 204, json: async () => ({}) };
      }
      // After delete, reload returns empty list
      if (url === "/api/messages") return EMPTY_MESSAGES;
      return { ok: false, status: 404, json: async () => ({}) };
    });

    render(<App />);
    const deleteBtn = await screen.findByRole("button", { name: /delete/i });
    await userEvent.click(deleteBtn);

    await waitFor(() => {
      const deleteCall = fetchCalls.find(
        (c) => c.url === "/api/messages/42" && c.method === "DELETE"
      );
      expect(deleteCall).toBeDefined();
    });
  });

  it("removes the deleted message from the list", async () => {
    const messages = [{ id: 10, content: "Remove me", createdAt: new Date().toISOString() }];
    let deleteCalled = false;

    global.fetch = vi.fn(async (url, options = {}) => {
      const method = options.method || "GET";
      if (url === "/api/health") return HEALTH_OK;
      if (url === "/api/messages" && method === "GET") {
        return deleteCalled ? EMPTY_MESSAGES : jsonResponse(messages);
      }
      if (url === "/api/messages/10" && method === "DELETE") {
        deleteCalled = true;
        return { ok: true, status: 204, json: async () => ({}) };
      }
      return { ok: false, status: 404, json: async () => ({}) };
    });

    render(<App />);
    expect(await screen.findByText("Remove me")).toBeInTheDocument();

    const deleteBtn = screen.getByRole("button", { name: /delete/i });
    await userEvent.click(deleteBtn);

    await waitFor(() => {
      expect(screen.queryByText("Remove me")).not.toBeInTheDocument();
    });
  });

  it("shows an error when delete fails", async () => {
    const messages = [{ id: 99, content: "Will fail", createdAt: new Date().toISOString() }];

    global.fetch = vi.fn(async (url, options = {}) => {
      const method = options.method || "GET";
      if (url === "/api/health") return HEALTH_OK;
      if (url === "/api/messages" && method === "GET") return jsonResponse(messages);
      if (url === "/api/messages/99" && method === "DELETE") {
        return { ok: false, status: 500, json: async () => ({}) };
      }
      return { ok: false, status: 404, json: async () => ({}) };
    });

    render(<App />);
    const deleteBtn = await screen.findByRole("button", { name: /delete/i });
    await userEvent.click(deleteBtn);

    await waitFor(() => {
      expect(screen.getByText(/failed to delete message/i)).toBeInTheDocument();
    });
  });

  it("can post a new message via the form", async () => {
    const user = userEvent.setup();
    let posted = false;

    global.fetch = vi.fn(async (url, options = {}) => {
      const method = options.method || "GET";
      if (url === "/api/health") return HEALTH_OK;
      if (url === "/api/messages" && method === "GET") {
        return posted
          ? jsonResponse([{ id: 1, content: "Hello world", createdAt: new Date().toISOString() }])
          : EMPTY_MESSAGES;
      }
      if (url === "/api/messages" && method === "POST") {
        posted = true;
        return jsonResponse({ id: 1, content: "Hello world", createdAt: new Date().toISOString() }, 201);
      }
      return { ok: false, status: 404, json: async () => ({}) };
    });

    render(<App />);
    await user.type(screen.getByPlaceholderText(/what should the agent verify/i), "Hello world");
    await user.click(screen.getByRole("button", { name: /send/i }));

    await waitFor(() => {
      expect(screen.getByText("Hello world")).toBeInTheDocument();
    });
  });

  it("shows an error when submitting an empty message", async () => {
    mockFetch({
      "/api/health": () => HEALTH_OK,
      "/api/messages": () => EMPTY_MESSAGES
    });

    render(<App />);
    await userEvent.click(screen.getByRole("button", { name: /send/i }));

    expect(screen.getByText(/please enter a message/i)).toBeInTheDocument();
  });
});
