import { GoogleGenAI } from "@google/genai";
import mime from "mime";
import fs from "fs/promises";

const GEMINI_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_KEY) {
  console.error("❌ Missing GEMINI_API_KEY in .env");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: GEMINI_KEY });

async function testImageGen() {
  try {
    const model = "gemini-2.5-flash-image-preview";
    const config = { responseModalities: ["IMAGE"] };
    const contents = [
      {
        role: "user",
        parts: [{ text: "Generate an image of a neon gaming thumbnail with dark background" }],
      },
    ];

    console.log("🚀 Requesting image from Gemini...");

    const stream = await ai.models.generateContentStream({ model, config, contents });

    let fileIndex = 0;
    for await (const chunk of stream) {
      const parts = chunk?.candidates?.[0]?.content?.parts || [];
      const inlineData = parts.find((p) => p.inlineData)?.inlineData;

      if (inlineData) {
        const mimeType = inlineData.mimeType || "image/png";
        const buffer = Buffer.from(inlineData.data, "base64");

        const filename = `gemini-test-${fileIndex}.${mime.getExtension(mimeType)}`;
        await fs.writeFile(filename, buffer);

        console.log(`✅ Saved image: ${filename}`);
        fileIndex++;
      }
    }

    if (fileIndex === 0) {
      console.error("❌ No images returned by Gemini");
    }
  } catch (err) {
    console.error("❌ Gemini error:", err);
  }
}

testImageGen();