"use client";

import React, { useEffect, useRef, useState } from "react";
import { API_BASE_URL } from "@config/api";

interface Membership {
  membership_number?: string;
  member_name?: string;
  is_active?: boolean;
  status?: string;
  plan_name?: string;
  start_date?: string;
  end_date?: string;
}

type State =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "ok"; data: Membership }
  | { kind: "err"; msg: string };

/**
 * شاشة تحقّق الكاشير.
 *
 * الماسح الخطّي يتصرّف كلوحة مفاتيح: يكتب الأرقام ثم Enter. لذلك يبقى
 * التركيز في الحقل دائماً ويُرسل الطلب عند Enter بلا ضغط أي زر.
 */
export default function PageClient() {
  const [code, setCode] = useState("");
  const [state, setState] = useState<State>({ kind: "idle" });
  const inputRef = useRef<HTMLInputElement>(null);

  // الماسح يكتب في العنصر المُركَّز — نُبقي التركيز في الحقل دوماً
  useEffect(() => {
    const focus = () => inputRef.current?.focus();
    focus();
    const id = window.setInterval(focus, 1200);
    return () => window.clearInterval(id);
  }, []);

  const verify = async (raw: string) => {
    const number = raw.trim().replace(/\s/g, "");
    if (!number) return;

    setState({ kind: "loading" });
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/membership/verify/${encodeURIComponent(number)}`,
        { headers: { Accept: "application/json", "Accept-Language": "ar" } },
      );
      const body = await res.json();

      if (!body?.status) {
        setState({ kind: "err", msg: body?.msg || "رقم العضوية غير صالح" });
        return;
      }
      const m = (body?.data?.membership ?? body?.data) as Membership;
      setState({ kind: "ok", data: m });
    } catch {
      setState({ kind: "err", msg: "تعذّر الاتصال بالخادم. حاول مرة أخرى." });
    } finally {
      setCode("");
      inputRef.current?.focus();
    }
  };

  const active = state.kind === "ok" && state.data.is_active === true;

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-[#F6F4FC] px-4 py-8"
      onClick={() => inputRef.current?.focus()}
    >
      <div className="mx-auto w-full max-w-xl">
        <header className="mb-6 text-center">
          <h1 className="m-0 text-[22px] font-extrabold text-[#1A1A2E]">
            التحقّق من العضوية
          </h1>
          <p className="mt-1 text-[13px] text-[#6B6880]">
            امسح الباركود على بطاقة العميل أو اكتب رقم العضوية ثم اضغط Enter
          </p>
        </header>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void verify(code);
          }}
          className="mb-5 flex gap-2"
        >
          <input
            ref={inputRef}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            inputMode="numeric"
            autoComplete="off"
            placeholder="رقم العضوية"
            dir="ltr"
            className="h-14 flex-1 rounded-2xl border-2 border-[#DED7F2] bg-white px-4 text-center font-mono text-[20px] font-bold tracking-[0.2em] outline-none focus:border-[#6703EB]"
          />
          <button
            type="submit"
            disabled={!code.trim() || state.kind === "loading"}
            className="h-14 rounded-2xl bg-[linear-gradient(135deg,#400198_0%,#6703EB_100%)] px-6 text-[15px] font-extrabold text-white disabled:opacity-50"
          >
            {state.kind === "loading" ? "جارٍ…" : "تحقّق"}
          </button>
        </form>

        {state.kind === "idle" && (
          <p className="rounded-2xl border border-dashed border-[#DED7F2] bg-white/60 p-8 text-center text-[14px] text-[#9A99B0]">
            بانتظار مسح البطاقة…
          </p>
        )}

        {state.kind === "err" && (
          <div className="rounded-2xl border-2 border-[#E5484D] bg-white p-8 text-center">
            <div className="mb-3 text-[48px] leading-none">❌</div>
            <p className="m-0 text-[20px] font-extrabold text-[#E5484D]">
              {state.msg}
            </p>
            <p className="mt-2 text-[13px] text-[#6B6880]">لا تمنح الخصم</p>
          </div>
        )}

        {state.kind === "ok" && (
          <div
            className={`rounded-2xl border-2 bg-white p-8 text-center ${
              active ? "border-[#12A06A]" : "border-[#E5484D]"
            }`}
          >
            <div className="mb-3 text-[48px] leading-none">
              {active ? "✅" : "⛔"}
            </div>
            <p
              className={`m-0 text-[22px] font-extrabold ${
                active ? "text-[#12A06A]" : "text-[#E5484D]"
              }`}
            >
              {active ? "اشتراك فعّال — امنح الخصم" : "الاشتراك منتهٍ"}
            </p>

            <div className="mt-5 space-y-2 border-t border-dashed border-[#EFEDF7] pt-5 text-right">
              <Row label="اسم العميل" value={state.data.member_name} />
              <Row label="رقم العضوية" value={state.data.membership_number} mono />
              <Row label="الباقة" value={state.data.plan_name} />
              <Row label="تنتهي في" value={state.data.end_date} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value?: string | null;
  mono?: boolean;
}) {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[13px] text-[#6B6880]">{label}</span>
      <span
        className={`text-[15px] font-bold text-[#1A1A2E] ${mono ? "font-mono tracking-wider" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}
