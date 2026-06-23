import { useEffect, useState } from "react";

const apiBase = import.meta.env.VITE_API_BASE || "";

export default function App() {
  const [health, setHealth] = useState({ status: "checking" });
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [jokes, setJokes] = useState([]);
  const [currentJoke, setCurrentJoke] = useState(null);

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

  const loadJokes = async () => {
    try {
      const res = await fetch(`${apiBase}/api/jokes`);
      if (!res.ok) throw new Error("Failed to load jokes");
      const data = await res.json();
      setJokes(data);
      if (data && data.length > 0) {
        setCurrentJoke(data[Math.floor(Math.random() * data.length)]);
      }
    } catch (_err) {
      // jokes are optional, silently ignore
    }
  };

  const randomJoke = () => {
    if (jokes.length === 0) return;
    const idx = Math.floor(Math.random() * jokes.length);
    setCurrentJoke(jokes[idx]);
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
    loadJokes();
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
        <h2>😂 Joke of the Moment</h2>
        {currentJoke ? (
          <div>
            <p><strong>{currentJoke.setup}</strong></p>
            <p><em>{currentJoke.punchline}</em></p>
          </div>
        ) : (
          <p className="empty">Loading jokes…</p>
        )}
        <button onClick={randomJoke} style={{ marginTop: "0.5rem" }}>
          Another one 🎲
        </button>
      </section>

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
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
