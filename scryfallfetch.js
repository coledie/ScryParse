// mtg-downloader.js
// MTG Set Card Downloader JavaScript Module

class MTGDownloader {
    constructor() {
        this.apiBaseUrl = 'https://api.scryfall.com';
        this.isDownloading = false;
    }

    /**
     * Download all cards from a specific MTG set
     * @param {string} setCode - The set code (e.g., 'eld', 'mkm')
     * @param {Function} onProgress - Callback for progress updates
     * @returns {Promise<Array>} Array of card objects
     */
    async downloadSetCards(setCode, onProgress = null) {
        if (this.isDownloading) {
            throw new Error('Download already in progress');
        }

        this.isDownloading = true;
        
        try {
            let allCards = [];
            let nextPageUrl = `${this.apiBaseUrl}/cards/search?q=set:${setCode}&order=set`;
            let pageCount = 0;
            
            if (onProgress) {
                onProgress(`Starting download for set ${setCode.toUpperCase()}...`, 'loading');
            }
            
            while (nextPageUrl) {
                pageCount++;
                
                if (onProgress) {
                    onProgress(`Downloading page ${pageCount}${allCards.length > 0 ? ` (${allCards.length} cards so far)` : ''}...`, 'loading');
                }
                
                const response = await fetch(nextPageUrl);
                
                if (!response.ok) {
                    if (response.status === 404) {
                        throw new Error(`Set "${setCode.toUpperCase()}" not found. Please check the set code.`);
                    }
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                const pageCards = this.extractCardData(data.data);
                allCards = allCards.concat(pageCards);
                
                // Check if there's a next page
                nextPageUrl = data.has_more ? data.next_page : null;
                
                // Be respectful to the API - add a small delay
                await this.delay(100);
            }
            
            if (onProgress) {
                onProgress(`Processing ${allCards.length} cards...`, 'loading');
            }
            
            return allCards;
            
        } finally {
            this.isDownloading = false;
        }
    }

    /**
     * Extract relevant card data from Scryfall API response
     * @param {Array} cards - Raw card data from API
     * @returns {Array} Cleaned card data
     */
    extractCardData(cards) {
        return cards.map(card => ({
            // Basic card info
            name: card.name,
            mana_cost: card.mana_cost || "",
            cmc: card.cmc,
            type_line: card.type_line,
            oracle_text: card.oracle_text || "",
            
            // Combat stats
            power: card.power || null,
            toughness: card.toughness || null,
            
            // Color information
            colors: card.colors || [],
            color_identity: card.color_identity || [],
            
            // Set information
            rarity: card.rarity,
            set: card.set,
            set_name: card.set_name,
            collector_number: card.collector_number,
            artist: card.artist,
            
            // Images
            image_uris: card.image_uris ? {
                small: card.image_uris.small,
                normal: card.image_uris.normal,
                large: card.image_uris.large
            } : null,
            
            // Handle double-faced cards (transform, modal, etc.)
            card_faces: card.card_faces ? card.card_faces.map(face => ({
                name: face.name,
                mana_cost: face.mana_cost || "",
                type_line: face.type_line,
                oracle_text: face.oracle_text || "",
                power: face.power || null,
                toughness: face.toughness || null,
                colors: face.colors || [],
                image_uris: face.image_uris ? {
                    small: face.image_uris.small,
                    normal: face.image_uris.normal,
                    large: face.image_uris.large
                } : null
            })) : null,
            
            // Legal and market info
            legalities: card.legalities,
            prices: card.prices,
            
            // Additional useful fields
            scryfall_id: card.id,
            scryfall_uri: card.scryfall_uri,
            rulings_uri: card.rulings_uri
        }));
    }

    /**
     * Download cards and save as JSON file
     * @param {string} setCode - The set code
     * @param {Function} onProgress - Progress callback
     * @param {Function} onComplete - Completion callback
     * @param {Function} onError - Error callback
     */
    async downloadAndSave(setCode, onProgress, onComplete, onError) {
        try {
            const cards = await this.downloadSetCards(setCode, onProgress);
            
            // Create and download the file
            const filename = `${setCode.toLowerCase()}_cards.json`;
            this.saveAsFile(cards, filename);
            
            if (onComplete) {
                onComplete(cards, filename);
            }
            
        } catch (error) {
            console.error('Download error:', error);
            
            // Ensure the downloading flag is reset on error
            this.isDownloading = false;
            
            if (onError) {
                onError(error);
            }
        }
    }

    /**
     * Save data as downloadable JSON file
     * @param {Object} data - Data to save
     * @param {string} filename - Name of the file
     */
    saveAsFile(data, filename) {
        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    /**
     * Validate set code format
     * @param {string} setCode - Set code to validate
     * @returns {boolean} Whether the set code is valid format
     */
    isValidSetCode(setCode) {
        if (!setCode || typeof setCode !== 'string') {
            return false;
        }
        
        const trimmed = setCode.trim();
        return trimmed.length >= 2 && trimmed.length <= 4 && /^[A-Za-z0-9]+$/.test(trimmed);
    }

    /**
     * Utility function for delays
     * @param {number} ms - Milliseconds to delay
     * @returns {Promise}
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Get popular set codes with names
     * @returns {Array} Array of {code, name} objects
     */
    getPopularSets() {
        return [
            { code: 'ELD', name: 'Throne of Eldraine' },
            { code: 'MKM', name: 'Murders at Karlov Manor' },
            { code: 'OTJ', name: 'Outlaws of Thunder Junction' },
            { code: 'BLB', name: 'Bloomburrow' },
            { code: 'DSK', name: 'Duskmourn: House of Horror' },
            { code: 'FDN', name: 'Foundations' },
            { code: 'BRO', name: 'The Brothers\' War' },
            { code: 'ONE', name: 'Phyrexia: All Will Be One' },
            { code: 'MOM', name: 'March of the Machine' },
            { code: 'WOE', name: 'Wilds of Eldraine' },
            { code: 'LTR', name: 'The Lord of the Rings' },
            { code: 'DMU', name: 'Dominaria United' },
            { code: 'SNC', name: 'Streets of New Capenna' },
            { code: 'NEO', name: 'Kamigawa: Neon Dynasty' },
            { code: 'VOW', name: 'Innistrad: Crimson Vow' },
            { code: 'MID', name: 'Innistrad: Midnight Hunt' }
        ];
    }
}

// UI Controller Class
class MTGDownloaderUI {
    constructor() {
        this.downloader = new MTGDownloader();
        this.elements = {};
        this.init();
    }

    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.bindElements());
        } else {
            this.bindElements();
        }
    }

    bindElements() {
        this.elements = {
            setCodeInput: document.getElementById('setCode'),
            downloadBtn: document.querySelector('.download-btn'),
            clearBtn: document.querySelector('.clear-btn'),
            statusDiv: document.getElementById('status')
        };

        this.bindEvents();
    }

    bindEvents() {
        // Download button
        this.elements.downloadBtn?.addEventListener('click', () => this.downloadSet());
        
        // Clear button
        this.elements.clearBtn?.addEventListener('click', () => this.clearInput());
        
        // Enter key support
        this.elements.setCodeInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.downloadSet();
            }
        });
        
        // Auto-uppercase input
        this.elements.setCodeInput?.addEventListener('input', (e) => {
            e.target.value = e.target.value.toUpperCase();
        });

        // Set code click handlers
        document.querySelectorAll('.set-code').forEach(element => {
            element.addEventListener('click', () => {
                const code = element.textContent;
                this.fillSetCode(code);
            });
        });
    }

    async downloadSet() {
        const setCode = this.elements.setCodeInput?.value.trim();
        
        if (!setCode) {
            this.showStatus('Please enter a set code!', 'error');
            return;
        }
        
        if (!this.downloader.isValidSetCode(setCode)) {
            this.showStatus('Set code should be 2-4 characters long and contain only letters/numbers!', 'error');
            return;
        }
        
        // Check if already downloading
        if (this.downloader.isDownloading) {
            this.showStatus('❌ Download already in progress. Please wait for the current download to complete.', 'error');
            return;
        }
        
        // Update UI for download state
        this.setDownloadState(true);
        
        try {
            await this.downloader.downloadAndSave(
                setCode,
                (message, type) => this.showStatus(`<span class="spinner"></span>${message}`, type),
                (cards, filename) => {
                    this.showStatus(`✅ Successfully downloaded ${cards.length} cards from ${setCode.toUpperCase()}!`, 'success');
                    this.setDownloadState(false);
                },
                (error) => {
                    this.showStatus(`❌ Error: ${error.message}`, 'error');
                    this.setDownloadState(false);
                }
            );
        } catch (error) {
            // Handle any unexpected errors
            this.showStatus(`❌ Unexpected error: ${error.message}`, 'error');
            this.setDownloadState(false);
        }
    }

    setDownloadState(isDownloading) {
        if (!this.elements.downloadBtn) return;
        
        if (isDownloading) {
            this.elements.downloadBtn.disabled = true;
            this.elements.downloadBtn.innerHTML = '<span class="spinner"></span>Downloading...';
        } else {
            this.elements.downloadBtn.disabled = false;
            this.elements.downloadBtn.innerHTML = '📥 Download Cards';
        }
    }

    showStatus(message, type) {
        if (!this.elements.statusDiv) return;
        
        this.elements.statusDiv.innerHTML = message;
        this.elements.statusDiv.className = `status ${type}`;
        this.elements.statusDiv.classList.remove('hidden');
    }

    clearInput() {
        if (this.elements.setCodeInput) {
            this.elements.setCodeInput.value = '';
        }
        if (this.elements.statusDiv) {
            this.elements.statusDiv.classList.add('hidden');
        }
    }

    fillSetCode(code) {
        if (this.elements.setCodeInput) {
            this.elements.setCodeInput.value = code;
        }
    }
}

// Global functions for backward compatibility
window.downloadSet = function() {
    if (window.mtgUI) {
        window.mtgUI.downloadSet();
    }
};

window.clearInput = function() {
    if (window.mtgUI) {
        window.mtgUI.clearInput();
    }
};

window.fillSetCode = function(code) {
    if (window.mtgUI) {
        window.mtgUI.fillSetCode(code);
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    window.mtgUI = new MTGDownloaderUI();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MTGDownloader, MTGDownloaderUI };
}
