/**
 * Best-effort split of the generator form's free-text "location" field into
 * an address and a city, e.g. "Kadriorg, Tallinn" -> { address: "Kadriorg", city: "Tallinn" }.
 * When there's no comma, the whole value is treated as the city and the
 * address is left blank for the user to fill in.
 */
export function deriveAddressCity(location: string): { address: string; city: string } {
  const trimmed = location.trim();
  const commaIndex = trimmed.indexOf(',');
  if (commaIndex === -1) {
    return { address: '', city: trimmed };
  }
  const address = trimmed.slice(0, commaIndex).trim();
  const city = trimmed.slice(commaIndex + 1).trim();
  if (!address || !city) {
    return { address, city: city || trimmed };
  }
  return { address, city };
}
