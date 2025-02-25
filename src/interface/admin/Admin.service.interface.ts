
export interface IAdminService {
  adminLogin(data: { email: string; password: string }): Promise<{accessToken: string;refreshToken: string; admin: {id: string;email: string;password: string;};}>;

  generateTokn(admin_refresh_token: string): Promise<string>;

  addSpecialization(specializationData: { name: string; description: string },imageUrl: string | null): Promise<any>;

  TraienrsKycData(): Promise<any>;

  fetchKycData(trainerId: string): Promise<any>;

  updateKycStatus(  status: string,trainer_id: string,rejectionReason: string | null ): Promise<void>;

  getAllSpecializations(): Promise<any[]>;

  updateSpecStatus(spec_id: string, status: boolean): Promise<any>;

  fetchAllUsers(): Promise<any[]>;

  fetchAllTrainer(): Promise<any[]>;

  updateUserStatus(user_id: string, userStatus: boolean): Promise<any>;

  updateTrainerStatus(trainer_id: string, trainerStatus: boolean): Promise<any>;

  getAllBookings(): Promise<any[]>;

  getDashboardData(): Promise<any>;
}
