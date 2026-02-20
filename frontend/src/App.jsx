import { useState } from "react";

export default function App() {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi! Ask me anything." },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    const text = prompt.trim();
    if (!text || loading) return;

    const nextMessages = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setPrompt("");
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.map(({ role, content }) => ({ role, content })),
        }),
      });

      const data = await res.json();
      const aiReply =
        data?.choices?.[0]?.message?.content ||
        data?.error ||
        "No response from model.";

      setMessages((prev) => [...prev, { role: "assistant", content: aiReply }]);
    } catch (err) {
      setError("Request failed. Is backend running on port 3001?");
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "I could not reach the backend." },
      ]);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page">
      <section className="card">
        <h1>HAAK Chat</h1>
        <p className="subtitle">Super basic React frontend connected to your backend.</p>

        <div className="chat">
          {messages.map((m, i) => (
            <div key={i} className={`msg ${m.role}`}>
              <span className="label">{m.role}:</span> {m.content}
            </div>
          ))}
          {loading && <div className="msg assistant">assistant: Thinking...</div>}
        </div>

        <form onSubmit={onSubmit} className="composer">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Type your message"
          />
          <button type="submit" disabled={loading}>
            Send
          </button>
        </form>

        {error && <p className="error">{error}</p>}
      </section>
    </main>
  );
}
