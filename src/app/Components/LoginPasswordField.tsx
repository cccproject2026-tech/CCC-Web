"use client";

import { useId, useState } from "react";

type LoginPasswordFieldProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  autoComplete?: string;
  /** Tailwind classes for the text input (padding-right reserved for icon). */
  inputClassName?: string;
};

const defaultInputClass =
  "w-full rounded-lg border border-white/35 bg-white/10 py-3 pl-4 pr-11 text-sm text-white placeholder:text-white/65 focus:border-[#8ec5eb] focus:outline-none focus:ring-1 focus:ring-[#8ec5eb]/40 sm:text-base";

/**
 * Password input with show/hide toggle for login screens (director / pastor / mentor).
 */
export default function LoginPasswordField({
  value,
  onChange,
  disabled,
  placeholder = "Password",
  autoComplete = "current-password",
  inputClassName = defaultInputClass,
}: LoginPasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const id = useId();

  return (
    <div className="relative">
      <input
        id={id}
        type={visible ? "text" : "password"}
        placeholder={placeholder}
        autoComplete={autoComplete}
        disabled={disabled}
        className={inputClassName}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <button
        type="button"
        tabIndex={-1}
        disabled={disabled}
        onClick={() => setVisible((v) => !v)}
        className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-[#cde2f2] transition hover:bg-white/10 hover:text-white disabled:opacity-50"
        aria-label={visible ? "Hide password" : "Show password"}
      >
        <i className={`fa-solid ${visible ? "fa-eye-slash" : "fa-eye"} text-sm`} aria-hidden />
      </button>
    </div>
  );
}
