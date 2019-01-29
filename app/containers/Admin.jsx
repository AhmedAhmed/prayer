import React, { Component } from 'react';
import PropTypes from 'prop-types';

import fetchWP from '../utils/fetchWP';
import prayTimes from '../utils/prayTimes';
import {formatTime} from '../utils';
import config from '../utils/config';

export default class Admin extends Component {
  constructor(props) {
    super(props);

    this.state = {
      fajr : "",
      dhuhr : "",
      jumuah: "",
      asr : "",
      maghrib: "",
      isha : ""
    };

    this.fetchWP = new fetchWP({
      restURL: this.props.wpObject.api_url,
      restNonce: this.props.wpObject.api_nonce,
    });
  }

  getSetting = () => {
    this.fetchWP.get( 'prayers' )
    .then(
      (json) => this.setState({
        fajr: json.prayers.fajr,
        dhuhr: json.prayers.dhuhr,
        jumuah: json.prayers.jumuah,
        asr: json.prayers.asr,
        isha: json.prayers.isha
      }),
      (err) => console.log( 'error', err )
    );
  };

  updateSetting = () => {
    this.fetchWP.post( 'prayers', { 
      fajr: this.state.fajr, 
      dhuhr: this.state.dhuhr,
      jumuah: this.state.jumuah,
      asr: this.state.asr,
      maghrib: this.state.maghrib,
      isha: this.state.isha
    } )
    .then(
      (json) => this.processOkResponse(json, 'saved'),
      (err) => console.log('error', err)
    );
  }

  deleteSetting = () => {
    this.fetchWP.delete( 'prayers' )
    .then(
      (json) => this.processOkResponse(json, 'deleted'),
      (err) => console.log('error', err)
    );
  }

  processOkResponse = (json, action) => {
    if (json.success) {
      this.setState({
        fajr: json.value
      });
    } else {
      console.log(`Setting was not ${action}.`, json);
    }
  }

  updateInput = (event) => {
    this.setState({
      exampleSetting: event.target.value
    });
  }

  handleSave = (event) => {
    event.preventDefault();
    if ( this.state.fajr === this.state.fajrPrevious ) {
      console.log('Setting unchanged');
    } else {
      this.updateSetting();
    }
  }

  handleDelete = (event) => {
    event.preventDefault();
    this.deleteSetting();
  }

  componentDidMount(){
    const times = prayTimes.getTimes(new Date(), [config.location.lat, config.location.long ], -5  );
    this.setState({maghrib: times.maghrib});
    this.getSetting();
  }

  render() {
    return (
      <div className="wrap">
        <form className="kbw-form">
          <h1>Khalid Masjid Prayer Times</h1>

          <div className="form-items">
            <label htmlFor="fajr">Fajr:</label>
            <input 
              type="time"
              placeholder="Fajr" 
              onChange={(evt) => this.setState({fajr:evt.target.value})}
              value={this.state.fajr} />
          </div>
          <div className="form-items">
            <label htmlFor="dhuhr">Dhuhr:</label>
            <input type="time"
              id="dhuhr"
              placeholder="Dhuhr"
              onChange={(evt) => this.setState({dhuhr:evt.target.value})}
              value={this.state.dhuhr} />
          </div>
          <div className="form-items">
            <label htmlFor="jumuah">Jumuah:</label>
            <input type="time"
              id="jumuah"
              placeholder="Jumuah"
              onChange={(evt) => this.setState({ jumuah: evt.target.value })}
              value={this.state.jumuah} />
          </div>
          <div className="form-items">
            <label htmlFor="asr">Asr:</label>
            <input type="time"
              placeholder="Asr"
              id="asr"
              onChange={(evt) => this.setState({ asr: evt.target.value })}
              value={this.state.asr} />
          </div>
          <div className="form-items">
            <label htmlFor="maghrib">Maghrib:</label>
            <input type="time"
              id="maghrib"
              readOnly={true}
              value={this.state.maghrib} />
          </div>
          <div className="form-items">
            <label htmlFor="isha">Isha:</label>
            <input type="time" 
              placeholder="Isha"
              id="isha"
              onChange={(evt) => this.setState({ isha: evt.target.value })}
              value={this.state.isha} />
          </div>
          <div className="form-items">
            <button onClick={this.handleSave.bind(this)} className="button button-primary">Save Changes</button>
          </div>

          <div className="kbw-shortcodes">
            <h2>SHORTCODES AVAILABLE</h2>
            <h4>DEFAULT VIEW: <code>[wp_prayers theme="dark"]</code></h4>
            <h4>MONTHLY VIEW: <code>[wp_prayers city="Toronto, Ontario" format="month"]</code></h4>
            <h4>DAILY VIEW: <code>[wp_prayers city="Toronto, Ontario" format="day"]</code></h4>
          </div>

          <h1>[HACKED BY AHMED ABDIHAKIM AHMED] VERSION 1.0.</h1>

        </form>
      </div>
    );
  }
}

Admin.propTypes = {
  wpObject: PropTypes.object
};