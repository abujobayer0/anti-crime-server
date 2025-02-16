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
import morgan from "morgan";
import { NvidiaImageDescription } from "./hooks/nvidia.mistralai.mistral-7b-v.0.3";
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

app.post("/analyze", async (req: Request, res: Response) => {
  const { imageUrl, division, district } = req.body;

  const requiredParams = {
    imageUrl,
    division,
    district,
  };

  for (const [param, value] of Object.entries(requiredParams)) {
    if (!value) {
      console.log(`${param} is a mandatory parameter`);
      return res.status(400).json({
        error: `Missing required parameter: ${param}`,
      });
    }
  }

  try {
    const report = await NvidiaImageDescription(
      imageUrl[0],
      division,
      district
    );

    return res.status(200).json({ report });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate the report" });
  }
});

app.use(globalErrorHandler);

// This is connected with the notFound.ts file at the middleware folder.
app.use(notFound);

export default app;
