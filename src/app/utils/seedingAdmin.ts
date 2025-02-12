/* eslint-disable no-console */
import User from "../module/Auth/auth.model";
import { userRole } from "../module/Auth/auth.utils";

export const seed = async () => {
  try {
    //atfirst check if the admin exist of not
    const admin = await User.findOne({
      role: userRole.admin,
      email: "rijwanjannat36@gmail.com",
      isBanned: false,
    });
    if (!admin) {
      await User.create({
        name: "Md Rijwan Jannat",
        email: "rijwanjannat36@gmail.com",
        password: "Admin123",
        role: userRole.admin || "admin",
        profileImage:
          "https://oldweb.brur.ac.bd/wp-content/uploads/2019/03/male.jpg",
        isVerified: true,
      });
      console.log("Admin created successfully...");
      console.log("Seeding completed...");
    }
  } catch (error) {
    console.log("Error in seeding", error);
  }
};
