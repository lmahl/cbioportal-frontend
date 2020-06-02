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
    LOCATIONS = 'Locations',
    INTERVENTIONS = 'Interventions',
}

interface IClinicalTrialMatchProps {
    store: PatientViewPageStore;
    clinicalTrialMatches: IDetailedClinicalTrialMatch[];
}

export interface IDetailedClinicalTrialMatch {
    found: number;
    keywords: String;
    conditions: String[];
    title: String;
    nct: String;
    status: String;
    locations: string[];
    interventions: string[];
}

class ClinicalTrialMatchTableComponent extends LazyMobXTable<
    IDetailedClinicalTrialMatch
> {}

@observer
export class ClinicalTrialMatchTable extends React.Component<
    IClinicalTrialMatchProps,
    {}
> {
    private readonly ENTRIES_PER_PAGE = 10;
    private _columns = [
        {
            name: ColumnKey.STATUS,
            render: (trial: IDetailedClinicalTrialMatch) => (
                <div>{trial.status}</div>
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
            name: ColumnKey.TITLE,
            render: (trial: IDetailedClinicalTrialMatch) => (
                <div>
                    <a
                        target="_blank"
                        href={
                            'https://clinicaltrials.gov/ct2/show/' + trial.nct
                        }
                    >
                        {trial.title}
                    </a>
                </div>
            ),
            width: 300,
        },
        {
            name: ColumnKey.CONDITIONS,
            render: (trial: IDetailedClinicalTrialMatch) => (
                <div>
                    <ul>{this.asListElement(trial.conditions)}</ul>
                </div>
            ),
            width: 300,
        },
        {
            name: ColumnKey.INTERVENTIONS,
            render: (trial: IDetailedClinicalTrialMatch) => (
                <div>
                    <ul>{this.asListElement(trial.interventions)}</ul>
                </div>
            ),
            width: 300,
        },
        {
            name: ColumnKey.LOCATIONS,
            render: (trial: IDetailedClinicalTrialMatch) => (
                <div>
                    <ul>{this.asListElement(trial.locations)}</ul>
                </div>
            ),
            width: 300,
        },
    ];

    @observable
    studies: StudyListEntry[] = [];

    constructor(props: IClinicalTrialMatchProps) {
        super(props);
    }

    asListElement(str: String[]) {
        return str.map(i => <li>{i}</li>);
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
                        initialItemsPerPage={this.ENTRIES_PER_PAGE}
                    />
                </div>
            </div>
        );
    }
}
