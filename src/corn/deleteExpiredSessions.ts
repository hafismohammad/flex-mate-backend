import cron from 'node-cron';
import UserRepository from '../repositories/userRepository';


const userRepository = new UserRepository();

// Define the cron job
export const startDeleteExpiredSessionsCron = () => {
  cron.schedule('0 0 * * *', async () => {
    console.log('Running daily cleanup job for expired sessions');
    try {
      const currentDate = new Date();

      const deletedCount = await userRepository.deleteExpiredUnbookedSessions(currentDate);
      
      console.log(`Deleted ${deletedCount} unbooked, expired sessions.`);
    } catch (error) {
      console.error('Error deleting unbooked, expired sessions:', error);
    }
  });
};
