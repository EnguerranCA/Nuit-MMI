/**
 * Tutorial System - Reusable tutorial system
 * Generates card-based tutorial HTML
 */

export class TutorialSystem {
    /**
     * Generates the card-based tutorial HTML
     * @param {Object} tutorialData - Tutorial data
     * @param {string} tutorialData.title - Game title
     * @param {string} tutorialData.color - Card background color (hex)
     * @param {Array} tutorialData.cards - Array of card objects {image, text, span?}
     * @returns {string} - Tutorial HTML
     */
    static generateCards(tutorialData) {
        const { cards, color = '#8b5cf6' } = tutorialData;

        const cardsHTML = cards.map(card => {
            const spanClass = card.span === 2 ? 'md:col-span-2 md:w-2/3 md:mx-auto' : '';
            return `
                <article class="${spanClass} rounded-[2rem] p-4 flex items-center shadow-xl h-auto md:h-48 transition-transform hover:scale-[1.02]" style="background-color: ${color}">
                    <div class="w-1/2 h-full">
                        <img src="${card.image}" alt="" class="w-full h-full object-cover rounded-2xl border-2 border-black/10">
                    </div>
                    <div class="w-1/2 pl-4">
                        <p class="font-body font-bold text-base md:text-xl leading-tight text-black">
                            ${card.text}
                        </p>
                    </div>
                </article>
            `;
        }).join('');

        return `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                ${cardsHTML}
            </div>
        `;
    }

    /**
     * Legacy generate method for backwards compatibility
     */
    static generate(tutorialData) {
        // If cards are provided, use the new card system
        if (tutorialData.cards) {
            return this.generateCards(tutorialData);
        }
        
        // Fallback to simple format
        const { objective } = tutorialData;
        return `
            <div class="space-y-5">
                <div class="bg-primary rounded-xl p-4">
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
        return this.generate(data);
    }

    /**
     * Raccourci pour les tutoriels MakeyMakey
     */
    static generateMakeyMakeyTutorial(data) {
        return this.generate(data);
    }

    /**
     * Raccourci pour les tutoriels hybrides
     */
    static generateHybridTutorial(data) {
        return this.generate(data);
    }
}
