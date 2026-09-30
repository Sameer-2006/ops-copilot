const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const addressRoutes = require("./routes/addresses");
const auditRoutes = require("./routes/audit");
require("dotenv").config();
const orderStatusRoutes =
    require("./routes/orderStatus");

const { runOCR } = require("./services/ocrService");
const { parseAddress } = require("./services/addressParser");

const connectDB = require("./config/db");

const riderRoutes = require("./routes/riders");
const orderRoutes = require("./routes/orders");

const app = express();



app.use(cors({
    origin: process.env.FRONTEND_URL
}));
app.use(express.json());



const server = http.createServer(app);



const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL

    }
});

io.on("connection", (socket) => {

    console.log("Frontend connected:", socket.id);

    socket.on("disconnect", () => {
        console.log("Frontend disconnected:", socket.id);
    });

});

app.use("/api/riders", riderRoutes(io));
app.use("/api/addresses", addressRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/audit", auditRoutes);
app.use(
    "/api/orders",
    orderStatusRoutes
);

app.get("/", (req, res) => {
    res.json({
        message: "Ops Copilot Backend is running!"
    });
});



connectDB();



const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});