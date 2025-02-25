import { ObjectId } from "mongoose";

interface IFollowers {
  userId: ObjectId;
  following: ObjectId[];
  followers: ObjectId[];
}

export default IFollowers;
