const router=require("express").Router();
const jwt=require("jsonwebtoken");
const Event=require("../models/Event");

function auth(req,res,next){
  const header=req.headers.authorization||"";
  const token=header.startsWith("Bearer ")?header.slice(7):null;
  if(!token)return res.status(401).json({message:"Please login first"});
  try{req.user=jwt.verify(token,process.env.JWT_SECRET||"dev_secret_change_me");next();}
  catch(e){res.status(401).json({message:"Session expired. Please login again"});}
}
router.get("/",async(req,res)=>{
  try{
    const events=await Event.find().populate("createdBy","name").sort({date:1});
    res.json(events);
  }catch(e){res.status(500).json({message:"Could not load events"});}
});
router.post("/",auth,async(req,res)=>{
  try{
    const {title,description,category,date,venue,capacity}=req.body;
    if(!title||!description||!category||!date||!venue||!capacity)return res.status(400).json({message:"Please fill all fields"});
    const event=await Event.create({title,description,category,date,venue,capacity:Number(capacity),createdBy:req.user.id});
    res.status(201).json(event);
  }catch(e){res.status(400).json({message:"Could not create event"});}
});
router.post("/:id/register",auth,async(req,res)=>{
  try{
    const event=await Event.findById(req.params.id);
    if(!event)return res.status(404).json({message:"Event not found"});
    if(event.attendees.some(id=>id.toString()===req.user.id))return res.status(409).json({message:"You are already registered"});
    if(event.attendees.length>=event.capacity)return res.status(409).json({message:"Event is full"});
    event.attendees.push(req.user.id);await event.save();
    res.json({message:"Registered successfully",event});
  }catch(e){res.status(400).json({message:"Registration failed"});}
});
router.get("/mine/registered",auth,async(req,res)=>{
  try{
    const events=await Event.find({attendees:req.user.id}).sort({date:1});
    res.json(events);
  }catch(e){res.status(500).json({message:"Could not load your registrations"});}
});
router.delete("/:id",auth,async(req,res)=>{
  try{
    const event=await Event.findById(req.params.id);
    if(!event)return res.status(404).json({message:"Event not found"});
    if(event.createdBy.toString()!==req.user.id && req.user.role!=="admin")return res.status(403).json({message:"Only event creator or admin can delete"});
    await event.deleteOne();res.json({message:"Event deleted"});
  }catch(e){res.status(400).json({message:"Could not delete event"});}
});
module.exports=router;
