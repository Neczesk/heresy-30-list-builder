import { DataLoader } from './dataLoader';
import { ArmyListStorage } from './armyListStorage';

export function testPrimeSlotSystem() {
  console.log('Testing Prime Slot System...');
  
  const detachment = DataLoader.getDetachmentById('crusade-primary');
  if (detachment) {
    console.log('Crusade Primary Detachment slots:');
    detachment.slots.forEach(slot => {
      const role = DataLoader.getBattlefieldRoleById(slot.roleId);
      console.log(`  ${slot.count}x ${role?.name} ${slot.isPrime ? '(Prime)' : '(Non-Prime)'}`);
    });
  }
}

export function testPrimeAdvantageSystem() {
  console.log('Testing Prime Advantage System...');
  
  const primeAdvantages = DataLoader.getPrimeAdvantages();
  console.log(`Found ${primeAdvantages.length} prime advantages`);
  
  primeAdvantages.forEach(advantage => {
    console.log(`  ${advantage.name}: ${advantage.description}`);
  });
}

export function testAlliedDetachmentAvailability() {
  console.log('Testing Allied Detachment Availability...');
  
  // Create a test army list
  const testArmyList = ArmyListStorage.createNewArmyList('dark-angels', 2000, 'Loyalist');
  testArmyList.detachments.push({
    detachmentId: 'crusade-primary',
    units: [],
    primeAdvantages: []
  });
  
  console.log('Test Army List:', {
    faction: testArmyList.faction,
    detachments: testArmyList.detachments.length
  });
  
  // Check if Allied detachment exists
  const alliedDetachment = DataLoader.getDetachmentById('allied-detachment');
  console.log('Allied Detachment found:', !!alliedDetachment);
  if (alliedDetachment) {
    console.log('Allied Detachment details:', {
      id: alliedDetachment.id,
      name: alliedDetachment.name,
      type: alliedDetachment.type,
      faction: alliedDetachment.faction,
      requirements: alliedDetachment.requirements,
      restrictions: alliedDetachment.restrictions,
      triggers: alliedDetachment.triggers
    });
  }
  
  // Check available detachments
  const availableDetachments = DataLoader.getAvailableDetachments(testArmyList);
  console.log('Available detachments:', availableDetachments.map(d => d.name));
  
  // Check specifically for Allied detachments
  const alliedDetachments = availableDetachments.filter(d => d.type === 'Allied');
  console.log('Available Allied detachments:', alliedDetachments.map(d => d.name));
  
  // Test individual availability check
  if (alliedDetachment) {
    const isAvailable = DataLoader.isDetachmentAvailable(alliedDetachment, testArmyList);
    console.log('Allied detachment is available:', isAvailable);
  }
} 