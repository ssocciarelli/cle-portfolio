/**
 * Rafraîchir les captures du guide du visiteur (guide.html).
 * Les captures rouillent dès que l'UI de la démo change — ce script les
 * régénère toutes contre l'app RÉELLE en mode distant.
 *
 * Prérequis (une fois) : la pile de démo tourne en mode distant —
 *   cd ~/cle/apps/api && PORT=3001 DATABASE_URL=postgres://cle:cle_dev_only@localhost:5432/cle \
 *     APP_ORIGINS=http://localhost:5173 RATE_LIMIT_MAX=100000 pnpm dev
 *   cd ~/cle/apps/web && VITE_API_URL=http://localhost:3001 pnpm dev
 *   (base de préproduction semée : cd ~/cle/apps/api && pnpm seed:demo -- --reset)
 *
 * Lancer (playwright vient du monorepo cle) :
 *   cd ~/cle/apps/web && node ~/cle-portfolio/tools/capture-guide.mjs
 *
 * Puis régénérer le PDF (voir tools/README.md) et redéployer le portfolio.
 * NOTE : mode DISTANT obligatoire — en mode maquette la session ne survit
 * pas au rechargement et l'étape 6 (offre → salle) crée la VRAIE salle
 * « Triplex Plateau » qu'affiche la capture 07.
 */
import { chromium } from "@playwright/test";  // fourni par le monorepo cle
import { mkdirSync } from "node:fs";

const BASE = "http://localhost:5173";
const OUT = process.env.GUIDE_OUT ?? "/Users/stevensocciarelli/cle-portfolio/shots/guide";
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1.5 });
const page = await ctx.newPage();
const shot = (name) => page.screenshot({ path: `${OUT}/${name}.png` });

// 1 · Accueil
await page.goto(`${BASE}/`);
await page.waitForTimeout(600);
await shot("01-accueil");

// 2 · Connexion (comptes démo visibles)
await page.goto(`${BASE}/login`);
await page.waitForTimeout(400);
await page.getByText("Comptes de démonstration").scrollIntoViewIfNeeded();
await page.waitForTimeout(200);
await shot("02-connexion");

// Connexion réelle (mode distant : pas de 2FA pour les comptes démo)
await page.locator("main button[type=button]").first().click();
await page.waitForURL("**/app/feed", { timeout: 8000 }).catch(async () => {
  const code = page.getByLabel(/code/i);
  await code.fill("123456");
  await page.locator("button[type=submit]").click();
  await page.waitForURL("**/app/feed", { timeout: 8000 });
});
await page.waitForTimeout(600);

// 3 · Fil
await shot("03-fil");

// 4 · Marché
await page.goto(`${BASE}/app/marketplace/properties`);
await page.waitForTimeout(600);
await shot("04-marche");

// 5 · Fiche + calculatrice
await page.goto(`${BASE}/app/marketplace/properties/p-plateau-plex`);
await page.waitForTimeout(600);
await page.getByText("Calculatrice hypothécaire").scrollIntoViewIfNeeded();
await page.waitForTimeout(300);
await shot("05-calculatrice");

// 6 · Offre simulée (dialogue ouvert)
await page.getByRole("button", { name: "Faire une offre simulée" }).click();
await page.waitForTimeout(400);
await shot("06-offre");
await page.keyboard.press("Escape");
await page.waitForTimeout(200);

// 7 · Salle de transaction (semée)
await page.goto(`${BASE}/app/deal-rooms/room-brossard`);
await page.waitForTimeout(600);
await shot("07-salle");

// 8 · Entreprise confidentielle (verrouillée, formulaire NDA)
await page.goto(`${BASE}/app/marketplace/businesses/b-resto-plateau`);
await page.waitForTimeout(600);
await shot("08-nda");

// 9 · Projet
await page.goto(`${BASE}/app/projects/pr-cohabitat`);
await page.waitForTimeout(600);
await shot("09-projet");

// 10 · Espace investisseurs
await page.goto(`${BASE}/app/investor-hub`);
await page.waitForTimeout(600);
await shot("10-investir");

// 11 · Détail d'offre (porte / KYC simulé)
await page.goto(`${BASE}/app/investor-hub/o-rosemont-reno`);
await page.waitForTimeout(600);
await shot("11-offre-detail");

// 12 · Confidentialité (droits Loi 25)
await page.goto(`${BASE}/app/settings/privacy`);
await page.waitForTimeout(600);
await shot("12-confidentialite");

await browser.close();
console.log("guide shots →", OUT);
