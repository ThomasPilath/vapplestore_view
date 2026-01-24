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
    pool = mysql.createPool(dbConfig);
    console.log("✅ Database pool created successfully");
    
    // Gestion des erreurs de pool
    pool.on('connection', (connection) => {
      console.log('🔌 New database connection established');
    });
    
    pool.on('release', (connection) => {
      // Connexion retournée au pool (optionnel, peut être verbeux)
    });
    
    return pool;
  } catch (error) {
    console.error("❌ Database pool error:", error);
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
