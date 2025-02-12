/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Application, Request, Response } from "express";
import router from "./app/routes";
import notFound from "./app/middlewares/notFound";
import globalErrorHandler from "./app/middlewares/globalErrorhandler";
import { generateCrimeSceneReport, ImageToTextActivity } from "./hooks/reports";
import morgan from "morgan";
const app: Application = express();
app.use(morgan("dev"));

//parsers
app.use(express.json());
app.use(cookieParser());

app.use(cors({ origin: ["http://localhost:3000"], credentials: true }));

// Application routes
app.use("/api/v1", router);

app.get("/", (req: Request, res: Response) => {
  res.send(`Hello Anti Crime Server on Port:${process.env.PORT}`);
});

app.post("/analyze", async (req: Request, res: Response): Promise<any> => {
  const { imageUrl, division, district, crime_time } = req.body;

  // Validate required parameters
  if (!imageUrl) {
    console.log(" mandatory parameter");

    return res
      .status(400)
      .json({ error: "Missing required parameter: imageUrl" });
  }
  if (!division) {
    console.log(" mandatory parameter");
    return res
      .status(400)
      .json({ error: "Missing required parameter: division" });
  }
  if (!district) {
    console.log(" mandatory parameter");

    return res
      .status(400)
      .json({ error: "Missing required parameter: district" });
  }

  try {
    const generated_text = await ImageToTextActivity(imageUrl);
    if (!generated_text) {
      return res
        .status(400)
        .json({ error: "Failed to extract text from image" });
    }
    const crimeReportModel = {
      generated_text_from_image: generated_text,
      division: division,
      district: district,
      crime_time: crime_time,
    };
    const report = await generateCrimeSceneReport(crimeReportModel);

    return res.status(200).json({ report, generated_text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate the report" });
  }
}); // This is connected with the globalErrorhandler.ts file at the middleware folder.
app.use(globalErrorHandler);

// This is connected with the notFound.ts file at the middleware folder.
app.use(notFound);

export default app;
``;
