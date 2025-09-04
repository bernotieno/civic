/**
 * Comprehensive validation utilities for feedback submission
 * Handles client-side validation with detailed error messages
 */

import { FeedbackSubmissionData, FeedbackFormErrors, AuthUser } from '../types';

/**
 * Validation rules configuration
 */
export const VALIDATION_RULES = {
  title: {
    minLength: 10,
    maxLength: 200,
    required: true,
  },
  content: {
    minLength: 50,
    required: true,
  },
  category: {
    required: true,
    validCategories: [
      'infrastructure',
      'healthcare',
      'education',
      'water_sanitation',
      'security',
      'environment',
      'governance',
      'economic',
      'other'
    ],
  },
  priority: {
    required: true,
    validPriorities: ['low', 'medium', 'high', 'urgent'],
  },
  location: {
    countyRequired: true,
  },
};

/**
 * Validate title field
 */
export const validateTitle = (title: string): string | null => {
  if (!title || !title.trim()) {
    return 'Title is required';
  }

  const trimmedTitle = title.trim();
  
  if (trimmedTitle.length < VALIDATION_RULES.title.minLength) {
    return `Title must be at least ${VALIDATION_RULES.title.minLength} characters`;
  }
  
  if (trimmedTitle.length > VALIDATION_RULES.title.maxLength) {
    return `Title must not exceed ${VALIDATION_RULES.title.maxLength} characters`;
  }

  // Check for inappropriate content (basic check)
  const inappropriatePatterns = [
    /\b(fuck|shit|damn|hell)\b/gi,
    /[!@#$%^&*]{3,}/g, // Excessive special characters
  ];

  for (const pattern of inappropriatePatterns) {
    if (pattern.test(trimmedTitle)) {
      return 'Please use appropriate language in your title';
    }
  }

  return null;
};

/**
 * Validate content field
 */
export const validateContent = (content: string): string | null => {
  if (!content || !content.trim()) {
    return 'Detailed description is required';
  }

  const trimmedContent = content.trim();
  
  if (trimmedContent.length < VALIDATION_RULES.content.minLength) {
    return `Description must be at least ${VALIDATION_RULES.content.minLength} characters to provide sufficient detail`;
  }

  // Check for spam-like content
  const spamPatterns = [
    /(.)\1{10,}/g, // Repeated characters
    /\b(test|testing|asdf|qwerty)\b/gi, // Common test strings
  ];

  for (const pattern of spamPatterns) {
    if (pattern.test(trimmedContent)) {
      return 'Please provide meaningful content in your description';
    }
  }

  return null;
};

/**
 * Validate category selection
 */
export const validateCategory = (category: string): string | null => {
  if (!category || !category.trim()) {
    return 'Category selection is required';
  }

  if (!VALIDATION_RULES.category.validCategories.includes(category)) {
    return 'Please select a valid category';
  }

  return null;
};

/**
 * Validate priority selection
 */
export const validatePriority = (priority: string): string | null => {
  if (!priority || !priority.trim()) {
    return 'Priority level is required';
  }

  if (!VALIDATION_RULES.priority.validPriorities.includes(priority)) {
    return 'Please select a valid priority level';
  }

  return null;
};

/**
 * Validate location selection
 */
export const validateLocation = (
  countyId: number,
  subCountyId?: number,
  wardId?: number,
  villageId?: number
): { county_id?: string; sub_county_id?: string; ward_id?: string; village_id?: string } => {
  const errors: { county_id?: string; sub_county_id?: string; ward_id?: string; village_id?: string } = {};

  // County is required
  if (!countyId || countyId <= 0) {
    errors.county_id = 'County selection is required';
  }

  // Validate hierarchy consistency
  if (wardId && !subCountyId) {
    errors.sub_county_id = 'Sub-county must be selected when ward is specified';
  }

  if (villageId && !wardId) {
    errors.ward_id = 'Ward must be selected when village is specified';
  }

  return errors;
};

/**
 * Validate user permissions for county access
 */
export const validateUserAccess = (
  user: AuthUser,
  countyId: number
): string | null => {
  if (!user.accessible_counties || user.accessible_counties.length === 0) {
    return 'User does not have access to any counties';
  }

  const hasAccess = user.accessible_counties.some(county => county.id === countyId);
  if (!hasAccess) {
    return 'You do not have permission to submit feedback for this county';
  }

  // Additional role-based validation
  if (user.role === 'citizen') {
    // Citizens can only submit to their home county
    const homeCounty = user.accessible_counties[0]; // Assuming first county is home county
    if (countyId !== homeCounty.id) {
      return `Citizens can only submit feedback to their home county (${homeCounty.name})`;
    }
  }

  return null;
};

/**
 * Comprehensive form validation
 */
export const validateFeedbackForm = (
  formData: FeedbackSubmissionData,
  user: AuthUser
): { isValid: boolean; errors: FeedbackFormErrors } => {
  const errors: FeedbackFormErrors = {};

  // Validate individual fields
  const titleError = validateTitle(formData.title);
  if (titleError) errors.title = titleError;

  const contentError = validateContent(formData.content);
  if (contentError) errors.content = contentError;

  const categoryError = validateCategory(formData.category);
  if (categoryError) errors.category = categoryError;

  const priorityError = validatePriority(formData.priority);
  if (priorityError) errors.priority = priorityError;

  // Validate location
  const locationErrors = validateLocation(
    formData.county_id,
    formData.sub_county_id,
    formData.ward_id,
    formData.village_id
  );
  Object.assign(errors, locationErrors);

  // Validate user access
  const accessError = validateUserAccess(user, formData.county_id);
  if (accessError) errors.county_id = accessError;

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Real-time validation for form fields
 */
export const validateFieldRealTime = (
  field: keyof FeedbackSubmissionData,
  value: any,
  formData: FeedbackSubmissionData,
  user: AuthUser
): string | null => {
  switch (field) {
    case 'title':
      return validateTitle(value as string);
    
    case 'content':
      return validateContent(value as string);
    
    case 'category':
      return validateCategory(value as string);
    
    case 'priority':
      return validatePriority(value as string);
    
    case 'county_id':
      if (!value || value <= 0) {
        return 'County selection is required';
      }
      return validateUserAccess(user, value as number);
    
    default:
      return null;
  }
};

/**
 * Get validation summary for display
 */
export const getValidationSummary = (errors: FeedbackFormErrors): string[] => {
  const summary: string[] = [];
  
  if (errors.title) summary.push(`Title: ${errors.title}`);
  if (errors.content) summary.push(`Content: ${errors.content}`);
  if (errors.category) summary.push(`Category: ${errors.category}`);
  if (errors.priority) summary.push(`Priority: ${errors.priority}`);
  if (errors.county_id) summary.push(`County: ${errors.county_id}`);
  if (errors.sub_county_id) summary.push(`Sub-County: ${errors.sub_county_id}`);
  if (errors.ward_id) summary.push(`Ward: ${errors.ward_id}`);
  if (errors.village_id) summary.push(`Village: ${errors.village_id}`);
  if (errors.general) summary.push(errors.general);
  
  return summary;
};

/**
 * Check if form data has sufficient content for submission
 */
export const hasMinimumContent = (formData: FeedbackSubmissionData): boolean => {
  return (
    formData.title.trim().length >= VALIDATION_RULES.title.minLength &&
    formData.content.trim().length >= VALIDATION_RULES.content.minLength &&
    !!formData.category &&
    !!formData.priority &&
    formData.county_id > 0
  );
};

/**
 * Get character count status for fields
 */
export const getCharacterCountStatus = (
  field: 'title' | 'content',
  value: string
): { count: number; max?: number; min?: number; status: 'valid' | 'warning' | 'error' } => {
  const count = value.length;
  
  if (field === 'title') {
    const { minLength, maxLength } = VALIDATION_RULES.title;
    return {
      count,
      max: maxLength,
      min: minLength,
      status: count < minLength || count > maxLength ? 'error' : 
              count > maxLength * 0.9 ? 'warning' : 'valid'
    };
  }
  
  if (field === 'content') {
    const { minLength } = VALIDATION_RULES.content;
    return {
      count,
      min: minLength,
      status: count < minLength ? 'error' : 'valid'
    };
  }
  
  return { count, status: 'valid' };
};

export default {
  validateTitle,
  validateContent,
  validateCategory,
  validatePriority,
  validateLocation,
  validateUserAccess,
  validateFeedbackForm,
  validateFieldRealTime,
  getValidationSummary,
  hasMinimumContent,
  getCharacterCountStatus,
  VALIDATION_RULES,
};
