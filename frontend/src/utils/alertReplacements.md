# Alert Replacement Guide

## Files Updated with Custom Alerts:
✅ BillsManagement.tsx
✅ AdminFeedbackManagement.tsx  
✅ BillsList.tsx

## Remaining Files to Update:

### AdminSettings.tsx
- Line: `alert('Settings saved successfully!');`
- Replace with: `showSuccess('Success', 'Settings saved successfully!');`

### BillDetailsView.tsx
- Line: `alert('Please enter your feedback.');`
- Replace with: `showWarning('Input Required', 'Please enter your feedback.');`
- Line: `alert('Could not determine your county. Please contact support.');`
- Replace with: `showError('County Error', 'Could not determine your county. Please contact support.');`
- Line: `alert(\`\${feedbackData.is_anonymous ? 'Anonymous ' : ''}Feedback submitted successfully! Tracking ID: \${trackingId}\`);`
- Replace with: `showSuccess('Success', \`\${feedbackData.is_anonymous ? 'Anonymous ' : ''}Feedback submitted successfully! Tracking ID: \${trackingId}\`);`
- Line: `alert(\`Failed to submit feedback: \${errorData.message || 'Unknown error'}\`);`
- Replace with: `showError('Submission Failed', \`Failed to submit feedback: \${errorData.message || 'Unknown error'}\`);`
- Line: `alert('Error submitting feedback: ' + (error instanceof Error ? error.message : 'Unknown error'));`
- Replace with: `showError('Error', 'Error submitting feedback: ' + (error instanceof Error ? error.message : 'Unknown error'));`

### AdminUserManagement.tsx
- Line: `alert('User status toggle functionality needs backend implementation');`
- Replace with: `showWarning('Not Implemented', 'User status toggle functionality needs backend implementation');`
- Line: `alert('User added successfully!');`
- Replace with: `showSuccess('Success', 'User added successfully!');`
- Line: `alert(\`Failed to add user: \${errorData.message || 'Unknown error'}\`);`
- Replace with: `showError('Error', \`Failed to add user: \${errorData.message || 'Unknown error'}\`);`
- Line: `alert('Error adding user');`
- Replace with: `showError('Error', 'Error adding user');`

## Usage Pattern:

1. Import the hook and component:
```tsx
import CustomAlert from '../CustomAlert';
import { useAlert } from '../../hooks/useAlert';
```

2. Use the hook:
```tsx
const { alert, showSuccess, showError, showWarning, showInfo, hideAlert } = useAlert();
```

3. Add the component to JSX:
```tsx
<CustomAlert
  type={alert.type}
  title={alert.title}
  message={alert.message}
  isOpen={alert.isOpen}
  onClose={hideAlert}
/>
```

4. Replace alert() calls:
- `alert('Success message')` → `showSuccess('Success', 'Success message')`
- `alert('Error message')` → `showError('Error', 'Error message')`
- `alert('Warning message')` → `showWarning('Warning', 'Warning message')`
- `alert('Info message')` → `showInfo('Info', 'Info message')`