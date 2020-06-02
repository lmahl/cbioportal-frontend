import * as React from 'react';
import { action, computed, observable } from 'mobx';
import { PatientViewPageStore } from '../clinicalInformation/PatientViewPageStore';
import { observer } from 'mobx-react';
import { Mutation } from '../../../shared/api/generated/CBioPortalAPI';
import { Collapse } from 'react-collapse';
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

class CollapseList extends React.PureComponent {
    NUM_LIST_ELEMENTS = 3;

    getDiplayStyle(str: String[]) {
        if (str.length <= this.NUM_LIST_ELEMENTS) {
            return (
                <div>
                    <ul>{this.asFirstListElement(str)}</ul>
                </div>
            );
        } else {
            return (
                <div>
                    <ul>{this.asFirstListElement(str)}</ul>
                    <Collapse isOpened={this.state.isOpened}>
                        <ul>{this.asHiddenListElement(str)}</ul>
                    </Collapse>
                    <div className="config">
                        <label>
                            Show More:
                            <input
                                className="input"
                                type="checkbox"
                                checked={this.state.isOpened}
                                onChange={({ target: { checked } }) =>
                                    this.setState({ isOpened: checked })
                                }
                            />
                        </label>
                    </div>
                </div>
            );
        }
    }

    asFirstListElement(str: String[]) {
        var res: String[] = [];
        if (str.length <= this.NUM_LIST_ELEMENTS) {
            for (var i = 0; i < str.length; i++) {
                res.push(str[i]);
            }
        } else {
            for (var i = 0; i < this.NUM_LIST_ELEMENTS; i++) {
                res.push(str[i]);
            }
        }
        return res.map(i => <li>{i}</li>);
    }

    asHiddenListElement(str: String[]) {
        var res: String[] = [];
        if (str.length > this.NUM_LIST_ELEMENTS) {
            for (var i = this.NUM_LIST_ELEMENTS; i < str.length; i++) {
                res.push(str[i]);
            }
            return res.map(i => <li>{i}</li>);
        } else {
            return <div></div>;
        }
    }

    constructor(props) {
        super(props);
        this.state = { isOpened: false };
    }

    render() {
        const { isOpened } = this.state;
        const height = 100;

        return <div>{this.getDiplayStyle(this.props.elements)}</div>;

        /*return (
        <div>
            {this.props.permanenttext}
          <Collapse isOpened={isOpened}>
            {this.props.collapsetext}
          </Collapse>
          <div className="config">
            <label>
              Read More:
              <input
                className="input"
                type="checkbox"
                checked={isOpened}
                onChange={({target: {checked}}) => this.setState({isOpened: checked})} />
            </label>
          </div>
        </div>
      );*/
    }
}

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
                    <CollapseList elements={trial.conditions}></CollapseList>
                </div>
            ),
            width: 300,
        },
        {
            name: ColumnKey.INTERVENTIONS,
            render: (trial: IDetailedClinicalTrialMatch) => (
                <div>
                    <CollapseList elements={trial.interventions}></CollapseList>
                </div>
            ),
            width: 300,
        },
        {
            name: ColumnKey.LOCATIONS,
            render: (trial: IDetailedClinicalTrialMatch) => (
                <div>
                    <CollapseList elements={trial.locations}></CollapseList>
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
