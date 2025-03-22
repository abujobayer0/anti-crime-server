import Logger from "../utils/logger";

/**
 * Database Indexing Module
 * Handles the creation and management of database indexes for optimal query performance
 * @module DatabaseIndexing
 */
class DatabaseIndexingService {
  private static readonly logger = new Logger("DatabaseIndexingService");

  /**
   * Creates indexes for the User collection
   * @returns Promise resolving when indexes are created
   * @throws Error if index creation fails
   */
  private static async createUserIndexes(): Promise<void> {
    try {
      this.logger.info("Creating User collection indexes");
      const UserModel = (await import("./Auth/auth.model")).default;

      await Promise.all([
        UserModel.collection.createIndex(
          { email: 1 },
          {
            unique: true,
            name: "email_unique_idx",
            background: true,
          }
        ),
        UserModel.collection.createIndex(
          { name: 1 },
          {
            name: "name_idx",
            background: true,
          }
        ),
        UserModel.collection.createIndex(
          { role: 1, isBanned: 1 },
          {
            name: "role_banned_compound_idx",
            background: true,
          }
        ),
      ]);

      this.logger.info("User collection indexes created successfully");
    } catch (error: any) {
      this.logger.error(`Error creating User indexes: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * Creates indexes for the CrimeReport collection
   * @returns Promise resolving when indexes are created
   * @throws Error if index creation fails
   */
  private static async createCrimeReportIndexes(): Promise<void> {
    try {
      this.logger.info("Creating CrimeReport collection indexes");
      const { CrimeReport } = await import("./CrimeReport/crimeReport.model");

      await Promise.all([
        CrimeReport.collection.createIndex(
          { location: "2dsphere" },
          {
            name: "location_geo_idx",
            background: true,
          }
        ),
        CrimeReport.collection.createIndex(
          { createdAt: -1 },
          {
            name: "created_at_desc_idx",
            background: true,
          }
        ),
        CrimeReport.collection.createIndex(
          { status: 1, crimeType: 1 },
          {
            name: "status_crimeType_compound_idx",
            background: true,
          }
        ),
        CrimeReport.collection.createIndex(
          {
            title: "text",
            description: "text",
          },
          {
            name: "fulltext_search_idx",
            background: true,
            weights: {
              title: 10,
              description: 5,
            },
          }
        ),
      ]);

      this.logger.info("CrimeReport collection indexes created successfully");
    } catch (error: any) {
      this.logger.error(
        `Error creating CrimeReport indexes: ${error.message}`,
        error
      );
      throw error;
    }
  }

  /**
   * Creates indexes for the Comment collection
   * @returns Promise resolving when indexes are created
   * @throws Error if index creation fails
   */
  private static async createCommentIndexes(): Promise<void> {
    try {
      this.logger.info("Creating Comment collection indexes");
      const { Comment } = await import("./Comment/comment.model");

      await Promise.all([
        Comment.collection.createIndex(
          { reportId: 1 },
          {
            name: "reportId_idx",
            background: true,
          }
        ),
        Comment.collection.createIndex(
          { userId: 1, createdAt: -1 },
          {
            name: "userId_createdAt_compound_idx",
            background: true,
          }
        ),
        Comment.collection.createIndex(
          { replyTo: 1 },
          {
            name: "replyTo_idx",
            background: true,
            sparse: true,
          }
        ),
      ]);

      this.logger.info("Comment collection indexes created successfully");
    } catch (error: any) {
      this.logger.error(
        `Error creating Comment indexes: ${error.message}`,
        error
      );
      throw error;
    }
  }

  /**
   * Creates indexes for the Notification collection
   * @returns Promise resolving when indexes are created
   * @throws Error if index creation fails
   */
  private static async createNotificationIndexes(): Promise<void> {
    try {
      this.logger.info("Creating Notification collection indexes");
      const Notification = (await import("./Notification/notification.model"))
        .default;

      await Promise.all([
        Notification.collection.createIndex(
          { recipient: 1, createdAt: -1 },
          {
            name: "recipient_createdAt_compound_idx",
            background: true,
          }
        ),
        Notification.collection.createIndex(
          { recipient: 1, isRead: 1 },
          {
            name: "recipient_isRead_compound_idx",
            background: true,
          }
        ),
        Notification.collection.createIndex(
          { type: 1 },
          {
            name: "type_idx",
            background: true,
          }
        ),
        Notification.collection.createIndex(
          {
            recipient: 1,
            isRead: 1,
            type: 1,
          },
          {
            name: "recipient_isRead_type_compound_idx",
            background: true,
          }
        ),
      ]);

      this.logger.info("Notification collection indexes created successfully");
    } catch (error: any) {
      this.logger.error(
        `Error creating Notification indexes: ${error.message}`,
        error
      );
      throw error;
    }
  }

  /**
   * Creates indexes for the Followers collection
   * @returns Promise resolving when indexes are created
   * @throws Error if index creation fails
   */
  private static async createFollowersIndexes(): Promise<void> {
    try {
      this.logger.info("Creating Followers collection indexes");
      const { Followers } = await import("./Followers/followers.model");

      await Promise.all([
        Followers.collection.createIndex(
          { userId: 1 },
          {
            name: "userId_idx",
            background: true,
          }
        ),
        Followers.collection.createIndex(
          { userId: 1, following: 1 },
          {
            name: "userId_following_compound_idx",
            background: true,
          }
        ),
        Followers.collection.createIndex(
          { userId: 1, followers: 1 },
          {
            name: "userId_followers_compound_idx",
            background: true,
          }
        ),
      ]);

      this.logger.info("Followers collection indexes created successfully");
    } catch (error: any) {
      this.logger.error(
        `Error creating Followers indexes: ${error.message}`,
        error
      );
      throw error;
    }
  }

  /**
   * Creates indexes for the Bookmark collection
   * @returns Promise resolving when indexes are created
   * @throws Error if index creation fails
   */
  private static async createBookmarkIndexes(): Promise<void> {
    try {
      this.logger.info("Creating Bookmark collection indexes");
      const { Bookmark } = await import("./Bookmark/bookmark.model");

      await Promise.all([
        Bookmark.collection.createIndex(
          { userId: 1, reportId: 1 },
          {
            name: "userId_reportId_unique_idx",
            background: true,
            unique: true,
          }
        ),
        Bookmark.collection.createIndex(
          { userId: 1, createdAt: -1 },
          {
            name: "userId_createdAt_idx",
            background: true,
          }
        ),
      ]);

      this.logger.info("Bookmark collection indexes created successfully");
    } catch (error: any) {
      this.logger.error(
        `Error creating Bookmark indexes: ${error.message}`,
        error
      );
      throw error;
    }
  }

  /**
   * Initializes all database indexes
   * @returns Promise resolving when all indexes are created
   */
  public static async initializeIndexes(): Promise<void> {
    this.logger.info("Starting database indexes initialization");

    try {
      await this.createUserIndexes();
      await this.createCrimeReportIndexes();
      await this.createCommentIndexes();
      await this.createNotificationIndexes();
      await this.createFollowersIndexes();
      await this.createBookmarkIndexes();

      this.logger.info("All database indexes created successfully");
    } catch (error: any) {
      this.logger.error(
        `Failed to initialize database indexes: ${error.message}`,
        error
      );
      throw error;
    }
  }

  /**
   * Verifies that all required indexes exist in the database
   * @returns Promise resolving to a boolean indicating if all indexes exist
   */
  public static async verifyIndexes(): Promise<boolean> {
    this.logger.info("Verifying database indexes");

    try {
      const UserModel = (await import("./Auth/auth.model")).default;
      const userIndexes = await UserModel.collection.indexes();

      const { CrimeReport } = await import("./CrimeReport/crimeReport.model");
      const crimeReportIndexes = await CrimeReport.collection.indexes();

      const allIndexesExist =
        userIndexes.length >= 3 && crimeReportIndexes.length >= 4;

      if (allIndexesExist) {
        this.logger.info("All required database indexes verified successfully");
      } else {
        this.logger.warn("Some database indexes are missing");
      }

      return allIndexesExist;
    } catch (error: any) {
      this.logger.error(`Error verifying indexes: ${error.message}`, error);
      return false;
    }
  }
}

/**
 * Initialize all database indexes
 * @returns Promise resolving when all indexes are created
 */
const initializeIndexes = async (): Promise<void> => {
  try {
    await DatabaseIndexingService.initializeIndexes();
  } catch (error: any) {
    console.error("Error initializing database indexes:", error.message);
  }
};

export default initializeIndexes;
