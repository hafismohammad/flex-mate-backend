import AdminModel from "../models/adminModel";
import SpecializationModel from "../models/specializationModel";
import KYCModel from "../models/KYC_Model";
import TrainerModel from "../models/trainerModel";
import UserModel from "../models/userModel";
import KycRejectionReasonModel from "../models/kycRejectionReason";
import BookingModel from "../models/booking";
import { MonthlyStats } from "../interface/admin_interface";

class AdminRepository {
  private adminModel = AdminModel;
  private specializationModel = SpecializationModel
  private kycModel = KYCModel
  private trainerModel = TrainerModel
  private userModel = UserModel
  private kycRejectionReasonModel = KycRejectionReasonModel

  async findAdmin(email: string) {
    try {
      return await this.adminModel.findOne({ email });
    } catch (error) {
      console.log("Error finding user:", error);
      return null;
    }
  }

  async addSpecialization({ name, description, image }: { name: string; description: string; image: string | null }) {
    try {
        return await this.specializationModel.create({ name, description, image });
    } catch (error) {
        console.log('Error adding specialization:', error);
        throw error;
    }
  }


  async getAllTrainersKycDatas() {
    return await this.trainerModel.aggregate([
      {
        $lookup: {
          from: this.kycModel.collection.name, 
          localField: '_id', 
          foreignField: 'trainerId', 
          as: 'kycData', 
        },
      },
      {
        $unwind: {
          path: '$kycData', 
          // preserveNullAndEmptyArrays: true, 
        },
      },
      {
        $project: {
          _id: 1,
          name: 1, 
          email: 1, 
          kycData: 1,
        },
      },
    ]);
  }

  async fetchKycData(trainerId: string) {
    try {
      const kycData = await KYCModel.findOne({ trainerId }).populate('specializationId').populate('trainerId')
      return kycData
    } catch (error) {
      console.error('Error fetching KYC data:', error);
      throw new Error('Failed to fetch KYC data');
    }
  }
  

  async updateKycStatus(status: string, trainer_id: string, rejectionReason: string | null): Promise<any> {
    try {
      const updatedTrainer = await this.trainerModel.findByIdAndUpdate(
        trainer_id,
        { kycStatus: status },
        { new: true, runValidators: true }
      );
  
      if (updatedTrainer) {
        console.log('Trainer KYC status updated successfully:', updatedTrainer);
  
        const updatedKyc = await this.kycModel.findOneAndUpdate(
          { trainerId: trainer_id },
          { kycStatus: status },
          { new: true, runValidators: true }
        );
  
        if (updatedKyc) {
          if (status === 'rejected' && rejectionReason) {
           const reason =  await this.kycRejectionReasonModel.create({
              trainerId: trainer_id,
              reason: rejectionReason,
            });
            console.log('Rejection reason saved successfully.');
            const response = {
              trainerMail : updatedTrainer.email,
              reason: reason.reason
            }
            return response
          } 

          if(status === 'approved') {
            console.log('approve hit with',updatedTrainer.email);
            
            if(updatedTrainer.email) {
              return updatedTrainer.email
            }
          }
        } else {
          console.log('KYC record not found for the given trainer ID:', trainer_id);
          return null;
        }
      } else {
        console.log('Trainer not found with the given ID:', trainer_id);
        return null;
      }
    } catch (error) {
      console.error('Error updating KYC status:', error);
      throw error;
    }
  }

  async deleteKyc(trainer_id: string) {
    try {
      const result = await this.kycModel.findOneAndDelete({ trainerId: trainer_id });
      if (result) {
        console.log('KYC record deleted successfully:', result);
      } else {
        console.log('No KYC record found for deletion with trainer ID:', trainer_id);
      }
    } catch (error) {
      console.error('Error deleting KYC record:', error);
    }
  }
  
  async getAllSpecializations() {
    return await this.specializationModel.find()
  }
  
  async updateSpecStatus(spec_id: string, status: boolean) {
    return await this.specializationModel.findByIdAndUpdate(
     { _id: spec_id},
     { isListed: status},
     { new: true } 
    )
  }

  async fetchAllUsers() {
    return await this.userModel.find()
  }
  async fetchAllTrainer() {
    
    const trainers =  await this.trainerModel.find().populate('specializations')
    console.log('trainers', trainers);
    
    return trainers
  }
  async updateUserStatus(user_id: string, userStatus: boolean) {
   return  await this.userModel.findByIdAndUpdate(
      {_id: user_id},
      {isBlocked: userStatus},
      { new: true } 
    )
    
  }

  async updateTrainerStatus(trainer_id: string, trainerStatus: boolean) {
   return  await this.trainerModel.findByIdAndUpdate(
      {_id: trainer_id},
      {isBlocked: trainerStatus},
      { new: true } 
    )
    
  }

  async saveRejectionReason(trainerId: string, reason: string): Promise<void> {
    try {
       await this.kycRejectionReasonModel.create({
        trainerId: trainerId,
        reason: reason,
        date: new Date(),
      });
      
    } catch (error) {
      console.error('Error saving rejection reason:', error);
      throw error;
    }
  }

  async fetchAllBookings() {
    try {
      const allBookings = await BookingModel.aggregate([
        {
          $lookup: {
            from: 'trainers',
            localField: 'trainerId',
            foreignField: '_id',
            as: 'trainerDetails'
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'userDetails'
          }
        },
        {
          $lookup: {
            from: 'sessions',
            localField: 'sessionId',
            foreignField: '_id',
            as: 'sessionDetails'
          }
        },
        {
          $lookup: {
            from: 'specializations',
            localField: 'specializationId',
            foreignField: '_id',
            as: 'specializationDetails'
          }
        },
        {
          $unwind: {
            path: "$trainerDetails",
            preserveNullAndEmptyArrays: true 
          }
        },
        {
          $unwind: {
            path: "$userDetails",
            preserveNullAndEmptyArrays: true 
          }
        },
        {
          $unwind: {
            path: "$sessionDetails",
            preserveNullAndEmptyArrays: true 
          }
        }, {
          $unwind: {
            path: "$specializationDetails",
            preserveNullAndEmptyArrays: true 
          }
        },
        {
          $project: {
            bookingId: '$_d',
            userName: '$userDetails.name',
            trainerName: '$trainerDetails.name',
            bookingDate: '$bookingDate',
            sessionDates: {
              $cond: {
                if: {$eq: ["$sessionDetails.isSingleSession", true]},
                then: {
                  startDate: { $ifNull: ["$sessionDetails.startDate", null] },
                },  else: {
                  startDate: { $ifNull: ["$sessionDetails.startDate", null] },
                  endDate: { $ifNull: ["$sessionDetails.endDate", null] },
                },
              }
            },
            sessionStartTime: "$startTime",
            sessionEndTime: '$endTime',
            sessionType: '$sessionType',
            specialization: '$specialization',
            amount: '$amount',
            status: '$paymentStatus'
          }
        }
      ])
      return allBookings
    } catch (error) {
      console.error('Error fetching all booking details:', error);
      throw error;
    }
  }

  async getAllStatistics() {
    const totalTrainers = await this.trainerModel.countDocuments();
    const totalUsers = await this.userModel.countDocuments();
    const activeUsers = await this.userModel.countDocuments({ isBlocked: false });
    const activeTrainers = await this.trainerModel.countDocuments({ isBlocked: false });
    const revenueData = await BookingModel.aggregate([
      { $match: { paymentStatus: "Completed" } },
      {
        $group: {
          _id: null,
          amount: { $sum: "$amount" },
          trainerRevenue: { $sum: { $multiply: ["$amount", 0.9] } },
          adminRevenue: { $sum: { $multiply: ["$amount", 0.1] } }
        }
      }
    ]);

    const amount = revenueData.length > 0 ? revenueData[0].amount : 0;
    const trainerRevenue = revenueData.length > 0 ? revenueData[0].trainerRevenue : 0;
    const adminRevenue = revenueData.length > 0 ? revenueData[0].adminRevenue : 0;
    const currentDate = new Date();
    const startDate = new Date();
    startDate.setMonth(currentDate.getMonth() - 12); // 12 months ago
  
    const usersAndDoctorsRegistrationData = await Promise.all([
      this.userModel.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
            count: { $sum: 1 }
          }
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } }
      ]),
  
      this.trainerModel.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
            count: { $sum: 1 }
          }
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } }
      ])
    ]);
  
    const monthlyStatistics: { [key: string]: MonthlyStats } = {};
  
    for (let monthOffset = 0; monthOffset < 12; monthOffset++) {
      const monthDate = new Date();
      monthDate.setMonth(currentDate.getMonth() - monthOffset);
      const year = monthDate.getFullYear();
      const month = monthDate.getMonth() + 1; 
      const key = `${year}-${month < 10 ? '0' : ''}${month}`;
  
      monthlyStatistics[key] = {
        users: 0,
        trainer: 0,
        revenue: 0,
        amount: 0,
        trainerRevenue: 0,
        adminRevenue: 0
      };
    }
    usersAndDoctorsRegistrationData[0].forEach(userData => {
      const key = `${userData._id.year}-${userData._id.month < 10 ? '0' : ''}${userData._id.month}`;
      if (monthlyStatistics[key]) {
        monthlyStatistics[key].users = userData.count;
      }
    });
  
    usersAndDoctorsRegistrationData[1].forEach(trainerData => {
      const key = `${trainerData._id.year}-${trainerData._id.month < 10 ? '0' : ''}${trainerData._id.month}`;
      if (monthlyStatistics[key]) {
        monthlyStatistics[key].trainer = trainerData.count;
      }
    });
  
    const revenueByMonth = await BookingModel.aggregate([
      { $match: { paymentStatus: "Completed", bookingDate: { $gte: startDate } } },
      {
        $group: {
          _id: {
            year: { $year: "$bookingDate" },   
            month: { $month: "$bookingDate" }  
        },
          amount: { $sum: "$amount" },
          trainerRevenue: { $sum: { $multiply: ["$amount", 0.9] } },
          adminRevenue: { $sum: { $multiply: ["$amount", 0.1] } }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);
    revenueByMonth.forEach(revenueData => {
      const key = `${revenueData._id.year}-${revenueData._id.month < 10 ? '0' : ''}${revenueData._id.month}`;
      if (monthlyStatistics[key]) {
        monthlyStatistics[key].revenue = revenueData.amount;
        monthlyStatistics[key].amount = revenueData.amount;
        monthlyStatistics[key].trainerRevenue = revenueData.trainerRevenue;
        monthlyStatistics[key].adminRevenue = revenueData.adminRevenue;
      }
  });
  
    const userTrainerChartData = Object.keys(monthlyStatistics).map(key => {
      const [year, month] = key.split('-');
      return {
        year: parseInt(year, 10),
        month: parseInt(month, 10),
        users: monthlyStatistics[key].users,
        trainer: monthlyStatistics[key].trainer,
        revenue: monthlyStatistics[key].revenue,
        amount: monthlyStatistics[key].amount,
        trainerRevenue: monthlyStatistics[key].trainerRevenue,
        adminRevenue: monthlyStatistics[key].adminRevenue
      };
    });
  
    return {
      totalTrainers,
      totalUsers,
      activeTrainers,
      activeUsers,
      totalRevenue: amount,
      trainerRevenue,  
      adminRevenue,  
      userTrainerChartData  
    };
  }
}


export default AdminRepository;
