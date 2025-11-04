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
  editable?: boolean;
  onPersonalChange?: (next: PersonalInfo) => void;
  onChurch1Change?: (next: ChurchInfo) => void;
  onChurch2Change?: (next: ChurchInfo) => void;
  onOtherChange?: (next: OtherInfo) => void;
  onInterestsChange?: (value: string) => void;
  onCommentsChange?: (value: string) => void;
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
  editable = false,
  onPersonalChange,
  onChurch1Change,
  onChurch2Change,
  onOtherChange,
  onInterestsChange,
  onCommentsChange,
}: ProfileFormProps) {
  return (
    <div className="p-8">
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
              readOnly={!editable}
              onChange={(e) =>
                onPersonalChange?.({
                  ...personal,
                  firstName: e.target.value,
                })
              }
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
              readOnly={!editable}
              onChange={(e) =>
                onPersonalChange?.({
                  ...personal,
                  lastName: e.target.value,
                })
              }
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
              readOnly={!editable}
              onChange={(e) =>
                onPersonalChange?.({
                  ...personal,
                  phoneNumber: e.target.value,
                })
              }
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
              readOnly={!editable}
              onChange={(e) =>
                onPersonalChange?.({
                  ...personal,
                  email: e.target.value,
                })
              }
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
            {renderChurchGrid(church1, editable, onChurch1Change)}
          </div>
        </>
      )}

      {church2 && (
        <>
          <h2 className="text-[22px] font-bold text-white mb-6">
            Current Church -2 Information
          </h2>
          <div className="grid grid-cols-2 gap-4 mb-8">
            {renderChurchGrid(church2, editable, onChurch2Change)}
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
                readOnly={!editable}
                onChange={(e) =>
                  onOtherChange?.({
                    ...other,
                    title: e.target.value,
                  })
                }
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
                readOnly={!editable}
                onChange={(e) =>
                  onOtherChange?.({
                    ...other,
                    yearsInMinistry: e.target.value,
                  })
                }
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
                readOnly={!editable}
                onChange={(e) =>
                  onOtherChange?.({
                    ...other,
                    conference: e.target.value,
                  })
                }
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
                readOnly={!editable}
                onChange={(e) =>
                  onOtherChange?.({
                    ...other,
                    communityServiceProjects: e.target.value,
                  })
                }
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
            readOnly={!editable}
            onChange={(e) => onInterestsChange?.(e.target.value)}
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
            readOnly={!editable}
            onChange={(e) => onCommentsChange?.(e.target.value)}
            rows={3}
            className="w-full px-4 py-3 bg-[#4A7BA8]/30 text-white border border-white/20 rounded-lg text-[14px] outline-none resize-none"
          ></textarea>
        </div>
      )}
    </div>
  );
}

function renderChurchGrid(
  church: ChurchInfo,
  editable: boolean,
  onChange?: (next: ChurchInfo) => void
) {
  return (
    <>
      <div>
        <label className="block text-[13px] text-white/80 mb-2">
          Church Name
        </label>
        <input
          type="text"
          value={church.name || ""}
          readOnly={!editable}
          onChange={(e) => onChange?.({ ...church, name: e.target.value })}
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
          readOnly={!editable}
          onChange={(e) => onChange?.({ ...church, phone: e.target.value })}
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
          readOnly={!editable}
          onChange={(e) => onChange?.({ ...church, website: e.target.value })}
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
          readOnly={!editable}
          onChange={(e) => onChange?.({ ...church, address: e.target.value })}
          className="w-full px-4 py-3 bg-[#4A7BA8]/30 text-white border border-white/20 rounded-lg text-[14px] outline-none"
        />
      </div>
      <div>
        <label className="block text-[13px] text-white/80 mb-2">City</label>
        <input
          type="text"
          value={church.city || ""}
          readOnly={!editable}
          onChange={(e) => onChange?.({ ...church, city: e.target.value })}
          className="w-full px-4 py-3 bg-[#4A7BA8]/30 text-white border border-white/20 rounded-lg text-[14px] outline-none"
        />
      </div>
      <div>
        <label className="block text-[13px] text-white/80 mb-2">State</label>
        <input
          type="text"
          value={church.state || ""}
          readOnly={!editable}
          onChange={(e) => onChange?.({ ...church, state: e.target.value })}
          className="w-full px-4 py-3 bg-[#4A7BA8]/30 text-white border border-white/20 rounded-lg text-[14px] outline-none"
        />
      </div>
      <div>
        <label className="block text-[13px] text-white/80 mb-2">Zip Code</label>
        <input
          type="text"
          value={church.zipCode || ""}
          readOnly={!editable}
          onChange={(e) => onChange?.({ ...church, zipCode: e.target.value })}
          className="w-full px-4 py-3 bg-[#4A7BA8]/30 text-white border border-white/20 rounded-lg text-[14px] outline-none"
        />
      </div>
      <div>
        <label className="block text-[13px] text-white/80 mb-2">Country</label>
        <input
          type="text"
          value={church.country || ""}
          readOnly={!editable}
          onChange={(e) => onChange?.({ ...church, country: e.target.value })}
          className="w-full px-4 py-3 bg-[#4A7BA8]/30 text-white border border-white/20 rounded-lg text-[14px] outline-none"
        />
      </div>
    </>
  );
}
