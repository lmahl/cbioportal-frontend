import PropTypes from 'prop-types';
import React from 'react';

const Checkbox = ({ type = 'checkbox', name, checked = true, onChange }) => (
    <input type={type} name={name} checked={checked} onChange={onChange} />
);

Checkbox.propTypes = {
    type: PropTypes.string,
    name: PropTypes.string.isRequired,
    checked: PropTypes.bool,
    onChange: PropTypes.func.isRequired,
};

export default Checkbox;
