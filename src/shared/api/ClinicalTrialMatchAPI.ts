import * as request from 'superagent';
import { ClinicalTrialsGovStudies } from './ClinicalTrialsGovStudyStrucutre';

import {
    getBasicQuery,
    getEverythingQuery,
    getAllCountriesBasicQuery,
    getQuery,
} from './ClinicalTrialsGovQueryBuilder';
import { RecruitingStatus } from 'shared/enums/ClinicalTrialsGovRecruitingStatus';

export async function searchStudiesForKeyword(
    keyword: String,
    min_rnk: number,
    max_rnk: number,
    locations: string[],
    status: RecruitingStatus[]
): Promise<String> {
    const url_raw =
        'https://ClinicalTrials.gov/api/query/full_studies?expr=' +
        keyword +
        getQuery(locations, status) +
        '&min_rnk=' +
        min_rnk +
        '&max_rnk=' +
        max_rnk +
        '&fmt=JSON';
    const url = encodeURI(url_raw);
    console.log('sending request to: ' + url);
    return request.get(url).then(res => {
        return res.text;
    });
}

export async function searchStudiesForKeywordAsString(
    keyword: String,
    min_rnk: number,
    max_rnk: number,
    locations: string[],
    status: RecruitingStatus[]
): Promise<ClinicalTrialsGovStudies> {
    const url_raw =
        'https://ClinicalTrials.gov/api/query/full_studies?expr=' +
        keyword +
        getQuery(locations, status) +
        '&min_rnk=' +
        min_rnk +
        '&max_rnk=' +
        max_rnk +
        '&fmt=JSON';
    const url = encodeURI(url_raw);
    console.log('sending request to: ' + url);
    return request.get(url).then(res => {
        var result: ClinicalTrialsGovStudies = JSON.parse(res.text);
        return result;
    });
}
