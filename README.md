# MORDRA 3.3.2 — RANDOM KILLER FIX

Mise à jour joueurs / rôles.

## Corrigé
- Le Tueur est tiré totalement aléatoirement à chaque partie.
- Aucun ordre fixe.
- Aucun système de joueur de gauche.
- Le même joueur peut être Tueur plusieurs fois de suite.
- Un autre joueur peut aussi être Tueur plusieurs fois de suite.
- Le futur mode Double Tueur utilise aussi un tirage aléatoire.
- Le joueur qui commence à parler est aussi choisi aléatoirement.

# MORDRA 3.3.1 — WORD BALANCE FIX

Mise à jour basée sur vos vrais tests de partie.

## Corrigé / Ajouté
- En mode Classique, le Tueur n'a plus de mot.
- En mode Blitz, le Tueur n'a plus de mot.
- En mode Mystère, le Tueur garde un mot proche, car personne ne voit son rôle.
- Anti-répétition renforcé.
- Le jeu évite de ressortir les mêmes paires trop rapidement.
- Le jeu évite l'inversion directe d'une paire déjà jouée.
- Les paires trop proches ressortent moins souvent.
- Meilleur équilibre pour les parties à 3 ou 4 joueurs.

# MORDRA 3.2 — VICTORY CHESTS

Grosse mise à jour de récompense.

## Ajouté
- Coffre de victoire à la fin de partie.
- Le meilleur joueur de l'équipe gagnante reçoit un coffre.
- Coffres : Bronze, Argent, Or, Mythique.
- Récompenses équilibrées en Éclats de Sang.
- Petite chance de débloquer un cosmétique.
- Animation d'ouverture du coffre.
- Récompense sauvegardée automatiquement.

## Équilibrage
- Bronze : 20 à 50 Éclats, très fréquent.
- Argent : 60 à 100 Éclats, rare.
- Or : 120 à 180 Éclats, très rare, cosmétique garanti.
- Mythique : 300 à 500 Éclats, extrêmement rare, cosmétique garanti.

# MORDRA 3.1.1 — MODE CLEANUP

Petite mise à jour de logique.

## Corrigé
- Le menu “Mode de dévoilement” est retiré de la préparation de partie.
- Le mode choisi au départ contrôle automatiquement le dévoilement.
- Classique = rôle + mot.
- Mystère = mot seulement.
- Blitz = rôle + mot avec discussion à 1 minute.
- L'écran est plus clair et moins répétitif.

# MORDRA 3.1 — SHADOW MODES

Mise à jour rapide et stable avant partie.

## Ajouté
- Nouvel écran Choix du mode avant Nouvelle Partie.
- Mode Classique fonctionnel.
- Mode Mystère fonctionnel : seul le mot est affiché.
- Mode Blitz fonctionnel : discussion à 1 minute.
- Double Tueur affiché en Bientôt.
- Paranormal affiché en Bientôt.
- Détective affiché en Bientôt.
- Affichage du mode choisi dans la préparation de partie.

# MORDRA 3.0.12 — VERDICT CINEMATIC

Mini mise à jour de suspense.

## Ajouté
- Après le dernier vote, le résultat ne s'affiche plus directement.
- Compte à rebours cinématique 3, 2, 1.
- Textes de suspense : analyse des votes, vérification, verdict imminent.
- Petit son à chaque étape.
- Flash final avant le résultat.
- Fonctionne pour victoire, égalité et élimination.

# MORDRA 3.0.11 — AUTO VOTE TIMER

Mini mise à jour.

## Ajouté
- Quand le temps de discussion arrive à 0, le vote se lance automatiquement.
- Petit son de transition avant le vote.

# MORDRA 3.0.10 — DISCUSSION TIMER

Petite mise à jour de partie.

## Ajouté
- Compte à rebours pendant la discussion.
- Le temps dépend du nombre de minutes choisi avant la partie.
- Par défaut : 3 minutes.
- À 10 secondes restantes, le timer devient rouge.
- Petit son d'alerte à 10 secondes.
- Vibration légère sur mobile compatible.
- Bouton “Voter maintenant” disponible à tout moment.

# MORDRA 3.0.9 — NEW PLAYER FLOW FIX

Correction importante pour les nouveaux joueurs.

## Corrigé
- Depuis Nouvelle Partie, le bouton Nouveau joueur ne bloque plus.
- Le joueur créé apparaît directement dans la liste.
- Le joueur créé est automatiquement sélectionné.
- Le compteur passe directement à 1/4, 2/4, etc.
- Si le joueur existe déjà, il est sélectionné sans bloquer.
- Plus besoin de faire retour puis revenir.

# MORDRA 3.0.8 — REVEAL BUTTON FIX

Réparation urgente.

## Corrigé
- Le bouton Dévoiler ne casse plus la partie.
- Le mode classique affiche rôle + mot.
- Le mode mystère affiche seulement le mot.
- Après le dernier joueur, la discussion se lance.
- La fonction de révélation est sécurisée.

# MORDRA 3.0.7 — REVEAL FLOW FIX

Réparation urgente.

## Corrigé
- Après le dernier mot dévoilé, la partie passe bien à la discussion.
- Le mode mystère ne bloque plus la partie.
- La fonction discussion est sécurisée.
- La fonction revealPass est sécurisée.
- Si une erreur arrive, un bouton permet de continuer vers la discussion.

# MORDRA 3.0.6 — HIDDEN ROLE MODE

Mise à jour du dévoilement.

## Nouveautés
- Nouveau réglage avant de lancer une partie.
- Mode classique : le joueur voit son rôle + son mot.
- Mode mystère : le joueur voit seulement son mot.
- En mode mystère, même le Tueur ne sait pas qu'il est Tueur.
- Le vote et la fin de partie gardent la même logique.
- Mise à jour ciblée sans modifier les succès ni le lancement.

# MORDRA 3.0.5 — ACHIEVEMENTS STABLE

Mise à jour uniquement Succès, basée sur la version 3.0.4 qui se lance.

## Ajouté
- Bouton Succès avec choix du joueur.
- Défis par joueur.
- Catégories.
- Raretés.
- Progression visible.
- Récompenses en Éclats de Sang.
- Succès secrets.
- Vérification automatique après une partie.

# MORDRA 3.0.4 — LAUNCH FIX

Correction urgente.

## Corrigé
- Le jeu se lance de nouveau.
- La fonction intro() est restaurée.
- Les bannières, cadres et titres visibles sont conservés.
- Aucun autre système n'est modifié.

# MORDRA 3.0.3 — VISUAL SAFE UPDATE

Mise à jour sûre basée sur la dernière version stable.

## Corrigé
- Les bannières sont visibles sur les cartes joueurs.
- Les cadres apparaissent clairement autour de la carte.
- Le cadre Argent / Or / Diamant / Néant change vraiment l'apparence.
- Les titres apparaissent sous le nom du joueur.
- Les badges restent visibles.
- Cette version ne touche pas au système de lancement du jeu.

# MORDRA 2.0.6 — EMERGENCY DISPLAY FIX

Correction urgente.

## Corrigé
- Le jeu repart de la dernière version stable.
- Le lancement doit s'afficher correctement.
- Ajout d'une protection si une erreur JavaScript arrive.
- Éclats de Sang visibles en haut dans la boutique.
- Timer de réinitialisation boutique conservé.
- Cache Service Worker changé pour forcer la nouvelle version.

# MORDRA 2.0.4 — VOTE TRANSITION

Petite mise à jour de confort.

## Nouveautés
- Après un vote, le jeu affiche “Vote enregistré”.
- Petite pause avant de passer au joueur suivant.
- Écran clair “À [joueur] de voter”.
- Animation visuelle pendant le passage au vote.
- Réduit les erreurs où un joueur pense que son clic n'a pas marché.

# MORDRA 2.0.3 — MOBILE CENTER & TIMER

Petite mise à jour.

## Nouveautés
- Temps de discussion/vote par défaut réglé sur 3 minutes.
- Les écrans “Passe le téléphone”, “Dévoiler”, “Discussion”, “Égalité” et “Fin de partie” sont mieux centrés sur mobile.
- Les récompenses de fin de partie restent comme dans la version précédente.

# MORDRA 2.0.2 — PARTY CLARITY

Mise à jour ciblée et stable.

## Nouveautés
- Les joueurs sélectionnés avant une partie sont visibles.
- Les boutons des joueurs déjà sélectionnés changent d'apparence.
- Après les révélations, le jeu annonce qui commence à parler.
- Le joueur qui commence est choisi aléatoirement.
- Fin de partie avec récompenses affichées joueur par joueur.
- Affichage XP, Éclats de Sang, victoire/participation et niveaux gagnés.

# MORDRA 2.0.1 — SHOP HUB

Mise à jour d'organisation du menu.

## Nouveautés
- Ajout d'un vrai onglet 🛒 Boutique dans le menu principal.
- Blood Market est maintenant rangé dans Boutique.
- Boutique tournante accessible directement depuis Boutique.
- Passe des Ombres accessible depuis Boutique.
- Collection accessible depuis Boutique.
- Menu principal plus clair.

# MORDRA 2.0 STABLE

Version reconstruite proprement.

## Objectif
Remettre le jeu sur une base stable :
- lancement fiable,
- menu fiable,
- statistiques fiables,
- création de joueurs fiable,
- sauvegarde automatique,
- partie jouable,
- classement, MVP, Hall of Fame,
- Blood Market, boutique, collection, passe,
- export/import des données.

## Important
Cette version privilégie la stabilité. Certains systèmes avancés pourront être enrichis ensuite.


## MORDRA Test 4.00
- Mode Championnat intégré sur la vraie base 3.3.2 RANDOM KILLER FIX.
- Durées : 1, 3, 5, 10 ou 15 manches.
- Même groupe, même mode et mêmes paramètres entre les manches.
- Classement, scores, récompenses, animations, vibrations et reprise locale.


## Test 4.00 — Accueil officiel
- Image d'accueil intégrée comme fond réel, sans recréation en code.
- Bouton invisible par-dessus DÉMARRER.
- Menu principal complet : Nouvelle partie, Championnat, Progression, Statistiques, Succès, Collection, Boutique, Paramètres.
- Brouillard animé, particules rouges et glow respirant.


## Mise à jour Chargement Premium V2
- Durée cinématique environ 12 secondes.
- Progression non linéaire avec pauses visuelles.
- Transition finale fluide vers le menu principal.


## Mise à jour Audio UI finale
- Bouton 🔊/🔇 retiré du menu principal.
- Sons intégrés : DÉMARRER, clic général, retour, élément verrouillé.
- Les sons respectent la jauge Effets sonores.
- Les éléments Bientôt ont un feedback sonore + shake + toast.
