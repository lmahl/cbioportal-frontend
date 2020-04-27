import Checkbox from './ClinicalTrialMatchTableCheckbox';
import React from 'react';
import { PatientViewPageStore } from '../clinicalInformation/PatientViewPageStore';
import { ClinicalTrialMatchTextfield } from '../clinicalTrialMatch/ClinicalTrialMatchTextfield';
import { RecruitingStatus } from 'shared/enums/ClinicalTrialsGovRecruitingStatus';

interface IClinicalTrialOptionsMatchProps {
    store: PatientViewPageStore;
}

class ClinicalTrialMatchTableOptions extends React.Component<
    IClinicalTrialOptionsMatchProps
> {
    //query_field:ClinicalTrialMatchTextfield = new ClinicalTrialMatchTextfield("");
    recruiting_values: RecruitingStatus[] = [];

    constructor(props: IClinicalTrialOptionsMatchProps) {
        super(props);

        this.state = {
            checkedItems: new Map(),
            queryBoxValue: '',
            countryString: '',
            checkedRecruitingItems: new Map(),
        };

        this.recruiting_values = [
            RecruitingStatus.ActiveNotRecruiting,
            RecruitingStatus.Completed,
            RecruitingStatus.EnrollingByInvitation,
            RecruitingStatus.NotYetRecruiting,
            RecruitingStatus.Recruiting,
            RecruitingStatus.Suspended,
            RecruitingStatus.Terminated,
            RecruitingStatus.UnknownStatus,
            RecruitingStatus.Withdrawn,
        ];

        this.handleChange = this.handleChange.bind(this);
        this.handleTextChange = this.handleTextChange.bind(this);
        this.handleCountryChange = this.handleCountryChange.bind(this);
        this.handleRecChange = this.handleRecChange.bind(this);
    }

    getRecruitingKeyFromValueString(value: string): RecruitingStatus {
        for (let status of this.recruiting_values) {
            if (status.toString() == value) {
                return status;
            }
        }

        return RecruitingStatus.Invalid;
    }

    handleChange(e) {
        const item = e.target.name;
        const isChecked = e.target.checked;
        this.setState(prevState => ({
            checkedItems: prevState.checkedItems.set(item, isChecked),
            queryBoxValue: prevState.queryBoxValue,
            countryString: prevState.countryString,
            checkedRecruitingItems: prevState.checkedRecruitingItems,
        }));
        console.log(this.state);
    }

    handleTextChange(e) {
        const newValue = e.target.value;
        this.setState(prevState => ({
            checkedItems: prevState.checkedItems,
            queryBoxValue: newValue,
            countryString: prevState.countryString,
            checkedRecruitingItems: prevState.checkedRecruitingItems,
        }));
        console.log(this.state);
    }

    handleCountryChange(e) {
        const newValue = e.target.value;
        this.setState(prevState => ({
            checkedItems: prevState.checkedItems,
            queryBoxValue: prevState.queryBoxValue,
            countryString: newValue,
            checkedRecruitingItems: prevState.checkedRecruitingItems,
        }));
        console.log(this.state);
    }

    handleRecChange(e) {
        const item = e.target.name;
        const isChecked = e.target.checked;
        this.setState(prevState => ({
            checkedItems: prevState.checkedItems,
            queryBoxValue: prevState.queryBoxValue,
            countryString: prevState.countryString,
            checkedRecruitingItems: prevState.checkedRecruitingItems.set(
                item,
                isChecked
            ),
        }));

        console.log(this.state);
    }

    setSearchParams() {
        var symbols: string[] = [];
        var recruiting_stati: RecruitingStatus[] = [];

        this.props.store.mutationHugoGeneSymbols.forEach(
            function(value: string) {
                console.log(value + ' ' + this.state.checkedItems.get(value));
                if (this.state.checkedItems.get(value)) {
                    symbols.push(value);
                }
            }.bind(this)
        );

        this.recruiting_values.forEach(
            function(value: RecruitingStatus) {
                console.log(
                    value.toString() +
                        ' ' +
                        this.state.checkedRecruitingItems.get(value.toString())
                );
                if (this.state.checkedRecruitingItems.get(value.toString())) {
                    recruiting_stati.push(
                        this.getRecruitingKeyFromValueString(value)
                    );
                }
            }.bind(this)
        );

        this.props.store.setClinicalTrialSearchParams(
            this.state.queryBoxValue,
            this.state.countryString,
            recruiting_stati,
            symbols
        );

        console.log('smybols');
        console.log(symbols);
        console.log(recruiting_stati);

        //this.props.store.setSymbolsToSearch(symbols);
    }

    render() {
        return (
            <React.Fragment>
                <div>
                    <label>
                        Additional Query:
                        <input
                            type="text"
                            value={this.state.value}
                            onChange={this.handleTextChange}
                        />
                    </label>
                    <label>
                        Search Country
                        <input
                            type="text"
                            value={this.state.value}
                            onChange={this.handleCountryChange}
                        />
                    </label>
                    {this.props.store.mutationHugoGeneSymbols.map(item => (
                        <div>
                            <label key={item}>
                                <Checkbox
                                    name={item}
                                    checked={this.state.checkedItems.get(item)}
                                    onChange={this.handleChange}
                                />
                                {item}
                            </label>
                        </div>
                    ))}

                    {this.recruiting_values.map(item => (
                        <div>
                            <label key={item}>
                                <Checkbox
                                    name={item.toString()}
                                    checked={this.state.checkedRecruitingItems.get(
                                        item
                                    )}
                                    onChange={this.handleRecChange}
                                />
                                {item}
                            </label>
                        </div>
                    ))}
                </div>
                <div>
                    <button onClick={this.setSearchParams.bind(this)}>
                        Search
                    </button>
                </div>
            </React.Fragment>
        );
    }
}

export default ClinicalTrialMatchTableOptions;
