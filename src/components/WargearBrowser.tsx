import React, { useState, useEffect } from 'react';
import { DataLoader } from '../utils/dataLoader';
import type { SpecialRule } from '../types/army';
import './WargearBrowser.css';

interface WargearBrowserProps {
  onBackToBrowserMenu: () => void;
}

const WargearBrowser: React.FC<WargearBrowserProps> = ({
  onBackToBrowserMenu
}) => {
  const [wargearRules, setWargearRules] = useState<SpecialRule[]>([]);
  const [filteredRules, setFilteredRules] = useState<SpecialRule[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRules, setExpandedRules] = useState<Set<string>>(new Set());

  // Load wargear rules on mount
  useEffect(() => {
    const rules = DataLoader.getSpecialRules();
    // Filter for wargear special rules only
    const wargearOnlyRules = rules.filter(rule => rule.type === 'wargear');
    setWargearRules(wargearOnlyRules);
    setFilteredRules(wargearOnlyRules);
  }, []);

  // Filter rules based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredRules(wargearRules);
    } else {
      const filtered = wargearRules.filter(rule => 
        rule.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rule.shortText.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rule.longText.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredRules(filtered);
    }
  }, [searchTerm, wargearRules]);

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
        <button className="back-to-menu-button" onClick={onBackToBrowserMenu}>
          ← Back to Browser Menu
        </button>
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
              <button className="clear-search-button" onClick={clearSearch}>
                ×
              </button>
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
            <button className="clear-search-link" onClick={clearSearch}>
              Clear search
            </button>
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