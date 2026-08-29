"use client";

/**
 * مؤشر تحميل موحّد بلون الهوية البنفسجي.
 * (للقوائم يُفضَّل استخدام `SkeletonRows`/`SkeletonGrid` من `@ui` بدلاً منه.)
 *
 * `onDark` يقلب الألوان لتبقى الحلقة مرئية فوق تدرّج الهوية الداكن.
 */
export const LoadingSpinner = ({
  size = 28,
  onDark = false,
}: {
  size?: number;
  onDark?: boolean;
}) => (
  <div
    className="flex w-full items-center justify-center"
    role="status"
    aria-label="Loading"
  >
    <span
      aria-hidden
      className={`inline-block animate-spin rounded-full border-2 ${
        onDark
          ? "border-white/25 border-t-white"
          : "border-mk-border-strong border-t-mk-primary"
      }`}
      style={{ width: size, height: size }}
    />
  </div>
);
