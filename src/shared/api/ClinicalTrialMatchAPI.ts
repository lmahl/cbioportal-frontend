import * as request from 'superagent';
import { ClinicalTrialsGovStudies } from './ClinicalTrialsGovStudyStrucutre';

import { getQuery } from './ClinicalTrialsGovQueryBuilder';
import { RecruitingStatus } from 'shared/enums/ClinicalTrialsGovRecruitingStatus';

export async function searchStudiesForKeyword(
    keyword: string,
    nec_search_symbols: string[],
    min_rnk: number,
    max_rnk: number,
    locations: string[],
    status: RecruitingStatus[]
): Promise<String> {
    const url_raw =
        'https://ClinicalTrials.gov/api/query/full_studies?expr=' +
        keyword +
        getQuery(locations, status, nec_search_symbols) +
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
    keyword: string,
    nec_search_symbols: string[],
    min_rnk: number,
    max_rnk: number,
    locations: string[],
    status: RecruitingStatus[]
): Promise<ClinicalTrialsGovStudies> {
    const url_raw =
        'https://ClinicalTrials.gov/api/query/full_studies?expr=' +
        keyword +
        getQuery(locations, status, nec_search_symbols) +
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

export async function getStudiesByCondtionsFromOncoKBasString(): Promise<
    String
> {
    const oncokb_studies_url = 'https://test.oncokb.org/trials';
    return request.get(oncokb_studies_url).then(res => {
        return res.text;
    });
}

export async function getStudiesByCondtionsFromOncoKB(): Promise<
    IOncoKBStudyDictionary
> {
    const oncokb_studies_url = 'https://test.oncokb.org/trials';
    return request.get(oncokb_studies_url).then(res => {
        var result: IOncoKBStudyDictionary = JSON.parse(res.text);
        return result;
    });
}

//Only includes fields relevant for ClinicalTrials.Gov search
interface IOncoKBStudy {
    briefTitle: string;
    currentTrialStatus: string;
    nctId: string;
}

interface IOncoKBStudyListByOncoTreeCode {
    nciCode: string;
    nciMainType: string;
    trials: IOncoKBStudy[];
}

export interface IOncoKBStudyDictionary {
    [index: string]: IOncoKBStudyListByOncoTreeCode;
}

export function getAllStudyNctIdsByOncoTreeCode(
    studyDictionary: IOncoKBStudyDictionary,
    oncoTreeCode: string
): string[] {
    var result: string[] = [];
    var studyList: IOncoKBStudyListByOncoTreeCode =
        studyDictionary[oncoTreeCode];
    var trials: IOncoKBStudy[];

    if (!studyList) {
        return result;
    }

    trials = studyDictionary[oncoTreeCode].trials;

    for (var std of trials) {
        result.push(std.nctId);
    }

    return result;
}

export function getAllStudyNctIdsByOncoTreeCodes(
    studyDictionary: IOncoKBStudyDictionary,
    oncoTreeCodes: string[]
): string[] {
    var result: string[] = [];

    for (var oc = 0; oc < oncoTreeCodes.length; oc++) {
        var oncoTreeCode: string = oncoTreeCodes[oc];
        var studyList: IOncoKBStudyListByOncoTreeCode =
            studyDictionary[oncoTreeCode];
        var trials: IOncoKBStudy[];

        if (studyList) {
            trials = studyDictionary[oncoTreeCode].trials;
            for (var std of trials) {
                result.push(std.nctId);
            }
        }
    }

    return result;
}
