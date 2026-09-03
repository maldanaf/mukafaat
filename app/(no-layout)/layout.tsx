/**
 * صفحات بلا تخطيط الموقع (الدخول، الباقات، نتائج الدفع).
 *
 * `force-dynamic` كما في مجموعة `(with-layout)`: بدونها تُصيَّر
 * الصفحة مسبقاً وتُخدم من الكاش، فيتأخّر ظهور أي تعديل من لوحة
 * التحكم — وهذه الصفحات تعرض الباقات وأسعارها.
 */
export const dynamic = "force-dynamic";

export default function NoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
