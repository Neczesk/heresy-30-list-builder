import React, { useState, useMemo } from 'react';
import { Button } from './ui';
import { DataLoader } from '../utils/dataLoader';
import './WargearBrowser.css';

interface WargearBrowserProps {
  onBackToBrowserMenu: () => void;
}

const WargearBrowser: React.FC<WargearBrowserProps> = ({
  onBackToBrowserMenu
}) => {
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
    return wargearRules.filter(rule => 
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
    <div className="wargear-browser">
      <div className="browser-header">
        <Button variant="secondary" onClick={onBackToBrowserMenu}>
          ← Back to Browser Menu
        </Button>
        <h2>Wargear Browser</h2>
      </div>

      <div className="search-section">
        <div className="search-container">
          <div className="search-input-wrapper">
            <input
              type="text"
              placeholder="Search wargear..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="search-input"
            />
            {searchTerm && (
              <Button variant="secondary" size="sm" onClick={clearSearch}>
                ×
              </Button>
            )}
          </div>
          <div className="search-results">
            {searchTerm && (
              <span className="results-count">
                {filteredRules.length} of {wargearRules.length} wargear found
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="rules-section">
        {filteredRules.length === 0 ? (
          <div className="no-results">
            <p>No wargear found matching "{searchTerm}"</p>
            <Button variant="info" size="sm" onClick={clearSearch}>
              Clear search
            </Button>
          </div>
        ) : (
          <div className="rules-list">
            {filteredRules.map((rule) => (
              <div key={rule.id} className="rule-item">
                <div 
                  className="rule-header"
                  onClick={() => handleRuleToggle(rule.id)}
                >
                  <div className="rule-title">
                    <h3>{rule.name}</h3>
                    <div className="rule-short-text">
                      <strong>{rule.shortText}</strong>
                    </div>
                  </div>
                  <div className="rule-toggle">
                    {expandedRules.has(rule.id) ? '−' : '+'}
                  </div>
                </div>
                
                {expandedRules.has(rule.id) && (
                  <div className="rule-details">
                    <div className="rule-description">
                      <em>{rule.description}</em>
                    </div>
                    <div className="rule-long-text">
                      {rule.longText}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WargearBrowser; 