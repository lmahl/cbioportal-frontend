import { Study } from 'shared/api/ClinicalTrialsGovStudyStrucutre';

export class StudyListEntry {
    private numberFound: number;
    private keywordsFound: String[];
    private study: Study;
    private score: number;

    constructor(study: Study, keyword: String) {
        this.numberFound = 1;
        this.keywordsFound = [keyword];
        this.study = study;
        this.score = 0;
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

    calculateScore(isConditionMatching: boolean): number {
        var res: number = 0;

        if (isConditionMatching) {
            res += 1000;
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

    calculateScores(nct_ids: string[]) {
        this.list.forEach((value: StudyListEntry, key: String) => {
            var nct_id = value.getStudy().ProtocolSection.IdentificationModule
                .NCTId;
            var isConditionMatching: boolean = false;

            console.log('calculating score');

            if (nct_ids.includes(nct_id)) {
                isConditionMatching = true;
                console.log('Match found');
            }
            value.calculateScore(isConditionMatching);
        });
    }
}
