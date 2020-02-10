export function getLocationQuery(location: String): String {
    return 'SEARCH[Location](AREA[LocationCountry]' + location;
}
