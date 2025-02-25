
export interface IAdminRepository {
  findAdmin(email: string): Promise<any>;

  addSpecialization(data: {name: string;description: string;image: string | null;}): Promise<any>;

  getAllTrainersKycDatas(): Promise<any>;

  fetchKycData(trainerId: string): Promise<any>;

  updateKycStatus(status: string,trainer_id: string,rejectionReason: string | null ): Promise<any>;

  deleteKyc(trainer_id: string): Promise<void>;

  getAllSpecializations(): Promise<any>;

  updateSpecStatus(spec_id: string, status: boolean): Promise<any>;

  fetchAllUsers(): Promise<any>;

  fetchAllTrainer(): Promise<any>;

  updateUserStatus(user_id: string, userStatus: boolean): Promise<any>;

  updateTrainerStatus(trainer_id: string,trainerStatus: boolean): Promise<any>;

  saveRejectionReason(trainerId: string, reason: string): Promise<void>;

  fetchAllBookings(): Promise<any>;

  getAllStatistics(): Promise<{ totalTrainers: number;totalUsers: number;activeUsers: number;activeTrainers: number;amount: number;trainerRevenue: number;adminRevenue: number}>;
}
