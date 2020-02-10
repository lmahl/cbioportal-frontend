import { Study } from 'shared/api/ClinicalTrialsGovStudyStrucutre';

export class StudyListEntry {
    private numberFound: number;
    private keywordsFound: String[];
    private study: Study;

    constructor(study: Study, keyword: String) {
        this.numberFound = 1;
        this.keywordsFound = [keyword];
        this.study = study;
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
}
