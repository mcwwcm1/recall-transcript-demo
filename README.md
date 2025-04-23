# Recall.ai Realtime Transcription Demo

This project provides a handy reference for developers looking to integrate Recall.ai's realtime transcription API into their applications. It uses the Recall.ai API to create a bot and send it into a Google Meet, and then displays the transcript in realtime.

## Setup

You will need:
- npm ([as detailed here](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) or through your package manager)
- cloudflared ([github](https://github.com/cloudflare/cloudflared) or through your package manager) (optional, but you will need to ensure the webhook server is accessible from the internet)
- a command line interface and some basic familiarity with it

Setting up:
1. Install npm and verify that you can run it with ```npm -v```
2. Install cloudflared
3. Clone this repository, then navigate the project folder (recall-transcript-demo) and run: ```npm install```

Running:
1. Open a terminal window, and launch cloudflared with ```cloudflared tunnel --url http://localhost:3000```
2. Note the unique URL that cloudflared provides you of the form `https://<unique-id>.trycloudflare.com`
3. Copy .env.example to .env.local, then and only then, enter your API key and the cloudflared URL (note that you will need to update this URL each time you relaunch the cloudflared tunnel)
4. In a new terminal window, leaving the tunnel running, navigate to the project folder and run ```npm run webhook```
5. Open vite.config.js, ensure that "target:" under "/api" matches a region for which your API key is valid
6. Leave the webhook server running, do the same again, this time running ```npm run dev```
7. Follow the url provided in the terminal, and the application should open in your browser
8. Return to the terminal window running ```npm run webhook```, and verify that an "🔌 SSE client connected" has been logged
9. Open a Google Meet, copy the invitation link, and paste it into the application, then click "Start"
10. In ~30s, assuming your API key is valid, you will get a request from a bot to join the meeting, admit the bot, and within ~30s to 1m you will see a realtime transcript in the textbox

## Troubleshooting

**I am getting errors in the browser app when pressing start**
- Open the browser console and check for the API response code. Likely there is an issue with your API key or with the region you are targeting in vite.config.js

**I am seeing no errors after pressing start, but the bot never joins my meeting**
- Double check that it is not sitting in the waiting room
- You may be entering an invalid, or old Google Meet link

**The bot joins my meeting, but I never get any transcripts back**
- Check that there are no errors in the browser console
- Check that you see a connection established message in the terminal window running ```npm run webhook```
- Look for transcript data in the webhook terminal (it is configured to log all transcript json data to the console)
- Enable CC in the Google Meet and verify that you see captions there
