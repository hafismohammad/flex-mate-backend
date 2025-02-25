export interface User {
    id: string;
     name: string;
     phone: string;
     email: string;
     password: string;
     dob?:string
     gender?: string,
     isBlocked?: boolean;
   }
 

   export interface ISessionSchedules {
    _id: string;
    trainerId: string;
    specializationId: {
      _id: string;
      name: string;
      description: string;
      image: string;
      isListed: boolean;
      createdAt: Date;
    };
    startDate: Date;
    startTime: string;
    endTime: string;
    isSingleSession: boolean;
    price: number;
    isBooked: boolean;
    status: "Confirmed" | "Pending" | "Cancelled" | "InProgress" | "Completed";
    createdAt: Date;
    updatedAt: Date;
  }
  