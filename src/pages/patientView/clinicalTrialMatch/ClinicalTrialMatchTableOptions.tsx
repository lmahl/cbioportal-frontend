import Checkbox from './ClinicalTrialMatchTableCheckbox';
import React from 'react';
import { PatientViewPageStore } from '../clinicalInformation/PatientViewPageStore';
import { ClinicalTrialMatchTextfield } from '../clinicalTrialMatch/ClinicalTrialMatchTextfield';
import { RecruitingStatus } from 'shared/enums/ClinicalTrialsGovRecruitingStatus';
import Select from 'react-select';
import CreatableSelect from 'react-select/creatable';
import {
    recruitingValueNames,
    countriesNames,
    genderNames,
} from './utils/SelectValues';

interface IClinicalTrialOptionsMatchProps {
    store: PatientViewPageStore;
}

interface IClinicalTrialOptionsMatchState {
    mutationSymbolItems: Array<string>;
    mutationNecSymbolItems: Array<string>;
    countryItems: Array<string>;
    recruitingItems: Array<string>;
    gender: string;
    value?: string;
}

class ClinicalTrialMatchTableOptions extends React.Component<
    IClinicalTrialOptionsMatchProps,
    IClinicalTrialOptionsMatchState
> {
    recruiting_values: RecruitingStatus[] = [];
    countries: Array<String>;
    genders: Array<String>;

    constructor(props: IClinicalTrialOptionsMatchProps) {
        super(props);

        this.state = {
            mutationSymbolItems: new Array<string>(),
            mutationNecSymbolItems: new Array<string>(),
            countryItems: new Array<string>(),
            recruitingItems: new Array<string>(),
            gender: 'All',
        };

        this.recruiting_values = recruitingValueNames;

        this.genders = genderNames;
        this.countries = countriesNames;
    }

    getRecruitingKeyFromValueString(value: string): RecruitingStatus {
        for (let status of this.recruiting_values) {
            if (status.toString() == value) {
                return status;
            }
        }

        return RecruitingStatus.Invalid;
    }

    setSearchParams() {
        var symbols: string[] = this.state.mutationSymbolItems;
        var necSymbols: string[] = this.state.mutationNecSymbolItems;
        var recruiting_stati: RecruitingStatus[] = this.state.recruitingItems.map(
            item => this.getRecruitingKeyFromValueString(item)
        );
        var countries_to_search: string[] = this.state.countryItems;

        console.group('TRIALS start search');
        console.log(this.state);
        console.groupEnd();

        this.props.store.setClinicalTrialSearchParams(
            countries_to_search,
            recruiting_stati,
            symbols,
            necSymbols,
            this.state.gender
        );

        console.log('smybols');
        console.log(symbols);
        console.log(recruiting_stati);
        console.log('necSymbols');
        console.log(necSymbols);

        //this.props.store.setSymbolsToSearch(symbols);
    }

    render() {
        return (
            <React.Fragment>
                <div
                    style={{
                        display: 'block',
                        maxWidth: '40%',
                    }}
                >
                    <div
                        style={{
                            display: 'block',
                            marginLeft: '5px',
                            marginBottom: '5px',
                        }}
                    >
                        <CreatableSelect
                            options={this.props.store.mutationHugoGeneSymbols.map(
                                geneSymbol => ({
                                    label: geneSymbol,
                                    value: geneSymbol,
                                })
                            )}
                            isMulti
                            name="mutationSearch"
                            className="basic-multi-select"
                            classNamePrefix="select"
                            placeholder="Select OPTIONAL mutations and additional search keywords..."
                            onChange={(selectedOption: Array<any>) => {
                                const newMutations = [];
                                if (selectedOption !== null) {
                                    const mutations = selectedOption.map(
                                        item => item.value
                                    );
                                    newMutations.push(...mutations);
                                }
                                this.setState({
                                    mutationSymbolItems: newMutations,
                                });

                                console.group('TRIALS Mutation Changed');
                                console.log(this.state.mutationSymbolItems);
                                console.groupEnd();
                            }}
                        />
                    </div>
                    <div
                        style={{
                            display: 'block',
                            marginLeft: '5px',
                            marginBottom: '5px',
                        }}
                    >
                        <CreatableSelect
                            options={this.props.store.mutationHugoGeneSymbols.map(
                                geneSymbol => ({
                                    label: geneSymbol,
                                    value: geneSymbol,
                                })
                            )}
                            isMulti
                            name="mutationSearch"
                            className="basic-multi-select"
                            classNamePrefix="select"
                            placeholder="Select NECESSARY mutations and additional search keywords..."
                            onChange={(selectedOption: Array<any>) => {
                                const newMutations = [];
                                if (selectedOption !== null) {
                                    const mutations = selectedOption.map(
                                        item => item.value
                                    );
                                    newMutations.push(...mutations);
                                }
                                this.setState({
                                    mutationNecSymbolItems: newMutations,
                                });
                            }}
                        />
                    </div>
                    <div
                        style={{
                            display: 'block',
                            marginLeft: '5px',
                            marginBottom: '5px',
                        }}
                    >
                        <Select
                            options={this.recruiting_values.map(recStatus => ({
                                label: recStatus,
                                value: recStatus,
                            }))}
                            isMulti
                            name="recruitingStatusSearch"
                            className="basic-multi-select"
                            classNamePrefix="select"
                            placeholder="Select status..."
                            onChange={(selectedOption: Array<any>) => {
                                const newStatuses = [];
                                if (selectedOption !== null) {
                                    const statuses = selectedOption.map(
                                        item => item.value
                                    );
                                    newStatuses.push(...statuses);
                                }
                                this.setState({
                                    recruitingItems: newStatuses,
                                });
                            }}
                        />
                    </div>
                    <div
                        style={{
                            display: 'block',
                            marginLeft: '5px',
                            marginBottom: '5px',
                        }}
                    >
                        <Select
                            options={this.countries.map(cnt => ({
                                label: cnt,
                                value: cnt,
                            }))}
                            isMulti
                            name="CountrySearch"
                            className="basic-multi-select"
                            classNamePrefix="select"
                            placeholder="Select countries..."
                            onChange={(selectedOption: Array<any>) => {
                                const newStatuses = [];
                                if (selectedOption !== null) {
                                    const statuses = selectedOption.map(
                                        item => item.value
                                    );
                                    newStatuses.push(...statuses);
                                }
                                this.setState({
                                    countryItems: newStatuses,
                                });
                            }}
                        />
                    </div>
                    <div
                        style={{
                            display: 'block',
                            marginLeft: '5px',
                            marginBottom: '5px',
                        }}
                    >
                        <Select
                            options={this.genders.map(gender => ({
                                label: gender,
                                value: gender,
                            }))}
                            name="recruitingStatusSearch"
                            defaultValue={{ label: 'All', value: 'All' }}
                            className="basic-select"
                            classNamePrefix="select"
                            placeholder="Select gender..."
                            onChange={(selectedOption: string) => {
                                var newStatuses = '';
                                if (selectedOption !== null) {
                                    newStatuses = selectedOption;
                                }
                                this.setState({
                                    gender: newStatuses,
                                });
                            }}
                        />
                    </div>
                </div>
                <div>
                    <button
                        onClick={this.setSearchParams.bind(this)}
                        className={'btn btn-default'}
                        style={{
                            display: 'block',
                            marginLeft: '5px',
                        }}
                    >
                        Search
                    </button>
                </div>
            </React.Fragment>
        );
    }
}

export default ClinicalTrialMatchTableOptions;
