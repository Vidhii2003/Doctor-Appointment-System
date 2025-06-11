import doctorModel from "../models/doctorModel.js"
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import appointmentModel from './../models/appointmentModel.js';


const changeAvailability = async (req, res) => {
    try{

        const {docId} = req.body 

        const docData = await doctorModel.findById(docId)
        await doctorModel.findByIdAndUpdate(docId,{available: !docData.available })
        res.json({success:true, message: 'Availability Changed'})

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}


const doctorList = async (req, res) => {
  try {
    const { speciality } = req.query;

    let filter = {};

    if (speciality) {
      filter.speciality = { $regex: new RegExp(speciality, 'i') }; // case-insensitive match
    }

    const doctor = await doctorModel.find(filter).select('-password -email');
    res.json({ success: true, doctor });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};


// api for the doctor login //

const loginDoctor = async (req, res) => {
    try {
        const { email, password } = req.body
        const doctor = await doctorModel.findOne({ email })

        if (!doctor) {
            return res.json({ success: false, message: 'Invalid Credentials' })
        }

        const isMatch = await bcrypt.compare(password, doctor.password)

        if (isMatch) {
            const token = jwt.sign({ id: doctor._id }, process.env.JWT_SECRET)
            return res.json({ success: true, token }) // success response
        } else {
            return res.json({ success: false, message: 'Invalid Credentials' })
        }

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// api for getting doctor appointments fpr doc panel //

const appointmentsDoctor = async (req, res) => {
    try {
        const doctorId = req.user.id; // token payload decoded in middleware
        const appointments = await appointmentModel.find({ docId: doctorId });
        res.json({ success: true, appointments });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// api for marking appointment complete for doc panel //
 
const appointmentComplete = async (req, res) => {
    try {
        const { appointmentId } = req.body;
        const doctorId = req.user.id; // <-- coming from decoded token
        const appointmentData = await appointmentModel.findById(appointmentId);
        
        if (appointmentData && appointmentData.docId.toString() === doctorId) {
        
        await appointmentModel.findByIdAndUpdate(appointmentId, { isCompleted: true });
        return res.json({ success: true, message: 'Appointment Completed' });
      } else {
        return res.json({ success: false, message: 'Marking Failed' });
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({ success: false, message: error.message });
    }
  };
  

// api for cancelling appointment complete for doc panel //
 
const appointmentCancel = async (req, res) => {
    try {
        const { appointmentId } = req.body;
        const doctorId = req.user.id;
        const appointmentData = await appointmentModel.findById(appointmentId);
        
        if (appointmentData && appointmentData.docId.toString() === doctorId) {
        
        await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true });
        return res.json({ success: true, message: 'Appointment Cancelled' });
      } else {
        return res.json({ success: false, message: 'Cancellation Failed' });
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({ success: false, message: error.message });
    }
  };

  // api for getting dashboard data for doc panel //

  const doctorDashboard = async (req, res) => {
    try {
      const docId = req.user.id; 
  
      const appointments = await appointmentModel.find({ docId });
  
      let earnings = 0;
  
      appointments.forEach(item => {
        if (item.isCompleted || item.payment) {
          earnings += item.amount || 0;
        }
      });
  
      let patients = [];
  
      appointments.forEach(item => {
        if (!patients.includes(item.userId.toString())) {
          patients.push(item.userId.toString());
        }
      });
  
      const dashData = {
        earnings,
        appointments: appointments.length,
        patients: patients.length,
        latestAppointments: appointments.reverse().slice(0, 5)
      };
  
      res.json({ success: true, dashData });
  
    } catch (error) {
      console.log(error);
      res.status(500).json({ success: false, message: error.message });
    }
  }  
  
  // api for getting doctor profile for doc panel //

  const doctorProfile = async (req,res) => {

    try {
        const docId = req.user.id;
        const profileData = await doctorModel.findById(docId).select('-password')

        res.json({success:true, profileData})

    } catch (error) {
      console.log(error);
      res.status(500).json({ success: false, message: error.message });
    }

  }

  // api for updatind doctor profile for doc panel //

  const updateDoctorProfile = async (req, res) => {
    try {
      const docId = req.user.id;
      const { fees, address, available } = req.body; //from frontend
  
      await doctorModel.findByIdAndUpdate(docId, { fees, address, available });
  
      res.json({ success: true, message: 'Profile Updated' });
    } catch (error) {
      console.log(error);
      res.status(500).json({ success: false, message: error.message });
    }
  };  


export {changeAvailability,doctorList,loginDoctor,appointmentsDoctor, appointmentComplete, appointmentCancel, doctorDashboard, doctorProfile, updateDoctorProfile}