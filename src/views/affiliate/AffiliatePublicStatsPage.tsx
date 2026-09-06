"use client";

import { t } from "i18next";
import React, { useEffect, useState } from "react";
import { useParams } from "@/lib/router-compat";
import { Helmet } from "@/lib/helmet-compat";
import { api } from "@network/apiClient";
import { API_ENDPOINTS } from "@network/apiEndpoints";
import {
  FiUser,
  FiShoppingBag,
  FiTrendingUp,
  FiDollarSign,
  FiClock,
  FiBarChart2,
  FiClock as FiHistory,
  FiInbox,
  FiTag,
} from "react-icons/fi";

interface AffiliateInfo {
  name: string;
  commission_type: "percentage" | "fixed";
  commission_value: number;
}

interface Stats {
  total_usages: number;
  total_sales: number;
  total_commission: number;
  paid_commission: number;
  pending_commission: number;
}

interface ByCodeRow {
  code_id: number;
  code: string | null;
  title: string | null;
  uses: number;
  commission: number;
}

interface DiscountCodeRow {
  id: number;
  code: string;
  title: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  max_usage: number;
  usage_count: number;
  start_date: string | null;
  end_date: string | null;
  status: boolean;
  is_expired: boolean;
  is_maxed: boolean;
  total_usages: number;
  paid_usages: number;
  total_sales: number;
  total_commission: number;
}

interface RecentUsage {
  id: number;
  date: string | null;
  code: string | null;
  code_title: string | null;
  customer: string | null;
  original_amount: number;
  discount_amount: number;
  final_amount: number;
  commission: number;
  status: "pending" | "paid" | "cancelled";
}

interface AffiliateData {
  affiliate: AffiliateInfo;
  stats: Stats;
  discount_codes: DiscountCodeRow[];
  by_code: ByCodeRow[];
  recent_usages: RecentUsage[];
}

const fmt = (n: number) =>
  new Intl.NumberFormat("ar-SA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n || 0);

const fmtInt = (n: number) =>
  new Intl.NumberFormat("ar-SA").format(n || 0);

const AffiliatePublicStatsPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<AffiliateData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setLoading(true);
    api
      .get(API_ENDPOINTS.affiliatePublic(token))
      .then((res) => {
        if (cancelled) return;
        const body = res.data as {
          status?: boolean;
          msg?: string;
          data?: AffiliateData;
        };
        if (body?.status === true && body.data) {
          setData(body.data);
          setError(null);
        } else {
          setError(body?.msg || t("ui.t_b71ff7", "تعذّر تحميل البيانات"));
        }
      })
      .catch((err) => {
        if (cancelled) return;
        const msg = err?.response?.data?.msg || t("ui.t_b71ff7", "تعذّر تحميل البيانات");
        setError(msg);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (loading) {
    return (
      <div style={styles.body}>
        <div style={{ padding: 80, textAlign: "center", color: "#6b7280" }}>
          جاري التحميل...
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={styles.body}>
        <div
          style={{
            padding: 80,
            textAlign: "center",
            color: "#991b1b",
            background: "#fef2f2",
            margin: 20,
            borderRadius: 12,
          }}
        >
          {error || t("ui.t_520e39", "خطأ غير معروف")}
        </div>
      </div>
    );
  }

  const { affiliate, stats, discount_codes, by_code, recent_usages } = data;

  return (
    <>
      <Helmet>
        <title>إحصائيات المسوّق · {affiliate.name}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div style={styles.body}>
        {/* Brand header */}
        <div style={styles.brand}>
          <div style={styles.container}>
            <div style={styles.brandRow}>
              <div>
                <h1 style={styles.brandTitle}>
                  <FiUser style={{ marginInlineEnd: 8 }} />
                  {affiliate.name}
                </h1>
                <div style={styles.brandSub}>
                  <span style={styles.brandBadge}>
                    عمولة:{" "}
                    {affiliate.commission_type === "percentage"
                      ? `${fmt(affiliate.commission_value)}%`
                      : `${fmt(affiliate.commission_value)} ر.س`}
                  </span>
                </div>
              </div>
              <div style={{ textAlign: "end", opacity: 0.85, fontSize: 12 }}>
                صفحة خاصة بك — لا تشاركها مع أحد
              </div>
            </div>
          </div>
        </div>

        <div style={styles.container}>
          {/* KPI cards */}
          <div style={styles.statsGrid}>
            <KpiCard
              label={t("ui.t_0f331f", "مرات الاستخدام")}
              value={fmtInt(stats.total_usages)}
              icon={<FiShoppingBag size={28} color="#400198" />}
            />
            <KpiCard
              label={t("ui.t_7db74e", "إجمالي المبيعات")}
              value={fmt(stats.total_sales)}
              hint="ر.س"
              icon={<FiTrendingUp size={28} color="#16a34a" />}
            />
            <KpiCard
              label={t("ui.t_1d353b", "إجمالي العمولة")}
              value={fmt(stats.total_commission)}
              hint="ر.س"
              valueColor="#16a34a"
              icon={<FiDollarSign size={28} color="#ca8a04" />}
            />
            <KpiCard
              label={t("ui.t_0685e5", "قيد التسوية")}
              value={fmt(stats.pending_commission)}
              hint={`ر.س · مدفوع: ${fmt(stats.paid_commission)}`}
              valueColor="#ca8a04"
              icon={<FiClock size={28} color="#6b7280" />}
            />
          </div>

          {/* Discount codes — full list */}
          <div style={styles.card}>
            <div
              style={{
                ...styles.cardHeader,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 8,
              }}
            >
              <h6 style={{ margin: 0, fontWeight: 700 }}>
                <FiTag style={{ marginInlineEnd: 6 }} />
                أكواد الخصم الخاصة بك
                <span style={styles.headerCount}>{discount_codes.length}</span>
              </h6>
            </div>
            {discount_codes.length === 0 ? (
              <div
                style={{
                  padding: 40,
                  textAlign: "center",
                  color: "#9ca3af",
                }}
              >
                <FiTag size={32} style={{ opacity: 0.4 }} />
                <div style={{ marginTop: 8 }}>
                  لا توجد أكواد خصم مربوطة بك حالياً.
                </div>
                <small>تواصل مع الإدارة لإصدار كود مخصّص لك.</small>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={styles.table}>
                  <thead style={styles.thead}>
                    <tr>
                      <th style={styles.th}>الكود</th>
                      <th style={styles.th}>العنوان</th>
                      <th style={styles.th}>نوع الخصم</th>
                      <th style={styles.th}>القيمة</th>
                      <th style={{ ...styles.th, textAlign: "center" }}>
                        الاستخدامات
                      </th>
                      <th style={{ ...styles.th, textAlign: "center" }}>
                        المدفوعة
                      </th>
                      <th style={{ ...styles.th, textAlign: "end" }}>
                        إجمالي المبيعات
                      </th>
                      <th style={{ ...styles.th, textAlign: "end" }}>
                        إجمالي العمولة
                      </th>
                      <th style={{ ...styles.th, textAlign: "center" }}>
                        الحالة
                      </th>
                      <th style={styles.th}>الصلاحية</th>
                    </tr>
                  </thead>
                  <tbody>
                    {discount_codes.map((dc) => (
                      <tr key={dc.id} style={styles.tr}>
                        <td style={styles.td}>
                          <code style={styles.code}>{dc.code}</code>
                        </td>
                        <td style={styles.td}>{dc.title}</td>
                        <td style={styles.td}>
                          {dc.discount_type === "percentage" ? (
                            <span style={{ ...styles.pill, ...styles.pillInfo }}>
                              نسبي
                            </span>
                          ) : (
                            <span style={{ ...styles.pill, ...styles.pillWarn }}>
                              مالي
                            </span>
                          )}
                        </td>
                        <td style={styles.td}>
                          {dc.discount_type === "percentage"
                            ? `${dc.discount_value}%`
                            : `${fmt(dc.discount_value)} ر.س`}
                        </td>
                        <td style={{ ...styles.td, textAlign: "center" }}>
                          <span
                            style={{
                              ...styles.pill,
                              background: "#f3f4f6",
                              color: "#374151",
                            }}
                          >
                            {fmtInt(dc.total_usages)}
                          </span>
                        </td>
                        <td style={{ ...styles.td, textAlign: "center" }}>
                          <span
                            style={{
                              ...styles.pill,
                              background: "#d4edda",
                              color: "#155724",
                            }}
                          >
                            {fmtInt(dc.paid_usages)}
                          </span>
                        </td>
                        <td style={{ ...styles.td, textAlign: "end" }}>
                          {fmt(dc.total_sales)} ر.س
                        </td>
                        <td
                          style={{
                            ...styles.td,
                            textAlign: "end",
                            color: "#16a34a",
                            fontWeight: 700,
                          }}
                        >
                          {fmt(dc.total_commission)} ر.س
                        </td>
                        <td style={{ ...styles.td, textAlign: "center" }}>
                          {dc.is_expired ? (
                            <span style={{ ...styles.pill, ...styles.pillWarn }}>
                              منتهي
                            </span>
                          ) : dc.status ? (
                            <span style={{ ...styles.pill, ...styles.pillOk }}>
                              نشط
                            </span>
                          ) : (
                            <span style={{ ...styles.pill, ...styles.pillBad }}>
                              متوقف
                            </span>
                          )}
                        </td>
                        <td style={styles.td}>
                          <small style={{ color: "#6b7280" }}>
                            {dc.start_date || "—"} ← {dc.end_date || "—"}
                          </small>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot style={styles.thead}>
                    <tr>
                      <th
                        colSpan={4}
                        style={{ ...styles.th, textAlign: "end" }}
                      >
                        الإجماليات:
                      </th>
                      <th style={{ ...styles.th, textAlign: "center" }}>
                        {fmtInt(
                          discount_codes.reduce(
                            (s, x) => s + x.total_usages,
                            0,
                          ),
                        )}
                      </th>
                      <th style={{ ...styles.th, textAlign: "center" }}>
                        {fmtInt(
                          discount_codes.reduce(
                            (s, x) => s + x.paid_usages,
                            0,
                          ),
                        )}
                      </th>
                      <th style={{ ...styles.th, textAlign: "end" }}>
                        {fmt(
                          discount_codes.reduce(
                            (s, x) => s + x.total_sales,
                            0,
                          ),
                        )}{" "}
                        ر.س
                      </th>
                      <th
                        style={{
                          ...styles.th,
                          textAlign: "end",
                          color: "#16a34a",
                        }}
                      >
                        {fmt(
                          discount_codes.reduce(
                            (s, x) => s + x.total_commission,
                            0,
                          ),
                        )}{" "}
                        ر.س
                      </th>
                      <th colSpan={2} style={styles.th}></th>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {/* By code */}
          {by_code.length > 0 && (
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <h6 style={{ margin: 0, fontWeight: 700 }}>
                  <FiBarChart2 style={{ marginInlineEnd: 6 }} />
                  العمولة لكل كود خصم
                </h6>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={styles.table}>
                  <thead style={styles.thead}>
                    <tr>
                      <th style={styles.th}>الكود</th>
                      <th style={styles.th}>العنوان</th>
                      <th style={{ ...styles.th, textAlign: "center" }}>
                        مرات الاستخدام
                      </th>
                      <th style={{ ...styles.th, textAlign: "end" }}>
                        العمولة المتراكمة
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {by_code.map((row) => (
                      <tr key={row.code_id} style={styles.tr}>
                        <td style={styles.td}>
                          <code style={styles.code}>{row.code || "—"}</code>
                        </td>
                        <td style={styles.td}>{row.title || "—"}</td>
                        <td style={{ ...styles.td, textAlign: "center" }}>
                          {fmtInt(row.uses)}
                        </td>
                        <td
                          style={{
                            ...styles.td,
                            textAlign: "end",
                            fontWeight: 700,
                          }}
                        >
                          {fmt(row.commission)} ر.س
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Recent usages */}
          <div style={styles.card}>
            <div
              style={{
                ...styles.cardHeader,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h6 style={{ margin: 0, fontWeight: 700 }}>
                <FiHistory style={{ marginInlineEnd: 6 }} />
                آخر العمليات
              </h6>
              <small style={{ color: "#6b7280" }}>آخر 100 عملية</small>
            </div>
            {recent_usages.length === 0 ? (
              <div
                style={{
                  padding: 60,
                  textAlign: "center",
                  color: "#9ca3af",
                }}
              >
                <FiInbox size={48} style={{ opacity: 0.4 }} />
                <div style={{ marginTop: 8 }}>لا توجد عمليات بعد</div>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={styles.table}>
                  <thead style={styles.thead}>
                    <tr>
                      <th style={styles.th}>التاريخ</th>
                      <th style={styles.th}>الكود</th>
                      <th style={styles.th}>العميل</th>
                      <th style={{ ...styles.th, textAlign: "end" }}>
                        المبلغ
                      </th>
                      <th style={{ ...styles.th, textAlign: "end" }}>
                        الخصم
                      </th>
                      <th style={{ ...styles.th, textAlign: "end" }}>
                        العمولة
                      </th>
                      <th style={{ ...styles.th, textAlign: "center" }}>
                        الحالة
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {recent_usages.map((u) => (
                      <tr key={u.id} style={styles.tr}>
                        <td style={styles.td}>
                          <small style={{ color: "#6b7280" }}>{u.date}</small>
                        </td>
                        <td style={styles.td}>
                          {u.code_title || "—"}{" "}
                          <small style={{ color: "#6b7280" }}>
                            ({u.code || "—"})
                          </small>
                        </td>
                        <td style={styles.td}>{u.customer || "—"}</td>
                        <td style={{ ...styles.td, textAlign: "end" }}>
                          {fmt(u.original_amount)}
                        </td>
                        <td
                          style={{
                            ...styles.td,
                            textAlign: "end",
                            color: "#dc2626",
                          }}
                        >
                          −{fmt(u.discount_amount)}
                        </td>
                        <td
                          style={{
                            ...styles.td,
                            textAlign: "end",
                            fontWeight: 700,
                            color: "#16a34a",
                          }}
                        >
                          {fmt(u.commission)}
                        </td>
                        <td
                          style={{
                            ...styles.td,
                            textAlign: "center",
                          }}
                        >
                          <StatusBadge status={u.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div
            style={{
              textAlign: "center",
              color: "#9ca3af",
              fontSize: 12,
              padding: "24px 0",
            }}
          >
            صفحة خاصة بـ {affiliate.name} — منصة مكافآت · لا تشارك هذا الرابط
            مع أي شخص.
          </div>
        </div>
      </div>
    </>
  );
};

const KpiCard: React.FC<{
  label: string;
  value: string;
  hint?: string;
  valueColor?: string;
  icon: React.ReactNode;
}> = ({ label, value, hint, valueColor, icon }) => (
  <div style={styles.statCard}>
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 12,
      }}
    >
      <div>
        <div style={{ color: "#6b7280", fontSize: 13 }}>{label}</div>
        <div
          style={{
            fontSize: 26,
            fontWeight: 700,
            color: valueColor || "#111827",
            marginTop: 4,
          }}
        >
          {value}
        </div>
        {hint && (
          <div style={{ fontSize: 12, color: "#6b7280" }}>{hint}</div>
        )}
      </div>
      <div style={{ opacity: 0.8 }}>{icon}</div>
    </div>
  </div>
);

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  if (status === "paid") {
    return (
      <span
        style={{
          background: "#d4edda",
          color: "#155724",
          padding: "4px 10px",
          borderRadius: 8,
          fontSize: 12,
          fontWeight: 600,
        }}
      >
        مدفوعة
      </span>
    );
  }
  if (status === "pending") {
    return (
      <span
        style={{
          background: "#fff3cd",
          color: "#856404",
          padding: "4px 10px",
          borderRadius: 8,
          fontSize: 12,
          fontWeight: 600,
        }}
      >
        قيد التسوية
      </span>
    );
  }
  return (
    <span
      style={{
        background: "#e5e7eb",
        color: "#374151",
        padding: "4px 10px",
        borderRadius: 8,
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      ملغية
    </span>
  );
};

const styles: Record<string, React.CSSProperties> = {
  body: {
    background: "#f4f5f7",
    minHeight: "100vh",
    fontFamily: "'Tajawal', 'Cairo', sans-serif",
    direction: "rtl",
  },
  brand: {
    background: "linear-gradient(135deg, #400198 0%, #56005E 100%)",
    color: "#fff",
    padding: "24px 0",
    marginBottom: 24,
  },
  container: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "0 16px",
  },
  brandRow: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  brandTitle: {
    margin: 0,
    fontWeight: 700,
    fontSize: 24,
    display: "flex",
    alignItems: "center",
  },
  brandSub: {
    marginTop: 6,
    opacity: 0.85,
    fontSize: 13,
  },
  brandBadge: {
    background: "rgba(255,255,255,0.92)",
    color: "#1f2937",
    padding: "4px 10px",
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 600,
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    background: "#fff",
    borderRadius: 12,
    padding: 18,
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
  },
  card: {
    background: "#fff",
    borderRadius: 12,
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
    marginBottom: 24,
    overflow: "hidden",
  },
  cardHeader: {
    padding: "14px 18px",
    borderBottom: "1px solid #e5e7eb",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 14,
  },
  thead: {
    background: "#f9fafb",
  },
  th: {
    padding: "12px 14px",
    textAlign: "start",
    fontWeight: 600,
    color: "#374151",
    borderBottom: "1px solid #e5e7eb",
  },
  tr: {
    borderBottom: "1px solid #f3f4f6",
  },
  td: {
    padding: "12px 14px",
    color: "#1f2937",
  },
  code: {
    background: "#f3f4f6",
    padding: "2px 8px",
    borderRadius: 6,
    fontFamily: "monospace",
    color: "#400198",
  },
  pill: {
    display: "inline-block",
    padding: "2px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 600,
  },
  pillInfo: {
    background: "#dbeafe",
    color: "#1e40af",
  },
  pillWarn: {
    background: "#fef3c7",
    color: "#92400e",
  },
  pillOk: {
    background: "#d1fae5",
    color: "#065f46",
  },
  pillBad: {
    background: "#fee2e2",
    color: "#991b1b",
  },
  headerCount: {
    display: "inline-block",
    marginInlineStart: 8,
    background: "#6b7280",
    color: "#fff",
    borderRadius: 999,
    padding: "1px 9px",
    fontSize: 12,
    fontWeight: 600,
  },
};

export default AffiliatePublicStatsPage;
