/**
 * Custom hook for managing Kenya's administrative location hierarchy
 * Handles cascading dropdowns: County → Sub-County → Ward → Village
 */

import { useState, useEffect, useCallback } from 'react';
import { LocationHierarchy, LocationSelectionState } from '../types';
import { apiService } from '../services/api';

export const useLocationHierarchy = (initialCountyId?: number) => {
  const [state, setState] = useState<LocationSelectionState>({
    county: null,
    subCounty: null,
    ward: null,
    village: null,
    counties: [],
    subCounties: [],
    wards: [],
    villages: [],
    loadingSubCounties: false,
    loadingWards: false,
    loadingVillages: false,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load all counties on component mount
   */
  useEffect(() => {
    const loadCounties = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const counties = await apiService.getCounties();
        
        // Convert County[] to LocationHierarchy[] format
        const locationCounties: LocationHierarchy[] = counties.map(county => ({
          id: county.id,
          name: county.name,
          type: 'county' as const,
          level: 0,
          code: county.code,
          full_path: county.name,
          children: []
        }));

        setState(prev => ({
          ...prev,
          counties: locationCounties
        }));

        // If initial county ID is provided, select it
        if (initialCountyId) {
          const initialCounty = locationCounties.find(c => c.id === initialCountyId);
          if (initialCounty) {
            await selectCounty(initialCounty);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load counties');
        console.error('Error loading counties:', err);
      } finally {
        setLoading(false);
      }
    };

    loadCounties();
  }, [initialCountyId]);

  /**
   * Select a county and load its sub-counties
   */
  const selectCounty = useCallback(async (county: LocationHierarchy) => {
    try {
      setState(prev => ({
        ...prev,
        county,
        subCounty: null,
        ward: null,
        village: null,
        subCounties: [],
        wards: [],
        villages: [],
        loadingSubCounties: true
      }));

      const subCounties = await apiService.getLocationHierarchy('sub_county', county.id);
      
      setState(prev => ({
        ...prev,
        subCounties,
        loadingSubCounties: false
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sub-counties');
      setState(prev => ({
        ...prev,
        loadingSubCounties: false
      }));
    }
  }, []);

  /**
   * Select a sub-county and load its wards
   */
  const selectSubCounty = useCallback(async (subCounty: LocationHierarchy) => {
    try {
      setState(prev => ({
        ...prev,
        subCounty,
        ward: null,
        village: null,
        wards: [],
        villages: [],
        loadingWards: true
      }));

      const wards = await apiService.getLocationHierarchy('ward', undefined, subCounty.id);
      
      setState(prev => ({
        ...prev,
        wards,
        loadingWards: false
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load wards');
      setState(prev => ({
        ...prev,
        loadingWards: false
      }));
    }
  }, []);

  /**
   * Select a ward and load its villages
   */
  const selectWard = useCallback(async (ward: LocationHierarchy) => {
    try {
      setState(prev => ({
        ...prev,
        ward,
        village: null,
        villages: [],
        loadingVillages: true
      }));

      const villages = await apiService.getLocationHierarchy('village', undefined, ward.id);
      
      setState(prev => ({
        ...prev,
        villages,
        loadingVillages: false
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load villages');
      setState(prev => ({
        ...prev,
        loadingVillages: false
      }));
    }
  }, []);

  /**
   * Select a village
   */
  const selectVillage = useCallback((village: LocationHierarchy) => {
    setState(prev => ({
      ...prev,
      village
    }));
  }, []);

  /**
   * Reset all selections
   */
  const resetSelections = useCallback(() => {
    setState(prev => ({
      ...prev,
      county: null,
      subCounty: null,
      ward: null,
      village: null,
      subCounties: [],
      wards: [],
      villages: []
    }));
  }, []);

  /**
   * Get current selection as form data
   */
  const getSelectionData = useCallback(() => {
    return {
      county_id: state.county?.id || null,
      sub_county_id: state.subCounty?.id || null,
      ward_id: state.ward?.id || null,
      village_id: state.village?.id || null,
    };
  }, [state.county, state.subCounty, state.ward, state.village]);

  /**
   * Get full location path as string
   */
  const getLocationPath = useCallback(() => {
    const parts = [];
    if (state.county) parts.push(state.county.name);
    if (state.subCounty) parts.push(state.subCounty.name);
    if (state.ward) parts.push(state.ward.name);
    if (state.village) parts.push(state.village.name);
    return parts.join(' > ');
  }, [state.county, state.subCounty, state.ward, state.village]);

  /**
   * Validate that required locations are selected
   */
  const validateSelection = useCallback((requireCounty = true) => {
    const errors: string[] = [];
    
    if (requireCounty && !state.county) {
      errors.push('County selection is required');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }, [state.county]);

  return {
    // State
    ...state,
    loading,
    error,
    
    // Actions
    selectCounty,
    selectSubCounty,
    selectWard,
    selectVillage,
    resetSelections,
    
    // Utilities
    getSelectionData,
    getLocationPath,
    validateSelection,
    
    // Computed properties
    hasCounty: !!state.county,
    hasSubCounty: !!state.subCounty,
    hasWard: !!state.ward,
    hasVillage: !!state.village,
    isLoadingAny: state.loadingSubCounties || state.loadingWards || state.loadingVillages,
  };
};

export default useLocationHierarchy;
