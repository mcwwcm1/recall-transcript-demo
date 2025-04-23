import { useState, useEffect, useRef } from "react";

export default function App() {
  const COMMON_HEADERS = {
    "Content-Type": "application/json",
    Authorization: import.meta.env.VITE_RECALL_API_KEY,
  };

  const [meetingUrl, setMeetingUrl] = useState("");
  const [status, setStatus] = useState("");
  const [events, setEvents] = useState([]);
  const [botId, setBotId] = useState(null);
  const transcriptRef = useRef(null);

  useEffect(() => {
    const es = new EventSource("/events");
    es.onmessage = (e) => {
      const payload = JSON.parse(e.data);
      const body = payload.data?.data;
      if (body) setEvents((prev) => [...prev, body]);
    };
    return () => es.close();
  }, []);

  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [events]);

  async function startTranscription() {
    setEvents([]);
    setStatus("Starting…");
    const base = import.meta.env.VITE_RECALL_WEBHOOK_URL.replace(/\/$/, "");
    const webhookUrl = `${base}/webhook`;

    const res = await fetch("/api/bot/", {
      method: "POST",
      headers: COMMON_HEADERS,
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
    setStatus("Bot Created");
  }

  async function stopTranscription() {
    if (!botId) return;
    setStatus("Stopping…");
    const res = await fetch(`/api/bot/${botId}/leave_call/`, {
      method: "POST",
      headers: COMMON_HEADERS,
    });
    if (res.ok) {
      setStatus("Bot Stopped");
      setBotId(null);
    } else {
      setStatus(`Error stopping: ${await res.text()}`);
    }
  }

  return (
    <div className="app">
      <h2>Realtime Transcription Demo</h2>

      <input
        className="meeting-input"
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
          className="stop-button"
        >
          Stop
        </button>
      </div>

      <p>{status}</p>

      <h3>Transcript History</h3>
      <div className="transcript" ref={transcriptRef}>
        <ul className="transcript-list">
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
              <li key={i} className="transcript-item">
                <div className="participant">
                  <strong>{evt.participant.name}</strong>
                  {timeString && <div className="timestamp">{timeString}</div>}
                </div>
                <div className="message">
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
