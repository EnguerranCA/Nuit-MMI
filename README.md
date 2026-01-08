# 🎮 Projet Compilation de Mini-Jeux MMI
**Stack :** p5play, MakeyMakey et ML5.js

## 📝 Concept Global
Création d'une **compilation de mini-jeux web** dynamiques et sportifs. L'objectif est de faire bouger le joueur en sortant des contrôles classiques (clavier/souris) grâce à des interfaces ou de la détection de mouvement.

* **Thème :** Sport / Bouger / Fun.
* **Direction Artistique :** Style **"Kawaii"** (mignon), avec une cohérence graphique forte (personnages récurrents) entre les jeux.
* **Objectif :** Intégrer MakeyMakey ou la Webcam dans chaque jeu.

---

## 🛠️ Stack Technique

### 1. Moteur de Jeu : [p5play](https://p5play.org/)
Surcouche de p5.js permettant de créer des jeux plus facilement.
* **Cœur du système :** Utilisation des **Sprites** (physique, collisions, mouvements).
* *Outils :* Extension VS Code p5play ou OpenProcessing.

### 2. Contrôleurs (Inputs) pour dynamiser le jeu
* **🔌 Makey Makey :** Remplace les touches du clavier par des objets conducteurs (pâte à modeler, graphite, fruits, corps humain).
* **📷 ML5.js :** Utilise la webcam et l'IA pour détecter la position de l'utilisateur (PoseNet pour le corps, HandPose pour les mains, ou détection du visage).

### 3. Backend
* Mise en place d'une **Base de Données (BDD)** pour sauvegarder les scores et afficher un classement général.

---

## 🕹️ Liste des Mini-Jeux (Idées)

| Jeu | Concept | Technologie Input |
| :--- | :--- | :--- |
| **Formes dans les murs** | Reproduire une pose précise pour passer dans un trou (façon "Hole in the Wall"). | **ML5 (PoseNet)** : Détection corps entier. |
| **Reboucher les fuites** | Boucher des fuites d'eau qui apparaissent aléatoirement à l'écran. | **ML5** Placer la main au bon endroit et **MakeyMakey** Appliquer le patch de la fuite |
| **Subway Surfer** | Esquiver des obstacles (Gauche, Droite, Saut, Roulade). | **ML5** : Déplacement latéral du joueur devant la cam. |
| **Cowboy Aim Lab** | Dégainer et viser une cible le plus vite possible (réflexe). | **MakeyMakey** : Gâchette  |
| **Trombone Game** | Jeu de rythme où il faut ajuster la hauteur de la note. | **MakeyMakey** Jouer la note ou **ML5** (Hauteur main). |

---

## 🔄 Parcours Utilisateur (User Flow)

### 1. Menu Principal
* Affichage des personnages "Kawaii".
* Options : `JOUER` | `CLASSEMENT`.

### 2. Configuration
* Choix du mode :
    * **Partie Rapide :** Un seul jeu spécifique.
    * **Série (Gauntlet) :** Enchaînement des jeux aléatoire.

### 3. Boucle de Jeu (Game Loop)
1.  **Tuto Express :** Explication visuelle des contrôles.
2.  **Action :** Clique sur "Let's Go".
3.  **Jeu :** Le joueur joue jusqu'à perdre (difficulté croissante).
4.  **Transition :** Si mode série, passage au jeu suivant.

### 4. Fin de Partie
* Game Over.
* Saisie du **Pseudo**.
* Affichage du **Classement** (BDD).
* Boutons : `Rejouer` ou `Retour Menu`.

---

## ⚠️ Points de vigilance
* **Compatibilité :** Si utilisation d'IA (ChatGPT/Copilot) pour le code, vérifier la compatibilité avec la *dernière version* de p5play.
* **Webcam :** Gérer les permissions navigateur et l'éclairage pour ML5.