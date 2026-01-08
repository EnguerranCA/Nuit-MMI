/**
 * Tutorial System - Système de tutoriel réutilisable
 * Génère automatiquement le HTML du tutoriel selon un format standard
 */

export class TutorialSystem {
    /**
     * Génère le HTML complet du tutoriel
     * @param {Object} tutorialData - Données du tutoriel
     * @param {string} tutorialData.title - Titre du jeu
     * @param {string} tutorialData.objective - Objectif du jeu
     * @param {string} tutorialData.tip - Astuce (optionnel)
     * @param {string} tutorialData.technology - Technologie utilisée (ML5, MakeyMakey, etc.)
     * @param {string} tutorialData.input - Type d'input (Webcam, MakeyMakey, etc.)
     * @returns {string} - HTML du tutoriel
     */
    static generate(tutorialData) {
        const {
            title,
            objective,
            tip = null,
            technology = 'ML5',
            input = 'Webcam'
        } = tutorialData;

        // Construction de l'astuce si elle existe
        const tipHTML = tip ? `
            <div class="bg-lime-100 border-2 border-lime-400 rounded-xl p-3 mt-4">
                <p class="text-base">
                    <strong>Astuce :</strong> ${tip}
                </p>
            </div>
        ` : '';

        // HTML complet
        return `
            <div class="space-y-5">
                
                <!-- Objectif -->
                <div class="bg-orange-50 border-2 border-primary rounded-xl p-4">
                    <p class="text-lg">
                        <strong>Objectif :</strong><br>
                        <span class="mt-2 block text-center">${objective}</span>
                    </p>
                </div>

            </div>
        `;
    }


    /**
     * Raccourci pour les tutoriels ML5
     */
    static generateML5Tutorial(data) {
        return this.generate({
            ...data,
            technology: 'ML5',
            input: 'Webcam'
        });
    }

    /**
     * Raccourci pour les tutoriels MakeyMakey
     */
    static generateMakeyMakeyTutorial(data) {
        return this.generate({
            ...data,
            technology: 'MakeyMakey',
            input: 'MakeyMakey'
        });
    }

    /**
     * Raccourci pour les tutoriels hybrides
     */
    static generateHybridTutorial(data) {
        return this.generate({
            ...data,
            technology: 'ML5+MakeyMakey',
            input: 'Both'
        });
    }
}
