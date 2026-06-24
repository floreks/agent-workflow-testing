import { useEffect, useState } from "react";
import { getHealth } from "../utils/api";

/**
 * Header displays the app title and a live database health badge.
 * It polls the /api/health endpoint every 30 seconds.
 */
export default function Header() {
  const [health, setHealth] = useState({ status: "checking", version: "" });

  useEffect(() => {
    let cancelled = false;

    async function checkHealth() {
      try {
        const data = await getHealth();
        if (!cancelled) setHealth(data);
      } catch {
        if (!cancelled) setHealth({ status: "down", version: "" });
      }
    }

    checkHealth();
    const id = setInterval(checkHealth, 30_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const isOk = health.status === "ok";

  return (
    <header>
      <div>
        <p className="eyebrow">Agent workflow dev sandbox</p>
        <h1>Message board</h1>
        {health.version && (
          <p className="version">v{health.version}</p>
        )}
      </div>
      <div className={`badge ${isOk ? "good" : health.status === "checking" ? "pending" : "bad"}`}>
        {health.status}
        {isOk && health.dbPingMs != null && (
          <span className="badge-meta"> · db {health.dbPingMs}ms</span>
        )}
      </div>
    </header>
  );
}
