require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const notFoundMiddleware = require("./middlewares/not-found");
const errorMiddleware = require("./middlewares/error");
const rateLimitMiddleware = require("./middlewares/rate-limit");

const app = express();

app.use(cors());
app.use(morgan("dev"));
app.use(rateLimitMiddleware);
app.use(express.json());

app.use(notFoundMiddleware);
app.use(errorMiddleware);

const port = process.env.PORT || "5000";
app.listen(port, () => console.log(`server running on port ${port}`));
