import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// Type definitions
interface PersonalInfo {
  id: string;
  name: string;
  email: string;
  phone: string;
  constituency: string;
  county: string;
}

interface NotificationSettings {
  billUpdates: boolean;
  votingReminders: boolean;
  policyAlerts: boolean;
  weeklyDigest: boolean;
}

interface BillHistoryItem {
  id: string;
  title: string;
  action: string;
  date: string;
}

interface FeedbackHistoryItem {
  id: string;
  bill: string;
  feedback: string;
  date: string;
}

interface SavedBillItem {
  id: string;
  title: string;
  status: string;
  savedDate: string;
}

interface Colors {
  primary: string;
  secondary: string;
  success: string;
  warning: string;
  danger: string;
  background: string;
  card: string;
  text: string;
  textSecondary: string;
  border: string;
}

const ProfileSection: React.FC = () => {
  // Personal Info State
  const router = useRouter();
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({
    id: 'USR001234',
    name: 'John Doe',
    email: 'john.doe@email.com',
    phone: '+254 712 345 678',
    constituency: 'Nairobi Central',
    county: 'Nairobi',
  });

  // Notification Settings State
  const [notifications, setNotifications] = useState<NotificationSettings>({
    billUpdates: true,
    votingReminders: true,
    policyAlerts: false,
    weeklyDigest: true,
  });

  // Sample Data
  const billHistory: BillHistoryItem[] = [
    { id: '1', title: 'Healthcare Reform Bill 2024', action: 'Voted Yes', date: '2024-08-15' },
    { id: '2', title: 'Education Funding Act', action: 'Commented', date: '2024-08-10' },
    { id: '3', title: 'Climate Action Bill', action: 'Voted No', date: '2024-08-05' },
  ];

  const feedbackHistory: FeedbackHistoryItem[] = [
    { id: '1', bill: 'Tax Reform Bill', feedback: 'Strongly support progressive taxation', date: '2024-08-12' },
    { id: '2', bill: 'Infrastructure Bill', feedback: 'Need more rural road development', date: '2024-08-08' },
  ];

  const savedBills: SavedBillItem[] = [
    { id: '1', title: 'Digital Privacy Act', status: 'Under Review', savedDate: '2024-08-18' },
    { id: '2', title: 'Small Business Support Bill', status: 'In Committee', savedDate: '2024-08-16' },
  ];

   const colors: Colors = {
    primary: '#003C43',  // buttons
    secondary: '#64748B',
    success: '#059669',
    warning: '#D97706',
    danger: '#DC2626',
    background: '#E3FEF7',  // main background
    card: '#FFFFFF',
    text: '#1E293B',
    textSecondary: '#64748B',
    border: '#E2E8F0',
  };

  const handleSave = (): void => {
    setIsEditing(false);
    Alert.alert('Success', 'Profile updated successfully!');
  };

  const handleNotificationToggle = (key: keyof NotificationSettings): void => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const renderPersonalInfo = (): any => (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      <View style={styles.cardHeader}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Personal Information</Text>
        <TouchableOpacity
          onPress={() => isEditing ? handleSave() : setIsEditing(true)}
          style={[styles.editButton, { backgroundColor: colors.primary }]}
        >
          <Text style={styles.editButtonText}>
            {isEditing ? 'Save' : 'Edit'}
          </Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.infoGrid}>
        <View style={styles.infoItem}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>ID Number</Text>
          <Text style={[styles.value, { color: colors.text }]}>{personalInfo.id}</Text>
        </View>
        
        <View style={styles.infoItem}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Full Name</Text>
          {isEditing ? (
            <TextInput
              value={personalInfo.name}
              onChangeText={(text: string) => setPersonalInfo(prev => ({ ...prev, name: text }))}
              style={[styles.input, { borderColor: colors.border, color: colors.text }]}
            />
          ) : (
            <Text style={[styles.value, { color: colors.text }]}>{personalInfo.name}</Text>
          )}
        </View>
        
        <View style={styles.infoItem}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Email</Text>
          {isEditing ? (
            <TextInput
              value={personalInfo.email}
              onChangeText={(text: string) => setPersonalInfo(prev => ({ ...prev, email: text }))}
              style={[styles.input, { borderColor: colors.border, color: colors.text }]}
              keyboardType="email-address"
            />
          ) : (
            <Text style={[styles.value, { color: colors.text }]}>{personalInfo.email}</Text>
          )}
        </View>
        
        <View style={styles.infoItem}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Phone</Text>
          {isEditing ? (
            <TextInput
              value={personalInfo.phone}
              onChangeText={(text: string) => setPersonalInfo(prev => ({ ...prev, phone: text }))}
              style={[styles.input, { borderColor: colors.border, color: colors.text }]}
              keyboardType="phone-pad"
            />
          ) : (
            <Text style={[styles.value, { color: colors.text }]}>{personalInfo.phone}</Text>
          )}
        </View>
        
        <View style={styles.infoItem}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Constituency</Text>
          {isEditing ? (
            <TextInput
              value={personalInfo.constituency}
              onChangeText={(text: string) => setPersonalInfo(prev => ({ ...prev, constituency: text }))}
              style={[styles.input, { borderColor: colors.border, color: colors.text }]}
            />
          ) : (
            <Text style={[styles.value, { color: colors.text }]}>{personalInfo.constituency}</Text>
          )}
        </View>
        
        <View style={styles.infoItem}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>County</Text>
          {isEditing ? (
            <TextInput
              value={personalInfo.county}
              onChangeText={(text: string) => setPersonalInfo(prev => ({ ...prev, county: text }))}
              style={[styles.input, { borderColor: colors.border, color: colors.text }]}
            />
          ) : (
            <Text style={[styles.value, { color: colors.text }]}>{personalInfo.county}</Text>
          )}
        </View>
      </View>
    </View>
  );
  
  const handleLogout = () => {
    // 👉 Here you'll call your backend logout API
    // Example: await fetch("/logout")

    // For now simulate logout
    setTimeout(() => {
      // Clear auth state (e.g. AsyncStorage, context, etc.)
      router.replace("/LoginScreen"); // send user to login
    }, 1000);
  };

  const renderHistorySection = (
    title: string, 
    data: BillHistoryItem[] | FeedbackHistoryItem[] | SavedBillItem[], 
    type: 'bills' | 'feedback' | 'saved'
  ): any => (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      <Text style={[styles.cardTitle, { color: colors.text }]}>{title}</Text>
      {data.length === 0 ? (
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          No {title.toLowerCase()} yet
        </Text>
      ) : (
        data.map((item: any) => (
          <View key={item.id} style={[styles.historyItem, { borderBottomColor: colors.border }]}>
            <View style={styles.historyContent}>
              <Text style={[styles.historyTitle, { color: colors.text }]}>
                {item.title || item.bill}
              </Text>
              {type === 'bills' && item.action && (
                <View style={[
                  styles.actionBadge,
                  { backgroundColor: item.action.includes('Yes') ? colors.success + '20' : 
                    item.action.includes('No') ? colors.danger + '20' : colors.warning + '20' }
                ]}>
                  <Text style={[
                    styles.actionText,
                    { color: item.action.includes('Yes') ? colors.success :
                      item.action.includes('No') ? colors.danger : colors.warning }
                  ]}>
                    {item.action}
                  </Text>
                </View>
              )}
              {type === 'feedback' && item.feedback && (
                <Text style={[styles.feedbackText, { color: colors.textSecondary }]} numberOfLines={2}>
                  {item.feedback}
                </Text>
              )}
              {type === 'saved' && item.status && (
                <View style={[styles.statusBadge, { backgroundColor: colors.primary + '20' }]}>
                  <Text style={[styles.statusText, { color: colors.primary }]}>
                    {item.status}
                  </Text>
                </View>
              )}
            </View>
            <Text style={[styles.dateText, { color: colors.textSecondary }]}>
              {item.date || item.savedDate}
            </Text>
          </View>
        ))
      )}
    </View>
  );

  const renderNotificationSettings = (): any => (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      <Text style={[styles.cardTitle, { color: colors.text }]}>Notification Settings</Text>
      
      {Object.entries(notifications).map(([key, value]) => (
        <View key={key} style={[styles.settingItem, { borderBottomColor: colors.border }]}>
          <View style={styles.settingContent}>
            <Text style={[styles.settingTitle, { color: colors.text }]}>
              {key === 'billUpdates' ? 'Bill Updates' :
               key === 'votingReminders' ? 'Voting Reminders' :
               key === 'policyAlerts' ? 'Policy Alerts' : 'Weekly Digest'}
            </Text>
            <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
              {key === 'billUpdates' ? 'Get notified when bills you follow are updated' :
               key === 'votingReminders' ? 'Reminders about upcoming votes and deadlines' :
               key === 'policyAlerts' ? 'Urgent policy changes and announcements' :
               'Weekly summary of parliamentary activities'}
            </Text>
          </View>
          <Switch
            value={value}
            onValueChange={() => handleNotificationToggle(key as keyof NotificationSettings)}
            trackColor={{ false: colors.border, true: colors.primary + '40' }}
            thumbColor={value ? colors.primary : colors.secondary}
          />
        </View>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Profile</Text>
        <TouchableOpacity style={styles.headerIcon}>
          <Ionicons name="settings-outline" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderPersonalInfo()}
        
        {renderHistorySection('Bills Interacted With', billHistory, 'bills')}
        
        {renderHistorySection('Feedback Submitted', feedbackHistory, 'feedback')}
        
        {renderHistorySection('Saved Bills', savedBills, 'saved')}
        
        {renderNotificationSettings()}
        
        <View style={styles.footer}>
           <TouchableOpacity
      style={[styles.logoutButton, { borderColor: colors.danger }]}
      onPress={handleLogout}
    >
      <Text style={[styles.logoutText, { color: colors.danger }]}>Logout</Text>
    </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginTop: 40,
    backgroundColor: '#E3FEF7',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerIcon: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  card: {
    marginVertical: 8,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    backgroundColor: '#E3FEF7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  editButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  infoGrid: {
    gap: 16,
  },
  infoItem: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
  value: {
    fontSize: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  historyContent: {
    flex: 1,
    marginRight: 12,
    gap: 6,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  actionBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  feedbackText: {
    fontSize: 14,
    lineHeight: 20,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  dateText: {
    fontSize: 12,
    marginTop: 4,
  },
  emptyText: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  settingContent: {
    flex: 1,
    marginRight: 16,
    gap: 4,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingDescription: {
    fontSize: 14,
    lineHeight: 18,
  },
  footer: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  logoutButton: {
    borderWidth: 1,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default ProfileSection;