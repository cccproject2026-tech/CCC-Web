"use client";
import { useState } from "react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  if (!isOpen) return null;

  const handleChangePassword = () => {
    if (newPassword === confirmPassword && newPassword.length > 0) {
      setShowChangePassword(false);
      setShowSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setShowSuccess(false), 3000);
    }
  };

  const handleToggleNotifications = () => {
    setNotificationsEnabled(!notificationsEnabled);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  return (
    <>
      {/* Main Settings Modal */}
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b">
            <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-lg transition"
            >
              <i className="fa-solid fa-xmark text-xl text-gray-600"></i>
            </button>
          </div>

          {/* Settings Options */}
          <div className="p-6 space-y-4">
            <button
              onClick={() => setShowChangePassword(true)}
              className="w-full flex items-center justify-between p-4 border-2 border-gray-200 rounded-xl hover:border-[#2E3B8E] hover:bg-gray-50 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#2E3B8E]/10 rounded-lg flex items-center justify-center group-hover:bg-[#2E3B8E]/20 transition">
                  <i className="fa-solid fa-key text-[#2E3B8E]"></i>
                </div>
                <span className="font-semibold text-gray-800">
                  Change Password
                </span>
              </div>
              <i className="fa-solid fa-chevron-right text-gray-400"></i>
            </button>

            <button
              onClick={handleToggleNotifications}
              className="w-full flex items-center justify-between p-4 border-2 border-gray-200 rounded-xl hover:border-[#2E3B8E] hover:bg-gray-50 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#2E3B8E]/10 rounded-lg flex items-center justify-center group-hover:bg-[#2E3B8E]/20 transition">
                  <i className="fa-solid fa-bell text-[#2E3B8E]"></i>
                </div>
                <span className="font-semibold text-gray-800">
                  {notificationsEnabled
                    ? "Turn Off Notifications"
                    : "Turn On Notifications"}
                </span>
              </div>
              <div
                className={`w-12 h-6 rounded-full transition-colors ${
                  notificationsEnabled ? "bg-[#2E3B8E]" : "bg-gray-300"
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full mt-0.5 transition-transform ${
                    notificationsEnabled ? "translate-x-6" : "translate-x-1"
                  }`}
                ></div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {showChangePassword && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-2xl w-full max-w-md mx-4 shadow-2xl">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-bold text-gray-900">
                Change Password
              </h3>
              <button
                onClick={() => setShowChangePassword(false)}
                className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-lg transition"
              >
                <i className="fa-solid fa-xmark text-xl text-gray-600"></i>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E3B8E]"
                  placeholder="Enter current password"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E3B8E]"
                  placeholder="Enter new password"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E3B8E]"
                  placeholder="Confirm new password"
                />
              </div>

              {newPassword !== confirmPassword &&
                confirmPassword.length > 0 && (
                  <p className="text-sm text-red-600">Passwords do not match</p>
                )}
            </div>

            <div className="px-6 py-4 border-t flex justify-end gap-3">
              <button
                onClick={() => setShowChangePassword(false)}
                className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleChangePassword}
                disabled={
                  newPassword !== confirmPassword ||
                  newPassword.length === 0 ||
                  currentPassword.length === 0
                }
                className={`px-6 py-2 rounded-lg font-semibold transition ${
                  newPassword === confirmPassword &&
                  newPassword.length > 0 &&
                  currentPassword.length > 0
                    ? "bg-[#2E3B8E] text-white hover:bg-[#1F2A6E]"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                Change Password
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {showSuccess && (
        <div className="fixed top-8 left-1/2 transform -translate-x-1/2 z-[70] animate-slide-down">
          <div className="bg-white rounded-xl px-6 py-4 shadow-2xl border-2 border-green-500 flex items-center gap-3">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <i className="fa-solid fa-check text-white text-sm"></i>
            </div>
            <span className="text-[#2E3B8E] font-semibold">
              Settings Updated Successfully
            </span>
          </div>
        </div>
      )}
    </>
  );
}
