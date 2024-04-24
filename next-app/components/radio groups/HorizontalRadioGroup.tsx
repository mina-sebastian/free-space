import * as React from 'react';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';

export default function ControlledRadioButtonsGroup({options, value, handleRadioChange}) {

  return (
    <FormControl>
      <RadioGroup
        row
        aria-labelledby="demo-controlled-radio-buttons-group"
        name="controlled-radio-buttons-group"
        value={value}
        onChange={(event => handleRadioChange(event))}
      >

        {options.map( (option, index) => {
           return <FormControlLabel value={option} control={<Radio />} label={option} />
        } )}
      </RadioGroup>
    </FormControl>
  );
}