import { useState } from "react";
import axios from "axios";
import { Bot, Send, Sparkles, UserRound } from "lucide-react";
import { useToast } from "../../context/ToastContext.jsx";
import Button from "../ui/Button.jsx";

const API_URL =
  import.meta.env.VITE_PROJECT_ASSISTANT_API_URL ||
  "https://project-assistant-wr1v.onrender.com/api/chat";
const suggestions = [
  "What events are coming up?",
  "How do I register for an event?",
  "Suggest an event for my department",
];

export default function AIAssistant({ compact = false }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hi! I'm Campus AI. Ask me about campus events, registration rules, or how to use the portal.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const notify = useToast();

  async function send(text = input) {
    const message = text.trim();
    if (!message || loading) return;
    if (!navigator.onLine) {
      notify("No internet connection. Please check your network.", "error");
      return;
    }

    setInput("");
    setMessages((current) => [...current, { role: "user", text: message }]);
    setLoading(true);

    try {
      const { data } = await axios.post(
        API_URL,
        { project: "campusly", message },
        {
          headers: { "Content-Type": "application/json" },
          timeout: 90000,
        },
      );
      const reply = data.message || data.response || data.reply;
      if (typeof reply !== "string" || !reply.trim())
        throw new Error("The assistant returned an empty response.");
      setMessages((current) => [
        ...current,
        { role: "assistant", text: reply },
      ]);
    } catch (error) {
      const messageText = !navigator.onLine
        ? "No internet connection. Please check your network and try again."
        : error.response?.data?.message ||
          error.response?.data?.error ||
          error.message ||
          "I could not reach the assistant. Please try again later.";
      notify(messageText, "error");
      setMessages((current) => [
        ...current,
        { role: "assistant", text: messageText, isError: true },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section
      className={`assistant-panel glass-panel ${compact ? "assistant-compact" : ""}`}
    >
      <div className="assistant-heading">
        <div className="assistant-avatar">
          <Sparkles size={19} />
        </div>
        <div>
          <h3>Campus AI</h3>
          <p>Your campus event co-pilot</p>
        </div>
        <span className="online-indicator">AI Assistant</span>
      </div>
      <div className="chat-messages">
        {messages.map((item, index) => (
          <div key={index} className={`chat-message ${item.role}`}>
            <div className="chat-avatar">
              {item.role === "assistant" ? (
                <Bot size={15} />
              ) : (
                <UserRound size={15} />
              )}
            </div>
            <div className={`chat-bubble ${item.isError ? "chat-error" : ""}`}>
              {item.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="chat-message assistant">
            <div className="chat-avatar">
              <Bot size={15} />
            </div>
            <div className="chat-bubble typing">
              <i />
              <i />
              <i />
            </div>
          </div>
        )}
      </div>
      {messages.length === 1 && (
        <div className="suggestion-list">
          {suggestions.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => send(item)}
              disabled={loading}
            >
              {item}
              <span>↗</span>
            </button>
          ))}
        </div>
      )}
      <form
        className="chat-input"
        onSubmit={(event) => {
          event.preventDefault();
          send();
        }}
      >
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ask about campus events..."
          maxLength={1500}
          disabled={loading}
        />
        <Button
          type="submit"
          loading={loading}
          disabled={!input.trim() || loading}
          aria-label="Send message"
        >
          <Send size={16} />
        </Button>
      </form>
      <p className="ai-disclaimer">
        AI responses can be inaccurate. Verify important event details.
      </p>
    </section>
  );
}
