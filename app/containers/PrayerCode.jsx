import React, {Component} from 'react'
import PropTypes from 'prop-types'

import fetchWP from '../utils/fetchWP'
import prayTimes from '../utils/prayTimes'
import { formatTime } from '../utils'
import config from '../utils/config';

export default class PrayerCode extends Component {
  constructor(props){
    super(props);

    this.state = {
      lat:"",
      long:"",
      date: new Date(),
      month: new Date().getMonth(),
      year: new Date().getFullYear(),
      days: [],
      timezone: "",
      prayers: [],
      prayerState: false,
      remoteLat:0,
      remoteLong:0,
      monthTimezone: "",
      monthPrayers: []
    }

    this.fetchWP = new fetchWP({
      restURL: this.props.wpObject.api_url,
      restNonce: this.props.wpObject.api_nonce,
    });
  }

  fetchLocation(){
    const url = "https://maps.googleapis.com/maps/api/geocode/json?address=" + this.props.wpObject.city+"&key=AIzaSyCB-OuDTWWe-AaV0aRpNnxb7ZIFoLtB4FQ";
    fetch(url, {
      headers: {
        'Accept': 'application/json',
        'Origin': ''
      },
      method: "GET"
    }).then((response) => response.json())
      .then((json) => this.setState({ remoteLat: json.results[0].geometry.location.lat, remoteLong: json.results[0].geometry.location.lng}) );
  }

  fetchTimezone = () => {
    fetch("https://maps.googleapis.com/maps/api/timezone/json?location=" + this.state.remoteLat + "," + this.state.remoteLong + "&timestamp=1331161200&key=AIzaSyAkH8Vd7jjVgW_iQrCrnaRyIDJUjWIJ2OI", {
      headers: {
        'Accept': 'application/json',
        'Origin': ''
      },
      method: "GET"
    }).then((response) => response.json())
      .then((json) => { 
        this.setState({ monthTimezone: (json.rawOffset / 60 / 60) }); 
      });
  }

  componentDidMount(){
    //get location.
    this.fetchLocation();

    this.fetchWP.get('prayers')
      .then(
        (json) => { 
          this.setState({
            prayers: json.prayers,
            prayerState: true
          });
        },
        (err) => console.log('error', err)
    );
    this.setState({days:this._getDays()});
    this.setState({timezone:(this.state.date.getTimezoneOffset()/60)*-1});
  }

  componentDidUpdate(){
    if( this.state.days.length > 27 && this.state.monthPrayers.length == 0 && this.state.remoteLat != 0 && this.state.remoteLong != 0 ){
      if( this.state.monthTimezone == "" ){
        this.fetchTimezone();
      }
      if( this.state.monthTimezone != "" ){
        this._getPrayers();
      }
    }
  }

  _getDays = () => {
    var date = new Date(this.state.year, this.state.month, 1);
    var days = [];
    while (date.getMonth() === this.state.month) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    return days;
  }

  _getPrayers = () => {
    var times = [];
    console.log( this.state.monthTimezone );
    prayTimes.setMethod('ISNA');
    prayTimes.tune( { fajr: 2, dhuhr: 1, asr: 1, maghrib: 1, isha: 2 } );
    for(var i = 0; i < this.state.days.length; i++){
      times.push(prayTimes.getTimes(new Date(this.state.days[i]), [this.state.remoteLat, this.state.remoteLong], this.state.monthTimezone, 'auto', '12h') );
    }
    this.setState({monthPrayers: times});
  }

  _renderTimes = () => {
    return this.state.monthPrayers.map((prayer, index) => {
      var klass = "";
      if (new Date(this.state.days[index]).getDate() == new Date().getDate() ){
        klass = " current";
      }
      return (
        <tr key={index} className={"prayer-items"+klass}>
          <td className="prayer-items-date">{new Date(this.state.days[index]).getDate()}</td>
          <td>{prayer.fajr}</td>
          <td>{prayer.sunrise}</td>
          <td>{prayer.dhuhr}</td>
          <td>{prayer.asr}</td>
          <td>{prayer.maghrib}</td>
          <td>{prayer.isha}</td>
        </tr>
      );
    });
  }

  _month = (index) => {
    const months = ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    return months[index];
  }

  renderMonth(){
    var date = new Date();
    var headerMsg = "Part B: " + this._month( date.getMonth() ) + " " + date.getFullYear() + " " + "Monthly Prayer Table";
    var subMsg = "For " + this.props.wpObject.city;


    return (
      <div className="prayer-container">
        <div className="prayer-data">
          <h1><strong>{headerMsg}</strong></h1>
          <h2><strong>{subMsg}</strong></h2>
        </div>
        <table className="prayer-table">
          <tbody>
            <tr className="prayer-header-row">
              <td className="prayer-header-row-day">Day</td>
              <td>Fajr</td>
              <td>Sunrise</td>
              <td>Duhr</td>
              <td>Asr</td>
              <td>Maqrib</td>
              <td>Isha</td>
            </tr>
            {this._renderTimes()}
          </tbody>
        </table>
      </div>
    );
  }

  getTodayDate = () => {
    const today = new Date();
    let dd = today.getDate();
    let mm = this._month( today.getMonth() ); //January is 0!
    let yyyy = today.getFullYear();

    if (dd < 10) {
      dd = '0' + dd
    }

    if (mm < 10) {
      mm = '0' + mm
    }

    return mm + " " + dd + ', ' + yyyy;
  }

  renderDay = () => {
    const time = prayTimes.getTimes(new Date(), [this.state.remoteLat, this.state.remoteLong], this.state.monthTimezone, 'auto', '12h');
    var date = new Date();
    var headerMsg = "Part A: Today's Prayer Times";
    var subMsg = "For " + this.props.wpObject.city;
    return (
      <div className="prayer-today">
        <div className="prayer-data">
          <h1><strong>{headerMsg}</strong></h1>
          <h2><strong>{subMsg}</strong></h2>
        </div>
        <div className="prayers-date">{this.getTodayDate()}</div>
        <div className="prayers-list">
          <div className="prayers-list-item">
            <div className="prayer-name">Fajr</div>
            <div className="prayer-time">{time.fajr}</div>
          </div>
          <div className="prayers-list-item">
            <div className="prayer-name">Sunrise</div>
            <div className="prayer-time">{time.sunrise}</div>
          </div>
          <div className="prayers-list-item">
            <div className="prayer-name">Duhr</div>
            <div className="prayer-time">{time.dhuhr}</div>
          </div>
          <div className="prayers-list-item">
            <div className="prayer-name">Asr</div>
            <div className="prayer-time">{time.asr}</div>
          </div>
          <div className="prayers-list-item">
            <div className="prayer-name">Maqrib</div>
            <div className="prayer-time">{time.maghrib}</div>
          </div>
          <div className="prayers-list-item">
            <div className="prayer-name">Isha</div>
            <div className="prayer-time">{time.isha}</div>
          </div>
        </div>
      </div>
    );
  }

  renderStrip = () => {
    const times = prayTimes.getTimes(new Date(), [config.location.lat, config.location.long], -5);
    return this.state.prayerState == true? (
      <div className={this.props.wpObject.theme == "dark" ? "mosque_prayers white" :"mosque_prayers"}>
        <div className="prayer_item_header">Masjid Prayer Times:</div>
        <div className="prayer_item">Fajr {formatTime(this.state.prayers.fajr)} |</div>
        <div className="prayer_item">Duhur {formatTime(this.state.prayers.dhuhr)} |</div>
        <div className="prayer_item">Jumuah {formatTime(this.state.prayers.jumuah)} |</div>
        <div className="prayer_item">Asr {formatTime(this.state.prayers.asr)} |</div>
        <div className="prayer_item">Maqrib {formatTime(times.maghrib)} |</div>
        <div className="prayer_item">Isha {formatTime(this.state.prayers.isha)}</div>
      </div>
    ):(
        <div className={this.props.wpObject.theme == "dark" ? "mosque_prayers white" : "mosque_prayers"}>
          <div className="prayer_item_header">Loading...</div>
        </div>
    );
  }

  renderType = () => {
    switch( this.props.wpObject.format ){
      case "month":
        return this.renderMonth();
        break;
      case "strip":
        return this.renderStrip();
        break;
      case "day":
        return this.renderDay();
        break;
      default:
        return this.renderStrip();
    }
  }

  render(){
    return (
      <div className="prayer_container">
        {this.renderType()}
      </div>
    );
  }
}

PrayerCode.propTypes = {
  wpObject: PropTypes.object
};
