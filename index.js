import "dotenv/config";
import express from "express";
import multer from "multer";
import { GoogleGenAI } from "@google/genai";

const app = express();
const upload = multer();

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

const GEMINI_MODEL = "models/gemini-1.5-flash-latest";

app.use(express.json());

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server ready on http://localhost:${PORT}`));

app.post("/generate-text", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
    });

    const text = extractText(response);
    res.json({ text });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/generate-from-image", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Image file is required" });
    }

    const imageBuffer = req.file.buffer;
    const base64Image = imageBuffer.toString("base64");

    const prompt = req.body.prompt || "Describe the image in detail.";

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: req.file.mimetype, // contoh: "image/jpeg"
                data: base64Image,
              },
            },
          ],
        },
      ],
    });

    const text = extractText(response);
    res.json({ text });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/generate-from-document", upload.single("document"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Document file is required" });
    }
    const docBuffer = req.file.buffer;
    const base64Doc = docBuffer.toString("base64");
    const prompt = req.body.prompt || "Ringkas dokumen berikut:";
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: req.file.mimetype, // contoh: "application/pdf"
                data: base64Doc,
              },
            },
          ],
        },
      ],
    });
    const text = extractText(response);
    res.json({ text });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/generate-from-audio", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Audio file is required" });
    }

    const audioBuffer = req.file.buffer;
    const base64Audio = audioBuffer.toString("base64");

    const prompt = req.body.prompt || "Transcribe the following audio:";
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: req.file.mimetype, // contoh: "audio/mpeg"
                data: base64Audio,
              },
            },
          ],
        },
      ],
    });
    const text = extractText(response);
    res.json({ text });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Helper
function extractText(resp) {
  try {
    return resp?.candidates?.[0]?.content?.parts?.[0]?.text || JSON.stringify(resp, null, 2);
  } catch (error) {
    console.error("Error extracting text:", error);
    return JSON.stringify(resp, null, 2);
  }
}
