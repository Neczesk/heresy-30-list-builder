import type { Allegiance } from '../types/army';

/**
 * Utility class for replacing bracketed traits with actual values
 */
export class TraitReplacer {
  /**
   * Replace bracketed traits in a traits array with actual values
   */
  static replaceTraits(
    traits: string[],
    allegiance: Allegiance,
    legion?: string
  ): string[] {
    return traits.map(trait => this.replaceTrait(trait, allegiance, legion));
  }

  /**
   * Replace a single trait with its actual value
   */
  static replaceTrait(
    trait: string,
    allegiance: Allegiance,
    legion?: string
  ): string {
    // Replace [Allegiance] with the actual allegiance
    if (trait === '[Allegiance]') {
      return allegiance;
    }

    // Replace [Legiones Astartes] with the actual legion
    if (trait === '[Legiones Astartes]' && legion) {
      return this.formatLegionName(legion);
    }

    // Return the trait unchanged if no replacement is needed
    return trait;
  }

  /**
   * Format a legion ID into a display name
   */
  private static formatLegionName(legionId: string): string {
    const legionMap: { [key: string]: string } = {
      'iron-warriors': 'Iron Warriors',
      ultramarines: 'Ultramarines',
      'dark-angels': 'Dark Angels',
      'white-scars': 'White Scars',
      'space-wolves': 'Space Wolves',
      'imperial-fists': 'Imperial Fists',
      'blood-angels': 'Blood Angels',
      'iron-hands': 'Iron Hands',
      'world-eaters': 'World Eaters',
      'death-guard': 'Death Guard',
      'thousand-sons': 'Thousand Sons',
      'luna-wolves': 'Luna Wolves',
      'word-bearers': 'Word Bearers',
      'alpha-legion': 'Alpha Legion',
      'night-lords': 'Night Lords',
      salamanders: 'Salamanders',
      'raven-guard': 'Raven Guard',
      'emperor-s-children': "Emperor's Children",
      // Add more legions as needed
    };

    return legionMap[legionId] || legionId;
  }

  /**
   * Check if a trait is a bracketed trait that needs replacement
   */
  static isBracketedTrait(trait: string): boolean {
    return trait.startsWith('[') && trait.endsWith(']');
  }

  /**
   * Get all bracketed traits that need replacement
   */
  static getBracketedTraits(traits: string[]): string[] {
    return traits.filter(trait => this.isBracketedTrait(trait));
  }

  /**
   * Check if a trait array contains any bracketed traits
   */
  static hasBracketedTraits(traits: string[]): boolean {
    return traits.some(trait => this.isBracketedTrait(trait));
  }
}
