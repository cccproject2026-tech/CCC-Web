"use client";

import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import Book from "../Assets/book.png";
import { useRouter } from "next/navigation"; 

const cards = [
  {
    title: "Center for Community Change",
    desc: "Interested in receiving mentoring in community engagement",
  },
  {
    title: "Center for Community Change",
    desc: "Interested in receiving mentoring in community engagement",
  },
  {
    title: "Center for Community Change",
    desc: "Interested in receiving mentoring in community engagement",
  },
  {
    title: "Center for Community Change",
    desc: "Interested in receiving mentoring in community engagement",
  },
];

export default function WhatWeDoSection() {
     const router = useRouter();
  return (
    <section id="videos-section" className="bg-[#062946] text-white py-16 px-12 relative overflow-hidden">
      <div className="max-w-[1300px] mx-auto flex flex-wrap lg:flex-nowrap justify-between items-start lg:items-center gap-10">
        {/* LEFT SIDE — TEXT BLOCK */}
        <div className="min-w-[220px] lg:w-1/4 flex flex-col items-start">
          <h3 className="text-2xl font-semibold mb-2">What we do</h3>
          <p className="text-sm text-gray-300 mb-4">Learn more about CCC</p>
          <button className="bg-white text-[#0f4a76] px-5 py-2 rounded-md font-medium hover:opacity-90 transition">
            Show all
          </button>
        </div>

      
        <div className="flex-1 w-full">
          <Swiper
            modules={[Navigation, Pagination]}
            spaceBetween={24}
            slidesPerView={3}
            pagination={{ clickable: true, el: ".swiper-pagination-custom" }}
            navigation={{
              nextEl: ".next-btn",
              prevEl: ".prev-btn",
            }}
            loop={true}
            
            breakpoints={{
              0: { slidesPerView: 1 },
              640: { slidesPerView: 2 },
              1024: { slidesPerView: 3 },
            }}
            className="pb-12"
          >
            {cards.map((card, index) => (
              <SwiperSlide key={index}>
                <div className="bg-white text-black rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300">
               
                  <div className="relative">
                    <Image
                      src={Book}
                      alt={card.title}
                      className="w-full h-[180px] object-cover"
                    />
               
                    <div className="absolute inset-0 flex items-center justify-center">
                      <button className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center hover:scale-110 transition"
                         onClick={() =>router.push(`/pastor/VideoPage`)}
                      >
                        <i className="fa-solid fa-play text-[#0f4a76]"></i>
                      </button>
                    </div>
                  </div>

                
                  <div className="p-4">
                    <p className="text-xs text-[#0f4a76] font-semibold mb-1">
                      Introduction
                    </p>
                    <h4 className="text-sm font-semibold mb-1">{card.title}</h4>
                    <p className="text-xs text-gray-600 mb-3">{card.desc}</p>
                    <div className="flex justify-between items-center text-xs text-gray-400">
                      <span>18:00 Min</span>
                      <button className="border border-[#0f4a76] text-[#0f4a76] p-[6px] rounded-md hover:bg-[#0f4a76] hover:text-white transition">
                        <i className="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>

        
          <div className="flex justify-center items-center gap-4 mt-6">
            {/* <button className="prev-btn w-8 h-8 flex items-center justify-center rounded-md border border-white/50 text-white hover:bg-white hover:text-[#103C8C] transition">
              <i className="fa-solid fa-angle-left text-sm"></i>
            </button> */}

            

            <div className="swiper-pagination-custom !relative !bottom-0"></div>

            
          </div>
        </div>
      </div>
    </section>
  );
}
