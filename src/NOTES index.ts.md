import express from "express";
import type { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import productsRouter from "./routes/products";
import usersRouter from "./routes/users";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config();
const startedAt = new Date().toLocaleString()   // toISOString()

const app = express();
const PORT = process.env.PORT || 3001;

// Configuration EJS
// https://ejs.co/#docs
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
// EJS common views
const ejsRenderStatus = (req: Request, res: Response) => {
  // src/views/status.ejs
  res.render("status", {
    status: "OK",
    dataSource: process.env.DATA_SOURCE || "local",
    startedAt: startedAt,
  });
};
// Middlewares
app.use(express.static("public")); // or the correct directory
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/products", productsRouter);
app.use("/api/users", usersRouter);

/*  app.get(['/', '/api/status'], (req, res) => { }       // non recommandé
  OU:
    app.get('/api/status', (req, res) => {
      res.redirect('/')
    })
  OU:
    const renderStatus = (req, res) => {
      res.render('status', {
        status: 'OK',
        dataSource: process.env.DATA_SOURCE || 'local',
        timestamp: new Date().toISOString()
    })
}

*/
// Status Route
app.get("/", ejsRenderStatus);
app.get("/api/status", ejsRenderStatus);

/* app.get('/', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, 'html', 'start.html')) 
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>API Status</title>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.jade.min.css">
        <link rel="stylesheet" href="/global.css">
      </head>
      <body>
        <div class="container-fluid">
          <h1>API Status</h1>
          <div class="grille">
          <span>Status</span><span>OK</span>
          <span>Data Source</span><span>${process.env.DATA_SOURCE || 'local'}</span>
          <span>Timestamp</span><span>${new Date().toISOString()}</span>
          </div>
        </div>
      </body>
    </html>
  `) 
  res.render('status', {
    status: 'OK',
    dataSource: process.env.DATA_SOURCE || 'local',
    timestamp: new Date().toISOString()
  }) 
}) */

/* Démarrage du serveur */
app.listen(PORT, () => {
  console.log(`✅ Server API
    http://localhost:${PORT}
    startedAt: ${startedAt}
    📊 Data source: ${process.env.DATA_SOURCE?.toUpperCase() || "LOCAL"}
  `);
});
