const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors=require("cors");
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:5173", // or "*" to allow all origins
    methods: ["GET", "POST"],
    allowedHeaders: ["my-custom-header"],
    credentials: true,
  },
});

const mongoose = require("mongoose");
const userRoutes=require("./Routes/user");
const conversationRoutes = require("./Routes/conversation");

mongoose
  .connect(
    "mongodb+srv://andrewgreaves14:bPGXedSSKbprlj6f@swifttalkcluster.u8dir7o.mongodb.net/SwiftTalkDB?retryWrites=true&w=majority",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => {
    console.log("Connected to the database");
  })
  .catch((error) => {
    console.error("Database connection error:", error);
  });


app.use(cors());
app.set("socketio", io);

io.on("connection", (socket) => {

  socket.on("joinRoom", (conversationId) => {
    socket.join(conversationId);
    console.log(`User with ID: ${socket.id} joined room: ${conversationId}`);
  });


  socket.on("disconnect", () => {
    console.log(`User with ID: ${socket.id} disconnected`);
  });
});


// Middleware to attach io to req
app.use((req, res, next) => {
  req.io = io;
  next();
});
app.use("/",userRoutes);
app.use("/api/conversations", conversationRoutes);

server.listen(3001, () => {
  console.log("Server is running on port 3001");
});
