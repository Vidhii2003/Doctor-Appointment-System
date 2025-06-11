import React from 'react'
import { assets } from './../assets/assets';

const About = () => {
  return (
    <div>

      <div className='text-center text-2xl pt-10 text-gray-500'>
        <p>ABOUT <span className='text-gray-700 font-medium'>US</span></p>
      </div>

      <div className='my-10 flex flex-col md:flex-row gap-12'>
        <img className='w-full md:max-w-[360px]' src={assets.about_image} alt="" />
        <div className='flex flex-col justify-center gap-6 md:w-2/4 text-sm text-gray-600'>
          <p>Welcome to Prescripto, your reliable companion for effortlessly managing your healthcare needs. We recognize the difficulties people encounter when booking doctor appointments and keeping track of their medical records, and we're here to make the process seamless and efficient.</p>
          <p>At Prescripto, we are dedicated to advancing healthcare technology. We constantly work to enhance our platform by incorporating the latest innovations to provide a seamless user experience and top-quality service. Whether you're scheduling your first appointment or managing ongoing care, Prescripto is here to assist you at every stage.</p>
          <b className='text-gray-800'>Our Vision</b>
          <p>At Prescripto, our vision is to simplify healthcare access for everyone. We are dedicated to connecting patients with healthcare providers effortlessly, ensuring you receive the care you need, precisely when you need it.</p>
        </div>
      </div>

      <div className='text-xl my-4'>
        <p>WHY <span className='text-gray-700 font-semibold'>CHOOSE US</span> </p>
      </div>

      <div className='flex flex-col md:flex-row mb-20'>
        <div className='border px-10 md:px-16 py-8 sm:py-16 flex flex-col gap-5 text-[15px] hover:bg-primary hover:text-white transition-all duration-300 text-gray-600 cursor-pointer'>
            <b>Efficiency:</b>
            <p>Effortless appointment booking designed to seamlessly fit into your busy schedule.</p>
        </div>
        <div className='border px-10 md:px-16 py-8 sm:py-16 flex flex-col gap-5 text-[15px] hover:bg-primary hover:text-white transition-all duration-300 text-gray-600 cursor-pointer'>
            <b>Convenience:</b>
            <p>Connect with a reliable network of trusted healthcare professionals in your vicinity.</p>
        </div>
        <div className='border px-10 md:px-16 py-8 sm:py-16 flex flex-col gap-5 text-[15px] hover:bg-primary hover:text-white transition-all duration-300 text-gray-600 cursor-pointer'>
            <b>Personalization:</b>
            <p>Personalized suggestions and timely reminders to keep you proactive about your health.</p>
        </div>
      </div>

    </div>
  )
}

export default About
