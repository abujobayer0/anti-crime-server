import axios from "axios";
import { readFile } from "node:fs/promises";

const invokeUrl =
  "https://ai.api.nvidia.com/v1/vlm/microsoft/phi-3-vision-128k-instruct";
const stream = false;

const headers = {
  Authorization: `Bearer ${process.env.NVIDIA_API_KEY}`,
  Accept: stream ? "text/event-stream" : "application/json",
};

async function analyzeImageWithPhi(imagePath: string) {
  try {
    const data = await readFile(imagePath);
    const imageB64 = Buffer.from(data).toString("base64");
    if (imageB64.length > 180_000) {
      throw new Error("To upload larger images, use the assets API (see docs)");
    }

    const payload = {
      messages: [
        {
          role: "user",
          content: `Describe
 <img src="data:image/jpeg;base64,${imageB64}" />`,
        },
      ],
      max_tokens: 512,
      temperature: 1.0,
      top_p: 0.7,
      stream: stream,
    };

    const response = await axios.post(invokeUrl, payload, {
      headers: headers,
      responseType: stream ? "stream" : "json",
    });

    if (stream) {
      response.data.on("data", (chunk: any) => {
        console.log(chunk.toString());
      });
    } else {
      console.log(JSON.stringify(response.data));
    }
  } catch (error) {
    console.error(error);
  }
}

export default analyzeImageWithPhi;
