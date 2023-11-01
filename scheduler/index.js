import process from "process";
import express from "express";
import cors from "cors";
import config from "./config/config.js";
import fs from "fs";
import https from "https";
import { parse } from "tldts";

// Routes
import routes from "./routes/index.js";

const app = express();

app.use(express.json({ limit: "30mb", extended: true }));
app.use(express.urlencoded({ limit: "30mb", extended: true }));

const allowedOrigins = [config.CLIENT_URL, config.BASE_URL];
app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin
      // (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) == -1) {
        var msg =
          "The CORS policy for this site does not " +
          "allow access from the specified Origin.";
        const host = parse(origin);
        let domain = host.domain;
        if (host.publicSuffix == "localhost") {
          domain = host.publicSuffix;
        }
        if (domain != config.CLIENT_URL.split(":")[0]) {
          return callback(msg, false);
        }
      }
      return callback(null, true);
    },
  })
);

let setCache = function (req, res, next) {
  res.set("Pragma", `no-cache`);
  res.set("Cache-Control", `no-store`);
  next();
};

app.get("/", function (req, res, next) {
  res.set("Pragma", `no-cache`);
  res.set("Cache-Control", `no-store`);
  res.send(`server running ${process.pid}`);
});

// api routes
app.use("/api", setCache, routes);

app.use((req, res, next) => {
  res.set("Pragma", `no-cache`);
  res.set("Cache-Control", `no-store`);
  res.send("<h1> Page not found </h1>");
});

const HTTPS = config.USE_HTTPS || false;
const PORT = config.PORT || 5001;

//cert
const certificate = fs.readFileSync("cert/uird_jp.pem");
const privateKey = fs.readFileSync("cert/uird_jp.key");
const credentials = { key: privateKey, cert: certificate };

let server;
if (HTTPS == "true") {
  server = https.createServer(credentials, app);
} else {
  server = app;
}

server.listen(PORT, () => {
  console.log(
    `server running on pid ${process.pid} port ${PORT}, https: ${HTTPS}`
  );
});
