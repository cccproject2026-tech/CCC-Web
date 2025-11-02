"use client";
import React, { useState } from "react";
import PastorHeader from "@/app/Components/PastorHeader";
import { Pencil } from "lucide-react";
import { useRouter } from "next/navigation";

const page = () => {
  const [activeTab, setActiveTab] = useState("new");
  const router = useRouter();
  const cards = Array.from({ length: 9 }).map((_, i) => ({
    id: i,
    name: "Robert Fox",
    role: "Pastor",
    time: "09:43 AM",
    img: "https://via.placeholder.com/80",
  }));

  return (
    <div className="min-h-screen flex flex-col bg-[#1d538d]">
      <PastorHeader showFullHeader={true} />
      <img className="w-full h-80 bg-amber-800" />

      {/* Page Container with uniform padding */}
      <div className="max-w-7xl mx-auto py-10 w-full">
        {/* Search and Filter Bar */}
        <div className="flex justify-between items-center mb-10">
          <input
            className="bg-white w-96 h-10 rounded px-3"
            placeholder="Search"
          />
          <div className="flex gap-4">
            <div className="bg-white inline-flex h-10 px-3 items-center gap-2 rounded">
              {["new", "pending", "accepted"].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  aria-pressed={activeTab === tab}
                  className={`w-20 h-8 rounded-[5px] capitalize ${
                    activeTab === tab
                      ? "bg-[#1f366f] text-white"
                      : "bg-transparent text-[#1f366f]"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <button onClick={()=>router.push('/micro-grant/edit')} className="w-32 h-10 ml-2 rounded-[5px] bg-white flex items-center justify-center gap-3">
              <Pencil className="w-5 h-5 text-gray-700" />
              Edit Form
            </button>
          </div>
        </div>

        {/* Cards Grid */}
        <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
          {cards.map((card) => (
            <div
              key={card.id}
              className="bg-white rounded-2xl shadow-lg p-5 w-[420px] h-[160px] flex items-center justify-between"
            >
              {/* Left section */}
              <div className="flex items-center">
                <img
                  src={card.img}
                  alt="Profile"
                  className="w-20 h-20 rounded-xl object-cover"
                />
                <div className="ml-4 flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {card.name}
                    </h3>
                    <p className="text-sm text-gray-500">{card.role}</p>
                  </div>
                  <div className="flex items-center space-x-3 mt-3">
                    <button className="p-1.5 rounded-lg border border-gray-300 hover:bg-gray-100">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.5"
                          d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25H4.5a2.25 2.25 0 01-2.25-2.25V6.75M3 6.75l9 5.25 9-5.25"
                        />
                      </svg>
                    </button>
                    <button className="p-1.5 rounded-lg border border-gray-300 hover:bg-gray-100">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.5"
                          d="M7.5 8.25h9M7.5 12h6m-9 4.5h12a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0018.75 4.5H5.25A2.25 2.25 0 003 6.75v10.5A2.25 2.25 0 005.25 19.5z"
                        />
                      </svg>
                    </button>
                    <button className="p-1.5 rounded-lg border border-gray-300 hover:bg-gray-100">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.5"
                          d="M2.25 6.75l8.954 8.955c.44.44 1.16.44 1.6 0L21.75 6.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5H4.5A2.25 2.25 0 002.25 6.75v10.5A2.25 2.25 0 004.5 19.5z"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Right section */}
              <div className="flex flex-col items-end justify-between h-full py-2">
                <p className="text-xs text-gray-400">{card.time}</p>
                <button
                  onClick={() => router.push(`/micro-grant/${card.id}`)}
                  className="bg-[#143B6C] text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-[#0f2f58]"
                >
                  View
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default page;
