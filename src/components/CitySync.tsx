"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useCityStore } from "@stores/cityStore";

/**
 * عند تغيير المدينة المختارة نُبطل كاش الاستعلامات ليعاد جلبها بالمدينة الجديدة،
 * فتُطبَّق الفلترة في أي صفحة يقف عليها الزائر (العروض/المطاعم/المتاجر).
 */
const CitySync: React.FC = () => {
  const cityId = useCityStore((state) => state.cityId);
  const queryClient = useQueryClient();
  const previous = useRef<number | null | undefined>(undefined);

  useEffect(() => {
    if (previous.current === undefined) {
      previous.current = cityId;
      return;
    }
    if (previous.current === cityId) return;
    previous.current = cityId;
    queryClient.invalidateQueries();
  }, [cityId, queryClient]);

  return null;
};

export default CitySync;
