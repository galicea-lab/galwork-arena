import React, { ReactElement } from 'react';

interface IProps {
  date: Date;
  start?: number;
  onChange(date: Date): void;
}

const Calendar = ({ date, onChange }: IProps): ReactElement => (
  <div className="inline-block">
    <input
      type="date"
      value={date instanceof Date && !isNaN(date.getTime()) ? date.toISOString().split('T')[0] : ''}
      onChange={(e) => {
        if (e.target.value) {
          onChange(new Date(e.target.value));
        }
      }}
      className="text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-800"
    />
  </div>
);

export default Calendar;
