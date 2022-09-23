const express = require("express");
const cors = require("cors");
const bearerToken = require("express-bearer-token");
const dotenv = require("dotenv");
dotenv.config();

const app = express();

const routers = require("./src/routes");

const URL_CLIENT = process.env.URL_CLIENT;
app.use(express.json({ extended: true }));
// app.use(express.urlencoded());
app.use(
  cors({
    origin: `${URL_CLIENT}`,
    exposedHeaders: ["UID", "Auth-Token"],
  })
);
app.use(bearerToken());

app.use(express.static("public"));

// Database Connection
const connection = require("./src/config");
connection.connect((error) => {
  if (error) {
    console.log("Database connection error: ", error);
  }

  console.log(
    `Database connection is established at ID: ${connection.threadId}`
  );
});

app.use("/user", routers.user_router);
app.use("/user/transactions", routers.transaction_router);

const PORT = process.env.PORT || 2000;
app.listen(PORT, () => console.log(`API is connected at PORT: ${PORT}.`));
