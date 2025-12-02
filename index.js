import { AssemblyAI } from "assemblyai";
import { Readable } from "stream";
import recorder from "node-record-lpcm16";
import say from "say";
// import { runAgent } from "./pcAccess.js";
import { runAgent } from "./ollama.js";
import { config } from "dotenv";

import { runAgent } from "./Access.js";
import { config } from "dotenv";
config();

const client = new AssemblyAI({
  apiKey: process.env.ASSEMBLY_API_KEY,
});

const CONNECTION_PARAMS = {
  sampleRate: 16000,
  formatTurns: true,
};

async function startAssistant() {
  const transcriber = client.streaming.transcriber(CONNECTION_PARAMS);
  let lastTranscriptNormalized = "";

  transcriber.on("open", ({ id }) => {
    console.log(`🟢 Session opened: ${id}`);
  });

  transcriber.on("error", (error) => {
    console.error("❌ Transcriber error:", error);
  });

  transcriber.on("close", (code, reason) => {
    console.log(`🔴 Session closed: code=${code}, reason=${reason}`);
  });

  transcriber.on("turn", async (turn) => {
    say.stop();
    if (!turn.end_of_turn) return;

    const transcriptText = turn.transcript?.trim();
    if (!transcriptText) return;
    console.log(transcriptText);
    const normalized = transcriptText
      .toLowerCase()
      .replace(/[^\w\s]|_/g, "")
      .trim();

    if (normalized === lastTranscriptNormalized) return;
    if (normalized === lastTranscriptNormalized) {
      return;
    }

    lastTranscriptNormalized = normalized;

    console.log(`🎤 You said: "${transcriptText}"`);

    try {
      const agentResponse = await runAgent(transcriptText);
      console.log(`🤖 Agent says: ${agentResponse}`);
      say.stop();
      say.speak(agentResponse, "Microsoft David Desktop", 1.15);
    } catch (err) {
      console.error("❌ Error:", err.message);
      say.speak("Sorry, I encountered an error while processing your request.");
      say.stop()
      say.speak(agentResponse, 'Microsoft David Desktop',1.15);

    } catch (err) {
      console.error("❌ Error running agent:", err.message);
      say.speak("Sorry, I encountered an error.");
    }
  });

  try {
    console.log("🔌 Connecting to AssemblyAI...");
    await transcriber.connect();

    console.log("🎙️ Starting microphone...");
    const recording = recorder.record({
      sampleRate: CONNECTION_PARAMS.sampleRate,
      channels: 1,
      audioType: "wav",
    });
    say.stop();

    Readable.toWeb(recording.stream()).pipeTo(transcriber.stream());

    process.on("SIGINT", async () => {
      say.stop();
      say.stop()
      console.log("\n🛑 Stopping microphone...");
      recording.stop();

      console.log("🔌 Closing connection...");
      await transcriber.close();

      process.exit();
    });
  } catch (err) {
    console.error("❌ Unexpected error:", err.message);
  }
}

startAssistant();