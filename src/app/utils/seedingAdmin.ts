/* eslint-disable no-console */
import User from "../module/Auth/auth.model";
import { AuthServices } from "../module/Auth/auth.service";
import { userRole } from "../module/Auth/auth.utils";

export const seed = async () => {
  try {
    //atfirst check if the admin exist of not
    const admin = await User.findOne({
      role: userRole.admin,
      email: "zubayer.munna.dev@gmail.com",
      isBanned: false,
    });
    if (!admin) {
      await AuthServices.registerUserIntoDB({
        name: "Abu Talha Md Jobayer",
        email: "zubayer.munna.dev@gmail.com",
        password: "Admin123",
        contact: "+8801717171717",
        role: userRole.admin || "admin",
        profileImage: "https://i.ibb.co.com/39pHJZ94/IMG-0870.jpg",
        isVerified: true,
      });

      console.log("Admin created successfully...");
    }
  } catch (error) {
    console.log("Error in seeding", error);
  }
};
