import * as React from 'react';
import { action, computed, observable } from 'mobx';
import { PatientViewPageStore } from '../clinicalInformation/PatientViewPageStore';
import { observer } from 'mobx-react';
import { Mutation } from '../../../shared/api/generated/CBioPortalAPI';
import {
    searchStudiesForKeyword,
    searchStudiesForKeywordAsString,
} from '../../../shared/api/ClinicalTrialMatchAPI';
import {
    ClinicalTrialsGovStudies,
    Study,
} from '../../../shared/api/ClinicalTrialsGovStudyStrucutre';
import { StudyList, StudyListEntry } from './utils/StudyList';
import LazyMobXTable from '../../../shared/components/lazyMobXTable/LazyMobXTable';
import ClinicalTrialMatchTableOptions from './ClinicalTrialMatchTableOptions';

enum ColumnKey {
    NUM_FOUND = 'Appearences',
    KEYWORDS = 'Keywords Found',
    TITLE = 'Study Title',
    CONDITIONS = 'Conditions',
    NCT_NUMBER = 'NCT Number',
    STATUS = 'Status',
}

interface IClinicalTrialMatchProps {
    store: PatientViewPageStore;
    clinicalTrialMatches: IDetailedClinicalTrialMatch[];
}

export interface IDetailedClinicalTrialMatch {
    found: number;
    keywords: String;
    conditions: String;
    title: String;
    nct: String;
    status: String;
}

class ClinicalTrialMatchTableComponent extends LazyMobXTable<
    IDetailedClinicalTrialMatch
> {}

@observer
export class ClinicalTrialMatchTable extends React.Component<
    IClinicalTrialMatchProps,
    {}
> {
    private _columns = [
        {
            name: ColumnKey.NUM_FOUND,
            render: (trial: IDetailedClinicalTrialMatch) => (
                <div>{trial.found}</div>
            ),
            width: 300,
        },
        {
            name: ColumnKey.KEYWORDS,
            render: (trial: IDetailedClinicalTrialMatch) => (
                <div>{trial.keywords}</div>
            ),
            width: 300,
        },
        {
            name: ColumnKey.CONDITIONS,
            render: (trial: IDetailedClinicalTrialMatch) => (
                <div>{trial.conditions}</div>
            ),
            width: 300,
        },
        {
            name: ColumnKey.TITLE,
            render: (trial: IDetailedClinicalTrialMatch) => (
                <div>{trial.title}</div>
            ),
            width: 300,
        },
        {
            name: ColumnKey.NCT_NUMBER,
            render: (trial: IDetailedClinicalTrialMatch) => (
                <div>
                    <a
                        target="_blank"
                        href={
                            'https://clinicaltrials.gov/ct2/show/' + trial.nct
                        }
                    >
                        {trial.nct}
                    </a>
                </div>
            ),
            width: 300,
        },
        {
            name: ColumnKey.STATUS,
            render: (trial: IDetailedClinicalTrialMatch) => (
                <div>{trial.status}</div>
            ),
            width: 300,
        },
    ];

    @observable
    studies: StudyListEntry[] = [];

    constructor(props: IClinicalTrialMatchProps) {
        super(props);
    }

    render() {
        return (
            <div>
                <div>
                    <ClinicalTrialMatchTableOptions store={this.props.store} />
                </div>
                <div>
                    <ClinicalTrialMatchTableComponent
                        data={this.props.clinicalTrialMatches}
                        columns={this._columns}
                    />
                </div>
            </div>
        );
    }
}
