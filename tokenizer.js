// mtg-tokenizer.js
// Comprehensive MTG Card Tokenizer

class MTGTokenizer {
    constructor() {
        this.initializeVocabulary();
        this.unknownTokens = new Set();
        this.tokenCounts = new Map();
    }

    initializeVocabulary() {
        // MTG Keywords (abilities that appear as single words)
        this.keywords = new Set([
            // Evergreen Keywords
            'deathtouch', 'defender', 'double strike', 'enchant', 'equip', 'first strike',
            'flash', 'flying', 'haste', 'hexproof', 'indestructible', 'lifelink',
            'menace', 'protection', 'reach', 'trample', 'vigilance', 'ward',
            
            // Other Common Keywords
            'affinity', 'annihilator', 'banding', 'battle cry', 'bloodthirst', 'bushido',
            'buyback', 'cascade', 'changeling', 'convoke', 'cumulative upkeep', 'cycling',
            'dredge', 'echo', 'epic', 'evoke', 'exalted', 'explore', 'fading',
            'fear', 'flanking', 'flashback', 'forestwalk', 'frenzy', 'gravestorm',
            'haste', 'hideaway', 'horsemanship', 'imprint', 'intimidate', 'islandwalk',
            'kicker', 'landwalk', 'madness', 'morph', 'mountainwalk', 'multikicker',
            'persist', 'phasing', 'plainswalk', 'provoke', 'rampage', 'rebound',
            'recover', 'replicate', 'retrace', 'shadow', 'shroud', 'split second',
            'storm', 'sunburst', 'suspend', 'swampwalk', 'totem armor', 'transfigure',
            'undying', 'unearth', 'vanishing', 'wither',
            
            // Newer Keywords
            'adapt', 'addendum', 'afterlife', 'amass', 'ascend', 'assist', 'awaken',
            'battalion', 'bestow', 'boast', 'champion', 'cipher', 'clash', 'companion',
            'connive', 'constellation', 'converge', 'crew', 'dash', 'delve', 'detain',
            'devoid', 'double team', 'emerge', 'embalm', 'eternalize', 'escalate',
            'escape', 'exploit', 'fabricate', 'fight', 'forecast', 'foretell',
            'graft', 'heroic', 'hideaway', 'historic', 'inspired', 'jump-start',
            'landfall', 'learn', 'legendary', 'melee', 'mentor', 'miracle', 'modular',
            'myriad', 'ninjutsu', 'outlast', 'overload', 'partner', 'populate',
            'proliferate', 'prowess', 'raid', 'rally', 'renown', 'revolt', 'riot',
            'scavenge', 'scry', 'spectacle', 'splice', 'surveil', 'threshold',
            'tribute', 'undergrowth', 'unleash', 'vehicles'
        ]);

        // Trigger conditions
        this.triggers = new Set([
            'when', 'whenever', 'at the beginning of', 'at the end of', 'if', 'as long as',
            'enters the battlefield', 'leaves the battlefield', 'dies', 'attacks',
            'blocks', 'becomes blocked', 'deals damage', 'is dealt damage', 'becomes tapped',
            'becomes untapped', 'is discarded', 'is sacrificed', 'is exiled', 'is put into',
            'becomes the target', 'becomes attached', 'becomes unattached', 'transforms',
            'your upkeep', 'your draw step', 'your main phase', 'your end step',
            'each upkeep', 'each end step', 'each turn', 'each combat',
            'beginning of combat', 'end of combat', 'first strike damage',
            'combat damage', 'end of turn'
        ]);

        // Game actions and effects
        this.actions = new Set([
            'draw', 'discard', 'mill', 'exile', 'destroy', 'sacrifice', 'tap', 'untap',
            'search', 'shuffle', 'reveal', 'look', 'choose', 'target', 'deal damage',
            'gain life', 'lose life', 'put', 'return', 'cast', 'play', 'activate',
            'counter', 'copy', 'create', 'token', 'transform', 'flip', 'turn face up',
            'turn face down', 'attach', 'detach', 'equip', 'unequip', 'scry', 'fateseal',
            'clash', 'vote', 'investigate', 'explore', 'surveil', 'adapt', 'amass',
            'proliferate', 'populate', 'manifest', 'megamorph', 'bolster', 'support',
            'goad', 'meld', 'emerge', 'escalate', 'madness', 'surge', 'awaken',
            'devoid', 'ingest', 'process'
        ]);

        // Card types and supertypes
        this.cardTypes = new Set([
            'artifact', 'creature', 'enchantment', 'instant', 'land', 'planeswalker',
            'sorcery', 'tribal', 'legendary', 'basic', 'snow', 'world'
        ]);

        // Creature types (common ones)
        this.creatureTypes = new Set([
            'human', 'elf', 'goblin', 'zombie', 'angel', 'demon', 'dragon', 'beast',
            'bird', 'cat', 'dog', 'elephant', 'fish', 'horse', 'snake', 'spider',
            'wolf', 'bear', 'boar', 'fox', 'rat', 'bat', 'cow', 'crab', 'frog',
            'goat', 'sheep', 'pig', 'rabbit', 'turtle', 'whale', 'wizard', 'warrior',
            'soldier', 'knight', 'rogue', 'cleric', 'shaman', 'druid', 'monk',
            'berserker', 'barbarian', 'archer', 'scout', 'advisor', 'artificer',
            'assassin', 'mercenary', 'pirate', 'pilot', 'rebel', 'rigger', 'samurai',
            'ninja', 'construct', 'golem', 'homunculus', 'thopter', 'spirit', 'elemental',
            'giant', 'cyclops', 'ogre', 'orc', 'troll', 'minotaur', 'centaur', 'satyr',
            'faerie', 'merfolk', 'vedalken', 'viashino', 'kithkin', 'kor', 'leonin',
            'rhox', 'loxodon', 'vampire', 'werewolf', 'horror', 'nightmare', 'shade',
            'specter', 'wraith', 'zombie', 'skeleton', 'sliver', 'eldrazi'
        ]);

        // Mana and costs
        this.manaSymbols = new Set([
            '{W}', '{U}', '{B}', '{R}', '{G}', '{C}', '{X}', '{Y}', '{Z}',
            '{0}', '{1}', '{2}', '{3}', '{4}', '{5}', '{6}', '{7}', '{8}', '{9}',
            '{10}', '{11}', '{12}', '{13}', '{14}', '{15}', '{16}', '{17}', '{18}', '{19}', '{20}',
            '{W/U}', '{W/B}', '{U/B}', '{U/R}', '{B/R}', '{B/G}', '{R/G}', '{R/W}', '{G/W}', '{G/U}',
            '{2/W}', '{2/U}', '{2/B}', '{2/R}', '{2/G}',
            '{W/P}', '{U/P}', '{B/P}', '{R/P}', '{G/P}',
            '{T}', '{Q}', '{S}', '{E}'
        ]);

        // Common game terms
        this.gameTerms = new Set([
            'mana', 'mana cost', 'converted mana cost', 'color', 'colorless', 'multicolored',
            'power', 'toughness', 'loyalty', 'hand', 'library', 'graveyard', 'battlefield',
            'stack', 'exile', 'command zone', 'life', 'poison counter', 'experience counter',
            'energy counter', '+1/+1 counter', '-1/-1 counter', 'charge counter', 'time counter',
            'fade counter', 'age counter', 'divinity counter', 'feather counter', 'gold counter',
            'ice counter', 'level counter', 'lore counter', 'loyalty counter', 'music counter',
            'page counter', 'pressure counter', 'quest counter', 'storage counter', 'study counter',
            'verse counter', 'wage counter', 'turn', 'phase', 'step', 'priority', 'spell',
            'ability', 'permanent', 'nonpermanent', 'token', 'copy', 'owner', 'controller'
        ]);

        // Zones and locations
        this.zones = new Set([
            'hand', 'library', 'graveyard', 'battlefield', 'stack', 'exile', 'command zone',
            'top of library', 'bottom of library', 'your hand', 'your library', 'your graveyard',
            'opponent\'s hand', 'opponent\'s library', 'opponent\'s graveyard'
        ]);

        // Numbers and quantities
        this.numbers = new Set([
            'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
            'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty',
            'x', 'y', 'z', 'each', 'all', 'any', 'another', 'other', 'first', 'second', 'third',
            'half', 'double', 'triple', 'equal', 'additional', 'extra'
        ]);

        // Conditional and logical terms
        this.conditionals = new Set([
            'if', 'unless', 'when', 'whenever', 'while', 'as long as', 'instead', 'rather than',
            'only', 'can\'t', 'may', 'must', 'choose', 'random', 'at random'
        ]);

        // Combine all vocabularies
        this.vocabulary = new Set([
            ...this.keywords,
            ...this.triggers,
            ...this.actions,
            ...this.cardTypes,
            ...this.creatureTypes,
            ...this.manaSymbols,
            ...this.gameTerms,
            ...this.zones,
            ...this.numbers,
            ...this.conditionals,
            'CardName' // Generic token for all card names
        ]);

        // Add common punctuation and symbols as tokens
        this.punctuation = new Set([
            '.', ',', ':', ';', '!', '?', '(', ')', '[', ']', '{', '}', '"', "'",
            '—', '–', '-', '+', '/', '*', '=', '<', '>', '~'
        ]);
    }

    // Preprocess text to handle MTG-specific formatting
    preprocessText(text) {
        if (!text) return '';
        
        // Convert to lowercase for processing
        let processed = text.toLowerCase();
        
        // Handle mana symbols - keep them as single tokens
        processed = processed.replace(/\{[^}]+\}/g, (match) => ` ${match} `);
        
        // Handle common MTG phrases that should be single tokens
        const phrases = [
            'enters the battlefield', 'leaves the battlefield', 'beginning of combat',
            'end of combat', 'beginning of upkeep', 'end of turn', 'combat damage',
            'first strike damage', 'converted mana cost', 'mana cost', 'at the beginning of',
            'at the end of', 'as long as', 'rather than', 'in addition to', 'instead of',
            'double strike', 'first strike', 'split second', 'cumulative upkeep',
            'battle cry', 'totem armor', 'whenever ~ enters the battlefield',
            'when ~ dies', 'when ~ attacks', 'sacrifice ~', 'destroy target',
            'draw a card', 'gain life', 'lose life', 'deal damage', '+1/+1 counter',
            '-1/-1 counter', 'top of library', 'bottom of library'
        ];
        
        // Replace phrases with underscore-connected versions for tokenization
        phrases.forEach(phrase => {
            const regex = new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
            processed = processed.replace(regex, phrase.replace(/\s+/g, '_'));
        });
        
        // Handle reminder text in parentheses - often contains important ability definitions
        processed = processed.replace(/\([^)]+\)/g, (match) => {
            // Remove parentheses but keep the content
            return ' ' + match.slice(1, -1) + ' ';
        });
        
        // Handle card names with ~ symbol
        processed = processed.replace(/~/g, 'CARDNAME');
        
        return processed;
    }

    // Tokenize a single text string
    tokenizeText(text) {
        const processed = this.preprocessText(text);
        
        // Split on whitespace and punctuation, but keep punctuation as tokens
        const rawTokens = processed.split(/(\s+|[.,:;!?()\[\]{}"'—–\-+/*=<>~])/)
            .filter(token => token.trim().length > 0)
            .map(token => token.trim());
        
        const tokens = [];
        
        for (let token of rawTokens) {
            // Skip empty tokens
            if (!token) continue;
            
            // Convert underscores back to spaces for multi-word tokens
            const normalizedToken = token.replace(/_/g, ' ');
            
            // Check if it's in our vocabulary
            if (this.vocabulary.has(normalizedToken) || 
                this.punctuation.has(token) ||
                this.manaSymbols.has(token) ||
                /^\d+$/.test(token)) { // numbers
                
                tokens.push(normalizedToken);
                this.updateTokenCount(normalizedToken);
            } else {
                // Handle unknown tokens
                this.unknownTokens.add(normalizedToken);
                tokens.push(`UNK_${normalizedToken}`);
                this.updateTokenCount(`UNK_${normalizedToken}`);
            }
        }
        
        return tokens;
    }

    // Update token frequency counts
    updateTokenCount(token) {
        this.tokenCounts.set(token, (this.tokenCounts.get(token) || 0) + 1);
    }

    // Tokenize a complete MTG card object
    tokenizeCard(card) {
        const tokens = [];
        const cardData = {
            name: card.name || '',
            type_line: card.type_line || '',
            oracle_text: card.oracle_text || '',
            mana_cost: card.mana_cost || '',
            power: card.power || null,
            toughness: card.toughness || null,
            loyalty: card.loyalty || null,
            rarity: card.rarity || '',
            colors: card.colors || [],
            color_identity: card.color_identity || [],
            cmc: card.cmc || 0
        };

        // Tokenize different parts of the card
        const sections = {
            name: ['CardName'], // Use generic CardName token instead of tokenizing actual names
            type: this.tokenizeText(cardData.type_line),
            text: this.tokenizeText(cardData.oracle_text),
            mana: this.tokenizeText(cardData.mana_cost),
            stats: []
        };

        // Update token count for CardName
        this.updateTokenCount('CardName');

        // Handle power/toughness/loyalty
        if (cardData.power !== null) {
            sections.stats.push(`POWER_${cardData.power}`);
        }
        if (cardData.toughness !== null) {
            sections.stats.push(`TOUGHNESS_${cardData.toughness}`);
        }
        if (cardData.loyalty !== null) {
            sections.stats.push(`LOYALTY_${cardData.loyalty}`);
        }

        // Add rarity as a token
        if (cardData.rarity) {
            sections.rarity = [`RARITY_${cardData.rarity.toUpperCase()}`];
        }

        // Add colors as tokens
        sections.colors = cardData.colors.map(color => `COLOR_${color}`);
        
        // Add CMC as a token
        sections.cmc = [`CMC_${cardData.cmc}`];

        // Handle double-faced cards
        if (card.card_faces && card.card_faces.length > 0) {
            sections.faces = [];
            card.card_faces.forEach((face, index) => {
                const faceTokens = {
                    name: this.tokenizeText(face.name || ''),
                    type: this.tokenizeText(face.type_line || ''),
                    text: this.tokenizeText(face.oracle_text || ''),
                    mana: this.tokenizeText(face.mana_cost || '')
                };
                sections.faces.push(faceTokens);
            });
        }

        return {
            cardId: card.id || card.name,
            tokens: sections,
            metadata: {
                set: card.set,
                rarity: cardData.rarity,
                cmc: cardData.cmc,
                colors: cardData.colors
            }
        };
    }

    // Tokenize an array of cards
    tokenizeCards(cards) {
        const results = [];
        
        for (const card of cards) {
            try {
                const tokenized = this.tokenizeCard(card);
                results.push(tokenized);
            } catch (error) {
                console.error(`Error tokenizing card ${card.name || 'unknown'}:`, error);
            }
        }

        return {
            tokenizedCards: results,
            vocabulary: Array.from(this.vocabulary).sort(),
            unknownTokens: Array.from(this.unknownTokens).sort(),
            tokenCounts: Object.fromEntries(
                Array.from(this.tokenCounts.entries()).sort((a, b) => b[1] - a[1])
            ),
            stats: {
                totalCards: results.length,
                vocabularySize: this.vocabulary.size,
                unknownTokenCount: this.unknownTokens.size,
                totalTokens: Array.from(this.tokenCounts.values()).reduce((a, b) => a + b, 0)
            }
        };
    }

    // Get tokenization statistics
    getStats() {
        return {
            vocabularySize: this.vocabulary.size,
            unknownTokenCount: this.unknownTokens.size,
            totalUniqueTokens: this.tokenCounts.size,
            totalTokens: Array.from(this.tokenCounts.values()).reduce((a, b) => a + b, 0),
            topTokens: Array.from(this.tokenCounts.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 20)
        };
    }

    // Export vocabulary for model training
    exportVocabulary() {
        return {
            vocabulary: Array.from(this.vocabulary).sort(),
            tokenToId: Object.fromEntries(
                Array.from(this.vocabulary).sort().map((token, index) => [token, index])
            ),
            idToToken: Object.fromEntries(
                Array.from(this.vocabulary).sort().map((token, index) => [index, token])
            ),
            unknownTokens: Array.from(this.unknownTokens).sort(),
            stats: this.getStats()
        };
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MTGTokenizer;
} else {
    window.MTGTokenizer = MTGTokenizer;
}
