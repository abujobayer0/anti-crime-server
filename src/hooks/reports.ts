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
  **Time of Incident:** ${crime_time}  
  **Summary:** ${generated_text_from_image}  
  
  ### **Incident Overview**  
  The crime scene is set in an **urban environment**, marked by destruction, damaged vehicles, and broken infrastructure. Signs of **chaos and disorder** are evident, with possible links to ongoing protests, gang violence, or other disruptive events.  
  
  ### **Key Observations**  
  - **Actions & Movement:** The area is highly volatile, with **people fleeing, engaging in physical altercations, or reacting to escalating tensions**. Law enforcement is present, making efforts to control the situation.  
  - **Objects & Items:** Scattered **debris, broken glass, abandoned belongings, and potential weapons** suggest an intense conflict. Protest materials and other items hint at an organized or spontaneous outbreak of violence.  
  - **Suspects & Victims:** Several individuals display **signs of distress, injuries, or active aggression**. Perpetrators may be involved in **targeted attacks**, while victims could be **bystanders or direct targets**.  
  - **Potential Motive:** The incident appears to stem from **political unrest, gang conflicts, robbery, or an escalated protest**. Possible motives include **retaliation, territorial disputes, or external influences**.  
  
  ### **Report Instructions**  
  As an **experienced crime reporter**, craft a **factual and concise** report based on these details in **no more than 150 words**. Focus on:  
  - The **chronology of events**  
  - **Potential triggers** leading to the violence  
  - The **aftermath and response efforts**  
  
  Ensure the report remains **neutral, professional, and evidence-based**. Avoid speculation, and present only **verified details**.  
  `;

  const generatedReport = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  });

  return generatedReport.response?.candidates?.[0]?.content?.parts?.[0]?.text;
};
