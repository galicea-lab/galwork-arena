// ** Redux Imports
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

// ** Axios Imports
import axios from 'axios'

// ** Types
import { CalendarFiltersType, AddEventType, EventType } from '@/types/calendarTypes'
 
/*

// ** Fetch Events
export const fetchEvents = createAsyncThunk('appCalendar/fetchEvents', 
       async (calendars: CalendarFiltersType[]) => {
  const response = await axios.get('/apps/calendar/events', {
    params: {
      calendars
    }
  })
  return response.data
})

 
// ** Add Event
export const addEvent = createAsyncThunk('appCalendar/addEvent', async (event: AddEventType, { dispatch }) => {
  const response = await axios.post('/apps/calendar/add-event', {
    data: {
      event
    }
  })
  await dispatch(fetchEvents(['Personal', 'Microsoft365', 'Office', 'AcademicYear', 'Events']))

  return response.data.event
})

// ** Update Event
export const updateEvent = createAsyncThunk('appCalendar/updateEvent', async (event: EventType, { dispatch }) => {
  const response = await axios.post('/apps/calendar/update-event', {
    data: {
      event
    }
  })
  await dispatch(fetchEvents(['Personal', 'Microsoft365', 'Office', 'AcademicYear', 'Events']))

  return response.data.event
})

// ** Delete Event
export const deleteEvent = createAsyncThunk('appCalendar/deleteEvent', async (id: number | string, { dispatch }) => {
  const response = await axios.delete('/apps/calendar/remove-event', {
    params: { id }
  })
  await dispatch(fetchEvents(['Personal', 'Microsoft365', 'Office', 'AcademicYear', 'Events']))

  return response.data
})
*/

export const appCalendarSlice = createSlice({
  name: 'appCalendar',
  initialState: {
    events: [] as EventType[],
    selectedEvent: null,
    selectedCalendars: ['Microsoft365', 'Office', 'AcademicYear', 'Events']
  },
  reducers: {
    addMicrosoft365Ev: (state, action) => {
        let a=state.events.filter((event:EventType) => event.extendedProps.calendar!='Microsoft365' )
        for (let e of action.payload) {
          //alert(JSON.stringify(e)) //
          a.push( {
            id: e.id,
            url: e.url,
            title: e.title,
            allDay: e.allDay,
            start: new Date(e.start),
            end: new Date(e.end),
            extendedProps: {
              calendar: 'Microsoft365'
            }
          }) 
        }
        state.events=a
    },
    addCollectorEv: (state, action) => {
      let a=state.events.filter(event => event.extendedProps.calendar=='Microsoft365' )
      for (let e of action.payload) {
        //alert(JSON.stringify(e)) //
        a.push( {
          id: e.id,
          url: e.url,
          title: e.title,
          allDay: e.allDay,
          start: new Date(e.start),
          end: new Date(e.end),
          extendedProps: {
            calendar: (e.extendedProps && e.extendedProps.calendar)?e.extendedProps.calendar:'Office'
          }
        }) 
      }
      state.events=a
  },
  handleSelectEvent: (state, action) => {
      state.selectedEvent = action.payload
    },
    handleCalendarsUpdate: (state, action) => {
      const filterIndex = state.selectedCalendars.findIndex(i => i === action.payload)
      if (state.selectedCalendars.includes(action.payload)) {
        state.selectedCalendars.splice(filterIndex, 1)
      } else {
        state.selectedCalendars.push(action.payload)
      }
      if (state.selectedCalendars.length === 0) {
        state.events.length = 0
      }
    },
    handleAllCalendars: (state, action) => {
      const value = action.payload
      if (value === true) {
//        alert('ALL')
        state.selectedCalendars = ['Microsoft365', 'Office', 'AcademicYear', 'Events']
      } else {
//        alert('NONE')
        state.selectedCalendars = []
      }
    }
  },
  extraReducers: builder => {
/*    builder.addCase(fetchEvents.fulfilled, (state, action) => {
      state.events = action.payload
    })
    */
  }
})
export const { handleSelectEvent, handleCalendarsUpdate, handleAllCalendars, 
               addMicrosoft365Ev, addCollectorEv } = appCalendarSlice.actions

export default appCalendarSlice.reducer
