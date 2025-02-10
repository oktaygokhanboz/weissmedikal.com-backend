import express from "express";
import cors from "cors";
import pg from "pg";
import dotenv from "dotenv";
import nodemailer, { createTransport } from "nodemailer";
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const db = new pg.Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});
db.connect();

const transporter = createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.APP_PASS,
  },
});

app.post("/api/offer-form", async (req, res) => {
  try {
    const newInput = req.body;
    let emailContent = "<h3>Teklif Al Formu Yeni Kayıt</h3>";
    for (const key in newInput) {
      emailContent += `<p><strong>${
        key.charAt(0).toUpperCase() + key.slice(1)
      }</strong>: ${newInput[key]}</p>`;
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: "oktaygokhanboz@outlook.com",
      subject: "Yeni Kayıt: Teklif Al Formu",
      html: emailContent,
    };

    await transporter.sendMail(mailOptions);

    res.send({ message: true });
  } catch (err) {
    res.status(500).send({ message: false });
  }
});

app.get("/api/product-names", async (req, res) => {
  try {
    const result = await db.query("SELECT name FROM products ORDER BY id ASC");
    const names = result.rows.map((p) => p.name);
    res.status(200).json(names);
  } catch (err) {
    console.log(err);
  }
});

app.get("/api/:lang/categories", async (req, res) => {
  const { lang } = req.params;
  const column = lang === "en" ? "category" : "category_tr";
  try {
    const result = await db.query("SELECT * FROM categories ORDER BY id ASC");
    const categories = result.rows.map((c) => c[column]);
    res.status(200).json(categories);
  } catch (err) {
    console.log(err);
  }
});

app.get("/api/:lang/branches", async (req, res) => {
  const { lang } = req.params;
  const column = lang === "en" ? "branch" : "branch_tr";
  try {
    const result = await db.query("SELECT * FROM branches ORDER BY id ASC");
    const branches = result.rows.map((b) => b[column]);
    res.status(200).json(branches);
  } catch (err) {
    console.log(err);
  }
});

app.get("/api/products", async (req, res) => {
  const { c: categoryQuery, b: branchQuery } = req.query;

  const categories = Array.isArray(categoryQuery)
    ? categoryQuery
    : [categoryQuery];
  const branches = Array.isArray(branchQuery) ? branchQuery : [branchQuery];

  try {
    if (!categoryQuery && !branchQuery) {
      const result = await db.query(
        "SELECT id, name, name_tr, category, url_name FROM products ORDER BY name ASC"
      );
      res.status(200).json(result.rows);
    } else if (categoryQuery && !branchQuery) {
      const result = await db.query(
        "SELECT id, name, name_tr, category, url_name FROM products WHERE category = ANY($1) ORDER BY name ASC",
        [categories]
      );
      res.status(200).json(result.rows);
    } else if (!categoryQuery && branchQuery) {
      const result = await db.query(
        "SELECT id, name, name_tr, category, url_name FROM products WHERE branches && $1 ORDER BY name ASC",
        [branches]
      );
      res.status(200).json(result.rows);
    } else {
      const result = await db.query(
        "SELECT id, name, name_tr, category, url_name FROM products WHERE category = ANY($1) AND branches && $2 ORDER BY name ASC",
        [categories, branches]
      );
      res.status(200).json(result.rows);
    }
  } catch (err) {
    res.status(500).json("Something happened in server");
    console.log(err);
  }
});

app.get("/api/product/:item", async (req, res) => {
  const itemUrlName = req.params.item;
  try {
    const result = await db.query(
      "SELECT * FROM products WHERE url_name = $1",
      [itemUrlName]
    );
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.log(err);
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}/api/products`);
});
