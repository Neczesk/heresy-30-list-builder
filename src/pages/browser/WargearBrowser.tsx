import React, { useState, useMemo } from 'react';
import {
  Button,
  Typography,
  Box,
  Container,
  TextField,
  InputAdornment,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Paper,
} from '@mui/material';
import { Search, Clear, ExpandMore, ExpandLess } from '@mui/icons-material';
import { DataLoader } from '../../utils/dataLoader';

const WargearBrowser: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [expandedRules, setExpandedRules] = useState<Set<string>>(new Set());

  const wargearRules = useMemo(() => {
    const allRules = DataLoader.getSpecialRules();
    // Filter to only show wargear rules
    return allRules.filter(rule => rule.type === 'wargear');
  }, []);

  const filteredRules = useMemo(() => {
    if (!searchTerm) return wargearRules;

    const searchLower = searchTerm.toLowerCase();
    return wargearRules.filter(
      rule =>
        rule.name.toLowerCase().includes(searchLower) ||
        rule.shortText.toLowerCase().includes(searchLower) ||
        rule.description.toLowerCase().includes(searchLower) ||
        rule.longText.toLowerCase().includes(searchLower)
    );
  }, [wargearRules, searchTerm]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleRuleToggle = (ruleId: string) => {
    const newExpandedRules = new Set(expandedRules);
    if (newExpandedRules.has(ruleId)) {
      newExpandedRules.delete(ruleId);
    } else {
      newExpandedRules.add(ruleId);
    }
    setExpandedRules(newExpandedRules);
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Search Section */}
      <Box sx={{ mb: 4 }}>
        <TextField
          fullWidth
          placeholder="Search wargear..."
          value={searchTerm}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
            endAdornment: searchTerm && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={clearSearch} edge="end">
                  <Clear />
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2 }}
        />

        {searchTerm && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              label={`${filteredRules.length} of ${wargearRules.length} wargear found`}
              color="primary"
              variant="outlined"
              size="small"
            />
          </Box>
        )}
      </Box>

      {/* Results Section */}
      {filteredRules.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No wargear found matching "{searchTerm}"
          </Typography>
          <Button
            variant="outlined"
            size="small"
            onClick={clearSearch}
            sx={{ mt: 2 }}
          >
            Clear search
          </Button>
        </Paper>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {filteredRules.map(rule => (
            <Accordion
              key={rule.id}
              expanded={expandedRules.has(rule.id)}
              onChange={() => handleRuleToggle(rule.id)}
              sx={{
                '&:before': {
                  display: 'none',
                },
              }}
            >
              <AccordionSummary
                expandIcon={
                  expandedRules.has(rule.id) ? <ExpandLess /> : <ExpandMore />
                }
                sx={{
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                }}
              >
                <Box sx={{ width: '100%' }}>
                  <Typography variant="h6" component="h3" gutterBottom>
                    {rule.name}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontWeight: 'medium' }}
                  >
                    {rule.shortText}
                  </Typography>
                </Box>
              </AccordionSummary>

              <AccordionDetails>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{ fontStyle: 'italic' }}
                  >
                    {rule.description}
                  </Typography>
                  <Typography variant="body2">{rule.longText}</Typography>
                </Box>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      )}
    </Container>
  );
};

export default WargearBrowser;
