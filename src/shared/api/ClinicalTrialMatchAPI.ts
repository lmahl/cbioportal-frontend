import * as request from 'superagent';
import { ClinicalTrialsGovStudies } from './ClinicalTrialsGovStudyStrucutre';

export async function searchStudiesForKeyword(
    keyword: String,
    min_rnk: number,
    max_rnk: number
): Promise<String> {
    const url =
        'https://ClinicalTrials.gov/api/query/full_studies?expr=' +
        keyword +
        '%20AND%20SEARCH%5BLocation%5D(AREA%5BLocationCountry%5DGermany%20AND%20(AREA%5BLocationStatus%5DCOVERAGE%5BFullMatch%5DRecruiting%20OR%20AREA%5BLocationStatus%5DCOVERAGE%5BFullMatch%5D(Not%20yet%20recruiting)))' +
        '&min_rnk=' +
        min_rnk +
        '&max_rnk=' +
        max_rnk +
        '&fmt=JSON';
    console.log('sending request to: ' + url);
    return request.get(url).then(res => {
        return res.text;
    });
}

export async function searchStudiesForKeywordAsString(
    keyword: String,
    min_rnk: number,
    max_rnk: number
): Promise<ClinicalTrialsGovStudies> {
    const url =
        'https://ClinicalTrials.gov/api/query/full_studies?expr=' +
        keyword +
        '%20AND%20SEARCH%5BLocation%5D(AREA%5BLocationCountry%5DGermany%20AND%20(AREA%5BLocationStatus%5DCOVERAGE%5BFullMatch%5DRecruiting%20OR%20AREA%5BLocationStatus%5DCOVERAGE%5BFullMatch%5D(Not%20yet%20recruiting)))' +
        '&min_rnk=' +
        min_rnk +
        '&max_rnk=' +
        max_rnk +
        '&fmt=JSON';
    console.log('sending request to: ' + url);
    return request.get(url).then(res => {
        var result: ClinicalTrialsGovStudies = JSON.parse(res.text);
        return result;
    });
}
