/**
 * 🔧 Plumber Game - Répare les fuites !
 * Le joueur doit boucher les fuites d'eau avec ses mains détectées par la webcam
 * Utilise ML5 HandPose pour la détection de mains + touche espace pour réparer
 */

import { BaseGame } from '../BaseGame.js';
import { TutorialSystem } from '../TutorialSystem.js';

export class PlumberGame extends BaseGame {
    constructor(gameManager) {
        super(gameManager);
        
        // ML5 HandPose
        this.handPose = null;
        this.hands = [];
        this.videoCapture = null;
        
        // Groupes P5.play
        this.leaks = null;
        this.handSprites = null;
        this.handL = null;
        this.handR = null;
        
        // Sons
        this.soundMusic = null;
        this.soundDripping = null;
        this.soundFixed = null;
        this.musicVolume = 0.4;
        
        // Gameplay
        this.gameState = "LOADING";
        this.leakSpawnRate = 120; // Frames entre chaque fuite
        this.waterLevel = 0;
        this.difficulty = 1;
        this.frameCounter = 0;
        this.gameEnded = false; // Flag pour éviter d'appeler end() plusieurs fois
        
        // Système de particules d'eau pour les éclaboussures
        this.waterParticles = [];
        
        // Système de formes pour les fuites
        // Chaque forme correspond à une touche directionnelle avec sa couleur
        this.shapeTypes = {
            'square': { key: 'ArrowUp', keyCode: 38, label: '⬆️', name: 'Carré', color: '#54D8FF', strokeColor: '#3AB8DF' },
            'star': { key: 'ArrowDown', keyCode: 40, label: '⬇️', name: 'Étoile', color: '#FFB755', strokeColor: '#DF9735' },
            'circle': { key: 'ArrowLeft', keyCode: 37, label: '⬅️', name: 'Cercle', color: '#A3FF56', strokeColor: '#83DF36' },
            'triangle': { key: 'ArrowRight', keyCode: 39, label: '➡️', name: 'Triangle', color: '#FF3246', strokeColor: '#DF1226' }
        };
        this.shapeKeys = Object.keys(this.shapeTypes);
        
        // Référence P5
        this.p = null;
    }

    /**
     * Tutoriel du jeu
     */
    static getTutorial() {
        const content = TutorialSystem.generateHybridTutorial({
            title: 'Plumber Game',
            icon: '🔧',
            objective: 'Bouche les fuites d\'eau avec tes mains avant que la pièce ne soit inondée !',
            steps: [
                'Autorise l\'accès à ta webcam',
                'Connecte ton MakeyMakey aux flèches directionnelles',
                'Place ta main sur une fuite (elle devient orange)',
                'Regarde la forme de la fuite et appuie sur la bonne touche :',
                '⬆️ HAUT = Carré bleu | ⬇️ BAS = Étoile jaune',
                '⬅️ GAUCHE = Cercle vert | ➡️ DROITE = Triangle rouge',
                'Ne laisse pas le niveau d\'eau atteindre 100% !'
            ],
            tip: 'Travaille en équipe : un joueur place les mains, l\'autre appuie sur les touches !'
        });

        return {
            title: '🔧 Plumber Game',
            content: content
        };
    }

    /**
     * Initialisation du jeu
     */
    async init() {
        console.log('🔧 PlumberGame - Initialisation');
        
        return new Promise((resolve, reject) => {
            const sketch = (p) => {
                this.p = p;
                
                p.preload = () => {
                    // Charger HandPose dans preload (recommandé par ML5)
                    this.handPose = ml5.handPose();
                    
                    // Chargement des sons
                    this.soundMusic = p.loadSound('./sound/ost plumber.mp3');
                    this.soundDripping = p.loadSound('./sound/water-dripping.mp3');
                    this.soundFixed = p.loadSound('./sound/fixed.mp3');
                };
                
                p.setup = () => {
                    // Création du canvas
                    this.canvas = p.createCanvas(p.windowWidth, p.windowHeight);
                    this.canvas.parent('game-container');
                    
                    // Initialisation de P5play
                    this.world = new p.World();
                    this.world.gravity.y = 0;
                    
                    // Configuration Vidéo (même taille que CowboyDuel)
                    this.videoCapture = p.createCapture(p.VIDEO);
                    this.videoCapture.size(640, 480);
                    this.videoCapture.hide();
                    
                    // Attendre que la vidéo soit prête
                    this.videoCapture.elt.addEventListener('loadeddata', () => {
                        // Démarrer la détection des mains
                        this.handPose.detectStart(this.videoCapture, (results) => {
                            this.hands = results;
                        });
                        
                        console.log('✅ HandPose détection démarrée');
                        resolve();
                    });
                    
                    // Configuration des Mains (Sprites)
                    this.handSprites = new p.Group();
                    this.handSprites.color = 'lime';
                    this.handSprites.d = 60;
                    this.handSprites.collider = 'kinematic';
                    this.handSprites.alpha = 0.8;
                    this.handSprites.stroke = 'limegreen';
                    this.handSprites.strokeWeight = 3;
                    
                    // Création des sprites des mains
                    this.handL = new this.handSprites.Sprite(-100, -100);
                    this.handR = new this.handSprites.Sprite(-100, -100);
                    this.handL.label = 'leftHand';
                    this.handR.label = 'rightHand';
                    
                    // Configuration des Fuites (Groupe)
                    this.leaks = new p.Group();
                    this.leaks.color = 'cyan';
                    this.leaks.stroke = 'blue';
                    this.leaks.strokeWeight = 4;
                    this.leaks.collider = 'static';
                };

                p.draw = () => {
                    this.update(p);
                };

                p.keyPressed = () => {
                    this.onKeyPressed(p.key);
                };
            };

            window.p5Instance = new p5(sketch);
        });
    }

    /**
     * Démarrage du jeu
     */
    start() {
        super.start();
        console.log('▶️ PlumberGame - Démarrage');
        
        // Lancer la musique plumber en boucle
        if (this.soundMusic && !this.soundMusic.isPlaying()) {
            this.soundMusic.setVolume(this.musicVolume);
            this.soundMusic.loop();
            console.log('🎵 Musique plumber lancée');
        }
        
        // Réinitialiser les variables
        this.score = 0;
        this.difficulty = 1;
        this.leakSpawnRate = 180; // Plus lent au début (était 120)
        this.waterLevel = 0;
        this.gameState = "PLAYING";
        this.frameCounter = 0;
    }

    /**
     * Boucle de jeu
     */
    update(p) {
        if (!this.isRunning) return;
        
        this.frameCounter++;
        
        // --- FOND UNI ---
        p.background(45, 55, 72); // Couleur gris-bleu professionnel

        // Si HandPose n'est pas encore chargé ou aucune main détectée
        if (!this.handPose || this.hands.length === 0) {
            p.fill(255);
            p.textSize(24);
            p.textAlign(p.CENTER, p.CENTER);
            p.text("🖐️ Chargement de la détection des mains...", p.width/2, p.height/2 - 30);
            p.textSize(18);
            p.text("Placez vos mains devant la caméra", p.width/2, p.height/2 + 10);
            
            // Afficher un indicateur de chargement
            p.push();
            p.noFill();
            p.stroke(255);
            p.strokeWeight(4);
            p.arc(p.width/2, p.height/2 + 60, 40, 40, 0, (this.frameCounter % 60) / 60 * p.TWO_PI);
            p.pop();
            return;
        }
        
        // --- VÉRIFIER GAME OVER ---
        if (this.waterLevel >= 100) {
            this.drawGameOver(p);
            // N'appeler end() qu'une seule fois
            if (!this.gameEnded) {
                this.gameEnded = true;
                // Utiliser 'completed' au lieu de 'failed' pour permettre la transition au jeu suivant
                this.end('completed', this.score);
            }
            return;
        }

        // --- MISE A JOUR DES MAINS ---
        this.updateHands(p);

        // --- GESTION DES FUITES ---
        if (this.frameCounter % this.leakSpawnRate === 0) {
            this.createLeak(p);
            
            // Augmenter la difficulté progressivement (toutes les 10 réparations au lieu de 5)
            if (this.score > 0 && this.score % 10 === 0) {
                this.difficulty = Math.floor(this.score / 10) + 1;
                // Diminution plus douce du spawn rate (minimum 60 au lieu de 30)
                this.leakSpawnRate = Math.max(60, 180 - (this.difficulty * 15));
            }
        }
        
        // Montée de l'eau (plus lente: 0.03 au lieu de 0.05)
        if (this.leaks && this.leaks.length > 0) {
            this.waterLevel += this.leaks.length * 0.03;
            this.waterLevel = Math.min(100, this.waterLevel);
            
            // Jouer le son de gouttes d'eau s'il y a des fuites et si pas déjà en cours
            if (this.soundDripping && !this.soundDripping.isPlaying()) {
                this.soundDripping.setVolume(0.4);
                this.soundDripping.loop();
            }
        } else {
            // Arrêter le son de gouttes si toutes les fuites sont bouchées
            if (this.soundDripping && this.soundDripping.isPlaying()) {
                this.soundDripping.stop();
            }
        }

        // --- DESSINER LES FUITES ANIMÉES ---
        this.drawLeaks(p);

        // Vérification des réparations (main sur fuite + bonne touche directionnelle)
        if (this.leaks) {
            for (let i = this.leaks.length - 1; i >= 0; i--) {
                let leak = this.leaks[i];
                
                let handOnLeak = this.checkHandLeakCollision(this.handL, leak) || 
                                 this.checkHandLeakCollision(this.handR, leak);
                
                if (handOnLeak) {
                    // Vérifier si la bonne touche est pressée selon la forme
                    const shapeInfo = this.shapeTypes[leak.shapeType];
                    if (shapeInfo && p.keyIsDown(shapeInfo.keyCode)) {
                        this.repairLeak(leak, p);
                    }
                }
            }
        }
        
        // --- DESSINER LES MAINS ---
        this.drawHandCenters(p);
        
        // --- DESSINER L'EAU QUI MONTE ---
        this.drawWater(p);

        // --- UI (Interface) ---
        p.fill(255);
        p.textSize(24);
        p.textAlign(p.LEFT);
        p.text("Fuites réparées: " + this.score, 20, 40);
        p.text("Niveau: " + this.difficulty, 20, 70);
        
        p.fill(this.waterLevel >= 80 ? 'red' : this.waterLevel >= 50 ? 'orange' : 'white');
        p.text("Niveau d'eau: " + Math.floor(this.waterLevel) + "%", 20, 100);
        
        this.drawWaterBar(p);
        
        // Légende des formes et touches
        this.drawShapeLegend(p);
        
        // Feedback visuel des mains
        p.textSize(14);
        p.textAlign(p.CENTER);
        p.fill(this.handL && this.handL.visible ? 'lime' : '#666');
        p.text("Main G: " + (this.handL && this.handL.visible ? "✓ DÉTECTÉE" : "Non détectée"), 120, p.height - 20);
        
        p.fill(this.handR && this.handR.visible ? 'lime' : '#666');
        p.text("Main D: " + (this.handR && this.handR.visible ? "✓ DÉTECTÉE" : "Non détectée"), p.width - 120, p.height - 20);
        
        // DEBUG : Afficher la webcam et les points de la main
        this.drawDebug(p);
    }

    /**
     * Dessiner la légende des formes et touches
     */
    drawShapeLegend(p) {
        const legendX = p.width / 2;
        const legendY = 25;
        const itemWidth = 130;
        const startX = legendX - (itemWidth * 2);
        
        p.push();
        
        // Fond de la légende
        p.fill(0, 0, 0, 150);
        p.noStroke();
        p.rect(startX - 20, legendY - 15, itemWidth * 4 + 40, 50, 10);
        
        // Titre
        p.fill(255, 255, 0);
        p.textAlign(p.CENTER, p.TOP);
        p.textSize(12);
        p.text("Place ta main sur la fuite + appuie sur la touche :", legendX, legendY - 10);
        
        // Les 4 formes avec leurs touches et couleurs
        p.textSize(14);
        let xPos = startX;
        
        // Carré bleu - Haut
        p.fill('#54D8FF');
        p.stroke('#3AB8DF');
        p.strokeWeight(2);
        p.rectMode(p.CENTER);
        p.rect(xPos + 15, legendY + 18, 20, 20);
        p.fill(255);
        p.noStroke();
        p.textAlign(p.LEFT, p.CENTER);
        p.text("⬆️ Haut", xPos + 30, legendY + 18);
        
        xPos += itemWidth;
        
        // Étoile jaune - Bas
        p.fill('#FFB755');
        p.stroke('#DF9735');
        p.strokeWeight(2);
        // Dessiner petite étoile directement
        const starX = xPos + 15;
        const starY = legendY + 18;
        const starOuter = 12;
        const starInner = 5;
        p.beginShape();
        for (let i = 0; i < 5; i++) {
            const outerAngle = -p.HALF_PI + i * (p.TWO_PI / 5);
            p.vertex(starX + p.cos(outerAngle) * starOuter, starY + p.sin(outerAngle) * starOuter);
            const innerAngle = outerAngle + (p.TWO_PI / 10);
            p.vertex(starX + p.cos(innerAngle) * starInner, starY + p.sin(innerAngle) * starInner);
        }
        p.endShape(p.CLOSE);
        p.fill(255);
        p.noStroke();
        p.text("⬇️ Bas", xPos + 30, legendY + 18);
        
        xPos += itemWidth;
        
        // Cercle vert - Gauche
        p.fill('#A3FF56');
        p.stroke('#83DF36');
        p.strokeWeight(2);
        p.ellipse(xPos + 15, legendY + 18, 20, 20);
        p.fill(255);
        p.noStroke();
        p.text("⬅️ Gauche", xPos + 30, legendY + 18);
        
        xPos += itemWidth;
        
        // Triangle rouge - Droite
        p.fill('#FF3246');
        p.stroke('#DF1226');
        p.strokeWeight(2);
        p.beginShape();
        p.vertex(xPos + 15, legendY + 8);
        p.vertex(xPos + 25, legendY + 28);
        p.vertex(xPos + 5, legendY + 28);
        p.endShape(p.CLOSE);
        p.fill(255);
        p.noStroke();
        p.text("➡️ Droite", xPos + 30, legendY + 18);
        
        p.pop();
    }

    /**
     * DEBUG : Afficher la webcam et les points de la main (style CowboyDuel)
     */
    drawDebug(p) {
        // Cadre de debug en haut à droite
        const debugWidth = 240;
        const debugHeight = 180;
        const debugX = p.width - debugWidth - 20;
        const debugY = 80; // Décalé pour ne pas chevaucher la légende
        
        // Fond semi-transparent
        p.fill(0, 0, 0, 180);
        p.stroke(255, 255, 0);
        p.strokeWeight(2);
        p.rect(debugX - 10, debugY - 10, debugWidth + 20, debugHeight + 100, 10);
        
        // Afficher la webcam en miroir
        p.push();
        p.translate(debugX + debugWidth, debugY);
        p.scale(-1, 1);
        p.image(this.videoCapture, 0, 0, debugWidth, debugHeight);
        p.pop();
        
        // Dessiner les points de la main si détectés
        if (this.hands.length > 0) {
            for (let hand of this.hands) {
                if (!hand || !hand.keypoints) continue;
                
                // Dessiner chaque point
                p.push();
                p.translate(debugX + debugWidth, debugY);
                p.scale(-1, 1);
                
                for (const kp of hand.keypoints) {
                    // Mapper les coordonnées (webcam 640x480 vers debug window)
                    const x = p.map(kp.x, 0, 640, 0, debugWidth);
                    const y = p.map(kp.y, 0, 480, 0, debugHeight);
                    
                    // Couleur selon la main
                    if (hand.handedness === "Left") {
                        p.fill(255, 100, 100);
                    } else {
                        p.fill(0, 255, 0);
                    }
                    p.noStroke();
                    p.ellipse(x, y, 6, 6);
                }
                
                // Highlight le centre de la paume
                const palmCenter = this.getPalmCenter(hand.keypoints);
                if (palmCenter) {
                    const px = p.map(palmCenter.x, 0, 640, 0, debugWidth);
                    const py = p.map(palmCenter.y, 0, 480, 0, debugHeight);
                    p.noFill();
                    p.stroke(255, 255, 0);
                    p.strokeWeight(2);
                    p.ellipse(px, py, 25, 25);
                }
                p.pop();
            }
        }
        
        // Texte d'info
        p.fill(255);
        p.noStroke();
        p.textAlign(p.LEFT, p.TOP);
        p.textSize(12);
        p.text(`DEBUG - HandPose`, debugX, debugY + debugHeight + 5);
        p.text(`Mains détectées: ${this.hands.length}`, debugX, debugY + debugHeight + 20);
        
        if (this.hands.length > 0) {
            const palmL = this.handL && this.handL.visible ? `(${Math.round(this.handL.x)}, ${Math.round(this.handL.y)})` : "Non visible";
            const palmR = this.handR && this.handR.visible ? `(${Math.round(this.handR.x)}, ${Math.round(this.handR.y)})` : "Non visible";
            p.text(`Main G: ${palmL}`, debugX, debugY + debugHeight + 35);
            p.text(`Main D: ${palmR}`, debugX, debugY + debugHeight + 50);
        } else {
            p.fill(255, 100, 100);
            p.text(`Aucune main détectée!`, debugX, debugY + debugHeight + 35);
            p.text(`Placez votre main devant la caméra`, debugX, debugY + debugHeight + 50);
        }
    }

    /**
     * Nettoyage
     */
    cleanup() {
        console.log('🧹 PlumberGame - Nettoyage');
        
        // Arrêter tous les sons
        if (this.soundMusic && this.soundMusic.isPlaying()) {
            this.soundMusic.stop();
            console.log('🔇 Musique plumber arrêtée');
        }
        if (this.soundDripping && this.soundDripping.isPlaying()) {
            this.soundDripping.stop();
        }
        if (this.soundFixed && this.soundFixed.isPlaying()) {
            this.soundFixed.stop();
        }
        
        // Arrêter la webcam
        if (this.videoCapture) {
            this.videoCapture.stop();
            this.videoCapture.remove();
            this.videoCapture = null;
        }
        
        // Arrêter HandPose
        if (this.handPose) {
            this.handPose.detectStop();
            this.handPose = null;
        }
        
        // Supprimer les sprites
        if (this.leaks) {
            try {
                this.leaks.removeAll();
            } catch (e) {
                console.warn('Erreur suppression fuites:', e);
            }
        }
        
        if (this.handSprites) {
            try {
                this.handSprites.removeAll();
            } catch (e) {
                console.warn('Erreur suppression mains:', e);
            }
        }
        
        this.hands = [];
        
        super.cleanup();
    }

    /**
     * Gestion des inputs clavier (MakeyMakey)
     */
    onKeyPressed(key) {
        super.onKeyPressed(key);
        
        // Redémarrage avec R (pour debug)
        if ((key === 'r' || key === 'R') && this.waterLevel >= 100) {
            this.score = 0;
            this.difficulty = 1;
            this.leakSpawnRate = 120;
            this.waterLevel = 0;
            this.gameState = "PLAYING";
            
            if (this.leaks) {
                this.leaks.removeAll();
            }
        }
    }

    // ==================== MÉTHODES PRIVÉES ====================

    /**
     * Dessiner les formes des mains sur l'écran de jeu
     * Représentation visuelle des mains détectées avec les doigts
     */
    drawHandCenters(p) {
        // Dessiner les silhouettes des mains basées sur les keypoints
        for (let hand of this.hands) {
            if (!hand || !hand.keypoints) continue;
            
            const isLeft = hand.handedness === "Left";
            const handColor = isLeft ? p.color(255, 100, 100, 200) : p.color(100, 255, 100, 200);
            const strokeColor = isLeft ? p.color(200, 50, 50) : p.color(50, 200, 50);
            
            // Mapper tous les keypoints à l'écran
            const mappedPoints = hand.keypoints.map(kp => ({
                x: p.map(kp.x, 0, 640, p.width, 0), // Inversé pour effet miroir
                y: p.map(kp.y, 0, 480, 0, p.height),
                name: kp.name
            }));
            
            // Dessiner les connexions (lignes entre les points)
            p.push();
            p.stroke(strokeColor);
            p.strokeWeight(6);
            
            // Doigts : connexions
            const fingerConnections = [
                [0, 1], [1, 2], [2, 3], [3, 4],       // Pouce
                [0, 5], [5, 6], [6, 7], [7, 8],       // Index
                [0, 9], [9, 10], [10, 11], [11, 12],  // Majeur
                [0, 13], [13, 14], [14, 15], [15, 16],// Annulaire
                [0, 17], [17, 18], [18, 19], [19, 20],// Auriculaire
                [5, 9], [9, 13], [13, 17]             // Paume
            ];
            
            for (let conn of fingerConnections) {
                const p1 = mappedPoints[conn[0]];
                const p2 = mappedPoints[conn[1]];
                if (p1 && p2) {
                    p.line(p1.x, p1.y, p2.x, p2.y);
                }
            }
            p.pop();
            
            // Dessiner les articulations (cercles aux keypoints)
            p.push();
            p.noStroke();
            for (let i = 0; i < mappedPoints.length; i++) {
                const pt = mappedPoints[i];
                
                // Taille selon le type de point
                let size = 12;
                if (i === 0) size = 25; // Poignet plus grand
                else if ([4, 8, 12, 16, 20].includes(i)) size = 18; // Bouts des doigts
                
                p.fill(handColor);
                p.ellipse(pt.x, pt.y, size, size);
            }
            p.pop();
            
            // Étiquette "G" ou "D" au centre de la paume
            const palmCenter = this.getPalmCenter(hand.keypoints);
            if (palmCenter) {
                const cx = p.map(palmCenter.x, 0, 640, p.width, 0);
                const cy = p.map(palmCenter.y, 0, 480, 0, p.height);
                
                p.push();
                p.fill(255);
                p.stroke(0);
                p.strokeWeight(3);
                p.textAlign(p.CENTER, p.CENTER);
                p.textSize(24);
                p.text(isLeft ? 'G' : 'D', cx, cy);
                p.pop();
            }
        }
        
        // Aussi dessiner les sprites de collision (cercles simples)
        // Main gauche
        if (this.handL && this.handL.visible) {
            p.push();
            p.noFill();
            p.stroke(255, 100, 100);
            p.strokeWeight(4);
            p.circle(this.handL.x, this.handL.y, 60);
            p.pop();
        }
        
        // Main droite
        if (this.handR && this.handR.visible) {
            p.push();
            p.noFill();
            p.stroke(100, 255, 100);
            p.strokeWeight(4);
            p.circle(this.handR.x, this.handR.y, 60);
            p.pop();
        }
    }

    /**
     * Dessiner les mains sur la petite webcam en haut à droite
     */
    drawHandsOnWebcam(p, webcamX, webcamY, webcamWidth, webcamHeight) {
        if (this.hands.length === 0) return;
        
        for (let hand of this.hands) {
            let palmCenter = this.getPalmCenter(hand.keypoints);
            if (palmCenter) {
                // Convertir les coordonnées de la vidéo vers la petite webcam
                // La vidéo originale fait p.width x p.height, on la redimensionne
                const scaleX = webcamWidth / this.videoCapture.width;
                const scaleY = webcamHeight / this.videoCapture.height;
                
                // Appliquer l'effet miroir
                let x = webcamX + webcamWidth - (palmCenter.x * scaleX);
                let y = webcamY + (palmCenter.y * scaleY);
                
                // Couleur selon la main
                const isLeft = hand.handedness === "Left";
                p.push();
                p.fill(isLeft ? p.color(255, 100, 100) : p.color(0, 255, 0));
                p.stroke(255);
                p.strokeWeight(2);
                p.circle(x, y, 15);
                p.pop();
            }
        }
    }

    /**
     * Dessiner un mur de briques (gardé pour référence)
     */
    drawBrickWall(p) {
        let brickWidth = 80;
        let brickHeight = 40;
        
        for (let y = 0; y < p.height; y += brickHeight) {
            for (let x = 0; x < p.width; x += brickWidth) {
                let offset = (Math.floor(y / brickHeight) % 2) * (brickWidth / 2);
                
                let brickColor = p.color(180 + p.random(-20, 20), 80 + p.random(-10, 10), 60 + p.random(-10, 10));
                p.fill(brickColor);
                p.stroke(100, 50, 40);
                p.strokeWeight(2);
                
                p.rect(x + offset, y, brickWidth - 4, brickHeight - 4, 3);
            }
        }
    }

    /**
     * Dessiner l'eau qui monte
     */
    drawWater(p) {
        if (this.waterLevel > 0) {
            let waterHeight = p.map(this.waterLevel, 0, 100, 0, p.height);
            
            for (let i = 0; i < waterHeight; i += 5) {
                let alpha = p.map(i, 0, waterHeight, 150, 200);
                let blueShade = p.map(i, 0, waterHeight, 100, 180);
                p.fill(30, 100 + blueShade, 200, alpha);
                p.noStroke();
                p.rect(0, p.height - i, p.width, 5);
            }
            
            // Effet de vagues
            p.push();
            p.stroke(100, 150, 255, 150);
            p.strokeWeight(3);
            p.noFill();
            let waveY = p.height - waterHeight;
            p.beginShape();
            for (let x = 0; x <= p.width; x += 10) {
                let y = waveY + Math.sin((x + this.frameCounter) * 0.05) * 5;
                p.vertex(x, y);
            }
            p.endShape();
            p.pop();
        }
    }

    /**
     * Dessiner la barre de progression de l'eau
     */
    drawWaterBar(p) {
        let barX = 20;
        let barY = 130;
        let barWidth = 200;
        let barHeight = 20;
        
        p.fill(50);
        p.stroke(255);
        p.strokeWeight(2);
        p.rect(barX, barY, barWidth, barHeight, 5);
        
        let fillWidth = p.map(this.waterLevel, 0, 100, 0, barWidth);
        let barColor = this.waterLevel >= 80 ? p.color(255, 0, 0) : 
                       this.waterLevel >= 50 ? p.color(255, 165, 0) : 
                       p.color(30, 144, 255);
        p.fill(barColor);
        p.noStroke();
        p.rect(barX, barY, fillWidth, barHeight, 5);
    }

    /**
     * Vérifier collision main-fuite
     */
    checkHandLeakCollision(hand, leak) {
        if (!hand || !hand.visible) return false;
        
        let distance = Math.sqrt(
            Math.pow(hand.x - leak.x, 2) + 
            Math.pow(hand.y - leak.y, 2)
        );
        
        let handRadius = hand.d / 2;
        let leakRadius = leak.d / 2;
        
        return distance < (handRadius + leakRadius);
    }

    /**
     * Calculer le centre de la paume
     */
    getPalmCenter(keypoints) {
        let palmIndices = [0, 5, 9, 13, 17];
        let sumX = 0, sumY = 0, count = 0;
        
        for (let idx of palmIndices) {
            let kp = keypoints[idx];
            if (kp && kp.x && kp.y) {
                sumX += kp.x;
                sumY += kp.y;
                count++;
            }
        }
        
        if (count > 0) {
            return { x: sumX / count, y: sumY / count };
        }
        return null;
    }

    /**
     * Mettre à jour les positions des mains (même style que CowboyDuelGame)
     */
    updateHands(p) {
        if (!this.hands || this.hands.length === 0) {
            if (this.handL) this.handL.visible = false;
            if (this.handR) this.handR.visible = false;
            return;
        }
        
        this.handL.visible = false;
        this.handR.visible = false;
        
        for (let hand of this.hands) {
            if (!hand || !hand.keypoints) continue;
            
            // Utiliser le centre de la paume (comme avant)
            let palmCenter = this.getPalmCenter(hand.keypoints);
            
            if (palmCenter && palmCenter.x !== undefined && palmCenter.y !== undefined) {
                // Mapper la position de la main à l'écran
                // La webcam fait 640x480, on mappe à l'écran entier
                const mappedX = p.map(palmCenter.x, 0, 640, p.width, 0); // Inversé car mirrored
                const mappedY = p.map(palmCenter.y, 0, 480, 0, p.height);
                
                // Avec ml5.handPose() sans options, "Left" = vraie main gauche du joueur
                if (hand.handedness === "Left") {
                    // Lissage du mouvement
                    this.handL.x = p.lerp(this.handL.x, mappedX, 0.3);
                    this.handL.y = p.lerp(this.handL.y, mappedY, 0.3);
                    this.handL.visible = true;
                } else if (hand.handedness === "Right") {
                    // Lissage du mouvement
                    this.handR.x = p.lerp(this.handR.x, mappedX, 0.3);
                    this.handR.y = p.lerp(this.handR.y, mappedY, 0.3);
                    this.handR.visible = true;
                }
            }
        }
    }

    /**
     * Dessiner les keypoints des mains
     */
    drawHandKeypoints(p) {
        if (!this.hands || this.hands.length === 0) return;
        
        for (let hand of this.hands) {
            if (!hand || !hand.keypoints) continue;
            
            for (let keypoint of hand.keypoints) {
                if (keypoint && keypoint.x && keypoint.y) {
                    let x = p.width - keypoint.x;
                    let y = keypoint.y;
                    
                    p.push();
                    p.fill(0, 255, 0, 200);
                    p.noStroke();
                    p.circle(x, y, 8);
                    p.pop();
                }
            }
            
            this.drawHandConnections(p, hand.keypoints);
        }
    }

    /**
     * Dessiner les connexions entre les keypoints
     */
    drawHandConnections(p, keypoints) {
        const connections = [
            [0, 1], [1, 2], [2, 3], [3, 4],
            [0, 5], [5, 6], [6, 7], [7, 8],
            [0, 9], [9, 10], [10, 11], [11, 12],
            [0, 13], [13, 14], [14, 15], [15, 16],
            [0, 17], [17, 18], [18, 19], [19, 20],
            [5, 9], [9, 13], [13, 17]
        ];
        
        p.push();
        p.stroke(0, 255, 0, 150);
        p.strokeWeight(2);
        
        for (let conn of connections) {
            let kp1 = keypoints[conn[0]];
            let kp2 = keypoints[conn[1]];
            
            if (kp1 && kp2 && kp1.x && kp1.y && kp2.x && kp2.y) {
                let x1 = p.width - kp1.x;
                let y1 = kp1.y;
                let x2 = p.width - kp2.x;
                let y2 = kp2.y;
                
                p.line(x1, y1, x2, y2);
            }
        }
        p.pop();
    }

    /**
     * Créer une nouvelle fuite avec animation
     */
    createLeak(p) {
        if (!this.leaks) return;
        
        let leak = new this.leaks.Sprite();
        leak.x = p.random(80, p.width - 80);
        leak.y = p.random(80, p.height - 80);
        leak.d = 70;
        leak.text = ""; // Pas d'emoji, on dessine manuellement
        leak.color = p.color(0, 0, 0, 0); // Transparent - on dessine nous-même
        leak.stroke = p.color(0, 0, 0, 0); // Pas de bordure
        
        // Propriétés personnalisées pour l'animation
        leak.animPhase = p.random(p.TWO_PI); // Phase aléatoire pour décalage animation
        leak.sprayAngle = p.random(-0.3, 0.3); // Angle de jet légèrement aléatoire
        leak.intensity = 1; // Intensité du jet (1 = normal, diminue quand main dessus)
        
        // Assigner une forme aléatoire
        leak.shapeType = this.shapeKeys[Math.floor(Math.random() * this.shapeKeys.length)];
    }

    /**
     * Dessiner toutes les fuites avec animations d'eau
     */
    drawLeaks(p) {
        if (!this.leaks) return;
        
        for (let leak of this.leaks) {
            // Vérifier si une main est sur la fuite
            let handOnLeak = this.checkHandLeakCollision(this.handL, leak) || 
                             this.checkHandLeakCollision(this.handR, leak);
            
            // Ajuster l'intensité selon si main dessus
            leak.intensity = handOnLeak ? 0.3 : 1;
            
            // Dessiner la forme de la fuite
            this.drawLeakShape(p, leak, handOnLeak);
            
            // Dessiner le jet d'eau qui descend jusqu'en bas
            if (leak.intensity > 0.1) {
                this.drawWaterJet(p, leak.x, leak.y, leak.animPhase, leak.sprayAngle, leak.intensity);
            }
            
            // Générer des particules d'éclaboussures
            if (this.frameCounter % 3 === 0 && leak.intensity > 0.3) {
                this.spawnWaterParticles(p, leak.x, leak.y + 40, leak.intensity);
            }
        }
        
        // Mettre à jour et dessiner les particules d'eau
        this.updateAndDrawParticles(p);
    }

    /**
     * Dessiner la forme de fuite (carré, étoile, cercle, triangle) avec couleurs
     */
    drawLeakShape(p, leak, isBlocked) {
        const x = leak.x;
        const y = leak.y;
        const shapeInfo = this.shapeTypes[leak.shapeType];
        const size = 60;
        
        p.push();
        
        // Couleur de la forme - utiliser la couleur définie ou orange si main dessus
        if (isBlocked) {
            p.fill(255, 200, 100); // Orange quand main dessus
            p.stroke(255, 150, 50);
        } else {
            p.fill(shapeInfo.color);
            p.stroke(shapeInfo.strokeColor);
        }
        p.strokeWeight(4);
        
        // Dessiner selon le type de forme
        switch (leak.shapeType) {
            case 'square': // Carré bleu - Flèche Haut
                p.rectMode(p.CENTER);
                p.rect(x, y, size, size);
                break;
                
            case 'star': // Étoile jaune 5 branches - Flèche Bas
                // Dessiner une étoile à 5 branches directement avec vertex
                const outerRadius = size * 0.5;
                const innerRadius = size * 0.2;
                const points = 5;
                const angleStep = p.TWO_PI / points;
                const halfAngle = angleStep / 2;
                
                p.beginShape();
                for (let i = 0; i < points; i++) {
                    // Point externe (pointe de l'étoile)
                    const outerAngle = -p.HALF_PI + i * angleStep;
                    p.vertex(x + p.cos(outerAngle) * outerRadius, y + p.sin(outerAngle) * outerRadius);
                    // Point interne (creux de l'étoile)
                    const innerAngle = outerAngle + halfAngle;
                    p.vertex(x + p.cos(innerAngle) * innerRadius, y + p.sin(innerAngle) * innerRadius);
                }
                p.endShape(p.CLOSE);
                break;
                
            case 'circle': // Cercle vert - Flèche Gauche
                p.ellipse(x, y, size, size);
                break;
                
            case 'triangle': // Triangle rouge - Flèche Droite
                p.beginShape();
                p.vertex(x, y - size/2);
                p.vertex(x + size/2, y + size/2);
                p.vertex(x - size/2, y + size/2);
                p.endShape(p.CLOSE);
                break;
        }
        
        // Trou central (d'où sort l'eau)
        p.fill(20, 50, 80);
        p.noStroke();
        p.ellipse(x, y, 20, 20);
        
        // Afficher l'icône de touche quand main dessus
        if (isBlocked) {
            p.fill(255);
            p.stroke(0);
            p.strokeWeight(2);
            p.textAlign(p.CENTER, p.CENTER);
            p.textSize(24);
            p.text(shapeInfo.label, x, y - size/2 - 20);
        }
        
        p.pop();
    }

    /**
     * Dessiner le jet d'eau animé qui descend jusqu'en bas de l'écran
     */
    drawWaterJet(p, x, y, phase, angle, intensity) {
        p.push();
        
        const time = this.frameCounter * 0.15 + phase;
        const startY = y + 15; // Démarrer sous la forme
        const endY = p.height; // Jusqu'en bas de l'écran
        const jetLength = endY - startY;
        
        // Dessiner plusieurs lignes d'eau ondulantes
        for (let i = 0; i < 5; i++) {
            const offsetX = (i - 2) * 3;
            
            // Gradient de bleu - plus opaque en haut
            p.noFill();
            
            // Courbe d'eau
            p.beginShape();
            for (let j = 0; j <= jetLength; j += 8) {
                const progress = j / jetLength;
                const waveAmplitude = 5 + progress * 15; // Onde plus grande en bas
                const waveOffset = Math.sin(time * 2 + j * 0.02 + i) * waveAmplitude * intensity;
                
                // Gradient d'opacité et couleur
                const alpha = p.map(progress, 0, 1, 200, 80) * intensity;
                p.stroke(100 + i * 20, 180 + i * 15, 255, alpha);
                p.strokeWeight(p.map(progress, 0, 1, 6 - i, 2));
                
                p.vertex(x + offsetX + waveOffset + angle * 20, startY + j);
            }
            p.endShape();
        }
        
        // Éclaboussures en bas
        if (intensity > 0.5) {
            this.drawSplashAtBottom(p, x, endY - 10, time, intensity);
        }
        
        p.pop();
    }

    /**
     * Dessiner les éclaboussures au sol
     */
    drawSplashAtBottom(p, x, y, time, intensity) {
        p.push();
        p.noStroke();
        
        // Plusieurs gouttes qui éclaboussent
        for (let i = 0; i < 6; i++) {
            const splashX = x + Math.sin(time * 3 + i * 1.5) * 30;
            const splashY = y - Math.abs(Math.sin(time * 4 + i * 2)) * 20;
            const size = (5 + Math.sin(time * 2 + i) * 3) * intensity;
            
            p.fill(100, 180, 255, 150 * intensity);
            p.ellipse(splashX, splashY, size, size);
        }
        
        // Flaque d'eau
        p.fill(80, 150, 220, 100 * intensity);
        p.ellipse(x, y + 5, 50 * intensity, 10);
        
        p.pop();
    }

    /**
     * Générer des particules d'éclaboussures
     */
    spawnWaterParticles(p, x, y, intensity) {
        const numParticles = Math.floor(2 * intensity);
        
        for (let i = 0; i < numParticles; i++) {
            this.waterParticles.push({
                x: x + p.random(-10, 10),
                y: y + p.random(30, 60),
                vx: p.random(-3, 3) * intensity,
                vy: p.random(-2, 1) * intensity,
                size: p.random(3, 8),
                life: 1.0,
                decay: p.random(0.02, 0.05)
            });
        }
        
        // Limiter le nombre de particules pour les performances
        if (this.waterParticles.length > 200) {
            this.waterParticles = this.waterParticles.slice(-150);
        }
    }

    /**
     * Mettre à jour et dessiner les particules d'eau
     */
    updateAndDrawParticles(p) {
        p.push();
        p.noStroke();
        
        for (let i = this.waterParticles.length - 1; i >= 0; i--) {
            const particle = this.waterParticles[i];
            
            // Physique
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += 0.15; // Gravité
            particle.life -= particle.decay;
            
            // Dessiner
            if (particle.life > 0) {
                const alpha = particle.life * 200;
                p.fill(100, 180, 255, alpha);
                p.ellipse(particle.x, particle.y, particle.size * particle.life, particle.size * particle.life);
            } else {
                // Supprimer particule morte
                this.waterParticles.splice(i, 1);
            }
        }
        
        p.pop();
    }

    /**
     * Réparer une fuite avec effet splash
     */
    repairLeak(leak, p) {
        // Effet splash lors de la réparation
        this.createRepairSplash(p, leak.x, leak.y);
        
        // Jouer le son de réparation
        if (this.soundFixed) {
            this.soundFixed.setVolume(0.6);
            this.soundFixed.play();
        }
        
        leak.remove();
        this.score++;
        this.addScore(10); // Ajouter au score global
        this.waterLevel = Math.max(0, this.waterLevel - 10);
    }

    /**
     * Effet d'éclaboussure lors de la réparation
     */
    createRepairSplash(p, x, y) {
        // Créer beaucoup de particules qui partent dans toutes les directions
        for (let i = 0; i < 20; i++) {
            const angle = p.random(p.TWO_PI);
            const speed = p.random(3, 8);
            
            this.waterParticles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 3, // Légère impulsion vers le haut
                size: p.random(5, 12),
                life: 1.0,
                decay: p.random(0.015, 0.03)
            });
        }
    }

    /**
     * Écran Game Over
     */
    drawGameOver(p) {
        p.background(0, 50, 100);
        this.drawWater(p);
        
        p.fill(255, 0, 0);
        p.textSize(60);
        p.textAlign(p.CENTER, p.CENTER);
        p.text("NOYÉ! 🌊", p.width/2, p.height/2 - 50);
        
        p.fill(255);
        p.textSize(30);
        p.text("Score final: " + this.score, p.width/2, p.height/2 + 20);
        p.text("Niveau atteint: " + this.difficulty, p.width/2, p.height/2 + 60);
    }
}
