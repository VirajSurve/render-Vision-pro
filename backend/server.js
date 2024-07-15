import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from "url";

const apiKey = "AIzaSyD2JwFzqCf9bzMtm2TsdZzrd2_td-RW6CE"; 
const genAI = new GoogleGenerativeAI(apiKey);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors({
  origin: "https://vercel-vision-pro-client.vercel.app",
  methods: ["POST", "GET"],
  credentials: true
}));
app.options('*', cors());

app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.json("Hello");
});

async function uploadBase64ToGemini(base64Data, mimeType, filename) {
  const buffer = Buffer.from(base64Data, "base64");
  const tempFilePath = path.join(__dirname, filename);
  fs.writeFileSync(tempFilePath, buffer);

  try {
    const fileData = {
      inlineData: {
        data: base64Data,
        mimeType,
      },
    };
    return fileData;
  } finally {
    fs.unlinkSync(tempFilePath);
  }
}

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash-latest",
});

app.post('/upload', async (req, res) => {
  const { base64Image, mimeType, filename } = req.body;
  console.log("Received upload request with data:", { base64Image: base64Image.substring(0, 30) + "...", mimeType, filename });

  try {
    const image = await uploadBase64ToGemini(base64Image, mimeType, filename);
    if (!image) {
      throw new Error('Failed to process image');
    }

    const prompt = "Please describe the uploaded image.";
    const result = await model.generateContent([prompt, image]);
    const responseText = result.response.text;
    console.log("Model response:", responseText);
    res.json(responseText);
  } catch (error) {
    console.error('Error (Server) processing request:', error);
    res.status(500).json({ error: 'Failed to process request', details: error.message });
  }
});

app.post('/chat', async (req, res) => {
  const { userText } = req.body;
  try {
    const result = await model.generateContent([userText]);
    const responseText = result.response.text;
    console.log("Model response:", responseText);
    res.json(responseText);
  } catch (err) {
    console.error("Error (server) in sending the text", err);
    res.status(500).json({ error: 'Failed to send message', details: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
