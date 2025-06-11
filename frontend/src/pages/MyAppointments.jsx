/* eslint-disable no-unused-vars */
/* eslint-disable no-empty */
import React, { useContext, useEffect, useState } from 'react'
import { AppContext } from './../context/AppContext'
import axios from 'axios'
import { toast } from 'react-toastify'
import {useNavigate} from 'react-router-dom'

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement("script")
    script.src = "https://checkout.razorpay.com/v1/checkout.js"
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

const MyAppointments = () => {

  const { backendUrl, token, getDoctorsData, userData } = useContext(AppContext)

  const [appointments,setAppointments] = useState([])
  const months = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

  const navigate = useNavigate()

  const slotDateFormat = (slotDate) => {
    const dateArray = slotDate.split('_')
    return dateArray[0]+ " " + months[Number(dateArray[1])] + " " + dateArray[2]
  }


  const getUserAppointments = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/user/appointments`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      const res = await loadRazorpayScript()

      if (data.success) {
        setAppointments(data.appointments.reverse())
        console.log(data.appointments)
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message)
    }
  }

  const cancelAppointment = async (appointmentId) => {

    try {

      const {data} = await axios.post(backendUrl+ '/api/user/cancel-appointment', {appointmentId}, {headers: { Authorization: `Bearer ${token}` }})
      if (data.success) {
        toast.success(data.message)
        getUserAppointments()
        getDoctorsData()
      } else {
        toast.error(data.message)
      }
      
    } catch (error) {
      console.log(error);
      toast.error(error.message)
    }

  }

  const appointmentRazorpay = async (appointmentId) => {
    try {
      console.log("Creating Razorpay order for appointmentId:", appointmentId);
  
      const { data } = await axios.post(
        `${backendUrl}/api/user/payment-razorpay`,
        { appointmentId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
  
      if (!data.success) {
        toast.error(data.message);
        return;
      }
  
      // Load Razorpay script
      const scriptLoaded = await new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => resolve(true);
        script.onerror = () => {
          toast.error("Razorpay SDK failed to load.");
          resolve(false);
        };
        document.body.appendChild(script);
      });
  
      if (!scriptLoaded) return;
  
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID, 
        amount: data.order.amount,
        currency: "INR",
        name: "Prescripto",
        description: "Appointment Payment",
        order_id: data.order.id,
        handler: async function (response)  {
          toast.success("Payment Successful!");
          console.log("Payment success:", response);

          try {
            const { data } = await axios.post(backendUrl+'/api/user/verifyRazorpay',response,{headers: { Authorization: `Bearer ${token}` }})
            if (data.success) {
              getUserAppointments()
              navigate('/my-appointments')
            }
          } catch (error) {
          console.log(error)
          toast.error(error.message)
          }
        },
        prefill: {
          name: userData.name,
          email: userData.email,
        },
        theme: {
          color: "#0f172a",
        },
      };
  
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error("Error during Razorpay payment:", error);
      toast.error("Payment failed. Please try again.");
    }
  };
  

  useEffect(()=>{
     if (token) {
      getUserAppointments()
     }
  },[token])

  return (
    <div>
      <p className='pb-3 mt-12 font-medium text-zinc-700 border-b'>My Appointments</p>
      <div>
          {appointments.map((item,index)=>(
            <div className='grid grid-cols-[1fr_2fr] gap-4 sm:flex sm:gap-6 py-2 border-b' key={index}>
                 <div>
                  <img className='w-32 bg-indigo-50' src={item.docData.image} alt="" />
                 </div>
                 <div className='flex-1 text-sm text-zinc-600'>
                  <p className='text-netural-800 font-semibold'>{item.docData.name}</p>
                  <p>{item.docData.speciality}</p>
                  <p className='text-zinc-700 font-medium mt-1'>Address:</p>
                  <p className='text-xs'>{item.docData.address.line1}</p>
                  <p className='text-xs'>{item.docData.address.line2}</p>
                  <p className='text-xs mt-1'><span className='text-sm text-netural-700'>Date & Time:</span> {slotDateFormat(item.slotDate)} |  {item.slotTime}</p>
                 </div>
                 <div></div>
                 <div className='flex flex-col gap-2 justify-end'>
                  {!item.cancelled && item.payment && !item.isCompleted && <button className='sm:min-w-48 py-2 border rounded text-stone-500 bg:indigo-50'>Paid</button>}
                  {!item.cancelled && !item.payment && !item.isCompleted && <button onClick={()=>appointmentRazorpay(item._id)} className='text-sm text-stone-500 text-center sm:min-w-48 py-2 border rounded hover:bg-primary hover:text-white transition_all duration-300'>Pay Online</button>}
                  {!item.cancelled && !item.isCompleted && <button onClick={()=>cancelAppointment(item._id)} className='text-sm text-stone-500 text-center sm:min-w-48 py-2 border rounded hover:bg-red-600 hover:text-white transition_all duration-300'>Cancel Appointment</button>}
                  {item.cancelled && !item.isCompleted && <button className='sm:min-w-48 py-2 border border-red-500 rounded text-red-500'>Appointment Cancelled</button>}
                  {item.isCompleted && <button className='sm:min-w-48 py-2 border border-green-500 rounded text-green-500'>Completed</button>}
                 </div>
            </div>
          ))}
      </div>
    </div>
  )
}

export default MyAppointments
