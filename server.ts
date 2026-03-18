import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import cors from "cors";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import * as bcrypt from "bcryptjs";

const JWT_SECRET = process.env.JWT_SECRET || "as-apt-secret-key-2026";
const DATA_DIR = path.join(process.cwd(), "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const APARTMENTS_FILE = path.join(DATA_DIR, "apartments.json");
const BILLS_FILE = path.join(DATA_DIR, "bills.json";

const readData = (file: string) =>
  JSON.parse(fs.readFileSync(file, "utf-8"));

const writeData = (file: string, data: any) =>
  fs.writeFileSync(file, JSON.stringify(data, null, 2));

// Ensure files exist
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, JSON.stringify([]));
if (!fs.existsSync(APARTMENTS_FILE)) fs.writeFileSync(APARTMENTS_FILE, JSON.stringify([]));
if (!fs.existsSync(BILLS_FILE)) fs.writeFileSync(BILLS_FILE, JSON.stringify([]));

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json());
  app.use(cookieParser());

  // 🔐 Auth Middleware
  const authenticate = (req: any, res: any, next: any) => {
    const token =
      req.cookies.token || req.headers.authorization?.split(" ")[1];

    if (!token) return res.status(401).json({ error: "Unauthorized" });

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      next();
    } catch {
      res.status(401).json({ error: "Invalid token" });
    }
  };

  // --- AUTH ---
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, name } = req.body;
      const users = readData(USERS_FILE);

      const existing = users.find(
        (u: any) => u.email.toLowerCase() === email.toLowerCase()
      );

      if (existing) {
        return res.status(400).json({ error: "User already exists" });
      }

      const hashed = await bcrypt.hash(password, 10);

      const newUser = {
        id: Date.now().toString(),
        email,
        password: hashed,
        displayName: name,
        role: "admin",
        createdAt: new Date().toISOString(),
      };

      users.push(newUser);
      writeData(USERS_FILE, users);

      const { password: _, ...userWithoutPassword } = newUser;

      res.json(userWithoutPassword);
    } catch (err) {
      res.status(500).json({ error: "Server error" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      const users = readData(USERS_FILE);

      const user = users.find((u: any) => u.email === email);

      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      // ✅ FIXED COOKIE
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });

      const { password: _, ...userWithoutPassword } = user;

      res.json({ user: userWithoutPassword, token });
    } catch (err) {
      res.status(500).json({ error: "Server error" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    res.clearCookie("token");
    res.json({ success: true });
  });

  app.get("/api/auth/me", authenticate, (req: any, res) => {
    const users = readData(USERS_FILE);
    const user = users.find((u: any) => u.id === req.user.id);

    if (!user) return res.status(404).json({ error: "User not found" });

    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  });

  // --- BASIC ROUTE EXAMPLE ---
  app.get("/api/apartments", authenticate, (req, res) => {
    res.json(readData(APARTMENTS_FILE));
  });

  // --- VITE ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));

    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();