import express from "express";
const app = express();
app.use(express.json());

const clients = [];

app.get("/events", (req, res) => {
  console.log("🔌 SSE client connected");
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  clients.push(res);
  req.on("close", () => {
    console.log("❌ SSE client disconnected");
    clients.splice(clients.indexOf(res), 1);
  });
});

app.post("/webhook", (req, res) => {
  console.log("📬 Webhook received at", new Date().toISOString());
  console.log(JSON.stringify(req.body, null, 2));
  clients.forEach((c) => c.write(`data: ${JSON.stringify(req.body)}\n\n`));
  res.sendStatus(200);
});

app.all("*", (_, res) => res.sendStatus(404));

app.listen(3000, () =>
  console.log("🚀 Webhook & SSE server listening on http://localhost:3000"),
);
