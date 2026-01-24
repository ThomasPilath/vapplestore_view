import mysql from "mysql2/promise";

// Pool de connexions réutilisable
let pool: mysql.Pool | null = null;
let isInitializing = false;

// Fonction de retry avec backoff exponentiel
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 30,
  initialDelayMs: number = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      const delayMs = initialDelayMs * Math.pow(2, Math.min(attempt - 1, 5)); // Max 32s between retries
      console.warn(
        `⏳ Database connection attempt ${attempt}/${maxRetries} failed, retrying in ${delayMs}ms...`,
        (error as Error).message
      );
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw new Error(
    `Failed to connect to database after ${maxRetries} attempts. Last error: ${lastError?.message}`
  );
}

export async function getDB() {
  if (pool) return pool;

  // Éviter les initialisations multiples simultanées
  if (isInitializing) {
    // Attendre que l'initialisation se termine
    let attempts = 0;
    while (!pool && attempts < 100) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      attempts++;
    }
    if (!pool) throw new Error("Database initialization failed");
    return pool;
  }

  isInitializing = true;

  const dbConfig = {
    host: process.env.DATABASE_HOST || "localhost",
    port: parseInt(process.env.DATABASE_PORT || "3306"),
    user: process.env.DATABASE_USER || "app_user",
    password: process.env.DATABASE_PASSWORD || "app_password",
    database: process.env.DATABASE_NAME || "vapplestore",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    // Timeouts pour éviter les connexions bloquées
    connectTimeout: 10000, // 10 secondes pour établir la connexion
    acquireTimeout: 10000, // 10 secondes pour acquérir une connexion du pool
    timeout: 60000, // 60 secondes max pour une requête (pour les longues requêtes)
    // Gestion des connexions perdues
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000, // Envoyer un keepalive toutes les 10s
    // Pool management
    maxIdle: 10, // Garder max 10 connexions idle
    idleTimeout: 60000, // Fermer les connexions idle après 60s
  };

  try {
    // Utiliser retry avec backoff exponentiel pour attendre que MariaDB soit prêt
    await retryWithBackoff(() => {
      return new Promise<void>((resolve, reject) => {
        const testPool = mysql.createPool(dbConfig);
        
        testPool
          .getConnection()
          .then((connection) => {
            connection.release();
            pool = testPool;
            console.log("✅ Database pool created and tested successfully");
            resolve();
          })
          .catch((error) => {
            testPool.end().catch(() => {}); // Fermer le pool en cas d'erreur
            reject(error);
          });
      });
    }, 30, 1000); // 30 tentatives, commençant par 1s de délai

    // Le pool est créé et testé avec succès
    return pool!;
  } catch (error) {
    isInitializing = false;
    console.error("❌ Failed to create database pool:", error);
    throw error;
  }
}

export async function query(sql: string, values?: (string | number | boolean | null)[]): Promise<Record<string, unknown>[]> {
  const db = await getDB();
  const connection = await db.getConnection();
  try {
    const [results] = await connection.execute(sql, values || []);
    return (Array.isArray(results) ? results : []) as Record<string, unknown>[];
  } catch (error) {
    // Log l'erreur pour déboguer les problèmes de connexion
    console.error('❌ Database query error:', error);
    throw error;
  } finally {
    // Toujours libérer la connexion, même en cas d'erreur
    connection.release();
  }
}

export async function closeDB() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
