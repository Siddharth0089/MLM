import express from "express";
import cors from "cors";
import { connectDB } from "./db/connect.js";
import judgeRoutes from "./routes/judge.routes.js";
import "dotenv/config";

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.use("/api", judgeRoutes);

app.get("/", (_, res) => res.send("Judge backend running ✅"));

const PORT = process.env.PORT || 5000;



app.get("/health", (req, res) => {
  res.status(200).json({ msg: "api is up and running" });
});


const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => console.log("Server is running on port:", PORT));
  } catch (error) {
    console.error("💥 Error starting the server", error);
  }
};

startServer();
