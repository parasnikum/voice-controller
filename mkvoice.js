import recorder from 'node-record-lpcm16';
import fs from 'fs';
import say from 'say';
import { runAgent } from './ollama.js'; // your local agent
import { pipeline } from '@xenova/transformers';
import path from 'path';

// Local path to the model
const modelPath = path.resolve('./model/whisper');

const whisper = await pipeline('automatic-speech-recognition', modelPath, {
    modelType: 'base',  // small/medium etc.
    device: 'cpu',
});

// ------------------- Helper: Record mic to WAV ------------------- //
function recordAudio(filePath, duration = 5000) {
    return new Promise((resolve, reject) => {
        const fileStream = fs.createWriteStream(filePath, { encoding: 'binary' });
        const recording = recorder.record({
            sampleRate: 16000,
            channels: 1,
            audioType: 'wav'
        });

        recording.stream().pipe(fileStream);

        setTimeout(() => {
            recording.stop();
            resolve(filePath);
        }, duration);
    });
}

// ------------------- Main Assistant Loop ------------------- //
async function startAssistant() {
    console.log('🎙️ Starting offline assistant...');

    while (true) {
        console.log('🟢 Recording 5s of audio...');
        const audioFile = 'input.wav';
        await recordAudio(audioFile, 5000);

        console.log('📝 Transcribing...');
        const result = await whisper(audioFile);
        const transcript = result.text?.trim();

        if (!transcript) continue;

        console.log(`🎤 You said: "${transcript}"`);

        try {
            const agentResponse = await runAgent(transcript);
            console.log(`🤖 Agent says: ${agentResponse}`);
            say.stop();
            say.speak(agentResponse, 'Microsoft David Desktop', 1.15);
        } catch (err) {
            console.error('❌ Agent error:', err.message);
            say.speak('Sorry, I encountered an error while processing your request.');
        }
    }
}

startAssistant();
