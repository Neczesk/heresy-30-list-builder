import type { Army, ArmyDetachment, ArmyUnit } from '../types/army';

/**
 * Utility functions for managing detachment-unit relationships
 */

export interface DetachmentRelationship {
  triggeringUnit: ArmyUnit;
  triggeringSlotId: string;
  triggeredDetachments: ArmyDetachment[];
}

/**
 * Get all detachments triggered by a specific unit
 */
export function getDetachmentsTriggeredByUnit(
  armyList: Army,
  unitId: string
): ArmyDetachment[] {
  return armyList.detachments.filter(
    detachment =>
      detachment.triggeredBy &&
      detachment.triggeredBy.unitInstanceId === unitId
  );
}

/**
 * Get all detachments triggered by a specific slot
 */
export function getDetachmentsTriggeredBySlot(
  armyList: Army,
  slotId: string,
  detachmentId?: string
): ArmyDetachment[] {
  return armyList.detachments.filter(
    detachment =>
      detachment.triggeredBy &&
      detachment.triggeredBy.slotId === slotId &&
      (!detachmentId || detachment.triggeredBy.detachmentId === detachmentId)
  );
}

/**
 * Get the unit that triggered a specific detachment
 */
export function getTriggeringUnit(
  armyList: Army,
  triggeredDetachment: ArmyDetachment
): ArmyUnit | null {
  if (!triggeredDetachment.triggeredBy) return null;

  const { detachmentId, unitInstanceId } = triggeredDetachment.triggeredBy;
  const detachment = armyList.detachments.find(d => d.id === detachmentId);

  if (!detachment) return null;

  return detachment.units.find(unit => unit.id === unitInstanceId) || null;
}

/**
 * Check if a unit can trigger more detachments (for Officer of the Line rule)
 */
export function canTriggerMoreDetachments(
  armyList: Army,
  unit: ArmyUnit,
  slotId: string,
  maxDetachments: number = 1
): boolean {
  const currentDetachments = getDetachmentsTriggeredByUnit(armyList, unit.id);
  return currentDetachments.length < maxDetachments;
}

/**
 * Remove all detachments triggered by a specific unit
 */
export function removeDetachmentsTriggeredByUnit(
  armyList: Army,
  unitId: string
): Army {
  return {
    ...armyList,
    detachments: armyList.detachments.filter(
      detachment =>
        !detachment.triggeredBy ||
        detachment.triggeredBy.unitInstanceId !== unitId
    ),
  };
}

/**
 * Remove all detachments triggered by a specific slot
 */
export function removeDetachmentsTriggeredBySlot(
  armyList: Army,
  slotId: string,
  detachmentId?: string
): Army {
  return {
    ...armyList,
    detachments: armyList.detachments.filter(
      detachment =>
        !detachment.triggeredBy ||
        detachment.triggeredBy.slotId !== slotId ||
        (detachmentId && detachment.triggeredBy.detachmentId !== detachmentId)
    ),
  };
}

/**
 * Get all detachment relationships in an army list
 */
export function getAllDetachmentRelationships(armyList: Army): DetachmentRelationship[] {
  const relationships: DetachmentRelationship[] = [];

  armyList.detachments.forEach(detachment => {
    if (detachment.triggeredBy) {
      const triggeringUnit = getTriggeringUnit(armyList, detachment);
      if (triggeringUnit) {
        const existingRelationship = relationships.find(
          rel => rel.triggeringUnit.id === triggeringUnit.id
        );

        if (existingRelationship) {
          existingRelationship.triggeredDetachments.push(detachment);
        } else {
          relationships.push({
            triggeringUnit,
            triggeringSlotId: detachment.triggeredBy.slotId,
            triggeredDetachments: [detachment],
          });
        }
      }
    }
  });

  return relationships;
}

/**
 * Validate detachment relationships (for debugging)
 */
export function validateDetachmentRelationships(armyList: Army): string[] {
  const errors: string[] = [];

  armyList.detachments.forEach(detachment => {
    if (detachment.triggeredBy) {
      // Check if triggering detachment exists
      const triggeringDetachment = armyList.detachments.find(
        d => d.id === detachment.triggeredBy!.detachmentId
      );

      if (!triggeringDetachment) {
        errors.push(`Detachment ${detachment.id} references non-existent triggering detachment ${detachment.triggeredBy.detachmentId}`);
      } else {
        // Check if triggering unit exists
        const triggeringUnit = triggeringDetachment.units.find(
          unit => unit.id === detachment.triggeredBy!.unitInstanceId
        );

        if (!triggeringUnit) {
          errors.push(`Detachment ${detachment.id} references non-existent triggering unit ${detachment.triggeredBy.unitInstanceId}`);
        }
      }
    }
  });

  return errors;
}
