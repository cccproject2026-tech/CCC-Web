"use client";

import Image from "next/image";
import Gears from "@/app/Assets/gear-form.png"; 
import PastorHeader from "@/app/Components/PastorHeader";

export default function InterestForm() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#224b8a] to-[#224b8a] text-white flex flex-col">
    
      <PastorHeader/>

      <section className="flex flex-col lg:flex-row w-full flex-1">
 
        <div className="lg:w-1/2">
          <Image
            src={Gears}
            alt="Gears"
            className="w-[600px] h-auto object-contain"
          />
        </div>

    
        <div className="w-full lg:w-1/2 bg-gradient-to-b from-[#224b8a] to-[#224b8a] px-10 py-10">
       
     <div className="text-center mb-8">
  <h2
    className="inline-block text-white font-semibold px-10"
  >
    Interest Form
  </h2>
</div>





          <form className="space-y-8">
            {/* --- PERSONAL INFORMATION --- */}
            <div>
              <h3 className="text-sm font-semibold mb-4">Personal Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input type="text" placeholder="First Name" className="form-input" />
                <input type="text" placeholder="Last Name" className="form-input" />
                <input type="text" placeholder="Phone Number" className="form-input" />
                <input type="email" placeholder="Email" className="form-input" />
              </div>
            </div>

            {/* --- CURRENT CHURCH INFORMATION --- */}
            <div>
              <h3 className="text-sm font-semibold mb-4">Current Church Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input type="text" placeholder="Church Name" className="form-input" />
                <input type="text" placeholder="Church Phone" className="form-input" />
                <input type="text" placeholder="Church Website" className="form-input" />
                <input type="text" placeholder="Church Address" className="form-input" />
                <input type="text" placeholder="City" className="form-input" />
                <input type="text" placeholder="State" className="form-input" />
                <input type="text" placeholder="Zip Code" className="form-input" />
                <select className="form-input text-gray-500">
                  <option>Country</option>
                </select>
                <input type="text" placeholder="Years in Ministry" className="form-input" />
                <input type="text" placeholder="Conference" className="form-input" />
              </div>

              <div className="flex justify-end mt-3">
                <button
                  type="button"
                  className="bg-white/10 hover:bg-white/20 text-white text-sm px-4 py-2 rounded-md border border-white/30 transition"
                >
                  + Add More Church
                </button>
              </div>
            </div>

            {/* --- OTHER INFORMATION --- */}
            <div>
              <h3 className="text-sm font-semibold mb-4">Other Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <select className="form-input text-gray-500">
                  <option>Title</option>
                </select>
                <input type="text" placeholder="Years in Ministry" className="form-input" />
                <input type="text" placeholder="Conference" className="form-input" />
                <input
                  type="text"
                  placeholder="Current Community Service Projects"
                  className="form-input"
                />
                <select className="form-input text-gray-500">
                  <option>Interests</option>
                </select>
                <textarea
                  placeholder="Comments"
                  rows={2}
                  className="form-input sm:col-span-2 resize-none"
                ></textarea>
              </div>
            </div>

            {/* --- SUBMIT BUTTON --- */}
            <div className="text-center">
              <button
                type="submit"
                className="bg-white text-[#0E59A6] font-semibold px-10 py-2 rounded-md hover:bg-[#DCEBFF] transition"
              >
                Submit
              </button>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
