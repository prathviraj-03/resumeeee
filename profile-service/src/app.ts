import express from "express";
import { json } from "express";
import routes from "./routes/index";
import { errorHandler } from "./middleware/errorHandler";

const app = express();

app.use(json());
app.use((req, res, next) => {
  console.log(`[ProfileService] ${req.method} ${req.url}`);
  next();
});
app.use("/api", routes);

// 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Not Found", statusCode: 404 });
});

// Centralized error handler
app.use(errorHandler);

export default app;
