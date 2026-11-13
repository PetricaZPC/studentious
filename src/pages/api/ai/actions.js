import { GoogleGenerativeAI } from "@google/generative-ai";

function formatResponse(text) {
  
  let formattedText = text.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b><br/>');

  
  formattedText = formattedText.replace(/\n\* /g, '<br/>• ');

 
  formattedText = formattedText.replace(/^(\* )/gm, '• ');

  return formattedText.trim();
}

export default async function handler(req, res) {
  if (req.method != "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.GEMINI_AI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'The AI assistant is unavailable: no Gemini API key is configured.' });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || "gemini-2.5-flash" });
    const result = await model.generateContent(message);
    const response = await result.response;
    const text = formatResponse(response.text());

    res.status(200).json({ reply: text });
  } catch (error) {
    console.error("Error generating content:", error);
    res.status(502).json({ error: 'The AI assistant is unavailable (the free Gemini API key has probably expired or reached its quota).' });
  }
}