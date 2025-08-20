import { 
  collection, 
  doc, 
  addDoc,
  updateDoc, 
  deleteDoc,
  getDocs, 
  getDoc,
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  onSnapshot,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';
import { CalendarEvent, CreateCalendarEventData, UpdateCalendarEventData, RecurrenceType } from '../types/calendar';

const COLLECTION_NAME = 'calendarEvents';

// Helper function to generate recurring dates
const generateRecurringDates = (startDate: Date, recurrenceType: RecurrenceType, count: number = 52): Date[] => {
  const dates: Date[] = [];
  const currentDate = new Date(startDate);
  
  for (let i = 0; i < count; i++) {
    dates.push(new Date(currentDate));
    
    switch (recurrenceType) {
      case 'weekly':
        currentDate.setDate(currentDate.getDate() + 7);
        break;
      case 'biweekly':
        currentDate.setDate(currentDate.getDate() + 14);
        break;
      case 'monthly':
        currentDate.setMonth(currentDate.getMonth() + 1);
        break;
      case 'yearly':
        currentDate.setFullYear(currentDate.getFullYear() + 1);
        break;
      default:
        break;
    }
  }
  
  return dates;
};

// Create a new calendar event
export const createCalendarEvent = async (
  eventData: CreateCalendarEventData, 
  createdBy: string
): Promise<string> => {
  try {
    const isRecurring = eventData.isRecurring && eventData.recurrenceType && eventData.recurrenceType !== 'none';
    
    if (isRecurring) {
      // Create recurring events
      const recurrenceId = doc(collection(db, COLLECTION_NAME)).id; // Generate unique ID for the series
      const dates = generateRecurringDates(eventData.date, eventData.recurrenceType!);
      const batch = writeBatch(db);
      
      dates.forEach(date => {
        const eventRef = doc(collection(db, COLLECTION_NAME));
        batch.set(eventRef, {
          title: eventData.title,
          icon: eventData.icon,
          description: eventData.description,
          date: Timestamp.fromDate(date),
          isRecurring: true,
          recurrenceType: eventData.recurrenceType,
          recurrenceId: recurrenceId,
          originalDate: Timestamp.fromDate(eventData.date),
          createdBy,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      });
      
      await batch.commit();
      console.log('Recurring calendar events created with series ID:', recurrenceId);
      return recurrenceId;
    } else {
      // Create single event
      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        title: eventData.title,
        icon: eventData.icon,
        description: eventData.description,
        date: Timestamp.fromDate(eventData.date),
        isRecurring: false,
        createdBy,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      console.log('Calendar event created with ID:', docRef.id);
      return docRef.id;
    }
  } catch (error) {
    console.error('Error creating calendar event:', error);
    throw error;
  }
};

// Update an existing calendar event
export const updateCalendarEvent = async (
  eventId: string, 
  eventData: UpdateCalendarEventData
): Promise<void> => {
  try {
    const updateData: any = {
      ...eventData,
      updatedAt: serverTimestamp()
    };

    // Convert date to Timestamp if provided (single events only)
    if (eventData.date) {
      updateData.date = Timestamp.fromDate(eventData.date);
    }

    await updateDoc(doc(db, COLLECTION_NAME, eventId), updateData);
    console.log('Calendar event updated:', eventId);
  } catch (error) {
    console.error('Error updating calendar event:', error);
    throw error;
  }
};

// Update all events in a recurring series (title, description, icon only)
export const updateRecurringEventSeries = async (
  recurrenceId: string,
  eventData: Omit<UpdateCalendarEventData, 'date'>
): Promise<void> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('recurrenceId', '==', recurrenceId)
    );
    
    const querySnapshot = await getDocs(q);
    const batch = writeBatch(db);
    
    querySnapshot.docs.forEach(docSnapshot => {
      const updateData = {
        ...eventData,
        updatedAt: serverTimestamp()
      };
      batch.update(docSnapshot.ref, updateData);
    });
    
    await batch.commit();
    console.log('Recurring event series updated:', recurrenceId);
  } catch (error) {
    console.error('Error updating recurring event series:', error);
    throw error;
  }
};

// Delete a calendar event
export const deleteCalendarEvent = async (eventId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, eventId));
    console.log('Calendar event deleted:', eventId);
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    throw error;
  }
};

// Delete all events in a recurring series
export const deleteRecurringEventSeries = async (recurrenceId: string): Promise<void> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('recurrenceId', '==', recurrenceId)
    );
    
    const querySnapshot = await getDocs(q);
    const batch = writeBatch(db);
    
    querySnapshot.docs.forEach(docSnapshot => {
      batch.delete(docSnapshot.ref);
    });
    
    await batch.commit();
    console.log('Recurring event series deleted:', recurrenceId);
  } catch (error) {
    console.error('Error deleting recurring event series:', error);
    throw error;
  }
};

// Get all calendar events
export const getCalendarEvents = async (): Promise<CalendarEvent[]> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      orderBy('date', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        date: data.date?.toDate() || new Date(),
        icon: data.icon,
        description: data.description,
        createdBy: data.createdBy,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        isRecurring: data.isRecurring || false,
        recurrenceType: data.recurrenceType,
        recurrenceId: data.recurrenceId,
        originalDate: data.originalDate?.toDate()
      } as CalendarEvent;
    });
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    throw error;
  }
};

// Get calendar events for a specific date range
export const getCalendarEventsByDateRange = async (
  startDate: Date, 
  endDate: Date
): Promise<CalendarEvent[]> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('date', '>=', Timestamp.fromDate(startDate)),
      where('date', '<=', Timestamp.fromDate(endDate)),
      orderBy('date', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        date: data.date?.toDate() || new Date(),
        icon: data.icon,
        description: data.description,
        createdBy: data.createdBy,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        isRecurring: data.isRecurring || false,
        recurrenceType: data.recurrenceType,
        recurrenceId: data.recurrenceId,
        originalDate: data.originalDate?.toDate()
      } as CalendarEvent;
    });
  } catch (error) {
    console.error('Error fetching calendar events by date range:', error);
    throw error;
  }
};

// Get upcoming calendar events (next 30 days)
export const getUpcomingCalendarEvents = async (): Promise<CalendarEvent[]> => {
  try {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + 30);

    return await getCalendarEventsByDateRange(today, futureDate);
  } catch (error) {
    console.error('Error fetching upcoming calendar events:', error);
    throw error;
  }
};

// Get a specific calendar event by ID
export const getCalendarEventById = async (eventId: string): Promise<CalendarEvent | null> => {
  try {
    const eventDoc = await getDoc(doc(db, COLLECTION_NAME, eventId));
    if (eventDoc.exists()) {
      const data = eventDoc.data();
      return {
        id: eventDoc.id,
        title: data.title,
        date: data.date?.toDate() || new Date(),
        icon: data.icon,
        description: data.description,
        createdBy: data.createdBy,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as CalendarEvent;
    }
    return null;
  } catch (error) {
    console.error('Error fetching calendar event:', error);
    throw error;
  }
};

// Subscribe to calendar events for real-time updates
export const subscribeToCalendarEvents = (callback: (events: CalendarEvent[]) => void) => {
  const q = query(
    collection(db, COLLECTION_NAME),
    orderBy('date', 'asc')
  );

  return onSnapshot(q, (querySnapshot) => {
    const events = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        date: data.date?.toDate() || new Date(),
        icon: data.icon,
        description: data.description,
        createdBy: data.createdBy,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        isRecurring: data.isRecurring || false,
        recurrenceType: data.recurrenceType,
        recurrenceId: data.recurrenceId,
        originalDate: data.originalDate?.toDate()
      } as CalendarEvent;
    });
    callback(events);
  });
};

// Subscribe to upcoming calendar events
export const subscribeToUpcomingCalendarEvents = (callback: (events: CalendarEvent[]) => void) => {
  const today = new Date();
  const futureDate = new Date();
  futureDate.setDate(today.getDate() + 30);

  const q = query(
    collection(db, COLLECTION_NAME),
    where('date', '>=', Timestamp.fromDate(today)),
    where('date', '<=', Timestamp.fromDate(futureDate)),
    orderBy('date', 'asc')
  );

  return onSnapshot(q, (querySnapshot) => {
    const events = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        date: data.date?.toDate() || new Date(),
        icon: data.icon,
        description: data.description,
        createdBy: data.createdBy,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        isRecurring: data.isRecurring || false,
        recurrenceType: data.recurrenceType,
        recurrenceId: data.recurrenceId,
        originalDate: data.originalDate?.toDate()
      } as CalendarEvent;
    });
    callback(events);
  });
};

// Create birthday calendar event for a user
export const createBirthdayEvent = async (
  userId: string, 
  userName: string, 
  birthday: Date, 
  createdBy: string
): Promise<string> => {
  try {
    // Create a birthday event for the current year and future years
    const currentYear = new Date().getFullYear();
    const birthYear = birthday.getFullYear();
    const birthdayThisYear = new Date(currentYear, birthday.getMonth(), birthday.getDate());
    
    // Use the birthday this year as the starting date for recurring events
    const startDate = birthdayThisYear < new Date() 
      ? new Date(currentYear + 1, birthday.getMonth(), birthday.getDate()) // Next year if already passed
      : birthdayThisYear; // This year if not yet passed

    const eventData: CreateCalendarEventData = {
      title: `🎂 ${userName}'s Birthday`,
      icon: '🎂',
      description: `Happy Birthday ${userName}! ${birthYear ? `Turning ${currentYear - birthYear} this year.` : ''}`,
      date: startDate,
      isRecurring: true,
      recurrenceType: 'yearly'
    };

    return await createCalendarEvent(eventData, createdBy);
  } catch (error) {
    console.error('Error creating birthday event:', error);
    throw error;
  }
};

// Remove birthday events for a user
export const removeBirthdayEvents = async (userId: string): Promise<void> => {
  try {
    // Find all birthday events for this user
    const q = query(
      collection(db, COLLECTION_NAME),
      where('title', '>=', `🎂 ${userId}`),
      where('title', '<', `🎂 ${userId}\uf8ff`)
    );
    
    const querySnapshot = await getDocs(q);
    const batch = writeBatch(db);
    
    querySnapshot.docs.forEach(docSnapshot => {
      batch.delete(docSnapshot.ref);
    });
    
    if (querySnapshot.docs.length > 0) {
      await batch.commit();
      console.log(`Removed ${querySnapshot.docs.length} birthday events for user ${userId}`);
    }
  } catch (error) {
    console.error('Error removing birthday events:', error);
    throw error;
  }
};

// Remove birthday events by user name (more reliable approach)
export const removeBirthdayEventsByName = async (userName: string): Promise<void> => {
  try {
    // Find all birthday events containing the user's name
    const q = query(collection(db, COLLECTION_NAME));
    const querySnapshot = await getDocs(q);
    const batch = writeBatch(db);
    let eventsRemoved = 0;
    
    querySnapshot.docs.forEach(docSnapshot => {
      const data = docSnapshot.data();
      if (data.title && data.title.includes(`${userName}'s Birthday`)) {
        batch.delete(docSnapshot.ref);
        eventsRemoved++;
      }
    });
    
    if (eventsRemoved > 0) {
      await batch.commit();
      console.log(`Removed ${eventsRemoved} birthday events for ${userName}`);
    }
  } catch (error) {
    console.error('Error removing birthday events by name:', error);
    throw error;
  }
};