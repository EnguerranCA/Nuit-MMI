/**
 * 🎯 Wall Shapes Game - Formes dans les murs
 * Le joueur doit reproduire la pose pour passer à travers le mur
 * Utilise ML5 BodyPose pour la détection de pose
 */

import { BaseGame } from '../BaseGame.js';
import { TutorialSystem } from '../TutorialSystem.js';

export class WallShapesGame extends BaseGame {
    constructor(gameManager) {
        super(gameManager);
        
        // ML5 PoseNet
        this.bodyPose = null;
        this.poses = [];
        this.videoCapture = null;
        
        // Gameplay
        this.walls = [];
        this.wallSpeed = 2;
        this.wallSpawnTimer = 0;
        this.wallSpawnInterval = 180; // frames (~3 secondes à 60fps)
        
        // Objectif de jeu
        this.wallsPassed = 0;
        this.wallsToPass = 5; // Nombre de murs à passer pour gagner
        this.maxLives = 3;
        this.lives = 3;
        
        // Poses prédéfinies
        this.predefinedPoses = [
            { id: 'arms-up', name: 'Bras en haut', checkFunction: this.checkArmsUp.bind(this) },
            { id: 'arms-wide', name: 'Bras écartés', checkFunction: this.checkArmsWide.bind(this) },
            { id: 'squat', name: 'Accroupi', checkFunction: this.checkSquat.bind(this) },
            { id: 'one-arm-up', name: 'Un bras levé', checkFunction: this.checkOneArmUp.bind(this) },
        ];
        
        this.currentPoseRequired = null;
        this.matchTimer = 0;
        this.matchThreshold = 30; // frames de match requis
    }

    /**
     * Informations du tutoriel
     */
    static getTutorial() {
        const content = TutorialSystem.generateML5Tutorial({
            title: 'Formes dans les murs',
            objective: 'Reproduis la pose affichée sur le mur avant qu\'il n\'arrive pour passer à travers !',
            steps: [
                'Autorise l\'accès à ta webcam',
                'Place-toi devant la caméra (corps entier visible)',
                'Regarde la silhouette sur le mur qui avance',
                'Reproduis exactement la même pose',
                'Maintiens la pose jusqu\'à ce que le mur te traverse',
                'Plus tu maintiens la pose, plus tu gagnes de points !'
            ],
            tip: 'Assure-toi d\'avoir un bon éclairage et suffisamment de recul pour que tout ton corps soit visible.'
        });

        return {
            title: 'Formes dans les murs',
            content: content
        };
    }

    /**
     * Initialisation du jeu
     */
    async init() {
        console.log('🧱 WallShapesGame - Initialisation');
        
        // Création du sketch P5.js
        return new Promise((resolve, reject) => {
            const sketch = (p) => {
                p.setup = () => {
                    // Création du canvas
                    this.canvas = p.createCanvas(p.windowWidth, p.windowHeight);
                    this.canvas.parent('game-container');
                    
                    // Initialisation de P5play
                    this.world = new p.World();
                    this.world.gravity.y = 0; // Pas de gravité
                    
                    // Initialisation de la webcam
                    this.videoCapture = p.createCapture(p.VIDEO);
                    this.videoCapture.size(320, 240);
                    this.videoCapture.hide();
                    
                    // Attendre que la vidéo soit prête
                    this.videoCapture.elt.addEventListener('loadeddata', () => {
                        // Initialisation de BodyPose (nouvelle API ML5)
                        this.bodyPose = ml5.bodyPose({
                            flipped: true
                        });
                        
                        this.bodyPose.detectStart(this.videoCapture, (results) => {
                            this.poses = results;
                        });
                        
                        console.log('✅ BodyPose chargé');
                        resolve();
                    });
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
        console.log('▶️ WallShapesGame - Démarrage');
        
        // Premier mur après 2 secondes
        this.wallSpawnTimer = 120;
    }

    /**
     * Mise à jour du jeu
     */
    update(p) {
        if (!this.isRunning) return;

        // Fond
        p.background(242, 238, 229); // Beige kawaii
        
        // Affichage de la webcam en miroir (grand format au centre)
        p.push();
        p.translate(p.width / 2 + 320, p.height / 2);
        p.scale(-1, 1); // Miroir
        p.image(this.videoCapture, -320, -240, 640, 480);
        p.pop();
        
        // Dessiner le contour de la zone webcam
        p.noFill();
        p.stroke(0);
        p.strokeWeight(3);
        p.rect(p.width / 2 - 320, p.height / 2 - 240, 640, 480);

        // Afficher la progression
        p.fill(0);
        p.textAlign(p.LEFT, p.TOP);
        p.textSize(20);
        p.text(`Murs réussis: ${this.wallsPassed}/${this.wallsToPass}`, 20, 20);
        p.text(`Vies: ${this.lives}/${this.maxLives}`, 20, 50);

        // Dessiner le squelette si pose détectée
        if (this.poses.length > 0 && this.poses[0].keypoints) {
            this.drawSkeletonLarge(p, this.poses[0]);
        }

        // Gestion des murs
        this.updateWalls(p);
        
        // Spawn de nouveaux murs
        this.wallSpawnTimer++;
        if (this.wallSpawnTimer >= this.wallSpawnInterval) {
            this.spawnWall();
            this.wallSpawnTimer = 0;
        }
    }

    /**
     * Génération d'un nouveau mur
     */
    spawnWall() {
        const randomPose = this.predefinedPoses[Math.floor(Math.random() * this.predefinedPoses.length)];
        
        const wall = {
            x: window.p5Instance.width,
            y: window.p5Instance.height / 2,
            width: 80,
            height: window.p5Instance.height,
            pose: randomPose,
            passed: false,
            matched: false
        };
        
        this.walls.push(wall);
        console.log(`🧱 Nouveau mur: ${randomPose.name}`);
    }

    /**
     * Mise à jour des murs
     */
    updateWalls(p) {
        for (let i = this.walls.length - 1; i >= 0; i--) {
            const wall = this.walls[i];
            
            // Déplacement
            wall.x -= this.wallSpeed;
            
            // Dessin du mur
            this.drawWall(p, wall);
            
            // Vérification de la pose
            if (!wall.passed && wall.x < p.width / 2 && wall.x > p.width / 2 - wall.width) {
                if (this.checkPoseMatch(wall.pose)) {
                    wall.matched = true;
                    this.matchTimer++;
                    
                    if (this.matchTimer >= this.matchThreshold) {
                        wall.passed = true;
                        this.addScore(100);
                        console.log('Pose réussie ! +100 points');
                        this.matchTimer = 0;
                    }
                } else {
                    this.matchTimer = 0;
                }
            }
            
            // Vérifier si le mur est sorti de l'écran
            if (wall.x < -wall.width) {
                if (!wall.passed) {
                    console.log('Mur raté !');
                    this.lives--;
                    
                    if (this.lives <= 0) {
                        this.end('failed', this.score);
                        return;
                    }
                } else {
                    this.wallsPassed++;
                    
                    // Vérifier si le joueur a gagné
                    if (this.wallsPassed >= this.wallsToPass) {
                        console.log('Jeu terminé avec succès !');
                        this.end('completed', this.score);
                        return;
                    }
                }
                this.walls.splice(i, 1);
            }
        }
    }

    /**
     * Dessin d'un mur
     */
    drawWall(p, wall) {
        p.push();
        
        // Couleur selon l'état
        if (wall.matched) {
            p.fill(163, 255, 86, 150); // Lime transparent
            p.stroke(163, 255, 86);
        } else {
            p.fill(255, 183, 85, 200); // Orange
            p.stroke(255, 183, 85);
        }
        
        p.strokeWeight(8);
        
        // Mur avec trou au centre (silhouette)
        const centerX = wall.x + wall.width / 2;
        const centerY = p.height / 2;
        const holeSize = 300;
        
        // Partie haute
        p.rect(wall.x, 0, wall.width, centerY - holeSize / 2);
        
        // Partie basse
        p.rect(wall.x, centerY + holeSize / 2, wall.width, p.height - (centerY + holeSize / 2));
        
        // Partie gauche du trou
        p.rect(wall.x, centerY - holeSize / 2, wall.width / 2 - 50, holeSize);
        
        // Partie droite du trou
        p.rect(wall.x + wall.width / 2 + 50, centerY - holeSize / 2, wall.width / 2 - 50, holeSize);
        
        // Texte de la pose au-dessus
        p.fill(0);
        p.noStroke();
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(32);
        p.textStyle(p.BOLD);
        p.text(wall.pose.name, centerX, 50);
        
        // Indicateur de match
        if (wall.matched) {
            p.fill(163, 255, 86);
            p.textSize(24);
            const progress = Math.floor((this.matchTimer / this.matchThreshold) * 100);
            p.text(`${progress}%`, centerX, 100);
        }
        
        // Dessiner la silhouette de la pose requise dans le trou
        this.drawPoseSilhouette(p, wall.pose.id, centerX, centerY, wall.matched);
        
        p.pop();
    }

    /**
     * Vérification de correspondance de pose
     */
    checkPoseMatch(requiredPose) {
        if (this.poses.length === 0 || !this.poses[0].keypoints) return false;
        return requiredPose.checkFunction(this.poses[0]);
    }

    /**
     * Vérification: Bras en haut
     */
    checkArmsUp(poseData) {
        const leftWrist = poseData.keypoints.find(kp => kp.name === 'left_wrist');
        const rightWrist = poseData.keypoints.find(kp => kp.name === 'right_wrist');
        const nose = poseData.keypoints.find(kp => kp.name === 'nose');
        
        if (!leftWrist || !rightWrist || !nose) return false;
        if (leftWrist.confidence < 0.2 || rightWrist.confidence < 0.2) return false;
        
        return leftWrist.y < nose.y && rightWrist.y < nose.y;
    }

    /**
     * Vérification: Bras écartés
     */
    checkArmsWide(poseData) {
        const leftWrist = poseData.keypoints.find(kp => kp.name === 'left_wrist');
        const rightWrist = poseData.keypoints.find(kp => kp.name === 'right_wrist');
        const leftShoulder = poseData.keypoints.find(kp => kp.name === 'left_shoulder');
        const rightShoulder = poseData.keypoints.find(kp => kp.name === 'right_shoulder');
        
        if (!leftWrist || !rightWrist || !leftShoulder || !rightShoulder) return false;
        if (leftWrist.confidence < 0.2 || rightWrist.confidence < 0.2) return false;
        
        const shoulderWidth = Math.abs(rightShoulder.x - leftShoulder.x);
        const armSpan = Math.abs(rightWrist.x - leftWrist.x);
        
        return armSpan > shoulderWidth * 2;
    }

    /**
     * Vérification: Accroupi
     */
    checkSquat(poseData) {
        const leftKnee = poseData.keypoints.find(kp => kp.name === 'left_knee');
        const rightKnee = poseData.keypoints.find(kp => kp.name === 'right_knee');
        const leftHip = poseData.keypoints.find(kp => kp.name === 'left_hip');
        const rightHip = poseData.keypoints.find(kp => kp.name === 'right_hip');
        
        if (!leftKnee || !rightKnee || !leftHip || !rightHip) return false;
        if (leftKnee.confidence < 0.2 || rightKnee.confidence < 0.2) return false;
        
        const leftKneeBend = Math.abs(leftKnee.y - leftHip.y);
        const rightKneeBend = Math.abs(rightKnee.y - rightHip.y);
        
        return leftKneeBend < 100 && rightKneeBend < 100;
    }

    /**
     * Vérification: Un bras levé
     */
    checkOneArmUp(poseData) {
        const leftWrist = poseData.keypoints.find(kp => kp.name === 'left_wrist');
        const rightWrist = poseData.keypoints.find(kp => kp.name === 'right_wrist');
        const nose = poseData.keypoints.find(kp => kp.name === 'nose');
        
        if (!leftWrist || !rightWrist || !nose) return false;
        if (leftWrist.confidence < 0.2 || rightWrist.confidence < 0.2) return false;
        
        const leftUp = leftWrist.y < nose.y;
        const rightUp = rightWrist.y < nose.y;
        
        return (leftUp && !rightUp) || (!leftUp && rightUp);
    }

    /**
     * Dessin du squelette (grand format)
     */
    drawSkeletonLarge(p, poseData) {
        const offsetX = p.width / 2;
        const offsetY = p.height / 2;
        
        // Échelle pour adapter à la zone centrale
        const scaleX = 640 / this.videoCapture.width;
        const scaleY = 480 / this.videoCapture.height;
        
        p.push();
        p.translate(offsetX, offsetY);
        p.scale(-1, 1); // Miroir
        
        // Connexions du squelette
        const connections = [
            ['nose', 'left_eye'], ['left_eye', 'left_ear'], ['nose', 'right_eye'], ['right_eye', 'right_ear'],
            ['left_shoulder', 'right_shoulder'],
            ['left_shoulder', 'left_elbow'], ['left_elbow', 'left_wrist'],
            ['right_shoulder', 'right_elbow'], ['right_elbow', 'right_wrist'],
            ['left_shoulder', 'left_hip'], ['right_shoulder', 'right_hip'],
            ['left_hip', 'right_hip'],
            ['left_hip', 'left_knee'], ['left_knee', 'left_ankle'],
            ['right_hip', 'right_knee'], ['right_knee', 'right_ankle']
        ];
        
        // Dessiner les connexions
        p.stroke(163, 255, 86);
        p.strokeWeight(6);
        connections.forEach(([part1, part2]) => {
            const kp1 = poseData.keypoints.find(kp => kp.name === part1);
            const kp2 = poseData.keypoints.find(kp => kp.name === part2);
            if (kp1 && kp2 && kp1.confidence > 0.2 && kp2.confidence > 0.2) {
                p.line(
                    (kp1.x - this.videoCapture.width / 2) * scaleX,
                    (kp1.y - this.videoCapture.height / 2) * scaleY,
                    (kp2.x - this.videoCapture.width / 2) * scaleX,
                    (kp2.y - this.videoCapture.height / 2) * scaleY
                );
            }
        });
        
        // Dessiner les points
        p.fill(255, 183, 85);
        p.noStroke();
        poseData.keypoints.forEach(kp => {
            if (kp.confidence > 0.2) {
                p.circle(
                    (kp.x - this.videoCapture.width / 2) * scaleX,
                    (kp.y - this.videoCapture.height / 2) * scaleY,
                    12
                );
            }
        });
        
        p.pop();
    }

    /**
     * Dessin de la silhouette de la pose requise
     */
    drawPoseSilhouette(p, poseId, x, y, matched) {
        p.push();
        p.translate(x, y);
        
        // Couleur de la silhouette
        if (matched) {
            p.stroke(163, 255, 86);
            p.fill(163, 255, 86, 100);
        } else {
            p.stroke(255, 255, 255);
            p.fill(255, 255, 255, 100);
        }
        
        p.strokeWeight(4);
        
        const scale = 80;
        
        switch(poseId) {
            case 'arms-up':
                // Tête
                p.circle(0, -scale * 1.5, scale * 0.4);
                // Corps
                p.line(0, -scale, 0, scale * 0.5);
                // Bras levés
                p.line(0, -scale * 0.8, -scale * 0.6, -scale * 1.8);
                p.line(0, -scale * 0.8, scale * 0.6, -scale * 1.8);
                // Jambes
                p.line(0, scale * 0.5, -scale * 0.3, scale * 1.3);
                p.line(0, scale * 0.5, scale * 0.3, scale * 1.3);
                break;
                
            case 'arms-wide':
                // Tête
                p.circle(0, -scale * 1.5, scale * 0.4);
                // Corps
                p.line(0, -scale, 0, scale * 0.5);
                // Bras écartés
                p.line(0, -scale * 0.8, -scale * 1.2, -scale * 0.8);
                p.line(0, -scale * 0.8, scale * 1.2, -scale * 0.8);
                // Jambes
                p.line(0, scale * 0.5, -scale * 0.3, scale * 1.3);
                p.line(0, scale * 0.5, scale * 0.3, scale * 1.3);
                break;
                
            case 'squat':
                // Tête
                p.circle(0, -scale * 0.8, scale * 0.4);
                // Corps
                p.line(0, -scale * 0.5, 0, scale * 0.2);
                // Bras
                p.line(0, -scale * 0.3, -scale * 0.5, -scale * 0.1);
                p.line(0, -scale * 0.3, scale * 0.5, -scale * 0.1);
                // Jambes pliées
                p.line(0, scale * 0.2, -scale * 0.4, scale * 0.8);
                p.line(0, scale * 0.2, scale * 0.4, scale * 0.8);
                break;
                
            case 'one-arm-up':
                // Tête
                p.circle(0, -scale * 1.5, scale * 0.4);
                // Corps
                p.line(0, -scale, 0, scale * 0.5);
                // Un bras levé
                p.line(0, -scale * 0.8, -scale * 0.6, -scale * 1.8);
                // Un bras baissé
                p.line(0, -scale * 0.8, scale * 0.6, -scale * 0.3);
                // Jambes
                p.line(0, scale * 0.5, -scale * 0.3, scale * 1.3);
                p.line(0, scale * 0.5, scale * 0.3, scale * 1.3);
                break;
        }
        
        p.pop();
    }

    /**
     * Nettoyage
     */
    cleanup() {
        console.log('🧹 WallShapesGame - Nettoyage');
        
        // Arrêt de la webcam
        if (this.videoCapture) {
            this.videoCapture.stop();
            this.videoCapture.remove();
            this.videoCapture = null;
        }
        
        // Arrêt de BodyPose
        if (this.bodyPose) {
            this.bodyPose.detectStop();
            this.bodyPose = null;
        }
        
        super.cleanup();
    }
}
