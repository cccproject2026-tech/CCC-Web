"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import sampleThumb from "../../Assets/sampleThumb.png"; 
import thumb1 from "../../Assets/thumb1.png";
import thumb2 from "../../Assets/thumb2.png";
import PastorHeader from "@/app/Components/PastorHeader";


export default function VideoPage() {
  const router = useRouter();

  const videos = [
    {
      id: 1,
      title: "Center for Community Change",
      desc: "Interested in receiving mentoring in community engagement",
      duration: "18:00 Min",
      thumb: thumb1,
      date: "20 Oct 2024",
    },
    {
      id: 2,
      title: "Center for Community Change",
      desc: "Interested in receiving mentoring in community engagement",
      duration: "18:00 Min",
      thumb: thumb2,
    },
    {
      id: 3,
      title: "Center for Community Change",
      desc: "Interested in receiving mentoring in community engagement",
      duration: "18:00 Min",
      thumb: thumb2,
    },
  ];

  return (
    <div>
        <PastorHeader/>
  
    <section className="min-h-screen bg-gradient-to-b from-[#103C8C] to-[#1B4C9E] p-8">

      
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => router.back()}
          className="bg-white text-[#103C8C] px-4 py-1 rounded-full shadow-sm text-sm font-medium flex items-center gap-2 hover:bg-gray-100 transition"
        >
          <i className="fa-solid fa-arrow-left"></i> Back
        </button>
      </div>

  
      <div className="flex flex-col lg:flex-row gap-8">

        <div className="flex-1">
          <div className="relative p-[2px]">
            <div className="bg-[#0E59A6]/20 rounded-md p-1">
              <video
                controls
                className="w-full h-[420px] rounded-md object-cover"
                poster={sampleThumb.src}
              >
                <source src="/videos/sample.mp4" type="video/mp4" />
              </video>
            </div>
          </div>

       
          <div className="mt-4 text-white">
            <h3 className="text-lg font-semibold">
              Center for Community Change
            </h3>
            <p className="text-sm text-gray-200">
              Interested in receiving mentoring in community engagement
            </p>
          </div>
        </div>

      
        <div className="w-full lg:w-[340px] flex flex-col gap-5">
          {videos.map((v, idx) => (
            <div
              key={idx}
              className="bg-white text-black rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer"
            >
              <div className="relative">
                <Image
                  src={v.thumb}
                  alt={v.title}
                  className="w-full h-[130px] object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <button className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center hover:scale-110 transition">
                    <i className="fa-solid fa-play text-[#103C8C]"></i>
                  </button>
                </div>

            
                {v.date && (
                  <div className="absolute bottom-2 left-2 bg-[#103C8C]/90 text-white text-xs px-2 py-[2px] rounded">
                    {v.date}
                  </div>
                )}
              </div>

              <div className="p-4">
                <p className="text-xs text-[#103C8C] font-semibold mb-1">
                  Introduction
                </p>
                <h4 className="text-sm font-semibold mb-1">{v.title}</h4>
                <p className="text-xs text-gray-600 mb-3">{v.desc}</p>

                <div className="flex justify-between items-center text-xs text-gray-400">
                  <span>{v.duration}</span>
                  <button className="border border-[#103C8C] text-[#103C8C] p-[6px] rounded-md hover:bg-[#103C8C] hover:text-white transition">
                    <i className="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
      </div>
  );
}
