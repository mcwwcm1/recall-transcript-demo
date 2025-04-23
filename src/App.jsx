import { useState, useEffect } from "react";

export default function App() {
  const [meetingUrl, setMeetingUrl] = useState("");
  const [status, setStatus] = useState("");
  const [events, setEvents] = useState([]);
  const [botId, setBotId] = useState(null);

  useEffect(() => {
    const es = new EventSource("/events");
    es.onmessage = (e) => {
      const payload = JSON.parse(e.data);
      const body = payload.data?.data;
      if (body) setEvents((prev) => [...prev, body]);
    };
    return () => es.close();
  }, []);

  async function startTranscription() {
    setEvents([]);
    setStatus("Starting…");
    const base = import.meta.env.VITE_RECALL_WEBHOOK_URL.replace(/\/$/, "");
    const webhookUrl = `${base}/webhook`;

    const res = await fetch("/api/bot/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: import.meta.env.VITE_RECALL_API_KEY,
      },
      body: JSON.stringify({
        meeting_url: meetingUrl,
        recording_config: {
          transcript: { provider: { meeting_captions: {} } },
          realtime_endpoints: [
            {
              type: "webhook",
              url: webhookUrl,
              events: ["transcript.data", "transcript.partial_data"],
            },
          ],
        },
      }),
    });
    if (!res.ok) {
      setStatus(`Error: ${await res.text()}`);
      return;
    }
    const json = await res.json();
    setBotId(json.id);
    setStatus("Bot Created: Transcription started");
  }

  async function stopTranscription() {
    if (!botId) return;
    setStatus("Stopping…");
    const res = await fetch(`/api/bot/${botId}/leave_call/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: import.meta.env.VITE_RECALL_API_KEY,
      },
    });
    if (res.ok) {
      setStatus("Bot Stopped");
      setBotId(null);
    } else {
      setStatus(`Error stopping: ${await res.text()}`);
    }
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: 24,
      }}
    >
      <h2>Realtime Transcription Demo</h2>

      <input
        style={{ width: "80%", marginBottom: 12, padding: 8 }}
        placeholder="Enter Google Meet URL"
        value={meetingUrl}
        onChange={(e) => setMeetingUrl(e.target.value)}
        disabled={!!botId}
      />

      <div>
        <button onClick={startTranscription} disabled={!meetingUrl || !!botId}>
          Start
        </button>
        <button
          onClick={stopTranscription}
          disabled={!botId}
          style={{ marginLeft: 8 }}
        >
          Stop
        </button>
      </div>

      <p>{status}</p>

      <h3>Transcript History</h3>
      <div
        style={{
          width: "500px",
          maxWidth: "100%",
          height: "300px",
          overflowY: "auto",
          border: "1px solid #444",
          borderRadius: 8,
          padding: 16,
          backgroundColor: "#1e1e1e",
          color: "#fff",
        }}
      >
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {events.map((evt, i) => {
            const ts = evt.words?.[0]?.start_timestamp?.absolute;
            const timeString = ts
              ? new Date(ts).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })
              : "";
            return (
              <li
                key={i}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  marginBottom: 12,
                }}
              >
                <div style={{ flex: "0 0 auto" }}>
                  <strong>{evt.participant.name}</strong>
                  {timeString && (
                    <div
                      style={{
                        fontSize: "0.8em",
                        color: "#aaa",
                        marginTop: 2,
                      }}
                    >
                      {timeString}
                    </div>
                  )}
                </div>
                <div style={{ marginLeft: 12, flex: "1 1 auto" }}>
                  {evt.words.map((w) => w.text).join(" ")}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
