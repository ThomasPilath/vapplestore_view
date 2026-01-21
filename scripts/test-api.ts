/**
 * Script de test pour vérifier le chargement des données
 * Usage: bun run scripts/test-api.ts
 */

const API_URL = "http://localhost:3000";

async function login() {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username: "admin",
      password: "AdminPassword123",
    }),
  });

  if (!response.ok) {
    throw new Error(`Login failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.tokens.accessToken;
}

async function testAPI(endpoint: string, token: string) {
  const response = await fetch(`${API_URL}/api${endpoint}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`API call failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data;
}

async function main() {
  try {
    console.log("🔐 Connexion...");
    const token = await login();
    console.log("✅ Connecté avec succès");
    console.log("Token:", token.slice(0, 30) + "...");

    console.log("\n📊 Test /api/revenues...");
    const revenues = await testAPI("/revenues", token);
    console.log(`✅ ${revenues.data?.length || 0} revenues récupérés`);
    if (revenues.data?.length > 0) {
      console.log("Premier revenue:", revenues.data[0]);
    }

    console.log("\n🛒 Test /api/purchases...");
    const purchases = await testAPI("/purchases", token);
    console.log(`✅ ${purchases.data?.length || 0} purchases récupérés`);
    if (purchases.data?.length > 0) {
      console.log("Premier purchase:", purchases.data[0]);
    }

    console.log("\n✅ Tous les tests ont réussi !");
  } catch (error) {
    console.error("❌ Erreur:", error);
    process.exit(1);
  }
}

main();
