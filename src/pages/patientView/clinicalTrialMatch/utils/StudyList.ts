import { Study } from 'shared/api/ClinicalTrialsGovStudyStrucutre';
import { ageAsNumber, getGenderString } from './AgeSexConverter';

export class StudyListEntry {
    private numberFound: number;
    private keywordsFound: String[];
    private study: Study;
    private score: number;
    private minimumAge: number;
    private maximumAge: number;
    private sex: string;

    constructor(study: Study, keyword: String) {
        this.numberFound = 1;
        this.keywordsFound = [keyword];
        this.study = study;
        this.score = 0;

        try {
            var minimumAgeString =
                study.ProtocolSection.EligibilityModule.MinimumAge;
            this.minimumAge = ageAsNumber(minimumAgeString);
        } catch (e) {
            this.minimumAge = -1;
        }

        try {
            var maximumAgeString =
                study.ProtocolSection.EligibilityModule.MaximumAge;
            this.maximumAge = ageAsNumber(maximumAgeString);
        } catch (e) {
            this.maximumAge = -1;
        }

        try {
            this.sex = getGenderString(
                study.ProtocolSection.EligibilityModule.Gender
            );
        } catch (e) {
            this.sex = 'ALL';
        }
    }

    addFound(keyword: String) {
        this.numberFound += 1;
        this.keywordsFound.push(keyword);
    }

    getNumberFound(): number {
        return this.numberFound;
    }

    getKeywords(): String[] {
        return this.keywordsFound;
    }

    getStudy(): Study {
        return this.study;
    }

    getScore(): number {
        return this.score;
    }

    getSex(): string {
        return this.sex;
    }

    getMaximumAge(): number {
        return this.maximumAge;
    }

    getMinimumAge(): number {
        return this.minimumAge;
    }

    calculateScore(
        isConditionMatching: boolean,
        isSexMatching: boolean,
        isAgeMatching: boolean
    ): number {
        var res: number = 0;

        console.log('actually calculating score');

        if (isConditionMatching) {
            res += 10000;
        }

        if (isSexMatching) {
            res += 1000;
        }

        if (isAgeMatching) {
            res += 100;
        }

        res += this.getNumberFound() * 1;

        this.score = res;

        return res;
    }
}

export class StudyList {
    private list = new Map<String, StudyListEntry>();

    addStudy(study: Study, keyword: String) {
        var nct_id = study.ProtocolSection.IdentificationModule.NCTId;
        if (this.list.get(nct_id)) {
            //study is allready in list. Just add new keyword an increase numver
            this.list.get(nct_id).addFound(keyword);
        } else {
            //study not yet in list, add it
            this.list.set(nct_id, new StudyListEntry(study, keyword));
        }
    }

    getStudyListEntires(): Map<String, StudyListEntry> {
        return this.list;
    }

    calculateScores(
        nct_ids: string[],
        patient_age: number,
        patient_sex: string
    ) {
        this.list.forEach((value: StudyListEntry, key: String) => {
            var nct_id = value.getStudy().ProtocolSection.IdentificationModule
                .NCTId;
            var isConditionMatching: boolean = false;
            var isAgeMatching: boolean = false;
            var isSexMatching: boolean = false;
            var pSex = getGenderString(patient_sex);

            console.log('calculating score');

            if (nct_ids.includes(nct_id)) {
                isConditionMatching = true;
                console.log('Match found');
            }

            console.log('sex');
            console.log(pSex);
            console.log(value.getSex());

            if (pSex == 'All' || value.getSex() == 'All') {
                isSexMatching = true;
            } else if (pSex == value.getSex()) {
                isSexMatching = true;
            }

            console.log('maxAge');
            console.log(value.getMaximumAge());
            console.log(patient_age);
            console.log('minAge');
            console.log(value.getMinimumAge());

            if (value.getMinimumAge() >= 0) {
                if (value.getMaximumAge() >= 0) {
                    isAgeMatching =
                        value.getMinimumAge() <= patient_age &&
                        patient_age <= value.getMaximumAge();
                } else {
                    isAgeMatching = value.getMinimumAge() <= patient_age;
                }
            } else if (value.getMaximumAge() >= 0) {
                isAgeMatching = patient_age <= value.getMaximumAge();
            } else {
                isAgeMatching = true;
            }

            console.log(isAgeMatching);
            console.log(isSexMatching);
            value.calculateScore(
                isConditionMatching,
                isSexMatching,
                isAgeMatching
            );
        });
    }
}
