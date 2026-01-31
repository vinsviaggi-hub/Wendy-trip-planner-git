import countries from "i18n-iso-countries";
import itLocale from "i18n-iso-countries/langs/it.json";

countries.registerLocale(itLocale);

export type CountryOption = { code: string; name: string };

export const COUNTRY_OPTIONS: CountryOption[] = Object.entries(
  countries.getNames("it", { select: "official" })
)
  .map(([code, name]) => ({ code, name }))
  .sort((a, b) => a.name.localeCompare(b.name, "it"));

export function countryName(code: string) {
  return countries.getName(code, "it", { select: "official" }) ?? code;
}
