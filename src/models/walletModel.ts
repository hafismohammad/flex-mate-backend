import {Document, Schema, model} from 'mongoose'

export interface ITransaction {
    amount: number;
    transactionId: string;
    transactionType: 'credit' | 'debit';
    date?: Date;
    bookingId?: string;
}

export interface IWallet {
    trainerId: string;
    balance: number;
    transactions: ITransaction[];
    createdAt?: Date;
    updatedAt: Date;
}

const transactionSchema = new Schema<ITransaction>({
    amount: {type: Number, required: true},
    transactionId: {type: String, required: true},
    transactionType: {type: String, enum: ['credit', 'debit'], required: true},
    bookingId: {type: String, default: ''},
    date: {type: Date, default: Date.now}
})

const walletSchema = new Schema<IWallet>(
    {
      trainerId: { type: String, required: true },
      balance: { type: Number, required: true, default: 0 },
      transactions: [transactionSchema],
    },
    { timestamps: true }
  );

  export const WalletModel = model<IWallet>('Wallet',walletSchema);

export default WalletModel;