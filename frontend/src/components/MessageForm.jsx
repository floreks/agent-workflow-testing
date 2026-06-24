import { useState } from "react";

/**
 * MessageForm renders the controlled form for posting new messages.
 *
 * Props:
 *   onSubmit(content, author) → Promise  called when the form is submitted
 */
export default function MessageForm({ onSubmit }) {
  const [content, setContent] = useState("");
  const [author, setAuthor] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const trimmed = content.trim();
    if (!trimmed) {
      setError("Please enter a message.");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(trimmed, author.trim());
      setContent("");
    } catch (err) {
      setError(err.message ?? "Failed to send message.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="panel">
      <h2>Post a message</h2>
      <form onSubmit={handleSubmit} className="message-form">
        <div className="form-row">
          <input
            type="text"
            className="input-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What should the agent verify?"
            maxLength={2000}
            disabled={submitting}
            aria-label="Message content"
          />
        </div>
        <div className="form-row form-row--secondary">
          <input
            type="text"
            className="input-author"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="Author (optional)"
            maxLength={100}
            disabled={submitting}
            aria-label="Author name"
          />
          <button type="submit" disabled={submitting || !content.trim()}>
            {submitting ? "Sending…" : "Send"}
          </button>
        </div>
      </form>
      {error && <p className="error">{error}</p>}
      <p className="char-count">{content.length} / 2000</p>
    </section>
  );
}
