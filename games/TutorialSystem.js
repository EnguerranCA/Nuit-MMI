/**
 * Tutorial System - Reusable tutorial system
 * Automatically generates tutorial HTML in a standard format
 */

export class TutorialSystem {
    /**
     * Generates the complete tutorial HTML
     * @param {Object} tutorialData - Tutorial data
     * @param {string} tutorialData.title - Game title
     * @param {string} tutorialData.objective - Game objective
     * @param {string} tutorialData.tip - Tip (optional)
     * @param {string} tutorialData.technology - Technology used (ML5, MakeyMakey, etc.)
     * @param {string} tutorialData.input - Input type (Webcam, MakeyMakey, etc.)
     * @returns {string} - Tutorial HTML
     */
    static generate(tutorialData) {
        const {
            title,
            objective,
            tip = null,
            technology = 'ML5',
            input = 'Webcam'
        } = tutorialData;

        // Build tip section if it exists
        const tipHTML = tip ? `
            <div class="bg-lime-100 border-2 border-lime-400 rounded-xl p-3 mt-4">
                <p class="text-base">
                    <strong>Tip:</strong> ${tip}
                </p>
            </div>
        ` : '';

        // Complete HTML
        return `
            <div class="space-y-5">
                
                <!-- Objective -->
                <div class="bg-orange-50 border-2 border-primary rounded-xl p-4">
                    <p class="text-lg">
                        <strong>Objective:</strong><br>
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
