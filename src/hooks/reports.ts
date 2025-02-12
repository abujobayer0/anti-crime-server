import axios from "axios";

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export const ImageToTextActivity = async (imageUrl: string | string[]) => {
  if (!imageUrl || (Array.isArray(imageUrl) && imageUrl.length === 0)) {
    throw new Error("At least one image URL is required");
  }

  const captions: string[] = [];

  const inputs = Array.isArray(imageUrl) ? imageUrl : [imageUrl];
  inputs.forEach(async (input) => {
    const res = await axios.post(
      "https://api-inference.huggingface.co/models/Salesforce/blip-image-captioning-large",
      { inputs: input },
      {
        headers: {
          Authorization: `Bearer ${process.env.HUGGING_FACE_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    captions.push(res.data?.[0]?.generated_text);
  });

  return captions;
};
export const generateCrimeSceneReport = async (report: {
  generated_text_from_image: any;
  division: string;
  district: string;
  crime_time: string;
}) => {
  const { generated_text_from_image, division, district, crime_time } = report;
  const prompt = `
  **Crime Scene Report**  
  **Division:** ${division}  
  **District:** ${district}  
  **Time Of Incident:** ${crime_time}  
  **Summary:** ${generated_text_from_image}  
  
  Suppose you are a general people of bangladesh, you just seen this incident next to you . 
  Now write a professional and concise crime report based on provided details in **no more than 150 words**.  
  Maintain a neutral and factual tone while describing the incident.
  `;

  const generatedReport = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  });

  return generatedReport.response?.candidates?.[0]?.content?.parts?.[0]?.text;
};
