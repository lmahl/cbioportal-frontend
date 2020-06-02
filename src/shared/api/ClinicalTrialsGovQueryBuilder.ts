import { RecruitingStatus } from '../enums/ClinicalTrialsGovRecruitingStatus';

export function getQuery(
    locations: string[],
    recrutingStatus: RecruitingStatus[]
) {
    var resultQuery: string = '';

    //TODO: Export list
    //resultQuery += "AND (cancer OR leukemia OR neoplasm OR carcinoma OR tumor)"

    if (locations && locations.length > 0) {
        resultQuery += ' AND SEARCH[Location](AREA[LocationCountry](';
        resultQuery += locations[0];

        if (locations.length > 1) {
            for (let i = 1; i < locations.length; i++) {
                resultQuery += ' OR ' + locations[i];
            }
        }

        resultQuery += ')';

        if (recrutingStatus && recrutingStatus.length > 0) {
            resultQuery += 'AND (AREA[LocationStatus]COVERAGE[FullMatch](';
            resultQuery += recrutingStatus[0] + ')';

            if (recrutingStatus.length > 1) {
                for (let i = 1; i < recrutingStatus.length; i++) {
                    resultQuery +=
                        ' OR AREA[LocationStatus]COVERAGE[FullMatch](';
                    resultQuery += recrutingStatus[i] + ')';
                }
            }
            resultQuery += ')';
        }
        resultQuery += ')';
    } else {
        if (recrutingStatus && recrutingStatus.length > 0) {
            resultQuery += ' AND (AREA[OverallStatus]COVERAGE[FullMatch](';
            resultQuery += recrutingStatus[0];
            resultQuery += ')';

            if (recrutingStatus.length > 1) {
                for (let i = 1; i < recrutingStatus.length; i++) {
                    resultQuery +=
                        ' OR (AREA[OverallStatus]COVERAGE[FullMatch](';
                    resultQuery += recrutingStatus[i];
                    resultQuery += '))';
                }
            }

            resultQuery += ')';
        }
    }

    return resultQuery;
}

export function getBasicQuery() {
    return getQuery(
        ['Germany'],
        [RecruitingStatus.Recruiting, RecruitingStatus.NotYetRecruiting]
    );
}

export function getAllCountriesBasicQuery() {
    return getQuery(
        [],
        [RecruitingStatus.Recruiting, RecruitingStatus.NotYetRecruiting]
    );
}

export function getEverythingQuery() {
    return getQuery([], []);
}
