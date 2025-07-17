// mtg-tokenizer-configurable.js
// Configurable MTG Card Tokenizer using CSV configuration

class MTGTokenizer {
    constructor(configData = null) {
        this.categoryMaps = new Map();
        this.vocabulary = new Set();
        this.unknownTokens = new Set();
        this.tokenCounts = new Map();
        this.phrases = new Set();
        this.configLoaded = false;
        
        if (configData) {
            this.loadConfiguration(configData);
        }
    }

    // Load configuration from CSV data
    loadConfiguration(csvData) {
        try {
            const lines = csvData.split('\n');
            const headers = lines[0].split(',').map(h => h.trim());
            
            // Validate headers
            const expectedHeaders = ['category', 'token', 'description'];
            if (!expectedHeaders.every(h => headers.includes(h))) {
                throw new Error(`Invalid CSV headers. Expected: ${expectedHeaders.join(', ')}`);
            }
            
            // Clear existing data
            this.categoryMaps.clear();
            this.vocabulary.clear();
            this.phrases.clear();
            this.tokenCounts.clear();
            this.unknownTokens.clear();
            
            // Process each line
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;
                
                // Parse CSV line (handle quoted fields)
                const fields = this.parseCSVLine(line);
                if (fields.length < 3) continue;
                
                const category = fields[0].trim();
                const token = fields[1].trim();
                const description = fields[2].trim();
                
                // Add to category map
                if (!this.categoryMaps.has(category)) {
                    this.categoryMaps.set(category, new Set());
                }
                this.categoryMaps.get(category).add(token);
                
                // Add to vocabulary
                this.vocabulary.add(token);
                
                // Store phrases separately for preprocessing
                if (category === 'phrases') {
                    this.phrases.add(token);
                }
            }
            
            this.configLoaded = true;
            console.log(`Tokenizer configuration loaded with ${this.vocabulary.size} tokens across ${this.categoryMaps.size} categories`);
            
        } catch (error) {
            console.error('Error loading tokenizer configuration:', error);
            throw error;
        }
    }

    // Parse CSV line handling quoted fields
    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        
        result.push(current);
        return result;
    }

    // Load configuration from CSV file (for browser environment)
    async loadConfigurationFromFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    this.loadConfiguration(e.target.result);
                    resolve();
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = () => reject(new Error('Failed to read configuration file'));
            reader.readAsText(file);
        });
    }

    // Load configuration from URL (for browser environment)
    async loadConfigurationFromURL(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to fetch configuration: ${response.status}`);
            }
            const csvData = await response.text();
            this.loadConfiguration(csvData);
        } catch (error) {
            console.error('Error loading configuration from URL:', error);
            throw error;
        }
    }

    // Get tokens by category
    getTokensByCategory(category) {
        return Array.from(this.categoryMaps.get(category) || []);
    }

    // Get all categories
    getCategories() {
        return Array.from(this.categoryMaps.keys());
    }

    // Add a new token to a category
    addToken(category, token, description = '') {
        if (!this.categoryMaps.has(category)) {
            this.categoryMaps.set(category, new Set());
        }
        this.categoryMaps.get(category).add(token);
        this.vocabulary.add(token);
        
        if (category === 'phrases') {
            this.phrases.add(token);
        }
    }

    // Remove a token from a category
    removeToken(category, token) {
        if (this.categoryMaps.has(category)) {
            this.categoryMaps.get(category).delete(token);
            
            // Remove from vocabulary if not in any other category
            let foundInOtherCategory = false;
            for (const [cat, tokens] of this.categoryMaps.entries()) {
                if (cat !== category && tokens.has(token)) {
                    foundInOtherCategory = true;
                    break;
                }
            }
            
            if (!foundInOtherCategory) {
                this.vocabulary.delete(token);
                if (category === 'phrases') {
                    this.phrases.delete(token);
                }
            }
        }
    }

    // Preprocess text to handle MTG-specific formatting
    preprocessText(text) {
        if (!text) return '';
        
        // Convert to lowercase for processing
        let processed = text.toLowerCase();
        
        // Handle mana symbols - keep them as single tokens and convert hybrid/Phyrexian
        processed = processed.replace(/\{[^}]+\}/g, (match) => {
            // Convert hybrid mana symbols to use / indicator
            if (match.match(/\{[WUBRG2]\/(W|U|B|R|G)\}/)) {
                return ` / `;
            }
            // Convert Phyrexian mana symbols to use P indicator
            if (match.match(/\{[WUBRG]\/P\}/)) {
                return ` P `;
            }
            // Keep other mana symbols as-is
            return ` ${match} `;
        });
        
        // Handle configured phrases that should be single tokens
        const phrases = this.getTokensByCategory('phrases');
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
        if (!this.configLoaded) {
            throw new Error('Tokenizer configuration not loaded. Call loadConfiguration() first.');
        }
        
        console.log('=== DEBUG: tokenizeText called ===');
        console.log('Input text:', text);
        
        const processed = this.preprocessText(text);
        
        // Split on whitespace and punctuation, but keep punctuation as tokens
        const punctuationTokens = this.getTokensByCategory('punctuation');
        const punctuationRegex = punctuationTokens.length > 0 
            ? new RegExp(`([${punctuationTokens.map(p => p.replace(/[.*+?^${}()|[\]\\-]/g, '\\$&')).join('')}])`, 'g')
            : /([.,:;!?()\[\]{}"'—–+/*=<>~-])/g;
        
        const rawTokens = processed.split(punctuationRegex)
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
        if (!this.configLoaded) {
            throw new Error('Tokenizer configuration not loaded. Call loadConfiguration() first.');
        }
        
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
        if (!this.configLoaded) {
            throw new Error('Tokenizer configuration not loaded. Call loadConfiguration() first.');
        }
        
        // Clear previous token counts and unknown tokens for this session
        this.tokenCounts.clear();
        this.unknownTokens.clear();
        
        const results = [];
        
        for (const card of cards) {
            try {
                const tokenized = this.tokenizeCard(card);
                results.push(tokenized);
            } catch (error) {
                console.error(`Error tokenizing card ${card?.name || 'unknown'}:`, error);
            }
        }

        const totalTokens = Array.from(this.tokenCounts.values()).reduce((a, b) => a + b, 0);

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
                totalTokens: totalTokens
            }
        };
    }

    // Get tokenization statistics
    getStats() {
        return {
            configLoaded: this.configLoaded,
            categories: this.getCategories(),
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
            categories: Object.fromEntries(
                Array.from(this.categoryMaps.entries()).map(([cat, tokens]) => [cat, Array.from(tokens)])
            ),
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

    // Export current configuration as CSV
    exportConfiguration() {
        const lines = ['category,token,description'];
        
        for (const [category, tokens] of this.categoryMaps.entries()) {
            for (const token of tokens) {
                // Escape quotes and wrap in quotes if contains comma
                const escapedToken = token.includes(',') || token.includes('"') 
                    ? `"${token.replace(/"/g, '""')}"` 
                    : token;
                lines.push(`${category},${escapedToken},Token from ${category} category`);
            }
        }
        
        return lines.join('\n');
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MTGTokenizer;
} else {
    window.MTGTokenizer = MTGTokenizer;
}
