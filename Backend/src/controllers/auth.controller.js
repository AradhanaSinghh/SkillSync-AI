const tokenBlacklistModel = require("../models/blacklist.model.js");
const userModel=require("../models/user.model.js");
const bcrypt=require("bcryptjs");
const jwt=require("jsonwebtoken");
async function registerUserController(req,res){
    const {username,email,password}=req.body;

    if(!username || !email || !password){
        return res.status(400).json({
            message:"Please provide username,email and password"
        })

        const isUserAlreadyExists=await userModel.findOne({
            $or:[
                {username},
                {email}
            ]
        })

        if(isUserAlreadyExists){
            return res.status(400).json({
                message:"Account already exists with this username"
            })
        }
    }
    const hash=await bcrypt.hash(password,10);

    const user=await userModel.create({
        username,
        email,
        password:hash
    })

    const token=jwt.sign(
        {
        id:user._id,
        username:user.username
        },
        process.env.JWT_SECRET,
        {expiresIn:"1d"}
    )

    res.cookie("token",token);

    res.status(201).json({
        message:"User registered successfully!",
        user:{
            id:user._id,
            username:user.username,
            email:user.email
        }
    })
}


async function loginUserController(req,res){
    const {email,password}=req.body;

    const user=await userModel.findOne({email});

    if(!user){
        return res.status(400).json({
            message:"Invalid email or password"
        })
    }

    const isPasswordValid=await bcrypt.compare(password,user.password);

    if(!isPasswordValid){
        return res.status(401).json({
            message:"Invalid email or password"
        })
    }

    const token=jwt.sign(
        {
        id:user._id,
        username:user.username
        },
        process.env.JWT_SECRET,
        {expiresIn:"1d"}
    )

    res.cookie("token",token);
    res.status(201).json({
        message:"User loggedIn successfully!",
        user:{
            id:user._id,
            username:user.username,
            email:user.email
        }
    })
}

async function logoutUserController(req,res){
    const token=req.cookies.token;

    if(token){
        await tokenBlacklistModel.create({token})
    }

    res.clearCookie("token","token");
    res.status(200).json({
        message:"User logged out successfully"
    })
}

async function getMeController(req,res){
    const user=await userModel.findById(req.user.id);
    res.status(200).json({
        message:"user details fetched successfully",
        user:{
            id:user._id,
            username:user.username,
            email:user.email
        }
    })
}
module.exports={
    registerUserController,
    loginUserController,
    logoutUserController,
    getMeController
}