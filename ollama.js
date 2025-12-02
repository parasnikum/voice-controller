import { Ollama } from "ollama";
import { config } from "dotenv";
import { exec } from "child_process";
import { promisify } from "util";
import os from "os";
import fetch from "node-fetch";
// const { Vonage } = require('@vonage/server-sdk')
import { Vonage } from "@vonage/server-sdk";

config();

const asyncExec = promisify(exec);
const platform = os.platform();

const ai = new Ollama({
  baseURL: "http://localhost:11434", // Ollama local server
});

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

// ------------------- Helper functions ------------------- //
async function openApp({ app }) {
  const appName = app.toLowerCase().trim();

  // Map common app names to correct executable commands
  const appMap = {
    "chrome": {
      win32: 'start chrome',
      darwin: 'open -a "Google Chrome"',
      linux: 'google-chrome &',
    },
    "google chrome": {
      win32: 'start chrome',
      darwin: 'open -a "Google Chrome"',
      linux: 'google-chrome &',
    },
    "edge": {
      win32: 'start msedge',
      darwin: 'open -a "Microsoft Edge"',
      linux: 'microsoft-edge &',
    },
    "notepad": {
      win32: 'start notepad',
      darwin: 'open -a "TextEdit"',
      linux: 'gedit &',
    },
  };

  // Fallback: try to run the name directly
  const command =
    appMap[appName]?.[platform] ||
    `${appName} &`; // fallback for Linux/macOS

  try {
    await asyncExec(command);
    return `✅ Opened app: ${app}`;
  } catch (err) {
    return `❌ Could not open app "${app}": ${err.message}`;
  }
}


async function openWebsite({ url }) {
  const commands = {
    win32: `start "" "${url}"`,
    darwin: `open "${url}"`,
    linux: `xdg-open "${url}"`,
  };
  try {
    await asyncExec(commands[platform]);
    return `✅ Opened website: ${url}`;
  } catch (err) {
    return `❌ Could not open website "${url}": ${err.message}`;
  }
}

async function openFolder({ path }) {
  const commands = {
    win32: `start "" "${path}"`,
    darwin: `open "${path}"`,
    linux: `xdg-open "${path}"`,
  };
  try {
    await asyncExec(commands[platform]);
    return `✅ Opened folder: ${path}`;
  } catch (err) {
    return `❌ Could not open folder "${path}": ${err.message}`;
  }
}


const vonage = new Vonage({
  apiKey: "2181b5f1",
  apiSecret: "CfZfSxB3dpThKuuG" // if you want to manage your secret, please do so by visiting your API Settings page in your dashboard
})


const EMERGENCY_CONTACTS = [
  { name: "FAmily Member 1", phone: "917020086058" },
];

async function panicEmergency({ userName = "Paras", location = "NCER College" }) {
  try {
    const message = `🚨 EMERGENCY ALERT 🚨\nUSERxyz is in danger and needs help immediately!\nLast known location: "NCER College"`;

    // Send SMS to all emergency contacts
    for (const contact of EMERGENCY_CONTACTS) {
      const smsResp = await vonage.sms.send({
        to: contact.phone,
        from: "VisualAssist",
        text: message,
      });
      console.log(`📩 Sent emergency SMS to ${contact.name}:`, smsResp);
    }

    return `🚨 Emergency alerts have been sent to family contacts.`;
  } catch (err) {
    console.error("❌ Error sending panic SMS:", err);
    return `❌ Failed to send emergency messages: ${err.message}`;
  }
}

// ------------------- Google Maps Navigation ------------------- //

const HARDCODED_ORIGIN = "NCER College of Engineering, Pune, Maharashtra, India";

async function getDirections({ destination }) {
  try {
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(
      HARDCODED_ORIGIN
    )}&destination=${encodeURIComponent(destination)}&key=${GOOGLE_MAPS_API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== "OK") {
      return `❌ Google Maps API error: ${data.status}`;
    }

    const steps = data.routes[0].legs[0].steps.map(
      (step, i) => `${i + 1}. ${step.html_instructions.replace(/<[^>]+>/g, "")}`
    );

    const guiLink = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
      HARDCODED_ORIGIN
    )}&destination=${encodeURIComponent(destination)}&travelmode=driving`;

    return {
      steps: steps.join("\n"),
      guiLink,
    };
  } catch (err) {
    return `❌ Error fetching directions: ${err.message}`;
  }
}

// ------------------- Tool Registry ------------------- //

const toolFunctions = {
  getDirections,
  panicEmergency
};

// ------------------- Agent Core ------------------- //

export async function runAgent(inputText, options = { speak: true }) {
  console.log("🚀 runAgent called with input:", inputText);
const systemPrompt = `
You are "Visual Assistant" — a smart helper for visually impaired users.
You can perform actions by calling these tools:
user can tell the directions or the where he want to navigate as per that call  getDirections();

TOOLS:
- getDirections({"destination": "<place name>"})
- panicEmergency({"userName": "<user name>", "location": "<current location>"})

SMART BEHAVIOR:
- If the user says "panic", "help me", "emergency", or "call my family", call:
  panicEmergency({
    "userName": "User",
    "location": "<fetch dynamically from device or current coordinates>"
  }).
  The assistant should always include the user's current location (from IP, GPS, or other sensors) if available.

RULES:
- Do NOT write code or explanations.
- Do NOT wrap tool calls in markdown or backticks.
- Only call tools or give short, polite text responses.
- If the user just chats casually, reply politely in plain text.
`;


  const result = await ai.chat({
    model: "qwen2.5-coder:0.5b",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: inputText },
    ],
    temperature: 0.6,
    max_tokens: 400,
  });

  const output = result?.message?.content?.trim() || "";

  const toolCallRegex = /(\w+)\((\{[^}]+\})\)/g;
  const responses = [];
  let match;

  while ((match = toolCallRegex.exec(output)) !== null) {
    const toolName = match[1];
    const argsText = match[2];

    try {
      const args = JSON.parse(argsText);
      const fn = toolFunctions[toolName];

      if (!fn) {
        responses.push(`❌ Unknown tool: ${toolName}`);
        continue;
      }

      const result = await fn(args);
      if (typeof result === "object") {
        responses.push(`🗺️ Directions:\n${result.steps}\n\n🌍 Map: ${result.guiLink}`);
      } else {
        responses.push(result);
      }
    } catch (err) {
      responses.push(`❌ Failed to execute ${match[0]} — ${err.message}`);
    }
  }

  const finalResponse = responses.length ? responses.join("\n") : output;

  // 🧏‍♂️ Optional "speak" control
  if (options.speak) {
    console.log("🗣️ Speaking:", finalResponse);
    // Your text-to-speech code here (e.g., say.speak(finalResponse))
  } else {
    console.log("🤫 Silent mode active — not speaking output.");
  }

  return finalResponse;
}
