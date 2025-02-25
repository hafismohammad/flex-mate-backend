import express from "express";
import UserRepository from "../repositories/userRepository";
import UserService from "../services/userService";
import UserController from "../controllers/userController";
import authMiddlewares from "../middlewares/authMiddlewares";
import upload from "../utils/multer";

const router = express.Router();

const userRepository = new UserRepository(); 
const userService = new UserService(userRepository); 
const userController = new UserController(userService); 

// User Authentication Routes
router.post("/signup", userController.register.bind(userController)); 
router.post("/verifyotp", userController.verifyOtp.bind(userController));
router.post("/resend-otp", userController.resendOtp.bind(userController));
router.post("/login", userController.login.bind(userController)); 
router.post('/refresh-token', userController.refreshToken.bind(userController)); 

// User Profile Management Routes
router.patch('/reset-password/:user_id', authMiddlewares(['user']), userController.resetPassword.bind(userController)); 
router.patch('/update-user', authMiddlewares(['user']), userController.updateUserData.bind(userController)); 
router.patch('/profile-image/:user_id', authMiddlewares(['user']), upload.single('profileImage'), userController.uploadProfileImage.bind(userController));

// Trainer and Specializations Routes
router.get("/trainers", userController.getAllTrainers.bind(userController));
router.get("/specializations", userController.getAllSpecializations.bind(userController)); 
router.get("/trainers/:trainer_id", userController.getTrainer.bind(userController)); 

// Session and Booking Routes
router.get("/schedules", userController.getSessionSchedules.bind(userController)); 
router.post("/payment/:session_id", authMiddlewares(['user']), userController.checkoutPayment.bind(userController)); 
router.post("/bookings", authMiddlewares(['user']), userController.createBooking.bind(userController)); 
router.get('/users/:user_id', authMiddlewares(['user']), userController.getUser.bind(userController));
router.get('/bookings-details/:user_id', authMiddlewares(['user']), userController.getAllBookings.bind(userController)); 
router.patch('/cancel-booking/:booking_id', userController.cancelBooking.bind(userController)); 

// Review and Ratings Routes
router.post('/review', authMiddlewares(['user']), userController.addReview.bind(userController));
router.get('/reviews/:trainer_id', authMiddlewares(['user']), userController.getReivew.bind(userController));
router.get('/reviews-summary/:trainer_id', authMiddlewares(['user']), userController.getReivewSummary.bind(userController)); 
router.patch('/edit-review', authMiddlewares(['user']), userController.editReview.bind(userController)); 

// Notifications Routes
router.get('/notifications/:user_id', authMiddlewares(['user']), userController.getNotifications.bind(userController)); 
router.delete('/clear-notifications/:user_id', authMiddlewares(['user']), userController.clearNotifications.bind(userController));

// Booking Validation Routes
router.get('/bookings/:user_id/:trainer_id', authMiddlewares(['user']), userController.findbookings.bind(userController));

// Logout Route
router.post("/logout", authMiddlewares(['user']), userController.logout.bind(userController)); 

export default router;
