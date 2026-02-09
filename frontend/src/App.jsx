import { useEffect, useState } from "react";

const apiBase = import.meta.env.VITE_API_BASE || "";

export default function App() {
  const [health, setHealth] = useState({ status: "checking" });
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState("");
  const [error, setError] = useState("");

  const loadMessages = async () => {
    try {
      const res = await fetch(`${apiBase}/api/messages`);
      if (!res.ok) {
        throw new Error("Failed to load messages");
      }
      const data = await res.json();
      setMessages(data);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${apiBase}/api/health`);
        const data = await res.json();
        setHealth(data);
      } catch (err) {
        setHealth({ status: "down" });
      }
    };

    load();
    loadMessages();
  }, []);

  const submitMessage = async (event) => {
    event.preventDefault();
    setError("");

    if (!content.trim()) {
      setError("Please enter a message.");
      return;
    }

    try {
      const res = await fetch(`${apiBase}/api/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ content })
      });

      if (!res.ok) {
        throw new Error("Failed to save message");
      }

      setContent("");
      loadMessages();
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteMessage = async (id) => {
    setError("");
    try {
      const res = await fetch(`${apiBase}/api/messages?id=${id}`, {
        method: "DELETE"
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to delete message");
      }
      await loadMessages();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="app">
      <header>
        <div>
          <p className="eyebrow">Agent workflow dev sandbox</p>
          <h1>Message board</h1>
        </div>
        <div className={`badge ${health.status === "ok" ? "good" : "bad"}`}>
          {health.status}
        </div>
      </header>

      <section className="panel">
        <h2>Post a message</h2>
        <form onSubmit={submitMessage}>
          <input
            type="text"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="What should the agent verify?"
          />
          <button type="submit">Send</button>
        </form>
        {error ? <p className="error">{error}</p> : null}
      </section>

      <section className="panel">
        <h2>Recent messages</h2>
        <ul>
          {messages?.length === 0 ? (
            <li className="empty">No messages yet.</li>
          ) : (
            messages?.map((msg) => (
              <li key={msg.id}>
                <span>{msg.content}</span>
                <time>{new Date(msg.createdAt).toLocaleString()}</time>
                <button
                  className="delete"
                  aria-label={`Delete message ${msg.id}`}
                  onClick={() => deleteMessage(msg.id)}
                >
                  Delete
                </button>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
