import Checkbox from './ClinicalTrialMatchTableCheckbox';
import React from 'react';
import { PatientViewPageStore } from '../clinicalInformation/PatientViewPageStore';
import { ClinicalTrialMatchTextfield } from '../clinicalTrialMatch/ClinicalTrialMatchTextfield';
import { RecruitingStatus } from 'shared/enums/ClinicalTrialsGovRecruitingStatus';
import Select from 'react-select';
import CreatableSelect from 'react-select/creatable';

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

        this.genders = ['Male', 'Female', 'All'];

        this.countries = [
            'Afghanistan',
            'Albania',
            'Algeria',
            'American Samoa',
            'Andorra',
            'Angola',
            'Anguilla',
            'Antarctica',
            'Antigua and Barbuda',
            'Argentina',
            'Armenia',
            'Aruba',
            'Australia',
            'Austria',
            'Azerbaijan',
            'Bahamas',
            'Bahrain',
            'Bangladesh',
            'Barbados',
            'Belarus',
            'Belgium',
            'Belize',
            'Benin',
            'Bermuda',
            'Bhutan',
            'Bolivia',
            'Bosnia and Herzegowina',
            'Botswana',
            'Bouvet Island',
            'Brazil',
            'British Indian Ocean Territory',
            'Brunei Darussalam',
            'Bulgaria',
            'Burkina Faso',
            'Burundi',
            'Cambodia',
            'Cameroon',
            'Canada',
            'Cape Verde',
            'Cayman Islands',
            'Central African Republic',
            'Chad',
            'Chile',
            'China',
            'Christmas Island',
            'Cocos (Keeling) Islands',
            'Colombia',
            'Comoros',
            'Congo',
            'Congo, the Democratic Republic of the',
            'Cook Islands',
            'Costa Rica',
            "Cote d'Ivoire",
            'Croatia (Hrvatska)',
            'Cuba',
            'Cyprus',
            'Czech Republic',
            'Denmark',
            'Djibouti',
            'Dominica',
            'Dominican Republic',
            'East Timor',
            'Ecuador',
            'Egypt',
            'El Salvador',
            'Equatorial Guinea',
            'Eritrea',
            'Estonia',
            'Ethiopia',
            'Falkland Islands (Malvinas)',
            'Faroe Islands',
            'Fiji',
            'Finland',
            'France',
            'France Metropolitan',
            'French Guiana',
            'French Polynesia',
            'French Southern Territories',
            'Gabon',
            'Gambia',
            'Georgia',
            'Germany',
            'Ghana',
            'Gibraltar',
            'Greece',
            'Greenland',
            'Grenada',
            'Guadeloupe',
            'Guam',
            'Guatemala',
            'Guinea',
            'Guinea-Bissau',
            'Guyana',
            'Haiti',
            'Heard and Mc Donald Islands',
            'Holy See (Vatican City State)',
            'Honduras',
            'Hong Kong',
            'Hungary',
            'Iceland',
            'India',
            'Indonesia',
            'Iran (Islamic Republic of)',
            'Iraq',
            'Ireland',
            'Israel',
            'Italy',
            'Jamaica',
            'Japan',
            'Jordan',
            'Kazakhstan',
            'Kenya',
            'Kiribati',
            "Korea, Democratic People's Republic of",
            'Korea, Republic of',
            'Kuwait',
            'Kyrgyzstan',
            "Lao, People's Democratic Republic",
            'Latvia',
            'Lebanon',
            'Lesotho',
            'Liberia',
            'Libyan Arab Jamahiriya',
            'Liechtenstein',
            'Lithuania',
            'Luxembourg',
            'Macau',
            'Macedonia, The Former Yugoslav Republic of',
            'Madagascar',
            'Malawi',
            'Malaysia',
            'Maldives',
            'Mali',
            'Malta',
            'Marshall Islands',
            'Martinique',
            'Mauritania',
            'Mauritius',
            'Mayotte',
            'Mexico',
            'Micronesia, Federated States of',
            'Moldova, Republic of',
            'Monaco',
            'Mongolia',
            'Montserrat',
            'Morocco',
            'Mozambique',
            'Myanmar',
            'Namibia',
            'Nauru',
            'Nepal',
            'Netherlands',
            'Netherlands Antilles',
            'New Caledonia',
            'New Zealand',
            'Nicaragua',
            'Niger',
            'Nigeria',
            'Niue',
            'Norfolk Island',
            'Northern Mariana Islands',
            'Norway',
            'Oman',
            'Pakistan',
            'Palau',
            'Panama',
            'Papua New Guinea',
            'Paraguay',
            'Peru',
            'Philippines',
            'Pitcairn',
            'Poland',
            'Portugal',
            'Puerto Rico',
            'Qatar',
            'Reunion',
            'Romania',
            'Russian Federation',
            'Rwanda',
            'Saint Kitts and Nevis',
            'Saint Lucia',
            'Saint Vincent and the Grenadines',
            'Samoa',
            'San Marino',
            'Sao Tome and Principe',
            'Saudi Arabia',
            'Senegal',
            'Seychelles',
            'Sierra Leone',
            'Singapore',
            'Slovakia (Slovak Republic)',
            'Slovenia',
            'Solomon Islands',
            'Somalia',
            'South Africa',
            'South Georgia and the South Sandwich Islands',
            'Spain',
            'Sri Lanka',
            'St. Helena',
            'St. Pierre and Miquelon',
            'Sudan',
            'Suriname',
            'Svalbard and Jan Mayen Islands',
            'Swaziland',
            'Sweden',
            'Switzerland',
            'Syrian Arab Republic',
            'Taiwan, Province of China',
            'Tajikistan',
            'Tanzania, United Republic of',
            'Thailand',
            'Togo',
            'Tokelau',
            'Tonga',
            'Trinidad and Tobago',
            'Tunisia',
            'Turkey',
            'Turkmenistan',
            'Turks and Caicos Islands',
            'Tuvalu',
            'Uganda',
            'Ukraine',
            'United Arab Emirates',
            'United Kingdom',
            'United States',
            'United States Minor Outlying Islands',
            'Uruguay',
            'Uzbekistan',
            'Vanuatu',
            'Venezuela',
            'Vietnam',
            'Virgin Islands (British)',
            'Virgin Islands (U.S.)',
            'Wallis and Futuna Islands',
            'Western Sahara',
            'Yemen',
            'Yugoslavia',
            'Zambia',
            'Zimbabwe',
        ];

        // this.handleChange = this.handleChange.bind(this);
        // this.handleTextChange = this.handleTextChange.bind(this);
        // this.handleCountryChange = this.handleCountryChange.bind(this);
        // this.handleRecChange = this.handleRecChange.bind(this);
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
            this.state.gender
        );

        console.log('smybols');
        console.log(symbols);
        console.log(recruiting_stati);

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
