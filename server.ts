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
const BILLS_FILE = path.join(DATA_DIR, "bills.json");

const readData = (file: string) => JSON.parse(fs.readFileSync(file, "utf-8"));
const writeData = (file: string, data: any) => fs.writeFileSync(file, JSON.stringify(data, null, 2));

// Ensure data directory and files exist
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, JSON.stringify([]));
if (!fs.existsSync(APARTMENTS_FILE)) {
  const initialApartments = [
    { id: "1", number: "201", floor: "2", position: "front", type: "one-bedroom", status: "vacant", tenantName: "", tenantPhone: "", moveInDate: "", monthlyRent: 0, paymentDuration: 1 },
    { id: "2", number: "202", floor: "2", position: "back", type: "one-bedroom", status: "vacant", tenantName: "", tenantPhone: "", moveInDate: "", monthlyRent: 0, paymentDuration: 1 },
    { id: "3", number: "301", floor: "3", position: "front", type: "one-bedroom", status: "vacant", tenantName: "", tenantPhone: "", moveInDate: "", monthlyRent: 0, paymentDuration: 1 },
    { id: "4", number: "302", floor: "3", position: "back", type: "one-bedroom", status: "vacant", tenantName: "", tenantPhone: "", moveInDate: "", monthlyRent: 0, paymentDuration: 1 },
    { id: "5", number: "401", floor: "4", position: "front", type: "one-bedroom", status: "vacant", tenantName: "", tenantPhone: "", moveInDate: "", monthlyRent: 0, paymentDuration: 1 },
    { id: "6", number: "402", floor: "4", position: "back", type: "one-bedroom", status: "vacant", tenantName: "", tenantPhone: "", moveInDate: "", monthlyRent: 0, paymentDuration: 1 },
    { id: "7", number: "501", floor: "5", position: "single", type: "one-bedroom", status: "vacant", tenantName: "", tenantPhone: "", moveInDate: "", monthlyRent: 0, paymentDuration: 1 },
  ];
  writeData(APARTMENTS_FILE, initialApartments);
}
if (!fs.existsSync(BILLS_FILE)) fs.writeFileSync(BILLS_FILE, JSON.stringify([]));

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());
  app.use(cookieParser());

  // Auth Middleware
  const authenticate = (req: any, res: any, next: any) => {
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      next();
    } catch (err) {
      res.status(401).json({ error: "Invalid token" });
    }
  };

  // --- Auth Routes ---
  app.post("/api/auth/register", async (req, res) => {
    const { email, password, name } = req.body;
    console.log(`Registration attempt for: ${email}`);
    const users = readData(USERS_FILE);
    const trimmedEmail = email.toLowerCase().trim();
    if (users.find((u: any) => u.email.toLowerCase().trim() === trimmedEmail)) {
      console.log(`User already exists: ${trimmedEmail}`);
      return res.status(400).json({ error: "User already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const isFirstUser = users.length === 0;
    const newUser = {
      id: Date.now().toString(),
      email: trimmedEmail,
      password: hashedPassword,
      displayName: name,
      role: isFirstUser ? "super_admin" : "admin",
      status: isFirstUser ? "approved" : "pending",
      createdAt: new Date().toISOString(),
      hiddenModules: [],
    };
    users.push(newUser);
    writeData(USERS_FILE, users);
    console.log(`User registered successfully: ${trimmedEmail}`);
    const { password: _, ...userWithoutPassword } = newUser;
    res.json(userWithoutPassword);
  });

  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    console.log(`Login attempt for: ${email}`);
    const users = readData(USERS_FILE);
    const trimmedEmail = email.toLowerCase().trim();
    const user = users.find((u: any) => u.email.toLowerCase().trim() === trimmedEmail);
    
    if (!user) {
      console.log(`User not found: ${trimmedEmail}`);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    console.log(`Password match for ${trimmedEmail}: ${isMatch}`);

    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
    res.cookie("token", token, { httpOnly: true, secure: true, sameSite: "none" });
    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword, token });
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

  // --- User Management ---
  app.get("/api/users", authenticate, (req: any, res) => {
    const users = readData(USERS_FILE).map(({ password, ...u }: any) => u);
    res.json(users);
  });

  app.patch("/api/users/:id", authenticate, (req: any, res) => {
    if (req.user.role !== "super_admin") return res.status(403).json({ error: "Forbidden" });
    const users = readData(USERS_FILE);
    const index = users.findIndex((u: any) => u.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: "User not found" });
    users[index] = { ...users[index], ...req.body };
    writeData(USERS_FILE, users);
    res.json(users[index]);
  });

  // --- Apartment Routes ---
  app.get("/api/apartments", authenticate, (req, res) => {
    res.json(readData(APARTMENTS_FILE));
  });

  app.post("/api/apartments", authenticate, (req, res) => {
    const apartments = readData(APARTMENTS_FILE);
    const newApt = { ...req.body, id: Date.now().toString() };
    apartments.push(newApt);
    writeData(APARTMENTS_FILE, apartments);
    res.json(newApt);
  });

  app.patch("/api/apartments/:id", authenticate, (req, res) => {
    const apartments = readData(APARTMENTS_FILE);
    const index = apartments.findIndex((a: any) => a.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: "Not found" });
    apartments[index] = { ...apartments[index], ...req.body };
    writeData(APARTMENTS_FILE, apartments);
    res.json(apartments[index]);
  });

  // --- Bill Routes ---
  app.get("/api/bills", authenticate, (req, res) => {
    res.json(readData(BILLS_FILE));
  });

  app.post("/api/bills", authenticate, (req, res) => {
    const bills = readData(BILLS_FILE);
    const newBill = { ...req.body, id: Date.now().toString(), createdAt: new Date().toISOString() };
    bills.push(newBill);
    writeData(BILLS_FILE, bills);
    res.json(newBill);
  });

  app.patch("/api/bills/:id", authenticate, (req, res) => {
    const bills = readData(BILLS_FILE);
    const index = bills.findIndex((b: any) => b.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: "Not found" });
    bills[index] = { ...bills[index], ...req.body };
    writeData(BILLS_FILE, bills);
    res.json(bills[index]);
  });

  app.delete("/api/bills/:id", authenticate, (req, res) => {
    const bills = readData(BILLS_FILE);
    const filtered = bills.filter((b: any) => b.id !== req.params.id);
    writeData(BILLS_FILE, filtered);
    res.json({ success: true });
  });

  // --- Vite Middleware ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
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
