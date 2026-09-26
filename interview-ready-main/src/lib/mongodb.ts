import { MongoClient, Db, Collection, ObjectId } from "mongodb";
import fs from "node:fs";
import path from "node:path";

export function getCleanMongoUri(): string {
  const rawUri =
    process.env["MONGODB_URI"] ||
    "mongodb+srv://tasneem8_db_user:Tasneem.m%404733@newcluster.ei7r6y1.mongodb.net/interview_ready?appName=newcluster";
  try {
    const protocolMatch = rawUri.match(/^(mongodb(\+srv)?:\/\/)(.*)$/);
    if (!protocolMatch || !protocolMatch[1] || !protocolMatch[3]) return rawUri;
    const rest = protocolMatch[3];
    const lastAtIdx = rest.lastIndexOf("@");
    if (lastAtIdx === -1) return rawUri;

    const userInfo = rest.slice(0, lastAtIdx);
    const hostAndQuery = rest.slice(lastAtIdx + 1);

    const firstColonIdx = userInfo.indexOf(":");
    if (firstColonIdx === -1) return rawUri;

    const username = userInfo.slice(0, firstColonIdx);
    const password = userInfo.slice(firstColonIdx + 1);

    // If password contains unencoded special characters like '@'
    const cleanPassword = password.includes("%40") ? password : encodeURIComponent(password);
    return `${protocolMatch[1]}${username}:${cleanPassword}@${hostAndQuery}`;
  } catch {
    return rawUri;
  }
}

let client: MongoClient | null = null;
let useLocalFallback = false;
let connectionAttempted = false;
let indexesInitialized = false;

// Path to resilient local file-based JSON store
const DATA_DIR = path.resolve(process.cwd(), ".data");
const DB_FILE = path.join(DATA_DIR, "local_db.json");

type DbRecord = Record<string, unknown>;

interface LocalDatabase {
  users: DbRecord[];
  attempts: DbRecord[];
  resumes: DbRecord[];
  target_jobs: DbRecord[];
}

function ensureDbFile(): LocalDatabase {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      const initial: LocalDatabase = { users: [], attempts: [], resumes: [], target_jobs: [] };
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), "utf8");
      return initial;
    }
    const raw = fs.readFileSync(DB_FILE, "utf8");
    return JSON.parse(raw) as LocalDatabase;
  } catch (err) {
    console.error("[LocalDB] Error reading local store:", err);
    return { users: [], attempts: [], resumes: [], target_jobs: [] };
  }
}

function saveDbFile(data: LocalDatabase) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.error("[LocalDB] Error writing local store:", err);
  }
}

function matchQuery(item: DbRecord, query?: Record<string, unknown> | null): boolean {
  if (!query || Object.keys(query).length === 0) return true;
  for (const [key, val] of Object.entries(query)) {
    if (key === "_id") {
      if (String(item["_id"]) !== String(val)) return false;
    } else if (key === "email") {
      if (String(item["email"] || "").toLowerCase() !== String(val || "").toLowerCase())
        return false;
    } else {
      if (item[key] !== val) return false;
    }
  }
  return true;
}

function createLocalCollection<T = DbRecord>(collectionKey: keyof LocalDatabase) {
  return {
    async findOne(query?: Record<string, unknown>, options?: { sort?: Record<string, number> }) {
      const db = ensureDbFile();
      const list: DbRecord[] = db[collectionKey] || [];
      const matched = list.filter((item) => matchQuery(item, query));
      if (options?.sort) {
        const entries = Object.entries(options.sort);
        const firstEntry = entries[0];
        if (firstEntry) {
          const [sortKey, sortVal] = firstEntry;
          const sortDir = typeof sortVal === "number" ? sortVal : 1;
          matched.sort((a, b) => {
            const va =
              new Date((a[sortKey] as string | number | Date) || 0).getTime() ||
              Number(a[sortKey]) ||
              0;
            const vb =
              new Date((b[sortKey] as string | number | Date) || 0).getTime() ||
              Number(b[sortKey]) ||
              0;
            if (va < vb) return -sortDir;
            if (va > vb) return sortDir;
            return 0;
          });
        }
      }
      const item = matched[0];
      return item ? (structuredClone(item) as unknown as T) : null;
    },

    async insertOne(doc: Partial<T> & Record<string, unknown>) {
      const db = ensureDbFile();
      const list: DbRecord[] = db[collectionKey] || [];
      const _id = (doc["_id"] as ObjectId | string | undefined) || new ObjectId();
      const newDoc: DbRecord = {
        ...doc,
        _id,
        createdAt: doc["createdAt"]
          ? new Date(doc["createdAt"] as string | number | Date)
          : new Date(),
        updatedAt: doc["updatedAt"]
          ? new Date(doc["updatedAt"] as string | number | Date)
          : new Date(),
      };
      list.push(newDoc);
      db[collectionKey] = list;
      saveDbFile(db);
      return { insertedId: _id, acknowledged: true };
    },

    async updateOne(
      filter: Record<string, unknown>,
      update: { $set?: DbRecord; $setOnInsert?: DbRecord },
      options?: { upsert?: boolean },
    ) {
      const db = ensureDbFile();
      const list: DbRecord[] = db[collectionKey] || [];
      const index = list.findIndex((item) => matchQuery(item, filter));

      if (index === -1) {
        if (options?.upsert) {
          const _id = new ObjectId();
          const now = new Date();
          const newDoc: DbRecord = {
            _id,
            ...filter,
            ...(update.$setOnInsert || {}),
            ...(update.$set || {}),
            createdAt: update.$setOnInsert?.["createdAt"]
              ? new Date(update.$setOnInsert["createdAt"] as string | number | Date)
              : now,
            updatedAt: update.$set?.["updatedAt"]
              ? new Date(update.$set["updatedAt"] as string | number | Date)
              : now,
          };
          list.push(newDoc);
          db[collectionKey] = list;
          saveDbFile(db);
          return { upsertedId: _id, modifiedCount: 0, upsertedCount: 1, acknowledged: true };
        }
        return { modifiedCount: 0, matchedCount: 0, acknowledged: true };
      }

      if (update.$set) {
        list[index] = {
          ...list[index],
          ...update.$set,
          updatedAt: update.$set["updatedAt"]
            ? new Date(update.$set["updatedAt"] as string | number | Date)
            : new Date(),
        };
      }
      db[collectionKey] = list;
      saveDbFile(db);
      return { modifiedCount: 1, matchedCount: 1, acknowledged: true };
    },

    find(filter?: Record<string, unknown>) {
      let sortKey: string | null = null;
      let sortDir = 1;
      let limitCount = 0;

      return {
        sort(sortObj: Record<string, number>) {
          const entries = Object.entries(sortObj);
          const firstEntry = entries[0];
          if (firstEntry) {
            sortKey = firstEntry[0];
            sortDir = typeof firstEntry[1] === "number" ? firstEntry[1] : 1;
          }
          return this;
        },
        limit(n: number) {
          limitCount = n;
          return this;
        },
        async toArray() {
          const db = ensureDbFile();
          const list: DbRecord[] = db[collectionKey] || [];
          let matches = list.filter((item) => matchQuery(item, filter));
          if (sortKey) {
            const key = sortKey;
            const dir = sortDir;
            matches.sort((a, b) => {
              const va =
                new Date((a[key] as string | number | Date) || 0).getTime() || Number(a[key]) || 0;
              const vb =
                new Date((b[key] as string | number | Date) || 0).getTime() || Number(b[key]) || 0;
              if (va < vb) return -dir;
              if (va > vb) return dir;
              return 0;
            });
          }
          if (limitCount > 0) {
            matches = matches.slice(0, limitCount);
          }
          return structuredClone(matches) as unknown as T[];
        },
      };
    },

    async deleteMany(filter?: Record<string, unknown>) {
      const db = ensureDbFile();
      const list: DbRecord[] = db[collectionKey] || [];
      const remaining = list.filter((item) => !matchQuery(item, filter));
      const deletedCount = list.length - remaining.length;
      db[collectionKey] = remaining;
      saveDbFile(db);
      return { deletedCount, acknowledged: true };
    },

    async createIndex() {
      return "index_created";
    },
  };
}

async function initMongoOrFallback(): Promise<MongoClient | null> {
  if (useLocalFallback) {
    return null;
  }
  if (client) {
    return client;
  }
  if (!connectionAttempted) {
    connectionAttempted = true;
    const cleanUri = getCleanMongoUri();
    try {
      const mongo = new MongoClient(cleanUri, {
        serverSelectionTimeoutMS: 3000,
        connectTimeoutMS: 3000,
      });
      await mongo.connect();
      client = mongo;
      console.log("[MongoDB] Connected successfully to:", cleanUri.replace(/\/\/[^@]+@/, "//***@"));
      return client;
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.warn(
        `[MongoDB] Notice: Could not connect to MongoDB at "${cleanUri.replace(/\/\/[^@]+@/, "//***@")}" (${errMsg || "connection failed"}). ` +
          `Automatically using resilient local file storage at ".data/local_db.json". ` +
          `Authentication, mock interviews, and resumes will work immediately without interruption.`,
      );
      useLocalFallback = true;
      return null;
    }
  }
  return null;
}

export async function getMongoClient(): Promise<MongoClient | null> {
  return initMongoOrFallback();
}

export async function getDatabase(dbName = "interview_ready"): Promise<Db | null> {
  const mongoClient = await initMongoOrFallback();
  if (mongoClient) {
    return mongoClient.db(dbName);
  }
  return null;
}

export function isUsingLocalFallback(): boolean {
  return useLocalFallback;
}

/* ------------------------------------------------------------------ */
/* Model Document Types                                               */
/* ------------------------------------------------------------------ */

export interface UserDoc {
  _id?: ObjectId | string;
  email: string;
  passwordHash: string;
  displayName?: string | undefined;
  createdAt: Date;
  updatedAt: Date;
}

export interface AttemptDoc {
  _id?: ObjectId | string;
  userId: string;
  localId: string;
  takenAt: Date;
  jobTitle: string;
  org: string;
  readiness: number;
  metrics: Array<{ key: string; label: string; score: number }>;
  questionsAnswered: number;
  transcript: Array<{
    questionId: number;
    cls: string;
    prompt: string;
    text: string;
    mode: string;
  }>;
  voiceMetrics: Array<{
    questionId: number;
    seconds: number;
    fillerWords: number;
    longPauses: number;
    wordsPerMinute: number;
  }>;
  star: Array<Record<string, unknown>>;
  createdAt: Date;
}

export interface ResumeDoc {
  _id?: ObjectId | string;
  userId: string;
  fileName: string | null;
  content: string;
  wordCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TargetJobDoc {
  _id?: ObjectId | string;
  userId: string;
  title: string;
  org: string;
  location?: string | undefined;
  description: string;
  skills: string[];
  source: string;
  createdAt: Date;
  updatedAt: Date;
}

/* ------------------------------------------------------------------ */
/* Collection Helpers                                                 */
/* ------------------------------------------------------------------ */

export async function getCollections() {
  const mongoClient = await initMongoOrFallback();

  if (mongoClient && !useLocalFallback) {
    const db = mongoClient.db("interview_ready");
    const users = db.collection<UserDoc>("users");
    const attempts = db.collection<AttemptDoc>("attempts");
    const resumes = db.collection<ResumeDoc>("resumes");
    const targetJobs = db.collection<TargetJobDoc>("target_jobs");

    if (!indexesInitialized) {
      indexesInitialized = true;
      users.createIndex({ email: 1 }, { unique: true }).catch(() => {});
      attempts.createIndex({ userId: 1, takenAt: -1 }).catch(() => {});
      resumes.createIndex({ userId: 1 }).catch(() => {});
      targetJobs.createIndex({ userId: 1 }).catch(() => {});
    }

    return { users, attempts, resumes, targetJobs };
  }

  // Resilient local store fallback
  return {
    users: createLocalCollection<UserDoc>("users") as unknown as Collection<UserDoc>,
    attempts: createLocalCollection<AttemptDoc>("attempts") as unknown as Collection<AttemptDoc>,
    resumes: createLocalCollection<ResumeDoc>("resumes") as unknown as Collection<ResumeDoc>,
    targetJobs: createLocalCollection<TargetJobDoc>(
      "target_jobs",
    ) as unknown as Collection<TargetJobDoc>,
  };
}
