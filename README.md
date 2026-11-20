# Sylve : site démo de tiny houses

Site one-page statique (HTML, CSS, JS), sans étape de build. Ouvrez `index.html` dans un navigateur.
Les bibliothèques sont chargées depuis des CDN : GSAP 3.13 (ScrollTrigger, SplitText) via cdnjs, Lenis 1.1.20 via jsDelivr.

## Structure
- `index.html` : contenu et balisage sémantique
- `css/style.css` : jetons de design et mise en page
- `js/main.js` : animations GSAP, configurateur, avis, FAQ, formulaire
- `assets/img/` : photos Pexels en WebP. `hero-sky.webp` et `hero-fg.webp` sont deux calques découpés dans la même photo (ciel / paysage + maison).
- `dist/artifact.html` : la même page sans `<html>/<head>/<body>`, pour la publication Artifact

## Style guide (direction « nature chaleureuse »)
| Jeton | Valeur | Rôle |
|---|---|---|
| `--linen` | #EEE8DC | toile principale |
| `--linen-2` | #E2DACA | surfaces secondaires |
| `--moss` | #2F3B2D | sections sombres (avis) |
| `--night` | #161915 | anthracite (modèles, contact, pied de page) |
| `--sage` | #9AA88B | détails végétaux |
| `--amber` | #C98A3E | accent unique : la lumière des lampes |

- Titres : Fraunces (variable, axe SOFT élevé, graisses 300-400) pour la chaleur d'un bois taillé
- Texte : Hanken Grotesk 400/500/600
- Rayons de 14 px pour les images, boutons en pilule, une seule couleur d'accent

## Chorégraphie
1. Intro : deux battants de porte s'ouvrent, le ciel et la maison se posent à des vitesses différentes, et le titre se lève.
2. Hero épinglée : le titre se couche derrière la ligne d'arbres, puis un rideau lin monte vers la section suivante.
3. Manifeste : les mots s'allument au fil du défilement, avec des images en parallaxe.
4. Modèles : un défilement horizontal épinglé, des volets d'image et une parallaxe interne. Sur mobile, les cartes s'empilent.
5. Atelier (moment fort) : une maison SVG se construit en cinq étapes (châssis, ossature, isolation, bardage, lumière), puis la section passe à la nuit et les fenêtres s'allument.
6. Matières : des volets qui s'ouvrent au défilement.
7. Fenêtre : une baie cintrée s'agrandit jusqu'au plein écran sur l'intérieur.
8. Configurateur : un prix animé, et une maison SVG qui change de bardage, de toiture et d'options.
9. Avis, FAQ et contact : un bandeau dont la vitesse suit le défilement, un accordéon, et un formulaire de démonstration qui n'envoie rien.

Si l'utilisateur demande moins d'animations (`prefers-reduced-motion`), le site affiche une version statique complète : pas d'intro ni d'épinglage, et toutes les étapes restent visibles.

Contenu fictif : l'entreprise, les prix et les avis sont inventés pour la démo.
