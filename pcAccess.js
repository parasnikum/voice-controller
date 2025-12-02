import { GoogleGenAI, Type } from "@google/genai";
import { config } from "dotenv";
import { exec } from "child_process";
import { promisify } from "util";
import os from "os";
import fs from "fs/promises";
import fetch from "node-fetch";

config();

const asyncExec = promisify(exec);
const platform = os.platform();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;


async function execCommand({ command }) {
  console.log(`[Running Command]: ${command}`);
  try {
    const { stdout, stderr } = await asyncExec(command);
    return stdout || stderr || "Command executed.";
  } catch (error) {
    return `❌ Error: ${error.message}`;
  }
}

async function openApp({ app }) {
  const commands = {
    win32: `start "" "${app}"`,
    darwin: `open -a "${app}"`,
    linux: `${app} &`,
  };
  return execCommand({ command: commands[platform] || app });
}

async function openWebsite({ url }) {
  const commands = {
    win32: `start ${url}`,
    darwin: `open ${url}`,
    linux: `xdg-open "${url}"`,
  };
  return execCommand({ command: commands[platform] });
}

async function openFolder({ path }) {
  const commands = {
    win32: `start "" "${path}"`,
    darwin: `open "${path}"`,
    linux: `xdg-open "${path}"`,
  };
  return execCommand({ command: commands[platform] });
}

async function writeFile({ path, content }) {
  try {
    const dir = path.substring(0, path.lastIndexOf("/"));
    if (dir) await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path, content, "utf8");
    return `✅ File written: ${path}`;
  } catch (err) {
    return `❌ Write error: ${err.message}`;
  }
}

const HARDCODED_ORIGIN = "NCER College of Engineering, Pune, Maharashtra, India";

async function getDirections({ destination }) {
  // Only one API call to Directions API
  const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(
    HARDCODED_ORIGIN
  )}&destination=${encodeURIComponent(destination)}&key=${GOOGLE_MAPS_API_KEY}`;

  const response = await fetch(url);
  const data = await response.json();

  if (data.status !== "OK") {
    throw new Error(`Google Maps API error: ${data.status}`);
  }

  const steps = data.routes[0].legs[0].steps.map(
    (step, index) => `${index + 1}. ${step.html_instructions.replace(/<[^>]+>/g, "")}`
  );

  const guiLink = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
    HARDCODED_ORIGIN
  )}&destination=${encodeURIComponent(destination)}&travelmode=driving`;

  return {
    steps: steps.join(". "),
    guiLink,
  };
}




const toolFunctions = {
  execCommand,
  openApp,
  openWebsite,
  openFolder,
  writeFile,
  getDirections,
};

const tools = [
  {
    functionDeclarations: [
      {
        name: "execCommand",
        description: "Run any terminal/command line instruction",
        parameters: { type: Type.OBJECT, properties: { command: { type: Type.STRING } }, required: ["command"] },
      },
      {
        name: "openApp",
        description: "Opens a desktop application (e.g. Chrome, VSCode, etc.)",
        parameters: { type: Type.OBJECT, properties: { app: { type: Type.STRING } }, required: ["app"] },
      },
      {
        name: "openWebsite",
        description: "Opens a URL in the default browser",
        parameters: { type: Type.OBJECT, properties: { url: { type: Type.STRING } }, required: ["url"] },
      },
      {
        name: "openFolder",
        description: "Opens a folder in File Explorer or Finder",
        parameters: { type: Type.OBJECT, properties: { path: { type: Type.STRING } }, required: ["path"] },
      },
      {
        name: "writeFile",
        description: "Creates or overwrites a file with content",
        parameters: { type: Type.OBJECT, properties: { path: { type: Type.STRING }, content: { type: Type.STRING } }, required: ["path", "content"] },
      },
      {
        name: "getDirections",
        description: "Get step-by-step directions from NCER College of Engineering Pune to a destination",
        parameters: {
          type: Type.OBJECT,
          properties: {
            destination: { type: Type.STRING },
          },
          required: ["destination"],
        },
      },
    ],
  },
];


export async function runAgent(inputText) {
  console.log("🚀 runAgent called with input:", inputText);

  const contents = [{ role: "user", parts: [{ text: inputText }] }];

  const result = await ai.models.generateContent({
    model: "gemini-2.5-flash-lite",
    contents,
    config: {
      systemInstruction: `
You are an AI assistant with full desktop access through tools. You can open apps, browse websites, manage files, run terminal commands, and get Google Maps directions from NCER College of Engineering Pune.

Platform: ${platform}

Respond in a short, conversational summary (20–30 words). Use direct tool calls only. Avoid symbols, patterns, or formatting for narration.
`,
      tools,
    },
  });

  if (result.functionCalls?.length) {
    const responses = [];

    for (const functionCall of result.functionCalls) {
      const { name, args } = functionCall;
      const toolFn = toolFunctions[name];

      if (!toolFn) {
        console.error(`❌ Unknown function: ${name}`);
        responses.push(`Unknown tool: ${name}`);
        continue;
      }

      console.log(`🛠 Calling function: ${name} with args:`, args);
      const responseObj = await toolFn(args);
      if (typeof responseObj === "object") {
        responses.push(`Steps:\n${responseObj.steps}\n\nMap Link: ${responseObj.guiLink}`);
      } else {
        responses.push(responseObj);
      }

    }

    return responses.join("\n");
  }

  return result.text;
}
