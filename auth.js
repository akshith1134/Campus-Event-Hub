const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

function tokenFor(user){
  return jwt.sign({id:user._id,role:user.role},process.env.JWT_SECRET || "dev_secret_change_me",{expiresIn:"7d"});
}
router.post("/register",async(req,res)=>{
  try{
    const {name,email,password}=req.body;
    if(!name||!email||!password) return res.status(400).json({message:"Name, email and password are required"});
    if(password.length<6) return res.status(400).json({message:"Password must be at least 6 characters"});
    const normalized=email.toLowerCase().trim();
    if(await User.findOne({email:normalized})) return res.status(409).json({message:"Email already registered"});
    const hashed=await bcrypt.hash(password,10);
    const user=await User.create({name,email:normalized,password:hashed,role:"student"});
    res.status(201).json({token:tokenFor(user),user:{id:user._id,name:user.name,email:user.email,role:user.role}});
  }catch(e){res.status(500).json({message:"Registration failed"});}
});
router.post("/login",async(req,res)=>{
  try{
    const {email,password}=req.body;
    const user=await User.findOne({email:(email||"").toLowerCase().trim()});
    if(!user || !(await bcrypt.compare(password||"",user.password))) return res.status(401).json({message:"Invalid email or password"});
    res.json({token:tokenFor(user),user:{id:user._id,name:user.name,email:user.email,role:user.role}});
  }catch(e){res.status(500).json({message:"Login failed"});}
});
module.exports=router;
