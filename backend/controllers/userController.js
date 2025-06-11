import validator from 'validator'
import bcrypt from 'bcrypt'
import userModel from './../models/userModel.js';
import jwt from'jsonwebtoken'
import {v2 as cloudinary} from 'cloudinary'
import doctorModel from './../models/doctorModel.js';
import appointmentModel from '../models/appointmentModel.js';
import razorpay from 'razorpay';
import crypto from 'crypto';
import dotenv from 'dotenv'
dotenv.config()

// api for registering user //
const registerUser = async (req,res) => {

    try {
        const { name, email, password } = req.body

        if(!name || !email || !password) {
            return registerUser.json({success:false,message:"Missing Details"})
        } 
        if (!validator.isEmail(email)) {
            return registerUser.json({success:false,message:"enter valid email id "})
        }
        if (password.length < 8) {
            return registerUser.json({success:false,message:"enter strong password "})
        }

        // hashing user password //
        const salt= await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password,salt)

        const userData = {
            name,
            email,
            password:hashedPassword
        }
        
        const newUser = new userModel(userData)
        const user = await newUser.save()

        const token =jwt.sign({id:user._id}, process.env.JWT_SECRET)

        res.json({success:true,token})



    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })

    }
}

// api for the user login //
const loginUser = async (req,res) => {
    
    try {

        const {email,password} = req.body
        const user = await userModel.findOne({email})

        if (!user) {
            return res.json({ success: false, message: 'User not exist' })

        }
        const isMatch = await bcrypt.compare(password,user.password)

        if (isMatch) {
            const token =jwt.sign({id:user._id}, process.env.JWT_SECRET)
            res.json({success:true,token})
        } else {
            res.json({success:false,message:"Invalid Password"})
        }
        
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })

    }
}


// api for user profile data //
const getprofile = async (req, res) => {
    try {
      const userData = await userModel.findById(req.userId).select('-password')
      res.json({ success: true, userData })
    } catch (error) {
      console.log(error)
      res.status(500).json({ success: false, message: error.message })
    }
  }
  

// api for updating user profile //

const updateProfile = async (req, res) => {
    try {
      const userId = req.userId
      const { name, phone, address, dob, gender } = req.body
      const imageFile = req.file

      console.log('DOB received:', dob) 
  
      if (!name || !phone || !dob || !gender) {
        return res.json({ success: false, message: "Missing Data" })
      }
  
      const updateData = {
        name,
        phone,
        address: JSON.parse(address),
        dob,
        gender,
      }
  
      // Upload image to Cloudinary if provided
      if (imageFile) {
        const upload = await cloudinary.uploader.upload(imageFile.path, {
          resource_type: 'image',
        })
        updateData.image = upload.secure_url
      }
  
      // update and get updated user data
      
     // Perform update
     await userModel.findByIdAndUpdate(userId, updateData)

    // Get updated user data (excluding password)
    const updatedUser = await userModel.findByIdAndUpdate(
        userId,
        updateData,
        { new: true } 
      ).select('-password')
      
      res.json({ success: true, message: "Profile Updated", userData: updatedUser })
      
  
    } catch (error) {
      console.log(error)
      res.json({ success: false, message: error.message })
    }
  }


  // api for booking appointment //

  const bookAppointment = async (req,res) => {

    try {
        const userId = req.userId; // get from auth middleware
        const { docId, slotDate, slotTime } = req.body;
      
        const docData = await doctorModel.findById(docId).select('-password')

        if(!docData.available) {
            return res.json({success:false,message:'Doctor not available'})
        }

        let slots_booked = docData.slots_booked

        // check for the slot availablity //
        if (slots_booked[slotDate]) {
            if (slots_booked[slotDate].includes(slotTime)) {
                return res.json({success:false,message:'Slot not available'})
            } else {
                slots_booked[slotDate].push(slotTime)
            }
        } else {
            slots_booked[slotDate] = []
            slots_booked[slotDate].push(slotTime)
        }

        const userData = await userModel.findById(userId).select('-password')

        delete docData.slots_booked

        const appointmentData = {
            userId,
            docId,
            userData,
            docData,
            amount:docData.fees,
            slotTime,
            slotDate,
            date: Date.now()
        }

        const newAppointment = new appointmentModel(appointmentData)
        await newAppointment.save()

        // saving new slots data in the doctor data //
        
        await doctorModel.findByIdAndUpdate(docId,{slots_booked})
        res.json({success:true,message:'Appointment Booked '})

    } catch (error) {
      console.log(error)
      res.json({ success: false, message: error.message })
    }
  }

  // api for getting user appointments for frontend my-appointment page //

  const listAppointment = async (req, res) => {
    try {
      const userId = req.userId
      const appointments = await appointmentModel.find({ userId })
      res.json({ success: true, appointments })
    } catch (error) {
      console.log(error)
      res.status(500).json({ success: false, message: error.message })
    }
  }  

  // api for cancelling appointment //

  const cancelAppointment = async (req,res) => {
    try {

      const userId = req.userId
      const { appointmentId } = req.body
      const appointmentData = await appointmentModel.findById(appointmentId)

      // verifying appointment for the user //

      if (appointmentData.userId.toString() !== userId) {
        return res.json ({success:false,message:'Unauthorized action'})
      }

      await appointmentModel.findByIdAndUpdate(appointmentId, {cancelled:true})
      
      // release doctor slot //

      const {docId, slotDate, slotTime} = appointmentData

      const doctorData = await doctorModel.findById(docId)

      let slots_booked = doctorData.slots_booked

      slots_booked[slotDate] = slots_booked[slotDate].filter(e => e !== slotTime)

      await doctorModel.findByIdAndUpdate(docId, {slots_booked})

      res.json({success:true, message:'Appointment Cancelled'})

    } catch (error) {
      console.log(error)
      res.status(500).json({ success: false, message: error.message })
      
    }
  }

  const razorpayInstance = new razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  })  

  // api for making payment for appointment using razorpay //

  const paymentRazorpay = async (req,res) => {

    try {
      const { appointmentId } = req.body
      console.log("Creating Razorpay order for appointmentId:", appointmentId)
      const appointmentData = await appointmentModel.findById(appointmentId)

    if (!appointmentData || appointmentData.cancelled) {
      return res.json({success:false,message:"Appointment cancelled or not found"})
    }

    // create options for razorpay payment //
    const options = {
      amount: appointmentData.amount *100,
      currency: process.env.CURRENCY,
      receipt: appointmentId,
    }

    // creation of the order //
    const order = await razorpayInstance.orders.create(options)

    res.json({success:true,order})
 
      
    } catch (error) {
      console.log(error)
      res.status(500).json({ success: false, message: error.message })
    }
 
  }
  
  // api for verifying razorpay //
  
  const verifyRazorpay = async (req, res) => {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  
      // Validate required fields
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({ success: false, message: "Missing payment details" });
      }
  
      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");
  
      if (expectedSignature !== razorpay_signature) {
        return res.status(400).json({ success: false, message: "Invalid signature" });
      }
  
      // Extract appointment ID from order ID (if stored in receipt during order creation)
      const order = await razorpayInstance.orders.fetch(razorpay_order_id);
  
      if (!order || !order.receipt) {
        return res.status(404).json({ success: false, message: "Order not found or receipt missing" });
      }
  
      const appointmentId = order.receipt;
  
      await appointmentModel.findByIdAndUpdate(appointmentId, { payment: true });
  
      return res.json({ success: true, message: "Payment verified" });
    } catch (error) {
      console.error("verifyRazorpay error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  };
  

export {registerUser,loginUser,getprofile,updateProfile,bookAppointment,listAppointment,cancelAppointment,paymentRazorpay,verifyRazorpay}