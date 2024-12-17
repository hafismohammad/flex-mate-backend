import express from 'express';
import AdminController from '../controllers/adminController';
import AdminService from '../services/adminService';
import AdminRepository from '../repositories/adminRepository';
import upload from '../utils/multer';
import authMiddleware from '../middlewares/authMiddlewares';

const router = express.Router();

// Instantiate the repository, service, and controller in the correct order
const adminRepository = new AdminRepository();
const adminService = new AdminService(adminRepository);
const adminController = new AdminController(adminService);

// Admin Authentication Routes
router.post('/adminLogin', adminController.adminLogin.bind(adminController));
router.post('/refresh-token', adminController.refreshToken.bind(adminController));
router.post('/logout', authMiddleware(['admin']), adminController.adminLogout.bind(adminController));

// Specialization Management Routes
router.post('/specialization', authMiddleware(['admin']), upload.single('image'), adminController.addSpecialization.bind(adminController));
router.get('/specialization', authMiddleware(['admin']), adminController.getAllSpecializations.bind(adminController));
router.patch('/toggle-status/:spec_id', authMiddleware(['admin']), adminController.updateStatus.bind(adminController));

// KYC Management Routes
router.get('/trainers/kyc', authMiddleware(['admin']), adminController.getAllTrainersKycDatas.bind(adminController));
router.get('/trainers/kyc/:trainer_id', authMiddleware(['admin']), adminController.trainersKycData.bind(adminController));
router.patch('/kyc-status-update/:trainer_id', authMiddleware(['admin']), adminController.changeKycStatus.bind(adminController));

// User Management Routes
router.get('/users', authMiddleware(['admin']), adminController.getAllUsers.bind(adminController));
router.patch('/users/:user_id/block-unblock', authMiddleware(['admin']), adminController.blockUnblockUser.bind(adminController));

// Trainer Management Routes
router.get('/trainers', authMiddleware(['admin']), adminController.getAllTrainer.bind(adminController));
router.patch('/trainers/:trainer_id/block-unblock', authMiddleware(['admin']), adminController.blockUnblockTrainer.bind(adminController));

// Booking Management Routes
router.get('/bookings', authMiddleware(['admin']), adminController.getAllBookings.bind(adminController));

// Dashboard Data Route
router.get('/dashboardData', authMiddleware(['admin']), adminController.getDashboardData.bind(adminController));

export default router;
