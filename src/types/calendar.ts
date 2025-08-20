export type RecurrenceType = 'none' | 'weekly' | 'biweekly' | 'monthly';

export interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  icon: string; // Emoji
  description: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  // Recurring event fields
  isRecurring: boolean;
  recurrenceType?: RecurrenceType;
  recurrenceId?: string; // Groups recurring events together
  originalDate?: Date; // Original date for the series
}

export interface CreateCalendarEventData {
  title: string;
  date: Date;
  icon: string;
  description: string;
  isRecurring?: boolean;
  recurrenceType?: RecurrenceType;
}

export interface UpdateCalendarEventData {
  title?: string;
  date?: Date;
  icon?: string;
  description?: string;
}
