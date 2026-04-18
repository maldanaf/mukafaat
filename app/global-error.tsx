"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", fontFamily: "sans-serif", direction: "rtl" }}>
          <div style={{ textAlign: "center", padding: "2rem" }}>
            <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>حدث خطأ</h2>
            <button
              onClick={() => reset()}
              style={{ padding: "0.75rem 1.5rem", backgroundColor: "#400198", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "1rem" }}
            >
              إعادة المحاولة
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
