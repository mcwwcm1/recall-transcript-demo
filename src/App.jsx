import { useState, useEffect } from "react";

export default function App() {
  const [meetingUrl, setMeetingUrl] = useState("");
  const [status, setStatus] = useState("");
  const [events, setEvents] = useState([]);

  // subscribe to Server‑Sent Events
  useEffect(() => {
    const es = new EventSource("/events");
    es.onmessage = (e) => {
      // parse once
      const payload = JSON.parse(e.data);
      // drill into the actual transcript data
      const body = payload.data?.data;
      if (body) {
        setEvents((prev) => [...prev, body]);
      }
    };
    return () => es.close();
  }, []);

  async function startTranscription() {
    setStatus("Starting…");
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
              url: import.meta.env.VITE_RECALL_WEBHOOK_URL,
              events: ["transcript.data", "transcript.partial_data"],
            },
          ],
        },
      }),
    });
    setStatus(
      res.ok
        ? "✅ Started; check the live feed."
        : `Error: ${await res.text()}`,
    );
  }

  return (
    <div style={{ padding: 24, fontFamily: "sans-serif" }}>
      <h2>Recall.ai Live Transcription</h2>
      <input
        style={{ width: "100%", marginBottom: 12, padding: 8 }}
        placeholder="Google Meet URL"
        value={meetingUrl}
        onChange={(e) => setMeetingUrl(e.target.value)}
      />
      <button onClick={startTranscription}>Start</button>
      <p>{status}</p>

      <h3>Transcript Events</h3>
      <ul>
        {events.map((evt, i) => (
          <li key={i}>
            <strong>{evt.participant.name}:</strong>{" "}
            {evt.words.map((w) => w.text).join(" ")}
          </li>
        ))}
      </ul>
    </div>
  );
}
