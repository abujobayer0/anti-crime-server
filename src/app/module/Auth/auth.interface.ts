type TUserRole = "admin" | "user";

export interface TUser {
  name: string;
  email: string;
  password: string;
  contact?: string;
  role: TUserRole;
  coverImage: string;
  isVerified: boolean;
  profileImage: string;
  bio: string;
  isBanned: boolean;
  isDeleted: boolean;
  address: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TRegisterUser {
  email: string;
  password: string;
}

export interface TLoginUser {
  email: string;
  password: TLoginUser;
}
