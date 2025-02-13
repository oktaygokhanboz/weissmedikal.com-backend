import express from "express";
import cors from "cors";
import pg from "pg";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
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

const transporter = nodemailer.createTransport({
  service: "Yandex",
  auth: {
    user: process.env.FROM_EMAIL_USER,
    pass: process.env.FROM_EMAIL_PASS,
  },
});

app.post("/api/offer-form", async (req, res) => {
  try {
    const newInput = req.body;
    let emailContent = "<h3>Yeni Kayıt: Teklif Al Formu</h3>";
    for (const key in newInput) {
      emailContent += `<p><strong>${
        key.charAt(0).toUpperCase() + key.slice(1)
      }</strong>: ${newInput[key]}</p>`;
    }

    const mailOptions = {
      from: process.env.FROM_EMAIL_USER,
      to: process.env.TO_EMAIL_USER,
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
    const result = await db.query(
      "SELECT name, name_tr FROM products ORDER BY id ASC"
    );
    const names = result.rows.map((p) => p.name);
    const names_tr = result.rows.map((p) => p.name_tr);
    res.status(200).json({ names: names, names_tr: names_tr });
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

app.get("/api/:branch", async (req, res) => {
  let { branch } = req.params;
  branch = branch.replaceAll("-", " ");
  const { c: categoryQuery } = req.query;
  const categories = Array.isArray(categoryQuery)
    ? categoryQuery
    : [categoryQuery];

  try {
    if (!categoryQuery) {
      const result = await db.query(
        "SELECT name, name_tr, category, url_name FROM products WHERE $1 ILIKE ANY(branches) ORDER BY category DESC",
        [branch]
      );
      res.status(200).json(result.rows);
    } else {
      const result = await db.query(
        "SELECT name, name_tr, category, url_name FROM products WHERE $1 ILIKE ANY(branches) AND category = ANY($2) ORDER BY category DESC",
        [branch, categories]
      );
      res.status(200).json(result.rows);
    }
  } catch (err) {
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
  console.log(`Server is running on http://localhost:${port}/api/`);
});
