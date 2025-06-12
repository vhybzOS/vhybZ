import { type Db, MongoClient, ObjectId } from "mongodb";
import { z } from "zod/v4";

// Load environment variables
const env = Deno.env.toObject();

/**
 * Helper function to get environment variables with defaults
 * @param key - The environment variable name
 * @param defaultValue - Default value if the environment variable is not set
 * @returns The environment variable value
 * @throws {Error} If the environment variable is required but not set
 */
function getEnv(key: string, defaultValue?: string): string {
  const value = env[key] ?? defaultValue;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

// Base schemas without MongoDB types
const BaseUserSchema = z.object({
  googleId: z.string(),
  email: z.email(),
  name: z.string(),
  avatar: z.url().optional(),
  role: z.enum(['user', 'admin', 'superadmin']).default('user'),
  permissions: z.array(z.string()).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

const BaseAppSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  name: z.string().min(1, "App name is required"),
  content: z.string().min(1, "Content cannot be empty"),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Full schemas with MongoDB types
export const UserSchema = BaseUserSchema.extend({
  _id: z.instanceof(ObjectId).optional(),
});

export const AppSchema = BaseAppSchema.extend({
  _id: z.instanceof(ObjectId).optional(),
  userId: z.instanceof(ObjectId),
});

// Types
export type User = z.infer<typeof UserSchema>;
export type App = z.infer<typeof AppSchema>;

// Helper to convert base user to DB user
const toDbUser = (data: z.infer<typeof BaseUserSchema>) => ({
  ...data,
  _id: new ObjectId(),
  createdAt: new Date(),
  updatedAt: new Date(),
});

// Helper to convert base app to DB app
const toDbApp = (data: z.infer<typeof BaseAppSchema>) => ({
  ...data,
  _id: new ObjectId(),
  userId: new ObjectId(data.userId),
  createdAt: new Date(),
  updatedAt: new Date(),
});

// Helper function to parse with Zod and throw user-friendly errors
function parseWithZod<T>(
  schema: z.ZodType<T>,
  data: unknown,
  context: string,
): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new Error(
      `Validation failed for ${context}:\n${result.error.message}`,
    );
  }
  return result.data;
}

class Database {
  private client: MongoClient;
  private dbName: string;
  private isConnected = false;

  constructor() {
    // Get MongoDB URI from environment variables or use default local URI
    const mongoUri = getEnv("MONGODB_URI", "mongodb://localhost:27017");
    this.dbName = getEnv("MONGODB_DB_NAME", "vhybZ");

    this.client = new MongoClient(mongoUri);
  }

  // Initialize database connection and collections
  async connect(): Promise<void> {
    if (this.isConnected) return;

    try {
      await this.client.connect();
      this.isConnected = true;
      console.log("Successfully connected to MongoDB");

      // Initialize collections with validation
      await this.initializeCollections();
    } catch (error) {
      console.error("Failed to connect to MongoDB:", error);
      throw error;
    }
  }

  // Close the database connection
  async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.client.close();
      this.isConnected = false;
      console.log("MongoDB connection closed");
    }
  }

  // Initialize collections with schema validation
  private async initializeCollections(): Promise<void> {
    const db = this.client.db(this.dbName);

    // Create users collection with indexes
    await this.createCollection(db, "users", [
      { key: { googleId: 1 }, options: { unique: true } },
      { key: { email: 1 }, options: { unique: true } },
    ]);

    // Create apps collection with indexes
    await this.createCollection(db, "apps", [
      { key: { userId: 1 } },
    ]);
  }

  /**
   * Helper to create a collection with validation and indexes
   */
  private async createCollection(
    db: Db,
    collectionName: string,
    indexes: Array<{
      key: Record<string, 1 | -1>;
      options?: {
        unique?: boolean;
        [key: string]: unknown;
      };
    }> = [],
  ): Promise<void> {
    try {
      // Create collection without validation
      await db.createCollection(collectionName);

      // Create indexes
      const collection = db.collection(collectionName);
      await Promise.all(
        indexes.map(({ key, options }) => collection.createIndex(key, options)),
      );

      console.log(`Created collection '${collectionName}'`);
    } catch (error: unknown) {
      if ((error as { codeName?: string }).codeName !== "NamespaceExists") {
        throw error;
      }
      console.log(`Collection '${collectionName}' already exists`);
    }
  }

  // User operations
  private get users() {
    return this.client.db(this.dbName).collection<User>("users");
  }

  async findOrCreateUser(googleProfile: {
    id: string;
    email: string;
    name: string;
    picture?: string;
  }): Promise<User> {
    const now = new Date();

    // First try to find existing user
    const existingUser = await this.users.findOne({
      googleId: googleProfile.id,
    });

    if (existingUser) {
      // Update existing user
      const result = await this.users.findOneAndUpdate(
        { _id: existingUser._id },
        {
          $set: {
            name: googleProfile.name,
            email: googleProfile.email,
            avatar: googleProfile.picture,
            updatedAt: now,
          },
        },
        { returnDocument: "after" },
      );

      if (!result) {
        throw new Error("Failed to update user");
      }

      return result as User;
    }

    // Create new user
    const newUser = {
      _id: new ObjectId(),
      googleId: googleProfile.id,
      email: googleProfile.email,
      name: googleProfile.name,
      avatar: googleProfile.picture,
      role: 'user' as const,
      permissions: [],
      createdAt: now,
      updatedAt: now,
    };

    // Validate with base schema
    const validatedData = parseWithZod(BaseUserSchema, newUser, "user");

    const result = await this.users.insertOne(validatedData);

    if (!result.acknowledged) {
      throw new Error("Failed to create user");
    }

    return validatedData as User;
  }

  async getUser(id: string): Promise<User | null> {
    try {
      const user = await this.users.findOne({ _id: new ObjectId(id) });
      if (!user) return null;
      
      return parseWithZod(UserSchema, user, "user");
    } catch (error) {
      console.error("Error getting user:", error);
      return null;
    }
  }

  // App operations
  private get apps() {
    return this.client.db(this.dbName).collection<App>("apps");
  }

  async createApp(userId: string, name: string, content: string): Promise<App> {
    const appData = {
      userId,
      name,
      content,
    };

    // Validate with base schema (no MongoDB types)
    const validatedData = parseWithZod(BaseAppSchema, appData, "app");
    const dbApp = toDbApp(validatedData);

    const result = await this.apps.insertOne(dbApp);

    if (!result.acknowledged) {
      throw new Error("Failed to create app");
    }

    return this.getApp(dbApp._id.toString()) as Promise<App>;
  }

  async getApp(id: string): Promise<App | null> {
    const app = await this.apps.findOne({ _id: new ObjectId(id) });
    if (!app) return null;
    const parsedApp = parseWithZod(AppSchema, app, "app");
    if (!parsedApp) {
      throw new Error("Failed to parse app data");
    }
    return parsedApp;
  }

  async getUserApps(userId: string): Promise<App[]> {
    const apps = await this.apps.find({ userId: new ObjectId(userId) })
      .toArray();
    return apps.map((app: unknown) => parseWithZod(AppSchema, app, "app"));
  }

  async updateApp(
    id: string,
    updates: Partial<Omit<App, "_id" | "userId" | "createdAt">>,
  ): Promise<App | null> {
    const updateData = {
      ...updates,
      updatedAt: new Date(),
    };

    // Validate the update data against the schema (excluding immutable fields)
    const updateSchema = AppSchema.omit({
      _id: true,
      userId: true,
      createdAt: true,
    }).partial();
    const validatedUpdates = updateSchema.parse(updateData);

    const result = await this.apps.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: validatedUpdates },
      { returnDocument: "after" },
    );

    if (!result) return null;
    return parseWithZod(AppSchema, result, "app");
  }

  async deleteApp(id: string): Promise<boolean> {
    const result = await this.apps.deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount > 0;
  }
}

// Create and export a singleton instance
export const db = new Database();

// Helper to ensure database connection is established
export async function ensureDbConnection() {
  await db.connect();
}

// Cleanup on process exit
const signals: Deno.Signal[] = ["SIGINT"]; // Only use SIGINT for Windows
if (Deno.build.os !== "windows") {
  signals.push("SIGTERM", "SIGQUIT");
}

signals.forEach((signal) => {
  try {
    Deno.addSignalListener(signal, async () => {
      console.log(`\nReceived ${signal}, shutting down gracefully...`);
      await db.disconnect();
      Deno.exit(0);
    });
  } catch (error) {
    console.warn(`Failed to set up signal handler for ${signal}:`, error);
  }
});

// Example usage:
/*
async function example() {
  try {
    // Connect to the database
    await ensureDbConnection();

    // Example: Create a user
    const user = await db.findOrCreateUser({
      id: 'google-123',
      email: 'user@example.com',
      name: 'John Doe',
      picture: 'https://example.com/avatar.jpg',
    });

    // Example: Create an app
    const app = await db.createApp(
      user._id.toString(),
      'My First App',
      '<html><body><h1>Hello World</h1></body></html>'
    );

    console.log('Created app:', app);

  } catch (error) {
    console.error('Database error:', error);
  } finally {
    // Close the connection when done
    await db.disconnect();
  }
}

// Run the example
// example().catch(console.error);
*/
