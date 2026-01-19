import mysql from "mysql2/promise";

// Pool de connexions réutilisable
let pool: mysql.Pool | null = null;

export async function getDB() {
  if (pool) return pool;

  const dbConfig = {
    host: process.env.DATABASE_HOST || "localhost",
    port: parseInt(process.env.DATABASE_PORT || "3306"),
    user: process.env.DATABASE_USER || "app_user",
    password: process.env.DATABASE_PASSWORD || "app_password",
    database: process.env.DATABASE_NAME || "vapplestore",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  };

  try {
    pool = mysql.createPool(dbConfig);
    console.log("✅ Database pool created successfully");
    return pool;
  } catch (error) {
    console.error("❌ Database pool error:", error);
    throw error;
  }
}

export async function query(sql: string, values?: any[]) {
  const db = await getDB();
  const connection = await db.getConnection();
  try {
    const [results] = await connection.execute(sql, values || []);
    return results;
  } finally {
    connection.release();
  }
}

export async function closeDB() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
