---
# 🎙️ Voice-Controlled AI Desktop Assistant 🖥️

A simple **Node.js** desktop assistant that uses voice commands to control your PC, open apps, browse websites, manage files, and run terminal commands all powered by AI. 🚀 Leveraging **AssemblyAI** for real-time speech-to-text and **Google Gemini** for intelligent command execution. 🤖✨

---

## 🛠️ Features

* **🎤 Voice-activated**: Speak commands to control your computer hands-free.
* **🤖 AI-powered**: Uses **Google Gemini** to understand and execute complex instructions.
* **💻 Desktop control**: Open apps, websites, folders, run terminal commands, and manage files.
* **🌐 Cross-platform**: Works on **Windows**, **macOS**, and **Linux** (with minor adjustments).
* **🔊 Text-to-speech**: The assistant responds with spoken feedback.

---

## 📥 Installation

1. **Clone the repository**:

```sh
git clone https://github.com/parasnikum/desktop-assistant-agent.git
cd desktop-assistant-agent
```

2. **Install dependencies**:

```sh
npm install
```

3. **Get API Keys**:

* **AssemblyAI**: [Sign up for a free API key](https://www.assemblyai.com/)
* **Google Gemini**: [Get your Gemini API key](https://aistudio.google.com/app/apikey)

4. **Create a `.env` file** in the project root:

```
ASSEMBLY_API_KEY=your_assemblyai_api_key
GEMINI_API_KEY=your_gemini_api_key
```

---

## 🚀 Usage

Start the assistant:

```sh
node voiceControl.js
```

* 🎤 Speak your command after the prompt.
* The assistant will transcribe, process, and respond to your request.

### 🗣️ Example Commands:

* "Open Chrome" 💻
* "Go to youtube.com" 🎥
* "Create a file called notes.txt with the text 'Hello world'" 📝
* "Show me the Downloads folder" 📂
* "Run ipconfig in the terminal" 🖥️

---

## 🔧 How It Works

* **voiceControl.js**: Handles microphone input, speech-to-text (AssemblyAI), and text-to-speech responses. 🎙️➡️📝
* **pcAccess.js**: Uses **Google Gemini** to interpret commands and execute actions like opening apps, websites, folders, and running commands. 🧠➡️💻

### 🧑‍💻 Main Flow:

1. 🎤 Microphone audio is streamed to **AssemblyAI** for real-time transcription.
2. 📝 Transcribed text is sent to **Gemini** for intent detection and tool selection.
3. 💡 Gemini calls the appropriate function (open app, run command, etc.).
4. 🔊 The result is spoken back to the user.

---

## ✅ Supported Actions

* **🖥️ Open applications** (e.g., Chrome, VSCode)
* **🌐 Open websites** in your default browser
* **📁 Open folders** in File Explorer/Finder
* **💻 Run terminal/command line instructions**
* **📄 Create or overwrite files**

---

## 🛠️ Troubleshooting

* Ensure your microphone is working and accessible. 🎤🔊
* Double-check your API keys in `.env`. 🗝️
* For **Windows TTS**, the default voice is 'Microsoft David Desktop'. 🗣️
* For **Linux/macOS**, you may need to adjust TTS settings or install compatible voices. 🎙️

---

## 📦 Dependencies

* [assemblyai](https://www.npmjs.com/package/assemblyai)
* [@google/genai](https://www.npmjs.com/package/@google/genai)
* [node-record-lpcm16](https://www.npmjs.com/package/node-record-lpcm16)
* [say](https://www.npmjs.com/package/say)
* [dotenv](https://www.npmjs.com/package/dotenv)

---

## 🙌 Credits

* [AssemblyAI](https://www.assemblyai.com/)
* [Google Gemini](https://aistudio.google.com/)
* Inspired by **Jarvis** and other voice assistants. 🎥💡

---

