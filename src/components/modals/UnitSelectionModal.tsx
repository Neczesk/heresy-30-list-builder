import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Tabs,
  Tab,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { DataLoader } from '../../utils/dataLoader';
import { CustomUnitStorage } from '../../utils/customUnitStorage';
import type { Unit, CustomUnit, Army } from '../../types/army';

interface UnitSelectionModalProps {
  isOpen: boolean;
  roleId: string;
  roleName: string;
  armyList: Army;
  detachment: any;
  onUnitSelected: (unitId: string) => void;
  onClose: () => void;
}

const UnitSelectionModal: React.FC<UnitSelectionModalProps> = ({
  isOpen,
  roleId,
  roleName,
  armyList,
  detachment,
  onUnitSelected,
  onClose,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [activeTab, setActiveTab] = useState<'base' | 'custom'>('base');
  const [availableBaseUnits, setAvailableBaseUnits] = useState<Unit[]>([]);
  const [availableCustomUnits, setAvailableCustomUnits] = useState<
    CustomUnit[]
  >([]);

  // Get available base units
  useEffect(() => {
    if (!isOpen) return;

    const allUnits = DataLoader.getUnits();
    const primaryFaction = armyList.faction;
    const armyAllegiance = armyList.allegiance;

    // Get the battlefield role data to convert between ID and type
    const selectedRole = DataLoader.getBattlefieldRoleById(roleId);
    if (!selectedRole) {
      setAvailableBaseUnits([]);
      return;
    }

    // Get the specific slot data to check for unit restrictions
    const slotData = detachment.slots.find(
      (slot: any) => slot.roleId === roleId
    );
    const allowedUnitIds = slotData?.allowedUnits;

    const filteredUnits = allUnits.filter((unit: Unit) => {
      // If this slot has specific unit restrictions, only allow those units
      if (allowedUnitIds && allowedUnitIds.length > 0) {
        if (!allowedUnitIds.includes(unit.id)) {
          return false;
        }
      } else {
        // Otherwise, use the standard role-based filtering
        if (unit.battlefieldRole !== selectedRole.type) {
          return false;
        }
      }

      // Check allegiance compatibility
      if (
        unit.allegiance !== 'Universal' &&
        unit.allegiance !== armyAllegiance
      ) {
        return false;
      }

      // Check faction compatibility
      if (unit.faction && unit.faction !== 'universal') {
        // Direct faction match
        if (unit.faction === primaryFaction) {
          // If unit has a subfaction, check if it matches the army's subfaction
          if (unit.subfaction) {
            return unit.subfaction === armyList.subfaction;
          }
          return true;
        }

        // Check if current faction is a subfaction of the unit's faction
        const currentFactionData = DataLoader.getFactionById(primaryFaction);
        if (currentFactionData?.parentFaction === unit.faction) {
          // If unit has a subfaction, check if it matches the army's subfaction
          if (unit.subfaction) {
            return unit.subfaction === armyList.subfaction;
          }
          return true;
        }

        // Check if unit's faction is a parent of current faction
        const unitFactionData = DataLoader.getFactionById(unit.faction);
        if (
          unitFactionData?.isMainFaction &&
          currentFactionData?.parentFaction === unit.faction
        ) {
          // If unit has a subfaction, check if it matches the army's subfaction
          if (unit.subfaction) {
            return unit.subfaction === armyList.subfaction;
          }
          return true;
        }

        return false;
      }

      return true;
    });

    setAvailableBaseUnits(filteredUnits);
  }, [isOpen, roleId, armyList.faction, armyList.allegiance, detachment.slots]);

  // Get available custom units
  useEffect(() => {
    if (!isOpen) return;

    const allCustomUnits = CustomUnitStorage.getAllCustomUnits();
    const primaryFaction = armyList.faction;
    const armyAllegiance = armyList.allegiance;

    // Get the battlefield role data to convert between ID and type
    const selectedRole = DataLoader.getBattlefieldRoleById(roleId);
    if (!selectedRole) {
      setAvailableCustomUnits([]);
      return;
    }

    // Get the specific slot data to check for unit restrictions
    const slotData = detachment.slots.find(
      (slot: any) => slot.roleId === roleId
    );
    const allowedUnitIds = slotData?.allowedUnits;

    const filteredCustomUnits = Object.values(allCustomUnits).filter(
      (customUnit: CustomUnit) => {
        const baseUnit = DataLoader.getUnitById(customUnit.baseUnitId);
        if (!baseUnit) return false;

        // If this slot has specific unit restrictions, check if the base unit is allowed
        if (allowedUnitIds && allowedUnitIds.length > 0) {
          if (!allowedUnitIds.includes(baseUnit.id)) {
            return false;
          }
        } else {
          // Otherwise, use the standard role-based filtering
          if (baseUnit.battlefieldRole !== selectedRole.type) {
            return false;
          }
        }

        // Check allegiance compatibility
        if (
          baseUnit.allegiance !== 'Universal' &&
          baseUnit.allegiance !== armyAllegiance
        ) {
          return false;
        }

        // Check faction compatibility
        if (customUnit.faction && customUnit.faction !== 'universal') {
          // Direct faction match
          if (customUnit.faction === primaryFaction) {
            // If custom unit has a subfaction, check if it matches the army's subfaction
            if (customUnit.subfaction) {
              return customUnit.subfaction === armyList.subfaction;
            }
            return true;
          }

          // Check if current faction is a subfaction of the custom unit's faction
          const currentFactionData = DataLoader.getFactionById(primaryFaction);
          if (currentFactionData?.parentFaction === customUnit.faction) {
            // If custom unit has a subfaction, check if it matches the army's subfaction
            if (customUnit.subfaction) {
              return customUnit.subfaction === armyList.subfaction;
            }
            return true;
          }

          // Check if custom unit's faction is a parent of current faction
          const customUnitFactionData = DataLoader.getFactionById(
            customUnit.faction
          );
          if (
            customUnitFactionData?.isMainFaction &&
            currentFactionData?.parentFaction === customUnit.faction
          ) {
            // If custom unit has a subfaction, check if it matches the army's subfaction
            if (customUnit.subfaction) {
              return customUnit.subfaction === armyList.subfaction;
            }
            return true;
          }

          return false;
        }

        return true;
      }
    );

    setAvailableCustomUnits(filteredCustomUnits);
  }, [isOpen, roleId, armyList.faction, armyList.allegiance, detachment.slots]);

  const handleBaseUnitSelect = (unitId: string) => {
    onUnitSelected(unitId);
  };

  const handleCustomUnitSelect = (customUnit: CustomUnit) => {
    onUnitSelected(`custom:${customUnit.id}`);
  };

  const getBaseUnitPoints = (unit: Unit) => {
    return unit.points;
  };

  const getCustomUnitPoints = (customUnit: CustomUnit) => {
    const baseUnit = DataLoader.getUnitById(customUnit.baseUnitId);
    if (!baseUnit) return 0;

    const upgradePoints = customUnit.upgrades.reduce((total, upgrade) => {
      return total + upgrade.points * upgrade.count;
    }, 0);

    return baseUnit.points + upgradePoints;
  };

  if (!isOpen) return null;

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          maxHeight: isMobile ? '100vh' : '80vh',
          height: isMobile ? '100vh' : 'auto',
        },
      }}
    >
      <DialogTitle
        sx={{
          p: { xs: 2, sm: 3 },
          pb: { xs: 1, sm: 2 },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography
            variant={isMobile ? 'h6' : 'h6'}
            sx={{
              fontSize: { xs: '1.125rem', sm: '1.25rem' },
            }}
          >
            Select {roleName} Unit
          </Typography>
          <IconButton
            onClick={onClose}
            size={isMobile ? 'medium' : 'small'}
            sx={{
              p: { xs: 1, sm: 0.5 },
            }}
          >
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent
        sx={{
          p: { xs: 2, sm: 3 },
          pt: { xs: 0, sm: 1 },
        }}
      >
        <Box
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            mb: { xs: 1.5, sm: 2 },
          }}
        >
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            variant="fullWidth"
            sx={{
              '& .MuiTab-root': {
                fontSize: { xs: '0.875rem', sm: '1rem' },
                minHeight: { xs: '48px', sm: '56px' },
              },
            }}
          >
            <Tab
              label={`Base Units (${availableBaseUnits.length})`}
              value="base"
            />
            <Tab
              label={`Custom Units (${availableCustomUnits.length})`}
              value="custom"
            />
          </Tabs>
        </Box>

        <Box sx={{ mt: { xs: 1.5, sm: 2 } }}>
          {activeTab === 'base' && (
            <Box>
              {availableBaseUnits.length > 0 ? (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: { xs: 1.5, sm: 2 },
                  }}
                >
                  {availableBaseUnits.map(unit => (
                    <Box key={unit.id}>
                      <Card
                        sx={{
                          cursor: 'pointer',
                          '&:hover': { boxShadow: 4 },
                          transition: 'box-shadow 0.2s ease-in-out',
                        }}
                        onClick={() => handleBaseUnitSelect(unit.id)}
                      >
                        <CardContent
                          sx={{
                            p: { xs: 2, sm: 3 },
                          }}
                        >
                          <Box
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'flex-start',
                              mb: 1,
                              flexDirection: { xs: 'column', sm: 'row' },
                              gap: { xs: 1, sm: 0 },
                            }}
                          >
                            <Typography
                              variant={isMobile ? 'h6' : 'h6'}
                              component="h3"
                              sx={{
                                fontSize: { xs: '1.125rem', sm: '1.25rem' },
                              }}
                            >
                              {unit.name}
                            </Typography>
                            <Box
                              sx={{
                                display: 'flex',
                                gap: 1,
                                flexWrap: 'wrap',
                                justifyContent: {
                                  xs: 'flex-start',
                                  sm: 'flex-end',
                                },
                              }}
                            >
                              <Chip
                                label={`${getBaseUnitPoints(unit)} pts`}
                                color="primary"
                                size={isMobile ? 'small' : 'small'}
                              />
                              {unit.faction && unit.faction !== 'universal' && (
                                <Chip
                                  label={
                                    unit.faction === 'legiones-astartes'
                                      ? 'Legion'
                                      : unit.faction
                                  }
                                  color="secondary"
                                  size={isMobile ? 'small' : 'small'}
                                />
                              )}
                              {unit.legionSpecific &&
                                unit.legionSpecific.length > 0 && (
                                  <Chip
                                    label="Legion-specific"
                                    color="warning"
                                    size={isMobile ? 'small' : 'small'}
                                  />
                                )}
                            </Box>
                          </Box>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              fontSize: { xs: '0.875rem', sm: '1rem' },
                            }}
                          >
                            {unit.description}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Card>
                  <CardContent
                    sx={{
                      p: { xs: 2, sm: 3 },
                      textAlign: 'center',
                    }}
                  >
                    <Typography
                      variant="body1"
                      color="text.secondary"
                      sx={{
                        fontSize: { xs: '0.875rem', sm: '1rem' },
                      }}
                    >
                      No {roleName} units available for your faction.
                    </Typography>
                  </CardContent>
                </Card>
              )}
            </Box>
          )}

          {activeTab === 'custom' && (
            <Box>
              {availableCustomUnits.length > 0 ? (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: { xs: 1.5, sm: 2 },
                  }}
                >
                  {availableCustomUnits.map(customUnit => {
                    const baseUnit = DataLoader.getUnitById(
                      customUnit.baseUnitId
                    );
                    return (
                      <Box key={customUnit.id}>
                        <Card
                          sx={{
                            cursor: 'pointer',
                            '&:hover': { boxShadow: 4 },
                            transition: 'box-shadow 0.2s ease-in-out',
                          }}
                          onClick={() => handleCustomUnitSelect(customUnit)}
                        >
                          <CardContent
                            sx={{
                              p: { xs: 2, sm: 3 },
                            }}
                          >
                            <Box
                              sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                                mb: 1,
                                flexDirection: { xs: 'column', sm: 'row' },
                                gap: { xs: 1, sm: 0 },
                              }}
                            >
                              <Box>
                                <Typography
                                  variant={isMobile ? 'h6' : 'h6'}
                                  component="h3"
                                  sx={{
                                    fontSize: { xs: '1.125rem', sm: '1.25rem' },
                                  }}
                                >
                                  {customUnit.name}
                                </Typography>
                                <Chip
                                  label="Custom"
                                  color="info"
                                  size={isMobile ? 'small' : 'small'}
                                  sx={{ mt: 0.5 }}
                                />
                              </Box>
                              <Box
                                sx={{
                                  display: 'flex',
                                  gap: 1,
                                  flexWrap: 'wrap',
                                  justifyContent: {
                                    xs: 'flex-start',
                                    sm: 'flex-end',
                                  },
                                }}
                              >
                                <Chip
                                  label={`${getCustomUnitPoints(customUnit)} pts`}
                                  color="primary"
                                  size={isMobile ? 'small' : 'small'}
                                />
                                <Chip
                                  label={`Based on: ${baseUnit?.name || customUnit.baseUnitId}`}
                                  color="secondary"
                                  size={isMobile ? 'small' : 'small'}
                                />
                                {customUnit.upgrades.length > 0 && (
                                  <Chip
                                    label={`${customUnit.upgrades.length} upgrade${customUnit.upgrades.length !== 1 ? 's' : ''}`}
                                    color="success"
                                    size={isMobile ? 'small' : 'small'}
                                  />
                                )}
                                {customUnit.primeAdvantages &&
                                  customUnit.primeAdvantages.length > 0 && (
                                    <Chip
                                      label={`${customUnit.primeAdvantages.length} prime advantage${customUnit.primeAdvantages.length !== 1 ? 's' : ''}`}
                                      color="warning"
                                      size={isMobile ? 'small' : 'small'}
                                    />
                                  )}
                              </Box>
                            </Box>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{
                                fontSize: { xs: '0.875rem', sm: '1rem' },
                              }}
                            >
                              {customUnit.description ||
                                baseUnit?.description ||
                                'Custom unit configuration'}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Box>
                    );
                  })}
                </Box>
              ) : (
                <Card>
                  <CardContent
                    sx={{
                      p: { xs: 2, sm: 3 },
                      textAlign: 'center',
                    }}
                  >
                    <Typography
                      variant="body1"
                      color="text.secondary"
                      sx={{
                        fontSize: { xs: '0.875rem', sm: '1rem' },
                      }}
                    >
                      No custom {roleName} units available for your faction.
                    </Typography>
                  </CardContent>
                </Card>
              )}
            </Box>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default UnitSelectionModal;
