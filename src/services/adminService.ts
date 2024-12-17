import sendMail from "../config/email_config";
import AdminRepository from "../repositories/adminRepository";
import {generateAccessToken, generateRefreshToken, verifyRefreshToken} from '../utils/jwtHelper'

class AdminService {
  private adminRepository: AdminRepository;

  constructor(adminRepository: AdminRepository) {

    this.adminRepository = adminRepository;
  }

  async adminLogin({ email, password }: { email: string; password: string }) {
    try {
      const adminData = await this.adminRepository.findAdmin(email);
      if (adminData) {
        if(adminData.password !== password) {
         throw Error('Password is wrong')    
        }
            const accessToken = generateAccessToken({ id: adminData._id.toString(), email: adminData.email, role: 'admin' });
            const refreshToken = generateRefreshToken({ id: adminData._id.toString(), email: adminData.email });
            return {
                accessToken,
                refreshToken,
                admin: {
                    id: adminData._id.toString(),
                    email: adminData.email,
                    password: adminData.password
                }
            }
      } else console.log("admin not exists");
    } catch (error) {
      console.error("Error in admin login:", error);
      throw error;
    }
  }

  async generateTokn(admin_refresh_token: string) {
    try {
      const payload = verifyRefreshToken(admin_refresh_token);
      let id: string | undefined;
      let email: string | undefined;
      if (payload && typeof payload === "object") {
        id = payload?.id;
        email = payload?.email;
      }
      if (id && email) {
        const role = 'admin'
        const AdminNewAccessToken = generateAccessToken({ id, email , role});
        return AdminNewAccessToken;
      } else {
        throw new Error("Invalid token payload structure");
      }
    } catch (error) {
      console.error("Error generating token:", error);
      throw error;
    }
  }

  async addSpecialization(specializationData: { name: string, description: string }, imageUrl: string | null) {
    const specialization = await this.adminRepository.addSpecialization({ ...specializationData, image: imageUrl  });
    return specialization;
  }

  async TraienrsKycData() {
    try {
      const allTrainersKycDatas = await this.adminRepository.getAllTrainersKycDatas();
      return allTrainersKycDatas; 
    } catch (error) {
      console.error("Error fetching trainers KYC data:", error);
      throw error; 
    }
  }

  async fetchKycData(trainerId: string) {
    try {
      return await this.adminRepository.fetchKycData(trainerId);
    } catch (error) {
      console.error('Error fetching KYC data:', error);
      throw new Error('Failed to fetch KYC data');
    }
  }
  
  
  async updateKycStatus(status: string, trainer_id: string, rejectionReason: string | null): Promise<void> {
    try {
      const updatedKyc = await this.adminRepository.updateKycStatus(status, trainer_id, rejectionReason);
      if (status === 'approved' || status === 'rejected') {
        await this.adminRepository.deleteKyc(trainer_id);
        console.log(`KYC data deleted for trainer ID: ${trainer_id}`);
      }
      if(status === 'approved') {
        await sendMail('approve',updatedKyc, 'content')
      }else {
        await sendMail('reject',updatedKyc.trainerMail, updatedKyc.reason)
      }
    } catch (error) {
      console.error('Error updating KYC status:', error);
    }
  }
  

  async getAllSpecializations() {
    const specializations = await this.adminRepository.getAllSpecializations()    
    return specializations
  }

  async updateSpecStatus(spec_id: string, status: boolean) {
    return await this.adminRepository.updateSpecStatus(spec_id, status)
  }
  
  async fetchAllUsers() {
    return await this.adminRepository.fetchAllUsers()
  }
  async fetchAllTrainer() {
    return await this.adminRepository.fetchAllTrainer()
  }

  async updateUserStatus(user_id: string, userStatus: boolean) {
    return await this.adminRepository.updateUserStatus(user_id, userStatus)
  }
  async updateTrainerStatus(trainer_id: string, trainerStatus: boolean) {
    return await this.adminRepository.updateTrainerStatus(trainer_id, trainerStatus)
  }

  async getAllBookings() {
    return await this.adminRepository.fetchAllBookings()
  }

  async getDashboardData() {
    try {
      return await this.adminRepository.getAllStatistics()
    } catch (error: any) {
      throw Error(error)
    }
  }
}

export default AdminService;
