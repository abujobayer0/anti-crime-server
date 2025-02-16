import { HfInference } from "@huggingface/inference";

const client = new HfInference(process.env.HUGGING_FACE_API_KEY!);

export const Llama32VisionInstruct = async (
  imageUrl: string,
  division: string,
  district: string
) => {
  const chatCompletion = await client.chatCompletion({
    model: "meta-llama/Llama-3.2-11B-Vision-Instruct",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `What is happening in this image? what is the situation? write a detailed report about the image in 150 words. here is context: Division : ${division} , District : ${district} `,
          },
          {
            type: "image_url",
            image_url: {
              url: imageUrl[0],
            },
          },
        ],
      },
    ],
    provider: "fireworks-ai",
    max_tokens: 500,
  });

  return chatCompletion.choices[0].message.content;
};
