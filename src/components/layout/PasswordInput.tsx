"use client";

import { useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";

export function PasswordInput() {
  const [isVisible, setIsVisible] = useState(false);
  const Icon = isVisible ? EyeOff : Eye;

  return (
    <div className="relative">
      <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        id="password"
        name="password"
        type={isVisible ? "text" : "password"}
        autoComplete="off"
        required
        className="h-10 w-full rounded-lg border border-teal-100 bg-[#f3fbf9] pl-10 pr-10 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-[#27b8a8] focus:ring-2 focus:ring-[#27b8a8]/20"
        placeholder="Masukkan kata sandi"
      />
      <button
        type="button"
        aria-label={isVisible ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
        onClick={() => setIsVisible((current) => !current)}
      >
        <Icon className="h-4 w-4" />
      </button>
    </div>
  );
}
