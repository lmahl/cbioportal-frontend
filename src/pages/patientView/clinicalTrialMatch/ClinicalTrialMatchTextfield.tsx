import React from 'react';

export class ClinicalTrialMatchTextfield extends React.Component {
    constructor(props) {
        super(props);
        this.state = { value: 'foobar' };
        this.handleChange = this.handleChange.bind(this);
    }

    handleChange(event) {
        this.setState({ value: event.target.value });
    }

    render() {
        return (
            <label>
                Additional Query:
                <input
                    type="text"
                    value={this.state.value}
                    onChange={this.handleChange}
                />
            </label>
        );
    }
}
