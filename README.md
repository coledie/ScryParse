# ScryParse

Parse Scryfall API MTG cards for tokenization

## Features

- **Download MTG Card Data**: Fetch card data from Scryfall API by set code
- **Configurable Tokenization**: Use CSV-based configuration for flexible vocabulary management
- **Multi-file Support**: Load and process multiple card data files at once
- **Token Preview**: Preview tokenization results before exporting
- **Export Options**: Download tokenized data as JSON

## Usage

1. **Download Cards**: Enter a set code (e.g., "ELD", "MKM") and download card data
2. **Switch to Tokenize Tab**: The tokenizer configuration will load automatically
3. **Load Card Data**: Select the JSON files you downloaded in step 1
4. **Tokenize**: Generate tokens from the card data using the pre-configured vocabulary
5. **Export**: Download the tokenized results as JSON

## CSV Configuration

The tokenizer uses a CSV-based configuration system that automatically loads from `tokenizer_config.csv`. See `TOKENIZER_README.md` for detailed information about customizing the tokenization vocabulary.

## Files

- `index.html` - Main application interface
- `scryfallfetch.js` - Scryfall API integration
- `tokenizer-configurable.js` - Configurable tokenizer implementation
- `tokenizer_config.csv` - Default tokenizer configuration
- `style.css` - Application styling
- `TOKENIZER_README.md` - Detailed tokenizer documentation
