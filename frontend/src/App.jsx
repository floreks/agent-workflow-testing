import Header from "./components/Header";
import MessageForm from "./components/MessageForm";
import MessageList from "./components/MessageList";
import { useMessages } from "./hooks/useMessages";

/**
 * App is the root component. It wires together the Header, MessageForm,
 * and MessageList using the useMessages hook for shared state.
 */
export default function App() {
  const { messages, loading, error, refresh, create, remove, clearError } =
    useMessages({ limit: 50, autoRefreshMs: 60_000 });

  async function handleCreate(content, author) {
    clearError();
    await create({ content, author });
  }

  async function handleDelete(id) {
    clearError();
    await remove(id);
  }

  return (
    <div className="app">
      <Header />

      {error && (
        <div className="error-banner" role="alert">
          <span>{error}</span>
          <button className="btn-dismiss" onClick={clearError} aria-label="Dismiss error">
            ×
          </button>
        </div>
      )}

      <MessageForm onSubmit={handleCreate} />

      <div className="toolbar">
        <span className="message-count">
          {messages.length} message{messages.length !== 1 ? "s" : ""}
        </span>
        <button className="btn-refresh" onClick={refresh} disabled={loading}>
          {loading ? "Refreshing…" : "↻ Refresh"}
        </button>
      </div>

      <MessageList messages={messages} loading={loading} onDelete={handleDelete} />
    </div>
  );
}
