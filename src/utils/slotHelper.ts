import { ISession } from "../interface/trainer_interface";

export const createRecurringSessions = async (
  startDate: Date,
  recurrencePeriod: string,
  sessionData: ISession
) => {
  const sessions = [];
  let currentDate = new Date(startDate);

  // Determine the number of days to add based on the recurrence period
  const daysToAdd = recurrencePeriod === 'oneWeek' ? 7 : 14; 
  
  for (let i = 0; i < daysToAdd; i++) {
    // Clone the session data and set the date for each session
    const newSession = {
      ...sessionData,
      startDate: new Date(currentDate), // Set the specific date for this session
    };

    sessions.push(newSession);

    // Move to the next day for the next session
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return sessions;
};
