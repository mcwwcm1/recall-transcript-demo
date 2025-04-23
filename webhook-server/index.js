// Simple Express server for handling webhooks and streaming updates to the UI
import express from "express";
const app = express();

// Parse JSON bodies on incoming POSTs
app.use(express.json());

// Keep a list of all open SSE connections
const clients = [];

// SSE endpoint: client connects here to get live updates
app.get("/events", (req, res) => {
  console.log("🔌 SSE client connected");
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  clients.push(res);
  // When the browser closes the tab, remove it from our list
  req.on("close", () => {
    console.log("❌ SSE client disconnected");
    clients.splice(clients.indexOf(res), 1);
  });
});

// Webhook endpoint: Recall will POST captions here
app.post("/webhook", (req, res) => {
  console.log("Webhook received at", new Date().toISOString());
  console.log(JSON.stringify(req.body, null, 2));
  // Push the payload to every SSE client
  clients.forEach((c) => c.write(`data: ${JSON.stringify(req.body)}\n\n`));
  res.sendStatus(200);
});

// Catch-all for any other routes
app.all("*", (_, res) => res.sendStatus(404));

// Start listening on port 3000
app.listen(3000, () =>
  console.log("Webhook & SSE server listening on http://localhost:3000"),
);
