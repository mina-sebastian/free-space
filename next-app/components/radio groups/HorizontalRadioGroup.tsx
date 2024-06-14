import * as React from 'react';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';

// Functional component representing the horizontal radio group
export default function ControlledRadioButtonsGroup({options, value, handleRadioChange}) {

  return (
    <FormControl>
      <RadioGroup
        row
        aria-labelledby="demo-controlled-radio-buttons-group" // Set the aria label for the radio group
        name="controlled-radio-buttons-group" 
        value={value}
        onChange={(event => handleRadioChange(event))} // Handle radio change
      >
        {/* Map through the options and create a radio button for each option */}
        {options.map( (option, index) => {
           return <FormControlLabel value={option} control={<Radio />} label={option} /> // Create a radio button for the option
        } )}
      </RadioGroup>
    </FormControl>
  );
}