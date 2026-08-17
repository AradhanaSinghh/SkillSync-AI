const mongoose=require('mongoose');

async function connectToDB(){
    try{
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅Mongodb connnected successfully!");
    }
    catch(error){
        console.log("❌Mongodb connection failed!",error);
    }
}
module.exports=connectToDB