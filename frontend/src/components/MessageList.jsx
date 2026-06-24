/**
 * MessageList renders a sorted list of messages with delete support.
 *
 * Props:
 *   messages  – array of message objects
 *   loading   – boolean
 *   onDelete(id) → Promise
 */
export default function MessageList({ messages, loading, onDelete }) {
  if (loading && messages.length === 0) {
    return (
      <section className="panel">
        <h2>Recent messages</h2>
        <p className="loading">Loading…</p>
      </section>
    );
  }

  return (
    <section className="panel">
      <h2>Recent messages</h2>
      {messages.length === 0 ? (
        <p className="empty">No messages yet. Be the first to post!</p>
      ) : (
        <ul>
          {messages.map((msg) => (
            <MessageItem key={msg.id} msg={msg} onDelete={onDelete} />
          ))}
        </ul>
      )}
    </section>
  );
}

function MessageItem({ msg, onDelete }) {
  async function handleDelete() {
    if (!window.confirm(`Delete message #${msg.id}?`)) return;
    try {
      await onDelete(msg.id);
    } catch {
      // error is surfaced by the parent hook
    }
  }

  return (
    <li className="message-item">
      <div className="message-body">
        <span className="message-content">{msg.content}</span>
        {msg.author && (
          <span className="message-author">— {msg.author}</span>
        )}
      </div>
      <div className="message-meta">
        <time dateTime={msg.createdAt}>
          {new Date(msg.createdAt).toLocaleString()}
        </time>
        <button
          className="btn-delete"
          onClick={handleDelete}
          aria-label={`Delete message ${msg.id}`}
          title="Delete"
        >
          ×
        </button>
      </div>
    </li>
  );
}
