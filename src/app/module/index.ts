const userIndexes = async () => {
  const UserModel = (await import("./Auth/auth.model")).default;
  await UserModel.collection.createIndex({ email: 1 }, { unique: true });
  await UserModel.collection.createIndex({ name: 1 });
  await UserModel.collection.createIndex({ role: 1, isBanned: 1 });
};

const crimeReportIndexes = async () => {
  const { CrimeReport } = await import("./CrimeReport/crimeReport.model");
  await CrimeReport.collection.createIndex({ location: "2dsphere" });
  await CrimeReport.collection.createIndex({ createdAt: -1 });
  await CrimeReport.collection.createIndex({ status: 1, crimeType: 1 });
  await CrimeReport.collection.createIndex({
    title: "text",
    description: "text",
  });
};

const commentIndexes = async () => {
  const { Comment } = await import("./Comment/comment.model");
  await Comment.collection.createIndex({ reportId: 1 });
  await Comment.collection.createIndex({ userId: 1, createdAt: -1 });
  await Comment.collection.createIndex({ replyTo: 1 });
  await Comment.collection.createIndex({ replyTo: 1 });
};
const notificationIndexes = async () => {
  const Notification = (await import("./Notification/notification.model"))
    .default;
  await Notification.collection.createIndex({ recipient: 1, createdAt: -1 });
  await Notification.collection.createIndex({ recipient: 1, isRead: 1 });
  await Notification.collection.createIndex({ type: 1 });
  await Notification.collection.createIndex({
    recipient: 1,
    isRead: 1,
    type: 1,
  });
};
const followersIndexes = async () => {
  const { Followers } = await import("./Followers/followers.model");
  await Followers.collection.createIndex({ userId: 1 });
  await Followers.collection.createIndex({ userId: 1, following: 1 });
  await Followers.collection.createIndex({ userId: 1, followers: 1 });
};
const initializeIndexes = async () => {
  try {
    await Promise.all([
      userIndexes(),
      crimeReportIndexes(),
      commentIndexes(),
      notificationIndexes(),
      followersIndexes(),
    ]);
    console.log("Database indexes created successfully");
  } catch (error) {
    console.error("Error creating database indexes:", error);
  }
};

export default initializeIndexes;
