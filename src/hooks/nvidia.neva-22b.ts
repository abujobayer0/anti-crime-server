import axios from "axios";

export const NvidiaImageDescription = async (
  imageUrl: string,
  division: string,
  district: string
) => {
  const headers = {
    Authorization: `Bearer ${process.env.NVIDIA_API_KEY}`,
    Accept: "application/json",
  };

  const prompt = `
  Please provide a clear and simple description of this image, focusing on:
  1. What is happening in the scene
  2. Who or what is visible
  3. Any suspicious activities or safety concerns
  4. Important details about location and timing
  
  Location context: Division: ${division}, District: ${district}
  
  **Image Reference:** <img src="${imageUrl}" />
  `;

  const payload = {
    messages: [{ role: "user", content: prompt }],
    max_tokens: 1024,
    temperature: 0.2,
    top_p: 0.7,
    stream: false,
  };

  try {
    const response = await axios.post(
      "https://ai.api.nvidia.com/v1/vlm/nvidia/neva-22b",
      payload,
      { headers }
    );

    const aiResponse = response.data.choices[0].message.content;

    return aiResponse;
  } catch (error) {
    console.error("Error in NvidiaMistral7bInstruct:", error);
    throw error;
  }
};
