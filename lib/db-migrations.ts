/**
 * Système de migration et vérification de schéma
 * Vérifie et met à jour automatiquement la structure des tables
 */

import { query } from "@/lib/db";

interface ColumnInfo {
  Field: string;
  Type: string;
  Null: string;
  Key: string;
  Default: string | null;
  Extra: string;
}

/**
 * Schémas attendus pour chaque table
 */
const EXPECTED_SCHEMAS = {
  roles: [
    { name: "id", type: "varchar(36)", nullable: false, isPrimary: true },
    { name: "roleName", type: "varchar(50)", nullable: false },
    { name: "level", type: "int", nullable: false, default: "0" },
  ],
  users: [
    { name: "id", type: "varchar(36)", nullable: false, isPrimary: true },
    { name: "username", type: "varchar(100)", nullable: false },
    { name: "password", type: "varchar(255)", nullable: false },
    { name: "role", type: "varchar(36)", nullable: false },
    { name: "settings", type: "json", nullable: true },
    { name: "createdAt", type: "datetime", nullable: false, default: "CURRENT_TIMESTAMP" },
  ],
  revenues: [
    { name: "id", type: "varchar(36)", nullable: false, isPrimary: true },
    { name: "date", type: "date", nullable: false },
    { name: "base20", type: "decimal(10,2)", nullable: false, default: "0.00" },
    { name: "tva20", type: "decimal(10,2)", nullable: false, default: "0.00" },
    { name: "base5_5", type: "decimal(10,2)", nullable: false, default: "0.00" },
    { name: "tva5_5", type: "decimal(10,2)", nullable: false, default: "0.00" },
    { name: "createdAt", type: "datetime", nullable: false, default: "CURRENT_TIMESTAMP" },
    { name: "updatedAt", type: "datetime", nullable: false, default: "CURRENT_TIMESTAMP" },
  ],
  purchases: [
    { name: "id", type: "varchar(36)", nullable: false, isPrimary: true },
    { name: "date", type: "date", nullable: false },
    { name: "totalHT", type: "decimal(10,2)", nullable: false, default: "0.00" },
    { name: "tva", type: "decimal(10,2)", nullable: false, default: "0.00" },
    { name: "shippingFee", type: "decimal(10,2)", nullable: false, default: "0.00" },
    { name: "totalTTC", type: "decimal(10,2)", nullable: false, default: "0.00" },
    { name: "createdAt", type: "datetime", nullable: false, default: "CURRENT_TIMESTAMP" },
    { name: "updatedAt", type: "datetime", nullable: false, default: "CURRENT_TIMESTAMP" },
  ],
};

/**
 * Vérifie si une table existe
 */
async function tableExists(tableName: string): Promise<boolean> {
  try {
    const result = await query(
      `SELECT COUNT(*) as count FROM information_schema.tables 
       WHERE table_schema = DATABASE() AND table_name = ?`,
      [tableName]
    ) as any[];
    return result[0]?.count > 0;
  } catch (error) {
    console.error(`❌ Error checking table ${tableName}:`, error);
    return false;
  }
}

/**
 * Récupère les colonnes actuelles d'une table
 */
async function getTableColumns(tableName: string): Promise<ColumnInfo[]> {
  try {
    const columns = await query(`SHOW COLUMNS FROM ${tableName}`) as ColumnInfo[];
    return columns;
  } catch (error) {
    console.error(`❌ Error getting columns for ${tableName}:`, error);
    return [];
  }
}

/**
 * Normalise le type SQL pour la comparaison
 */
function normalizeType(type: string): string {
  return type.toLowerCase()
    .replace(/\s+/g, "")
    .replace("unsigned", "")
    .trim();
}

/**
 * Migre les données de revenues_OLD vers revenues
 */
async function migrateOldRevenuesData(): Promise<void> {
  try {
    const hasOldTable = await tableExists("revenues_OLD");
    if (!hasOldTable) return;

    console.log("📦 Migration des données revenues_OLD → revenues...");

    // Vérifier si revenues_OLD a des données
    const oldData = await query(`SELECT * FROM revenues_OLD`) as any[];
    if (!oldData || oldData.length === 0) {
      console.log("ℹ️  Aucune donnée à migrer depuis revenues_OLD");
      return;
    }

    // Migrer chaque ligne
    for (const row of oldData) {
      const base20 = Number(row.base20 ?? 0);
      const tva20 = Number(row.tva20 ?? 0);
      const base5_5 = Number(row.base5_5 ?? 0);
      const tva5_5 = Number(row.tva5_5 ?? 0);

      await query(
        `INSERT INTO revenues (id, date, base20, tva20, base5_5, tva5_5, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
         base20 = VALUES(base20),
         tva20 = VALUES(tva20),
         base5_5 = VALUES(base5_5),
         tva5_5 = VALUES(tva5_5)`,
        [
          row.id,
          row.date,
          base20,
          tva20,
          base5_5,
          tva5_5,
          row.createdAt,
          row.updatedAt ?? row.createdAt,
        ]
      );
    }

    console.log(`✅ Migration de ${oldData.length} entrées revenues terminée`);
  } catch (error) {
    console.error("❌ Erreur lors de la migration revenues_OLD:", error);
  }
}

/**
 * Migre les données de purchases avec ancien schéma (priceHT) vers nouveau (totalHT)
 */
async function migratePurchasesSchema(): Promise<void> {
  try {
    const columns = await getTableColumns("purchases");
    const hasPriceHT = columns.some((col) => col.Field === "priceHT");
    const hasTotalHT = columns.some((col) => col.Field === "totalHT");

    if (hasPriceHT && !hasTotalHT) {
      console.log("📦 Migration du schéma purchases: priceHT → totalHT...");
      
      // Renommer priceHT en totalHT
      await query(`ALTER TABLE purchases CHANGE COLUMN priceHT totalHT DECIMAL(10,2) NOT NULL DEFAULT 0.00`);
      
      console.log("✅ Schéma purchases mis à jour");
    }

    // Vérifier et renommer ttc → totalTTC si nécessaire
    const hasTTC = columns.some((col) => col.Field === "ttc");
    const hasTotalTTC = columns.some((col) => col.Field === "totalTTC");

    if (hasTTC && !hasTotalTTC) {
      console.log("📦 Migration du schéma purchases: ttc → totalTTC...");
      await query(`ALTER TABLE purchases CHANGE COLUMN ttc totalTTC DECIMAL(10,2) NOT NULL DEFAULT 0.00`);
      console.log("✅ Colonne ttc renommée en totalTTC");
    }
  } catch (error) {
    console.error("❌ Erreur lors de la migration du schéma purchases:", error);
  }
}

/**
 * Migre les données de revenues avec ancien schéma (ht/ttc stockés) vers nouveau (calculés)
 */
async function migrateRevenuesSchema(): Promise<void> {
  try {
    const columns = await getTableColumns("revenues");
    const hasHT = columns.some((col) => col.Field === "ht");
    const hasTTC = columns.some((col) => col.Field === "ttc");

    if (hasHT || hasTTC) {
      console.log("📦 Nettoyage du schéma revenues: suppression des colonnes ht/ttc...");
      
      if (hasHT) {
        await query(`ALTER TABLE revenues DROP COLUMN ht`);
      }
      if (hasTTC) {
        await query(`ALTER TABLE revenues DROP COLUMN ttc`);
      }
      
      console.log("✅ Colonnes ht/ttc supprimées de revenues");
    }
  } catch (error) {
    console.error("❌ Erreur lors de la migration du schéma revenues:", error);
  }
}

/**
 * Vérifie et met à jour une table spécifique
 */
async function verifyAndUpdateTable(tableName: string): Promise<void> {
  const expectedColumns = EXPECTED_SCHEMAS[tableName as keyof typeof EXPECTED_SCHEMAS];
  if (!expectedColumns) return;

  const exists = await tableExists(tableName);
  if (!exists) {
    console.log(`⚠️  Table ${tableName} n'existe pas, elle sera créée par initializeDatabase`);
    return;
  }

  const currentColumns = await getTableColumns(tableName);
  const currentColumnNames = currentColumns.map((col) => col.Field);

  // Vérifier les colonnes manquantes
  for (const expectedCol of expectedColumns) {
    const exists = currentColumnNames.includes(expectedCol.name);
    
    if (!exists) {
      console.log(`➕ Ajout de la colonne ${tableName}.${expectedCol.name}...`);
      
      let alterSQL = `ALTER TABLE ${tableName} ADD COLUMN ${expectedCol.name} ${expectedCol.type}`;
      
      if (!expectedCol.nullable) {
        alterSQL += " NOT NULL";
      }
      
      if (expectedCol.default) {
        if (expectedCol.default === "CURRENT_TIMESTAMP") {
          alterSQL += " DEFAULT CURRENT_TIMESTAMP";
        } else {
          alterSQL += ` DEFAULT ${expectedCol.default}`;
        }
      }
      
      try {
        await query(alterSQL);
        console.log(`✅ Colonne ${tableName}.${expectedCol.name} ajoutée`);
      } catch (error) {
        console.error(`❌ Erreur ajout colonne ${tableName}.${expectedCol.name}:`, error);
      }
    }
  }

  // Vérifier les types de colonnes existantes
  for (const expectedCol of expectedColumns) {
    const currentCol = currentColumns.find((col) => col.Field === expectedCol.name);
    if (currentCol) {
      const currentType = normalizeType(currentCol.Type);
      const expectedType = normalizeType(expectedCol.type);
      
      if (currentType !== expectedType) {
        console.log(`🔄 Modification du type de ${tableName}.${expectedCol.name}: ${currentCol.Type} → ${expectedCol.type}`);
        
        let alterSQL = `ALTER TABLE ${tableName} MODIFY COLUMN ${expectedCol.name} ${expectedCol.type}`;
        
        if (!expectedCol.nullable) {
          alterSQL += " NOT NULL";
        }
        
        if (expectedCol.default && expectedCol.default !== "CURRENT_TIMESTAMP") {
          alterSQL += ` DEFAULT ${expectedCol.default}`;
        }
        
        try {
          await query(alterSQL);
          console.log(`✅ Type de ${tableName}.${expectedCol.name} mis à jour`);
        } catch (error) {
          console.error(`❌ Erreur modification type ${tableName}.${expectedCol.name}:`, error);
        }
      }
    }
  }
}

/**
 * Vérifie et met à jour toutes les tables
 */
export async function verifyAndMigrateTables(): Promise<void> {
  console.log("🔍 Vérification de la structure de la base de données...");

  try {
    // D'abord, créer les tables si elles n'existent pas (via initializeDatabase)
    const { initializeDatabase } = await import("@/lib/db-init");
    await initializeDatabase();

    // Ensuite, migrer les schémas
    await migrateRevenuesSchema();
    await migratePurchasesSchema();

    // Migrer les données de revenues_OLD si présentes
    await migrateOldRevenuesData();

    // Vérifier et mettre à jour chaque table
    for (const tableName of Object.keys(EXPECTED_SCHEMAS)) {
      await verifyAndUpdateTable(tableName);
    }

    console.log("✅ Vérification et migration de la base de données terminées");
  } catch (error) {
    console.error("❌ Erreur lors de la vérification/migration:", error);
    throw error;
  }
}
