import { Coordinate } from './coordinate';

export const CITIES_AND_COORDINATES: { [name: string]: Coordinate } = {
    Erlangen: new Coordinate(49.6, 11.0),
    Leipzig: new Coordinate(51.359, 12.377),
    Dresden: new Coordinate(51.05, 13.739),
    Würzburg: new Coordinate(49.48, 9.56),
};

export function getDistanceBetweenCities(a: string, b: string): number {
    var city_a: Coordinate;
    var city_b: Coordinate;
    var distance: number = 0;

    if (!(a in CITIES_AND_COORDINATES) || !(b in CITIES_AND_COORDINATES)) {
        return -1;
    }

    if (a == b) {
        return 1;
    }

    city_a = CITIES_AND_COORDINATES[a];
    city_b = CITIES_AND_COORDINATES[b];

    distance = Math.abs(city_a.getDistance(city_b));

    return distance;
}

export function cityHasRecord(city: string): boolean {
    return city in CITIES_AND_COORDINATES;
}
