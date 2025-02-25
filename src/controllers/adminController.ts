import { NextFunction, Request, Response } from "express";
// import AdminService from "../services/adminService";
import { IAdminService } from "../interface/admin/Admin.service.interface";
import { ILoginAdmin } from "../interface/admin_interface";
import { uploadToCloudinary } from '../config/cloudinary'

class AdminController {
  private adminService: IAdminService;

  constructor(adminService: IAdminService) {
    this.adminService = adminService;
  }

  async adminLogin(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password }: ILoginAdmin = req.body;
      const admin = await this.adminService.adminLogin({ email, password });
      if (admin) {
        const { accessToken, refreshToken } = admin;
        res.cookie("admin_refresh_token", refreshToken, {
          httpOnly: true,
          sameSite: "none",
          secure: true,
          maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        console.log("Admin authenticated successfully");
        res.status(200).json({
            message: "Login successful",
            admin: admin.admin,
            token: accessToken,
          });
      } else {
        console.log("Admin authentication failed");
        res.status(401).json({ message: "Invalid email or password" });
      }
    } catch (error) {
      console.error("Error during admin login:", error);
      next(error)
    }
  }



  async adminLogout(req: Request, res: Response, next: NextFunction) {
    try {
      res.clearCookie("admin_refresh_token", {
        httpOnly: true,
        sameSite: "none",
        secure: true,
      });
      res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ message: "Logout failed", error });
    }
  }

  async addSpecialization(req: Request, res: Response, next: NextFunction) {
    try {
      const specializationData = req.body;
      const imageFile = req.file;
      let imageUrl: string | null = null;
      if (imageFile) {
        const result = await uploadToCloudinary(imageFile.buffer, 'specializationImage');
        imageUrl = result.secure_url;
      }
      const specialization = await this.adminService.addSpecialization(specializationData, imageUrl);
      res.status(201).json({ message: "Specialization added successfully", specialization });
    } catch (error) {
      console.error('Adding specialization error', error);
      next(error)
    }
  }


  async refreshToken(req: Request, res: Response, next: NextFunction) {
    const admin_refresh_token = req.cookies?.admin_refresh_token;
    if (!admin_refresh_token) {
      res.status(403).json({ message: "Refresh token not found" });
      return;
    }
    try {
      const newAccessToken = await this.adminService.generateTokn(
        admin_refresh_token
      );
      res.status(200).json({ accessToken: newAccessToken });
    } catch (error) {
      console.error("Error generating new access token:", error);
      next(error)
    }
  }


  async getAllTrainersKycDatas(req: Request, res: Response, next: NextFunction) {
    try {
      const allTrainersKycData = await this.adminService.TraienrsKycData();
      res.status(200).json({ message: "Trainers KYC data fetched successfully", data: allTrainersKycData });
    } catch (error) {
      console.error("Error fetching KYC data:", error);
      next(error)
    }
  }

  async trainersKycData(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const trainerId = req.params.trainer_id;
      const trainerKycDetails = await this.adminService.fetchKycData(trainerId);
      if (!trainerKycDetails) {
        res.status(404).json({ message: 'Trainer KYC details not found' });
        return;
      }
      res.status(200).json({
        message: 'Trainer KYC data fetched successfully',
        kycData: {
          ...trainerKycDetails,
        },
      });
    } catch (error) {
      console.error("Error fetching KYC data:", error);
      next(error)
    }
  }

  async changeKycStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const status = String(req.body.status);
      const trainer_id = req.params.trainer_id;
      const rejectionReason = req.body.rejectionReason || null;

      await this.adminService.updateKycStatus(status, trainer_id, rejectionReason);

      res.status(200).json({ message: 'Trainer status updated successfully', status });
    } catch (error) {
      console.error('Error updating trainer status:', error);
      next(error)
    }
  }

  async getAllSpecializations(req: Request, res: Response, next: NextFunction) {
    try {
      const allSpecializations = await this.adminService.getAllSpecializations();
      res.status(200).json(allSpecializations);
    } catch (error) {
      console.error('Error fetching specializations:', error);
      next(error)
    }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const spec_id = req.params.spec_id;
      const status = req.body.isListed;
      const updateResult = await this.adminService.updateSpecStatus(spec_id, status);
      res.status(200).json({
        message: 'Specialization status updated successfully.',
        data: updateResult,
      });
    } catch (error) {
      console.error('Error updating specializations status:', error);
      next(error)
    }
  }

  async getAllUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const allUsers = await this.adminService.fetchAllUsers()
      res.status(200).json({ message: 'Fetch all users successfully', users: allUsers })
    } catch (error) {
      next(error)
    }
  }
  async getAllTrainer(req: Request, res: Response, next: NextFunction) {
    try {
      const allTrainer = await this.adminService.fetchAllTrainer()
      res.status(200).json({ message: 'Fetch all trainer successfully', trainer: allTrainer })
    } catch (error) {
      next(error)
    }
  }

  async blockUnblockUser(req: Request, res: Response, next: NextFunction) {
    try {
      const user_id = req.params.user_id
      const userStatus = req.body.status
      const status = await this.adminService.updateUserStatus(user_id, userStatus)
      res.status(200).json({
        message: 'user status updated sucessfully',
        data: status,
      });
    } catch (error) {
        next(error)
    }
  }

  async blockUnblockTrainer(req: Request, res: Response, next: NextFunction) {
    try {
      const trainer_id = req.params.trainer_id
      const trainerStatus = req.body.status
      console.log(trainer_id, trainerStatus);
      const status = await this.adminService.updateTrainerStatus(trainer_id, trainerStatus)
      res.status(200).json({
        message: 'trainer status updated sucessfully',
        data: status,
      });
    } catch (error) {
      next(error)
    }
  }

async getAllBookings(req: Request, res: Response, next: NextFunction) {
  try {
  const allbookings = await this.adminService.getAllBookings()    
  res.status(200).json(allbookings)
  } catch (error) {
    next(error)
  } 
}

async getDashboardData(req: Request, res: Response, next: NextFunction) {
  try {
    const response = await this.adminService.getDashboardData()
    res.status(200).json({data: response})
  } catch (error) {
    next(error)
  }
} 
}

export default AdminController;
