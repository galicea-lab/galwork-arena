import React, { Component } from "react";
import moment from "moment";
import moment_tz from 'moment-timezone';
import 'moment/locale/pl';
import { Calendar as BigCalendar, 
         momentLocalizer, 
         //CalendarProps
         Event
       } from 'react-big-calendar'
//import 'react-big-calendar/lib/sass/styles.scss'
//import '../styles/calendar.scss'
//import 'react-big-calendar/lib/sass/styles';

import useBgColor, { UseBgColorType } from 'src/@core/hooks/useBgColor'


import { RootState } from 'src/redux'
import { connect } from 'react-redux';
import {store} from 'src/redux'
import {addMicrosoft365Ev, addCollectorEv} from 'src/redux/calendar'
import { Theme, createStyles, withStyles } from "@mui/material/styles";
//import { defaultBoxShadow } from "assets/jss/material-dashboard-react";
import { WithTranslation, withTranslation } from 'react-i18next';
//import { Redirect } from "react-router";
//import { Event as apiEvent, Events, ResService } from 'src/api/booking'
import {getEvents,ApiEvents} from 'src/api/collector'

import { AuthValuesType } from "src/context/types";
import {getUserWeekCalendar} from 'src/api/ms'
import { useAuth } from "src/hooks/useAuth";
import { CalendarType, EventType } from "src/types/apps/calendarTypes";
//import moment from 'moment-timezone';

const calStyle = (theme : Theme) => createStyles({
  warning: {
  //  ...defaultBoxShadow,
    color: theme.palette.secondary.main,
    fontWeight: "bold",
    padding:"10px"
  },
});


const localizer = momentLocalizer(moment)
//BigCalendar.setLocalizer( BigCalendar.momentLocalizer(moment) );      


interface CalProps {
  classes? : any;
  redux? : any;
  auth?: AuthValuesType;
  eColors:UseBgColorType;
 // t : any
}

interface CalState {
  //events : Event[]
  title: string,
  start: string,
  end: string,
  desc: string,
  openEvent: boolean,
  clickedEvent: any,
  addEvent : boolean,
}


class CalendarPage extends Component<CalendarType & CalProps  & WithTranslation, CalState> {
  constructor(props : any) {
    super(props,{});
    this.state = {
      //events: [],
      title: "",
      start: "",
      end: "",
      desc: "",
      openEvent: false,
      clickedEvent: {},
      addEvent : false,
    };
  }

  handleEventSelected(event : any) {
    console.log("event", event);
    this.setState({
      openEvent: true,
      clickedEvent: event,
      start: event.start,
      end: event.end,
      title: event.title,
      desc: event.desc
    });
  }

  eventStyleGetter = (event : EventType, start :Date | string, end:Date | string, isSelected: boolean)=>{
   
    let eColor = this.props.eColors.infoFilled;
    console.log(event);
    if (event.extendedProps)
      if (event.extendedProps.calendar=='Microsoft365')
        eColor=this.props.eColors.primaryFilled
      else if (event.extendedProps.calendar=='Office') 
        eColor=this.props.eColors.warningFilled
      else if (event.extendedProps.calendar=='AcademicYear')
        eColor=this.props.eColors.successFilled
    //alert(event.extendedProps.calendar+' '+eColor.backgroundColor)
    let style = {
        backgroundColor: eColor.backgroundColor,
        borderRadius: '0px',
        opacity: 0.8,
        color: eColor.color,
        border: '0px',
        display: 'block'
    };
    return {
        style: style
    };
  }
  

  //  Allows user to click on calendar slot and handles if appointment exists
  handleSlotSelected(slotInfo : any 
    /*
    {
        start: stringOrDate;
        end: stringOrDate;
        slots: Date[] | string[];
        action: 'select' | 'click' | 'doubleClick';
    }
    */
    ) {
    console.log("slotInfo", slotInfo);
    this.setState({
      title: "",
      desc: "",
      start: slotInfo.start,
      end: slotInfo.end,
      addEvent: true
    });
  }

  navigate( date : Date ) {
    let day = date.getDay()
    if (this.props.redux.lang==='pl')
       day=day-1
    let mon = new Date(date.getTime());
    let sun = new Date(date.getTime());
    mon.setDate(date.getDate() -day );
    sun.setDate(date.getDate() + 6 - day);
    this.apiGetEvents(this.props.redux.login || '', 
       mon.toISOString().substring(0,10),
       sun.toISOString().substring(0,10))

  }

  async apiGetEvents(user : string, dt_start : string, dt_end : string) {
    if (this.props.auth) {  
      let ianaTimeZone = 'Europe/Warsaw' //findOneIana(timeZone);
      let startOfWeek = moment_tz.tz(ianaTimeZone!.valueOf()).startOf('week').utc();
      const atoken : string = this.props.auth.access365Token || '' // token
      if ( atoken ) {  
        //alert('Token='+atoken)    
        //alert(startOfWeek)
       let result : EventType[] = await getUserWeekCalendar( 
         atoken, 
         ianaTimeZone,
         startOfWeek,
         {})
        
        if (result) {
             //JSON.stringify('wynik MS365'+result)
             store.dispatch(addMicrosoft365Ev(result));
           }
        else alert('ERROR')
      }
      if (this.props.auth.user && this.props.auth.user.accessToken)
        getEvents(this.props.auth.user.accessToken, user, dt_start, dt_end).then(
          (ret: ApiEvents) => {
            store.dispatch(addCollectorEv(ret.events));
            }
        ).catch(
          (err: any) => {
            console.log(this.props.t('API Error: ')+JSON.stringify(err));
          }
        );
    }
  }
   

  componentDidMount = () => {
    if (this.props.auth) 
      this.apiGetEvents(this.props.auth.user?.email || '', 
       moment().startOf('week').format('YYYY-MM-DD'), 
       moment().endOf('week').format('YYYY-MM-DD'))
  }


  render() {
    const { redux, t } = this.props
    /*
    if (! redux.session) 
      return <Redirect
         to={{
          pathname: '/login',
          state: { from: '/' }
        }}
      />     
      */
    //! moment.locale(redux.lang); 
    
    return(
      <BigCalendar
      events={  /*this.state.events */ this.props.redux.events}
      //! culture={redux.lang}
      defaultDate={new Date()}
      defaultView="week"
      timeslots={2}
      selectable={true}
      step={60}
      showMultiDayTimes
      views={["month", "week", "day", "agenda"]}
      localizer={ localizer }
      messages={{
        next: t("Next"),
        previous:t("Previous"),
        today:t("Today"),
        month: t("Month"),
        week: t("Week"),
        day: t("Day"),
        agenda: t("Agenda")
      }}
      onSelectEvent={ ( event : any) => this.handleEventSelected(event)}
      onSelectSlot={ (slotInfo : any) => this.handleSlotSelected(slotInfo)}
      onNavigate={
        date => {
        this.navigate( date );
      }}
      eventPropGetter={(this.eventStyleGetter)}
    />        
      )
  }
}

const mapStateToProps = (state : RootState) => ({
  redux : state.calendar
});

const XComponent = connect(mapStateToProps)
              ((withTranslation()(CalendarPage)));


 export default (props: any) => {
   const auth=useAuth()
   const eColors=useBgColor()
  return (
    <XComponent auth={auth} eColors={eColors} {...props} />
  )
}