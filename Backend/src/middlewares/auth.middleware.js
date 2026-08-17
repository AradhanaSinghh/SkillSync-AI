const jwt=require("jsonwebtoken");
const blacklistModel=require("../models/blacklist.model.js");
/*
Request
   ↓
authUser
   ↓
Get token from cookie
   ↓
jwt.verify()
   ↓
decoded user information
   ↓
req.user = decoded
   ↓
next()
   ↓
/profile controller
*/
async function authUser(req,res,next){
    const token=req.cookies.token;

    if(!token){
        return res.status(401).json({
            message:"token not provided."
        })
    }

    const blacklistToken=await blacklistModel.findOne({token});

    if(blacklistToken){
        return res.status(401).json({
            messgae:"token is invalid"
        })
    }
    try{
        const decoded=jwt.verify(token,process.env.JWT_SECRET);
        req.user=decoded;
        next();
    }
    catch(err){
        return res.status(401).json({
            message:"Invalid token"
        })
    }
}

module.exports={authUser};