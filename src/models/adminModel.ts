import { Schema, model } from "mongoose";
import { ILoginAdmin } from "../interface/admin_interface";

const adminSchema = new Schema<ILoginAdmin>({
  email: { type: String, require: true },
  password: { type: String, require: true },
});

const AdminModel = model("Admin", adminSchema);
export default AdminModel;
