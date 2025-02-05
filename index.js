import express from "express";
import cors from "cors";
import pg from "pg";

const app = express();
const port = 3000 || 8080;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "weissmedical",
  password: "Du86vp5SJ8XQ",
  port: 5432,
});
db.connect();

const corsOptions = {
  origin: "http://localhost:5173",
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

app.get("/api/product-names", async (req, res) => {
  try {
    const result = await db.query("SELECT name FROM products ORDER BY id ASC");
    const names = result.rows.map((p) => p.name);
    res.status(200).json(names);
  } catch (err) {
    console.log(err);
  }
});

app.get("/api/categories", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM categories ORDER BY id ASC");
    const categories = result.rows.map((c) => c.category);
    res.status(200).json(categories);
  } catch (err) {
    console.log(err);
  }
});

app.get("/api/branches", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM branches ORDER BY id ASC");
    const branches = result.rows.map((b) => b.branch);
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
        "SELECT id, name, category, url_name FROM products ORDER BY name ASC"
      );
      res.status(200).json(result.rows);
    } else if (categoryQuery && !branchQuery) {
      const result = await db.query(
        "SELECT id, name, category, url_name FROM products WHERE category = ANY($1) ORDER BY name ASC",
        [categories]
      );
      res.status(200).json(result.rows);
    } else if (!categoryQuery && branchQuery) {
      const result = await db.query(
        "SELECT id, name, category, url_name FROM products WHERE branches && $1 ORDER BY name ASC",
        [branches]
      );
      res.status(200).json(result.rows);
    } else {
      const result = await db.query(
        "SELECT id, name, category, url_name FROM products WHERE category = ANY($1) AND branches && $2 ORDER BY name ASC",
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

// SELECT id, name, category, url_name FROM products WHERE category = ANY($1) AND branches && $2 ORDER BY name ASC
