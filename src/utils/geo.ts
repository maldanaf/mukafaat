/**
 * أدوات «الدولة الواحدة»: عندما تكون هناك دولة مفعّلة واحدة فقط
 * (`single_country: true` من /api/geo/countries و/api/web/home) تتخطّى
 * الواجهة خطوة اختيار الدولة وتعرض المدن مباشرة.
 */

export interface GeoCountry {
  id: number;
  name: string;
  code?: string | null;
  flag?: string | null;
}

export interface GeoCountriesResult {
  countries: GeoCountry[];
  singleCountry: boolean;
  onlyCountry: GeoCountry | null;
  activeCountriesCount: number;
  /** true عندما وصلت الاستجابة فعلاً (وإلا لا نتخذ أي قرار بحذف التخزين) */
  loaded: boolean;
}

const EMPTY: GeoCountriesResult = {
  countries: [],
  singleCountry: false,
  onlyCountry: null,
  activeCountriesCount: 0,
  loaded: false,
};

function toCountry(raw: unknown): GeoCountry | null {
  if (!raw || typeof raw !== "object") return null;
  const c = raw as Record<string, unknown>;
  const id = Number(c.id);
  if (!Number.isFinite(id)) return null;
  return {
    id,
    name: String(c.name ?? ""),
    code: (c.code as string) ?? null,
    flag: (c.flag as string) ?? null,
  };
}

/** قراءة استجابة /api/geo/countries بأمان */
export function parseGeoCountries(payload: unknown): GeoCountriesResult {
  const raw = payload as Record<string, unknown> | undefined;
  if (!raw) return EMPTY;
  const data = (raw.data ?? raw) as Record<string, unknown>;
  const list = Array.isArray(data.countries) ? data.countries : [];
  const countries = list
    .map(toCountry)
    .filter((c): c is GeoCountry => c !== null);

  if (countries.length === 0 && data.single_country === undefined) return EMPTY;

  const activeCount = Number(data.active_countries_count ?? countries.length);
  const single =
    data.single_country === true ||
    (data.single_country === undefined && countries.length === 1);

  return {
    countries,
    singleCountry: single,
    onlyCountry: toCountry(data.country) ?? (single ? countries[0] ?? null : null),
    activeCountriesCount: Number.isFinite(activeCount)
      ? activeCount
      : countries.length,
    loaded: true,
  };
}

const COUNTRY_STORAGE_KEY = "country_id";

/** الدولة المختارة المخزّنة محلياً */
export function getStoredCountryId(): number | null {
  try {
    const raw = localStorage.getItem(COUNTRY_STORAGE_KEY);
    const n = raw && raw.trim() !== "" ? Number(raw) : NaN;
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

export function setStoredCountryId(id: number): void {
  try {
    localStorage.setItem(COUNTRY_STORAGE_KEY, String(id));
  } catch {
    /* ignore storage failures */
  }
}

export function clearStoredCountryId(): void {
  try {
    localStorage.removeItem(COUNTRY_STORAGE_KEY);
  } catch {
    /* ignore storage failures */
  }
}

/**
 * تنظيف الدولة المخزّنة إن لم تعد ضمن الدول المفعّلة، وضبطها على الدولة
 * الوحيدة عند `single_country`. يرجع true عند تغيّر التخزين (يحتاج إعادة تحميل).
 */
export function reconcileStoredCountry(geo: GeoCountriesResult): boolean {
  if (!geo.loaded || geo.countries.length === 0) return false;

  const stored = getStoredCountryId();

  if (geo.singleCountry && geo.onlyCountry) {
    if (stored !== geo.onlyCountry.id) {
      setStoredCountryId(geo.onlyCountry.id);
      return true;
    }
    return false;
  }

  if (stored != null && !geo.countries.some((c) => c.id === stored)) {
    // الدولة المخزّنة عُطّلت في اللوحة — نحذفها ليعود الاكتشاف التلقائي
    clearStoredCountryId();
    return true;
  }

  return false;
}
