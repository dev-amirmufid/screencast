import express from "express";
import expressWs from "express-ws";
import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import cors from "cors";
import bodyParser from "body-parser";
import multer from "multer";
import fs from "fs";
import https from "https";
import http from "http";
import config from './config/config.js'
import {redisClient} from './helpers/redis.js'
import {parse} from 'tldts'

// import { instrument } from "@socket.io/admin-ui";

// Routes
import { socketIO } from "./socket/routeSocket.js";
import routes from "./routes/index.js";
import {InitDBMiddleware} from "./middleware/tenant.middleware.js";

import helmet from "helmet";
import { xss } from "express-xss-sanitizer";


const allowedOrigins = [config.env.CLIENT_URL,config.BASE_URL];

const app = express();
const upload = multer();

expressWs(app);

app.use(helmet())
app.disable('x-powered-by')
app.use(bodyParser.json({limit: '2mb'}));
app.use(bodyParser.urlencoded({limit: '2mb', extended: true}));
app.use(xss())
// app.use(upload.array()); 
app.use(cors({
  origin: function(origin, callback){
    if(!origin) return callback(null, true);
    
    if(allowedOrigins.indexOf(origin) == -1){
      var msg = 'The CORS policy for this site does not ' +
                'allow access from the specified Origin.';
      const host = parse(origin)
      let domain = host.domain
      if(host.publicSuffix == 'localhost'){
        domain = host.publicSuffix
      }
      if(domain != config.env.CLIENT_URL.split(':')[0]) {
        return callback(msg, false);
      }
    }
    return callback(null, true);
  }
}));

// api routes
app.get("/", (req, res, next) => {
  res.status(200).send(`server running on ${config.BASE_URL}`);
 });

// api routes
app.use("/api", InitDBMiddleware(), routes);

let server;
if (config.env.USE_HTTPS == "true") {
  const certificate = fs.readFileSync("cert/uird_jp.pem");
  const privateKey = fs.readFileSync("cert/uird_jp.key");
  const credentials = { key: privateKey, cert: certificate };
  server = https.createServer(credentials, app);
} else {
  server = http.createServer(app);
}

const io = new Server(server, {
  transports: ["websocket","polling"],
  cors: {
    origin: '*',
    credentials: true
  }
});

// instrument(io, {
//   auth: false,
//   mode: "development",
// });

const subRedisClient = redisClient.duplicate();
Promise.all([redisClient.connect(), subRedisClient.connect()]).then(() => {
  io.adapter(createAdapter(redisClient, subRedisClient));
  socketIO(io);
});

setInterval(function () {
  redisClient.ping((err) => {
    if (err) console.error('Redis keepalive error', err);
  });
}, 180 * 1000);

server.listen(config.env.PORT, () => {
  console.log(`server running on ${config.BASE_URL}, https: ${config.env.USE_HTTPS}`);
});
