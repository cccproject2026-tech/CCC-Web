"use client";
import React from "react";

export interface PersonalInfo {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  email?: string;
}

export interface ChurchInfo {
  name?: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

export interface OtherInfo {
  title?: string;
  yearsInMinistry?: string;
  conference?: string;
  communityServiceProjects?: string;
}

interface ProfileFormProps {
  title: string;
  headerActions?: React.ReactNode;
  personal?: PersonalInfo;
  church1?: ChurchInfo;
  church2?: ChurchInfo;
  other?: OtherInfo;
  interests?: string;
  comments?: string;
  showInterests?: boolean;
  showComments?: boolean;
}

export default function ProfileForm({
  title,
  headerActions,
  personal,
  church1,
  church2,
  other,
  interests,
  comments,
  showInterests = false,
  showComments = false,
}: ProfileFormProps) {
  return (
    <div className="bg-gradient-to-b from-[#5089B8] to-[#6BA5D5] rounded-xl p-8 shadow-lg">
      {/* Header with optional actions */}
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-[22px] font-bold text-white">{title}</h2>
        {headerActions && (
          <div className="flex items-center gap-3">{headerActions}</div>
        )}
      </div>

      {personal && (
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div>
            <label className="block text-[13px] text-white/80 mb-2">
              First Name
            </label>
            <input
              type="text"
              value={personal.firstName || ""}
              readOnly
              className="w-full px-4 py-3 bg-[#4A7BA8]/30 text-white border border-white/20 rounded-lg text-[14px] outline-none"
            />
          </div>
          <div>
            <label className="block text-[13px] text-white/80 mb-2">
              Last Name
            </label>
            <input
              type="text"
              value={personal.lastName || ""}
              readOnly
              className="w-full px-4 py-3 bg-[#4A7BA8]/30 text-white border border-white/20 rounded-lg text-[14px] outline-none"
            />
          </div>
          <div>
            <label className="block text-[13px] text-white/80 mb-2">
              Phone Number
            </label>
            <input
              type="text"
              value={personal.phoneNumber || ""}
              readOnly
              className="w-full px-4 py-3 bg-[#4A7BA8]/30 text-white border border-white/20 rounded-lg text-[14px] outline-none"
            />
          </div>
          <div>
            <label className="block text-[13px] text-white/80 mb-2">
              Email
            </label>
            <input
              type="email"
              value={personal.email || ""}
              readOnly
              className="w-full px-4 py-3 bg-[#4A7BA8]/30 text-white border border-white/20 rounded-lg text-[14px] outline-none"
            />
          </div>
        </div>
      )}

      {church1 && (
        <>
          <h2 className="text-[22px] font-bold text-white mb-6">
            Current Church -1 Information
          </h2>
          <div className="grid grid-cols-2 gap-4 mb-8">
            {renderChurchGrid(church1)}
          </div>
        </>
      )}

      {church2 && (
        <>
          <h2 className="text-[22px] font-bold text-white mb-6">
            Current Church -2 Information
          </h2>
          <div className="grid grid-cols-2 gap-4 mb-8">
            {renderChurchGrid(church2)}
          </div>
        </>
      )}

      {other && (
        <>
          <h2 className="text-[22px] font-bold text-white mb-6">
            Other Information
          </h2>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-[13px] text-white/80 mb-2">
                Title
              </label>
              <input
                type="text"
                value={other.title || ""}
                readOnly
                className="w-full px-4 py-3 bg-[#4A7BA8]/30 text-white border border-white/20 rounded-lg text-[14px] outline-none"
              />
            </div>
            <div>
              <label className="block text-[13px] text-white/80 mb-2">
                Years in Ministry
              </label>
              <input
                type="text"
                value={other.yearsInMinistry || ""}
                readOnly
                className="w-full px-4 py-3 bg-[#4A7BA8]/30 text-white border border-white/20 rounded-lg text-[14px] outline-none"
              />
            </div>
            <div>
              <label className="block text-[13px] text-white/80 mb-2">
                Conference
              </label>
              <input
                type="text"
                value={other.conference || ""}
                readOnly
                className="w-full px-4 py-3 bg-[#4A7BA8]/30 text-white border border-white/20 rounded-lg text-[14px] outline-none"
              />
            </div>
            <div>
              <label className="block text-[13px] text-white/80 mb-2">
                Current Community Service Projects
              </label>
              <input
                type="text"
                value={other.communityServiceProjects || ""}
                readOnly
                className="w-full px-4 py-3 bg-[#4A7BA8]/30 text-white border border-white/20 rounded-lg text-[14px] outline-none"
              />
            </div>
          </div>
        </>
      )}

      {showInterests && (
        <div className="mb-6">
          <label className="block text-[13px] text-white/80 mb-2">
            Interests
          </label>
          <textarea
            value={interests || ""}
            readOnly
            rows={3}
            className="w-full px-4 py-3 bg-[#4A7BA8]/30 text-white border border-white/20 rounded-lg text-[14px] outline-none resize-none"
          ></textarea>
        </div>
      )}

      {showComments && (
        <div>
          <label className="block text-[13px] text-white/80 mb-2">
            Comments
          </label>
          <textarea
            value={comments || ""}
            readOnly
            rows={3}
            className="w-full px-4 py-3 bg-[#4A7BA8]/30 text-white border border-white/20 rounded-lg text-[14px] outline-none resize-none"
          ></textarea>
        </div>
      )}
    </div>
  );
}

function renderChurchGrid(church: ChurchInfo) {
  return (
    <>
      <div>
        <label className="block text-[13px] text-white/80 mb-2">
          Church Name
        </label>
        <input
          type="text"
          value={church.name || ""}
          readOnly
          className="w-full px-4 py-3 bg-[#4A7BA8]/30 text-white border border-white/20 rounded-lg text-[14px] outline-none"
        />
      </div>
      <div>
        <label className="block text-[13px] text-white/80 mb-2">
          Church Phone
        </label>
        <input
          type="text"
          value={church.phone || ""}
          readOnly
          className="w-full px-4 py-3 bg-[#4A7BA8]/30 text-white border border-white/20 rounded-lg text-[14px] outline-none"
        />
      </div>
      <div>
        <label className="block text-[13px] text-white/80 mb-2">
          Church Website
        </label>
        <input
          type="text"
          value={church.website || ""}
          readOnly
          className="w-full px-4 py-3 bg-[#4A7BA8]/30 text-white border border-white/20 rounded-lg text-[14px] outline-none"
        />
      </div>
      <div>
        <label className="block text-[13px] text-white/80 mb-2">
          Church Address
        </label>
        <input
          type="text"
          value={church.address || ""}
          readOnly
          className="w-full px-4 py-3 bg-[#4A7BA8]/30 text-white border border-white/20 rounded-lg text-[14px] outline-none"
        />
      </div>
      <div>
        <label className="block text-[13px] text-white/80 mb-2">City</label>
        <input
          type="text"
          value={church.city || ""}
          readOnly
          className="w-full px-4 py-3 bg-[#4A7BA8]/30 text-white border border-white/20 rounded-lg text-[14px] outline-none"
        />
      </div>
      <div>
        <label className="block text-[13px] text-white/80 mb-2">State</label>
        <input
          type="text"
          value={church.state || ""}
          readOnly
          className="w-full px-4 py-3 bg-[#4A7BA8]/30 text-white border border-white/20 rounded-lg text-[14px] outline-none"
        />
      </div>
      <div>
        <label className="block text-[13px] text-white/80 mb-2">Zip Code</label>
        <input
          type="text"
          value={church.zipCode || ""}
          readOnly
          className="w-full px-4 py-3 bg-[#4A7BA8]/30 text-white border border-white/20 rounded-lg text-[14px] outline-none"
        />
      </div>
      <div>
        <label className="block text-[13px] text-white/80 mb-2">Country</label>
        <input
          type="text"
          value={church.country || ""}
          readOnly
          className="w-full px-4 py-3 bg-[#4A7BA8]/30 text-white border border-white/20 rounded-lg text-[14px] outline-none"
        />
      </div>
    </>
  );
}
