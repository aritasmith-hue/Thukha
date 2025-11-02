import { GoogleGenAI } from "@google/genai";
import { UploadedFile } from "../types";
import { SYSTEM_PROMPT } from "../constants";

const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result.split(',')[1]);
      } else {
        // Handle ArrayBuffer case if necessary, though it's less common for this use case
        resolve('');
      }
    };
    reader.readAsDataURL(file);
  });
  const data = await base64EncodedDataPromise;
  return {
    inlineData: {
      data,
      mimeType: file.type,
    },
  };
};

export const generateReport = async (files: UploadedFile[]): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set.");
  }
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const imageParts = await Promise.all(
    files.map(uploadedFile => fileToGenerativePart(uploadedFile.file))
  );

  // FIX: Use systemInstruction for the main prompt and provide a concise user prompt with the images.
  const contentParts = [
    { text: "Please generate a GP Consultation & Diagnostic Report based on the attached patient documents, following the specified workflow." },
    ...imageParts
  ];
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: { parts: contentParts },
    config: {
      systemInstruction: SYSTEM_PROMPT,
    }
  });

  return response.text;
};
