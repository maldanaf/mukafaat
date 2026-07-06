"use client";

import { t } from "i18next";
import ReactFlagsSelect from "react-flags-select";
import { defaultCountryCode } from "@utils/geoCountry";

const CountrySelectDropdown = (props: {
  selectedNationality: string;
  onSelectNationalityChange: (nationality: string) => void;
}) => {
  // الافتراضي حسب IP الزائر (وإلا السعودية) عند عدم تمرير قيمة من الأب
  const {
    selectedNationality = defaultCountryCode(),
    onSelectNationalityChange,
  } = props;

  return (
    <div className="input-group wow fadeInUp" data-wow-delay="0.2s">
      <label
        htmlFor="nationality"
        className="text-sm text-title font-bold capitalize"
      >
        {t("job-application.nationality")}
      </label>
      <ReactFlagsSelect
        id="nationality"
        searchable
        showOptionLabel
        countries={["IL"]}
        blacklistCountries
        selectButtonClassName="h-12 px-8 rounded-md text-white font-semibold bg-[#f9fafb] hover:opacity-90 pb-0 mt-2"
        selected={selectedNationality}
        onSelect={(code) => onSelectNationalityChange(code)}
      />
    </div>
  );
};

export default CountrySelectDropdown;
