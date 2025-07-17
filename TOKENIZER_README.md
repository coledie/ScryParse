# CSV-Based Tokenizer Configuration

The MTG tokenizer now supports configurable vocabulary through CSV files instead of hardcoded values.

## Configuration File Format

The configuration file is a CSV with the following columns:
- `category`: The category/type of the token (e.g., "keywords", "actions", "creatureTypes")
- `token`: The actual token text
- `description`: A description of the token

### Example CSV format:
```csv
category,token,description
keywords,flying,Evergreen keyword ability
keywords,trample,Evergreen keyword ability
actions,draw,Game action
actions,discard,Game action
creatureTypes,human,Creature type
creatureTypes,elf,Creature type
```

## Token Categories

The default configuration includes these categories:

- **evergreenKeywords**: MTG evergreen keyword abilities (flying, trample, deathtouch, etc.)
- **commonKeywords**: Other common MTG keyword abilities (flashback, cycling, etc.)
- **newerKeywords**: Newer MTG keyword abilities (adapt, connive, etc.)
- **triggers**: Trigger conditions (when, whenever, etc.)
- **actions**: Game actions (draw, discard, etc.)
- **cardTypes**: Card types and supertypes
- **creatureTypes**: Creature subtypes
- **manaSymbols**: Basic mana symbols (`{W}`, `{U}`, `{B}`, `{R}`, `{G}`, `{C}`, `{X}`, numbers, `/` for hybrid, `P` for Phyrexian)
- **basicGameTerms**: Basic game terminology (mana, color, power, toughness, etc.)
- **complexGameTerms**: Complex game terminology (mana cost, activated ability, etc.)
- **counters**: All types of counters (+1/+1, charge, loyalty, etc.)
- **zones**: Game zones (hand, library, etc.)
- **numbers**: Numbers and quantifiers
- **conditionals**: Conditional terms
- **punctuation**: Punctuation marks
- **phrases**: Comprehensive multi-word phrases that should be treated as single tokens
- **special**: Special tokens like CardName

## Usage

1. **Automatic Configuration Loading**: The tokenizer configuration is automatically loaded from `tokenizer_config.csv` when you visit the tokenization tab
2. **Load Card Data**: Use the file input to load your JSON card data files
3. **Tokenize Cards**: Once both configuration and card data are loaded, you can tokenize the cards
4. **Preview or Export**: Generate a preview of the tokenization or export the results as JSON

## Customizing the Configuration

You can modify the `tokenizer_config.csv` file to:
- Add new token categories
- Add new tokens to existing categories
- Remove tokens you don't need
- Modify multi-word phrases that should be treated as single tokens

The configuration is automatically reloaded when you refresh the page or switch to the tokenization tab.

## Customizing the Configuration

You can modify the CSV file to:
- Add new token categories
- Add new tokens to existing categories
- Remove tokens you don't need
- Modify multi-word phrases that should be treated as single tokens

## Benefits

- **Flexible**: Easy to add new tokens without modifying code
- **Maintainable**: Non-programmers can update the vocabulary
- **Extensible**: New categories can be added easily
- **Portable**: Configuration can be shared between projects
- **Version Control**: CSV files can be tracked in version control

## Technical Details

The tokenizer loads the CSV configuration and creates category-based vocabularies. Multi-word phrases are preprocessed to be treated as single tokens by replacing spaces with underscores during tokenization.

### Mana Symbol Processing

The tokenizer automatically processes mana symbols with special handling:
- **Hybrid mana** (e.g., `{W/U}`, `{2/R}`) is converted to the `/` token
- **Phyrexian mana** (e.g., `{W/P}`, `{B/P}`) is converted to the `P` token  
- **Standard mana** (e.g., `{W}`, `{2}`, `{X}`) remains as-is

This simplifies the vocabulary while maintaining the semantic meaning of alternative mana costs.

#### Example:
```
Original: "Pay {2}{W/U} or {B/P} to activate."
Tokenized: ["pay", "{2}", "/", "or", "P", "to", "activate"]
```

Additionally, when cards mention "phyrexian mana" in their text, it's recognized as a single token.

Unknown tokens (not in the vocabulary) are prefixed with `UNK_` to distinguish them from known tokens.
