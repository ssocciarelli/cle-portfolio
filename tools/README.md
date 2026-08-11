# Outils du portfolio

## Rafraîchir le guide du visiteur (captures + PDF)

Le guide `guide.html` montre de vraies captures de la démo. Elles rouillent
quand l'UI change — voici comment les régénérer, de façon reproductible.

1. **Démarrer la pile de démo en mode distant** (voir l'en-tête de
   `capture-guide.mjs` pour les commandes exactes) et semer la base :
   `cd ~/cle/apps/api && pnpm seed:demo -- --reset`.

2. **Recapturer les 12 images** — le script DOIT s'exécuter depuis l'arbre du
   monorepo `cle` (sinon Node résout `@playwright/test` depuis le dossier du
   script, où il n'existe pas). On le copie donc dans `apps/web` le temps du
   run :
   ```
   cd ~/cle/apps/web && cp ~/cle-portfolio/tools/capture-guide.mjs ./_cap.mjs \
     && node _cap.mjs && rm _cap.mjs
   ```
   → écrit dans `~/cle-portfolio/shots/guide/*.png`.

3. **Régénérer le PDF imprimable** :
   ```
   cd ~/cle/apps/web && node -e '
     import("@playwright/test").then(async ({chromium}) => {
       const b = await chromium.launch();
       const p = await b.newPage({viewport:{width:1100,height:900}});
       await p.goto("file:///Users/stevensocciarelli/cle-portfolio/guide.html");
       await p.waitForTimeout(800);
       await p.pdf({path:"/Users/stevensocciarelli/cle-portfolio/guide.pdf",
         format:"Letter",printBackground:true,
         margin:{top:"12mm",bottom:"14mm",left:"10mm",right:"10mm"}});
       await b.close(); console.log("pdf ok");
     })'
   ```

4. **Vérifier l'accessibilité** de la page avant de pousser (aucune violation
   sérieuse attendue — un H1, alt sur chaque image, contraste AA) :
   axe-core est dispo dans `~/cle/apps/web` ; scanner `guide.html` en FR et EN.

5. **Déployer** : `git add -A && git commit && git push` dans `~/cle-portfolio`
   (GitHub Pages sert la racine).
