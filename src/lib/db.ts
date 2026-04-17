import bcrypt from "bcryptjs";
import { User } from "../types";

// Pre-hashed passwords for test credentials
// admin / admin123
// john_doe / password123
// jane_smith / secret456

const SALT_ROUNDS = 10;

export const createUsers = async (): Promise<User[]> => [
  {
    id: 1,
    username: "admin",
    password: await bcrypt.hash("admin123", SALT_ROUNDS),
    role: "admin",
  },
  {
    id: 2,
    username: "john_doe",
    password: await bcrypt.hash("password123", SALT_ROUNDS),
    role: "user",
  },
  {
    id: 3,
    username: "jane_smith",
    password: await bcrypt.hash("secret456", SALT_ROUNDS),
    role: "user",
  },
];

// Singleton pattern — users initialized once at startup
let usersCache: User[] | null = null;

export const getUsers = async (): Promise<User[]> => {
  if (!usersCache) {
    usersCache = await createUsers();
  }
  return usersCache;
};

export const findUserByUsername = async (
  username: string
): Promise<User | undefined> => {
  const users = await getUsers();
  return users.find((u) => u.username === username);
};

export const findUserById = async (id: number): Promise<User | undefined> => {
  const users = await getUsers();
  return users.find((u) => u.id === id);
};
