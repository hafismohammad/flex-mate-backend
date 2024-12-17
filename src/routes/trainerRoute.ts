import express from 'express';
import upload from '../utils/multer';
import authMiddlewares from '../middlewares/authMiddlewares';

import TrainerController from '../controllers/trainerController';
import TrainerService from '../services/trainerServices';
import TrainerRepository from '../repositories/trainerRepository';

const router = express.Router();

// Instantiate the repository, service, and controller
const trainerRepository = new TrainerRepository();
const trainerService = new TrainerService(trainerRepository);
const trainerController = new TrainerController(trainerService);

// Trainer Authentication Routes
router.post('/signup', trainerController.registerTrainer.bind(trainerController));
router.post('/otp', trainerController.verifyOtp.bind(trainerController));
router.post('/resend-otp', trainerController.resendOtp.bind(trainerController));
router.post('/login', trainerController.trainerLogin.bind(trainerController));
router.post('/refresh-token', trainerController.refreshToken.bind(trainerController));

// Trainer Profile Management Routes
router.post('/trainers/kyc', authMiddlewares(['trainer']), upload.fields([
  { name: 'profileImage', maxCount: 1 },
  { name: 'aadhaarFrontSide', maxCount: 1 },
  { name: 'aadhaarBackSide', maxCount: 1 },
  { name: 'certificate', maxCount: 1 }
]), trainerController.kycSubmission.bind(trainerController));

router.get('/kycStatus/:trainer_id', authMiddlewares(['trainer']), trainerController.trainerKycStatus.bind(trainerController));
router.put('/kyc/resubmit/:trainer_id', authMiddlewares(['trainer']), trainerController.resubmitkyc.bind(trainerController));

// Trainer Info Routes
router.get('/specializations', trainerController.getAllSpecializations.bind(trainerController));
router.get('/:trainer_id', authMiddlewares(['trainer']), trainerController.getTrainer.bind(trainerController));
router.patch('/update-trainer/:trainer_id', authMiddlewares(['trainer']), upload.single('profileImage'), trainerController.updateTrainer.bind(trainerController));
router.get('/trainers/:trainer_id/specializations', authMiddlewares(['trainer']), trainerController.fetchSpecialization.bind(trainerController));
router.get('/rejection-reason/:trainer_id', authMiddlewares(['trainer']), trainerController.fetchRejectionReason.bind(trainerController));


// Session and Booking Routes
router.post('/session/:trainer_id', authMiddlewares(['trainer']), trainerController.storeSessionData.bind(trainerController));
router.get('/schedules/:trainer_id', authMiddlewares(['trainer']), trainerController.getSessionSchedules.bind(trainerController));
router.delete('/sessions/:session_id', authMiddlewares(['trainer']), trainerController.deleteSessionSchedule.bind(trainerController));
router.get('/booking-details/:trainer_id', authMiddlewares(['trainer']), trainerController.fetchBookingDetails.bind(trainerController));

// User Management Routes
router.get('/users/:user_id', authMiddlewares(['trainer']), trainerController.fetchUser.bind(trainerController));
router.get('/wallet-data/:trainer_id', authMiddlewares(['trainer']), trainerController.getWalletData.bind(trainerController));
router.post('/withdraw/:trainer_id', authMiddlewares(['trainer']), trainerController.withdraw.bind(trainerController));

// Prescription Routes
router.post('/prescriptions/:booking_id', authMiddlewares(['trainer']), trainerController.addPrescriptionInfo.bind(trainerController));
router.patch('/update-prescription/:booking_id', authMiddlewares(['trainer']), trainerController.updatePrescription.bind(trainerController));

// Notifications Routes
router.get('/notifications/:trainer_id', authMiddlewares(['trainer']), trainerController.getNotifications.bind(trainerController));
router.delete('/clear-notifications/:trainer_id', authMiddlewares(['trainer']), trainerController.clearNotifications.bind(trainerController));

// Booking Management Routes
router.get('/booking/:booking_id', authMiddlewares(['trainer']), trainerController.getUserBooking.bind(trainerController));

// Logout Route
router.post('/logout', authMiddlewares(['trainer']), trainerController.logoutTrainer.bind(trainerController));

export default router;
