export interface ILoginAdmin {
    email: string;
    password: string;
  }

  export interface IAdminLoginResponse {
    accessToken: string;
    refreshToken: string;
    admin: {
      id: string;
      email: string;
      password: string;
    };
  }
  

  export interface ISpecialization extends Document {
    name: string;
    description: string;
    image: string
    createdAt: Date;
    isListed: boolean;
  }

  export interface MonthlyStats {
    users: number;       
    trainer: number;     
    revenue: number;     
    amount: number;     
    trainerRevenue: number;
    adminRevenue: number;
  }


