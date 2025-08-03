// Core army building interfaces for Horus Heresy 3.0

export type Allegiance = 'Loyalist' | 'Traitor' | 'Universal';

// Model types and subtypes
export type ModelType =
  | 'Infantry'
  | 'Cavalry'
  | 'Walker'
  | 'Automata'
  | 'Paragon'
  | 'Vehicle';
export type ModelSubType =
  | 'Unique'
  | 'Command'
  | 'Champion'
  | 'Specialist'
  | 'Heavy'
  | 'Sergeant'
  | 'Light'
  | 'Skirmish'
  | 'Transport'
  | 'Anti-grav'
  | 'Stable';

// Model characteristics for non-vehicle units
export interface InfantryModelCharacteristics {
  movement: number;
  strength: number;
  toughness: number;
  initiative: number;
  attacks: number;
  wounds: number;
  weaponSkill: number;
  ballisticSkill: number;
  leadership: number;
  willpower: number;
  cool: number;
  intelligence: number;
  armourSave: number;
  invulnerableSave?: number;
}

// Model characteristics for vehicle units
export interface VehicleModelCharacteristics {
  movement: number;
  ballisticSkill: number;
  frontArmour: number;
  sideArmour: number;
  rearArmour: number;
  hullPoints: number;
  transportCapacity?: number;
}

export interface UpgradeGroup {
  id: string;
  name: string;
  description?: string;
  collapsible?: boolean; // Whether this group can be collapsed/expanded
  defaultCollapsed?: boolean; // Whether this group starts collapsed
  upgrades: string[]; // IDs of upgrades in this group
}

export interface Model {
  id: string;
  name: string;
  type: ModelType;
  subType: ModelSubType;
  characteristics: InfantryModelCharacteristics | VehicleModelCharacteristics;
  specialRules: string[]; // IDs of special rules
  specialRuleValues?: { [ruleId: string]: number }; // Values for special rules that require them
  wargear: string[]; // IDs of wargear options
  weapons: Array<{ id: string; mount?: string; count?: number }>; // Weapon ID, optional mount location, and optional count
  description?: string;
  restrictions?: string[];
  upgradeGroups?: UpgradeGroup[]; // Groups of upgrades available for this model
}

export interface SpecialRule {
  id: string;
  name: string;
  description: string;
  shortText: string;
  longText: string;
  hasValue: boolean; // Whether this rule requires a numerical value
  type: 'special-rule' | 'wargear'; // Whether this is a special rule or wargear
}

export interface Faction {
  id: string;
  name: string;
  type: 'Legion' | 'Auxilia' | 'Mechanicum' | 'Knight' | 'Titan';
  description: string;
  allegiance: Allegiance; // New field for traitor/loyalist/universal
  specialRules: string[]; // IDs of special rules
  ritesOfWar?: string[]; // IDs of available rites of war
  isMainFaction: boolean;
  parentFaction?: string; // ID of parent faction for sub-factions
}

export interface RiteOfWar {
  id: string;
  name: string;
  faction: string; // Faction ID
  description: string;
  restrictions: string[];
  benefits: string[];
  detachmentModifications?: DetachmentModification[];
}

export interface DetachmentModification {
  detachmentType: string;
  slotChanges: SlotChange[];
  restrictions: string[];
}

export interface SlotChange {
  role: BattlefieldRoleType;
  change: 'add' | 'remove' | 'modify';
  count?: number;
}

export type BattlefieldRoleType =
  | 'High Command'
  | 'Command'
  | 'Troops'
  | 'Transport'
  | 'Heavy Transport'
  | 'Support'
  | 'Armour'
  | 'War Engine'
  | 'Reconnaissance'
  | 'Heavy Assault'
  | 'Fast Attack'
  | 'Retinue'
  | 'Warlord';

export interface BattlefieldRole {
  id: string;
  name: string;
  type: BattlefieldRoleType;
  description: string;
  maxCount?: number;
  minCount?: number;
}

export interface Detachment {
  id: string;
  name: string;
  type: 'Primary' | 'Auxiliary' | 'Apex' | 'Warlord' | 'Allied' | 'Universal';
  faction: string; // Faction ID
  description: string;
  requirements: DetachmentRequirement[];
  slots: DetachmentSlot[];
  maxCount?: number; // For Auxiliary detachments
  triggers?: DetachmentTrigger[]; // What conditions allow this detachment to be added
  restrictions?: DetachmentRestriction[]; // What prevents this detachment from being added
}

export interface DetachmentRequirement {
  type: 'points' | 'faction' | 'unit' | 'detachment' | 'slot-filled';
  value: string | number;
  description: string;
}

export interface DetachmentTrigger {
  type:
    | 'command-filled'
    | 'high-command-filled'
    | 'always-available'
    | 'specific-unit';
  description: string;
  requiredUnitId?: string; // Specific unit ID that must be in command/high command slot to trigger this detachment
  requiredSlotType?: 'Command' | 'High Command'; // Which slot type the required unit must be in
}

export interface DetachmentRestriction {
  type:
    | 'faction-must-match'
    | 'faction-must-differ'
    | 'max-count'
    | 'requires-slot';
  value: string | number;
  description: string;
}

export interface DetachmentSlot {
  roleId: string; // BattlefieldRole ID
  count: number;
  isPrime: boolean;
  description?: string;
  allowedUnits?: string[]; // Unit IDs that can be placed in this slot (if specified, overrides role-based filtering)
}

export interface Unit {
  id: string;
  name: string;
  faction: string; // Faction ID
  allegiance: Allegiance; // New field for traitor/loyalist/universal
  battlefieldRole: BattlefieldRoleType;
  points: number;
  minSize: number;
  maxSize: number;
  baseSize: number;
  description: string;
  models: { [modelId: string]: number }; // Model ID to count mapping
  wargear: WargearOption[];
  specialRules: string[]; // IDs of special rules
  specialRuleValues?: { [ruleId: string]: number }; // Values for special rules that require them
  traits: string[]; // Unit-level traits
  upgrades: string[]; // IDs of available unit-level upgrades
  modelUpgrades?: { [modelId: string]: string[] }; // Model-specific upgrade groups
  restrictions?: string[];
  legionSpecific?: string[]; // Legion IDs if unit is legion-specific
}

export interface WargearOption {
  id: string;
  name: string;
  points: number;
  description: string;
  isDefault?: boolean;
  restrictions?: string[];
}

// Weapon interfaces
// Base weapon profile interface
export interface WeaponProfile {
  name: string;
  range: number;
  firepower: number;
  rangedStrength: number;
  ap: number;
  damage: number;
  specialRules: string[]; // IDs of special rules
  specialRuleValues?: { [ruleId: string]: number }; // Values for special rules that require them
  traits: string[]; // Weapon-level traits
}

export interface RangedWeapon {
  id: string;
  name: string;
  type: 'ranged';
  // Single profile (for backward compatibility)
  range?: number;
  firepower?: number;
  rangedStrength?: number;
  ap?: number;
  damage?: number;
  specialRules?: string[]; // IDs of special rules
  specialRuleValues?: { [ruleId: string]: number }; // Values for special rules that require them
  traits?: string[]; // Weapon-level traits
  // Multiple profiles (new)
  profiles?: WeaponProfile[];
  description?: string;
  restrictions?: string[];
}

export interface MeleeWeapon {
  id: string;
  name: string;
  type: 'melee';
  initiativeModifier: number | string;
  attackModifier: number | string;
  strengthModifier: number | string;
  ap: number | null;
  damage: number;
  specialRules: string[]; // IDs of special rules
  specialRuleValues?: { [ruleId: string]: number }; // Values for special rules that require them
  traits: string[]; // Weapon-level traits
  description?: string;
  restrictions?: string[];
}

export type Weapon = RangedWeapon | MeleeWeapon;

export interface UnitUpgrade {
  id: string;
  name: string;
  description: string;
  type:
    | 'model'
    | 'squad'
    | 'weapon'
    | 'wargear'
    | 'model-count'
    | 'model-group-count';
  maxCount?: number | 'dependent'; // Maximum number of times this upgrade can be applied
  requiresUpgrade?: string; // ID of upgrade that must be applied first
  targetModel?: string; // Model ID for model-count upgrades
  targetModels?: { [modelId: string]: number }; // Model ID to count mapping for model-group-count upgrades
  targetModelType?: string; // Model ID for weapon/wargear upgrades
  options?: UpgradeOption[];
}

export interface UpgradeOption {
  id: string;
  name: string;
  description: string;
  points: number;
  restrictions?: string[];
  replaceWeapon?: string; // Weapon ID to replace (single weapon)
  addWeapon?: string | { id: string; mount?: string; count?: number }; // Weapon ID to add or full weapon object
  weaponReplacements?: {
    replaceWeapon: string;
    replaceMount?: string;
    addWeapon: string | { id: string; mount?: string; count?: number };
  }[]; // Multiple weapon replacements
  addWargear?: string; // Wargear ID to add
  requiresUpgrade?: string; // ID of upgrade option that must be selected first
  maxCount?: number; // Maximum number of times this upgrade can be applied
}

// RATIONALIZED ARMY STRUCTURE
// ===========================

// Army metadata and configuration
export interface Army {
  id: string;
  name: string;
  allegiance: Allegiance;
  faction: string; // Main faction ID
  subfaction?: string; // Subfaction ID (if applicable)
  pointsLimit: number;
  totalPoints: number;
  riteOfWar?: string;
  validationErrors: string[];
  createdAt: string;
  updatedAt: string;
  isNamed: boolean;
  detachments: ArmyDetachment[];
}

// Detachment with metadata and modifications
export interface ArmyDetachment {
  id: string; // Unique ID for this detachment instance
  detachmentId: string; // Reference to the base detachment definition
  customName?: string; // Optional custom name for this detachment
  points: number; // Total points for this detachment
  baseSlots: DetachmentSlot[]; // Original slots from the detachment definition
  modifiedSlots: DetachmentSlot[]; // Slots after modifications (prime advantages, etc.)
  primeAdvantages: PrimeAdvantage[]; // Prime advantages applied to this detachment
  units: ArmyUnit[]; // Units in this detachment
  triggeredBy?: {
    unitId: string; // ID of the unit that triggered this detachment (unit.id, not unit.unitId)
    slotId: string; // ID of the slot the triggering unit occupies
    detachmentId: string; // ID of the detachment containing the triggering unit
    unitInstanceId: string; // Unique ID of the specific unit instance that triggered this
  };
}

// Unit with complete data for editing and export
export interface ArmyUnit {
  id: string; // Unique ID for this unit instance
  unitId: string; // Reference to the base unit definition
  customName?: string; // Optional custom name for this unit
  size: number; // Current unit size
  points: number; // Total points for this unit
  slotId?: string; // ID of the specific slot this unit occupies

  // Custom unit tracking
  originalCustomUnitId?: string; // ID of the original custom unit if this was created from one

  // Model data
  models: { [modelId: string]: number }; // Model ID to count mapping

  // Wargear and equipment
  wargear: string[]; // Selected wargear option IDs
  weapons: {
    [modelId: string]: Array<{ id: string; mount?: string; count?: number }>;
  }; // Model ID to weapons mapping

  // Upgrades and modifications
  upgrades: ArmyUpgrade[]; // Applied upgrades
  primeAdvantages: PrimeAdvantage[]; // Prime advantages applied to this unit

  // Special rules and characteristics
  specialRules: string[]; // IDs of special rules
  specialRuleValues: { [ruleId: string]: number }; // Values for special rules that require them

  // Model-specific modifications
  modelModifications: { [modelId: string]: ModelModification }; // Model characteristic modifications

  // Weapon and wargear changes per model instance
  modelInstanceWeaponChanges: {
    [modelId: string]: { [instanceIndex: number]: WeaponChange };
  };
  modelInstanceWargearChanges: {
    [modelId: string]: { [instanceIndex: number]: WargearChange };
  };
}

// Model modification data
export interface ModelModification {
  characteristics?: Partial<
    InfantryModelCharacteristics | VehicleModelCharacteristics
  >;
  specialRules?: string[];
  specialRuleValues?: { [ruleId: string]: number };
}

// Weapon change tracking
export interface WeaponChange {
  removed: Array<{ id: string; mount?: string; count?: number }>;
  added: Array<{ id: string; mount?: string; count?: number }>;
}

// Wargear change tracking
export interface WargearChange {
  removed: string[];
  added: string[];
}

// Prime advantage with slot modification data
export interface PrimeAdvantage {
  advantageId: string; // Reference to the prime advantage definition
  slotId?: string; // Which prime slot this applies to (for unit-level advantages)
  description: string;
  effect: string;
  slotModification?: {
    roleId: string; // For logistical-benefit: which role was chosen
    count: number; // How many slots of this role to add
  };
}

// Prime Advantage definitions
export interface PrimeAdvantageDefinition {
  id: string;
  name: string;
  description: string;
  effect: string;
  restrictions?: string[];
}

// Upgrade tracking
export interface ArmyUpgrade {
  upgradeId: string;
  optionId?: string; // For upgrades with options
  count: number; // How many times this upgrade is applied
  points: number;
}

// Storage interfaces
export interface StoredArmyList {
  id: string;
  name: string;
  data: Army;
  isNamed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ArmyListMetadata {
  id: string;
  name: string;
  faction: string;
  allegiance: Allegiance;
  pointsLimit: number;
  totalPoints: number;
  isNamed: boolean;
  createdAt: string;
  updatedAt: string;
}

// Custom Unit interfaces
export interface CustomUnit {
  id: string; // Unique identifier (name-based)
  name: string; // Display name
  baseUnitId: string; // ID of the original unit this is based on
  faction: string; // Faction ID
  subfaction?: string; // Subfaction ID (if applicable)
  upgrades: ArmyUpgrade[]; // Selected upgrades
  primeAdvantages: PrimeAdvantage[]; // Prime advantages (if any)
  modelInstanceWeaponChanges: {
    [modelId: string]: { [instanceIndex: number]: WeaponChange };
  };
  modelInstanceWargearChanges: {
    [modelId: string]: { [instanceIndex: number]: WargearChange };
  };
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
  description?: string; // Optional description
}

export interface CustomUnitMetadata {
  id: string;
  name: string;
  baseUnitId: string;
  faction: string;
  subfaction?: string;
  createdAt: string;
  updatedAt: string;
  description?: string;
}

export interface CustomDetachment {
  id: string; // Unique identifier (name-based)
  name: string; // Display name
  baseDetachmentId: string; // ID of the original detachment this is based on
  faction: string; // Faction ID
  subfaction?: string; // Subfaction ID (if applicable)
  customName?: string; // Optional custom name for this detachment
  description: string; // User-provided description
  units: ArmyUnit[]; // Units in this detachment
  primeAdvantages: PrimeAdvantage[]; // Prime advantages applied to this detachment
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

export interface CustomDetachmentMetadata {
  id: string;
  name: string;
  baseDetachmentId: string;
  faction: string;
  subfaction?: string;
  customName?: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

// Legacy interfaces for backward compatibility
// These will be gradually phased out as the new structure is implemented
export interface ArmyList extends Army {}
export interface ArmyDetachmentLegacy {
  detachmentId: string;
  units: ArmyUnit[];
  primeAdvantages: PrimeAdvantage[];
  customSlots?: DetachmentSlot[];
  triggeredBy?: {
    unitId: string;
    slotId: string;
  };
}

export interface ArmyUnitLegacy {
  unitId: string;
  size: number;
  models: ArmyModel[];
  wargear: string[];
  upgrades: ArmyUpgrade[];
  points: number;
  slotId?: string;
  primeAdvantages?: PrimeAdvantage[];
  weaponReplacements?: { [modelId: string]: { [oldWeaponId: string]: string } };
  modelModifications?: { [modelId: string]: any };
  modelInstanceWeaponChanges?: {
    [modelId: string]: {
      [instanceIndex: number]: {
        removed: Array<{ id: string; mount?: string; count?: number }>;
        added: Array<{ id: string; mount?: string; count?: number }>;
      };
    };
  };
  modelInstanceWargearChanges?: {
    [modelId: string]: {
      [instanceIndex: number]: { removed: string[]; added: string[] };
    };
  };
}

export interface ArmyModel {
  modelId: string;
  count: number;
  wargear: string[];
  weapons: string[];
  specialRules: string[];
  specialRuleValues?: { [ruleId: string]: number };
}
