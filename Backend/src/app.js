const express=require("express");
const app=express();
const cors=require('cors');
const cookieParser=require("cookie-parser")
app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin:"http://localhost:5173",
    credentials:true//to handle data from cookies
}))
const authRouter=require("./routes/auth.routes.js");
const interviewRouter=require("./routes/interview.routes.js")
app.use("/api/auth",authRouter);
app.use("/api/interview",interviewRouter);

module.exports=app;