import React, { useState, useEffect } from 'react';
import { DataLoader } from '../utils/dataLoader';
import type { SpecialRule } from '../types/army';
import './SpecialRulesBrowser.css';

interface SpecialRulesBrowserProps {
  onBackToBrowserMenu: () => void;
}

const SpecialRulesBrowser: React.FC<SpecialRulesBrowserProps> = ({
  onBackToBrowserMenu
}) => {
  const [specialRules, setSpecialRules] = useState<SpecialRule[]>([]);
  const [filteredRules, setFilteredRules] = useState<SpecialRule[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRules, setExpandedRules] = useState<Set<string>>(new Set());

  // Load special rules on mount
  useEffect(() => {
    const rules = DataLoader.getSpecialRules();
    // Filter out wargear special rules
    const nonWargearRules = rules.filter(rule => rule.type !== 'wargear');
    setSpecialRules(nonWargearRules);
    setFilteredRules(nonWargearRules);
  }, []);

  // Filter rules based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredRules(specialRules);
    } else {
      const filtered = specialRules.filter(rule => 
        rule.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rule.shortText.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rule.longText.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredRules(filtered);
    }
  }, [searchTerm, specialRules]);

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
    <div className="special-rules-browser">
      <div className="browser-header">
        <button className="back-to-menu-button" onClick={onBackToBrowserMenu}>
          ← Back to Browser Menu
        </button>
        <h2>Special Rules Browser</h2>
      </div>

      <div className="search-section">
        <div className="search-container">
          <div className="search-input-wrapper">
            <input
              type="text"
              placeholder="Search special rules..."
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
                {filteredRules.length} of {specialRules.length} rules found
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="rules-section">
        {filteredRules.length === 0 ? (
          <div className="no-results">
            <p>No special rules found matching "{searchTerm}"</p>
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

export default SpecialRulesBrowser; 