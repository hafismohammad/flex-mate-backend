export interface ILoginAdmin {
    email: string;
    password: string;
  }

  export interface ISpecialization extends Document {
    name: string;
    description: string;
    image: string
    createdAt: Date;
    isListed: boolean;
  }

  export interface MonthlyStats {
    users: number;         // Number of registered users in the month
    trainer: number;       // Number of registered doctors in the month
    revenue: number;       // Total revenue for the month
    amount: number;     // Total fees collected for completed appointments
    trainerRevenue: number; // Revenue credited to doctors
    adminRevenue: number;
  }
