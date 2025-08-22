import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
  Dimensions,
  RefreshControl,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

// Type definitions
interface ProjectImage {
  id: string;
  url: string;
  caption: string;
  date: string;
}

interface ProjectUpdate {
  id: string;
  title: string;
  description: string;
  date: string;
  type: 'milestone' | 'delay' | 'completion' | 'general';
}

interface Project {
  id: string;
  title: string;
  description: string;
  budgetAllocated: number;
  budgetUsed: number;
  timeline: {
    startDate: string;
    endDate: string;
    duration: string;
  };
  progress: number;
  status: 'planning' | 'ongoing' | 'completed' | 'delayed';
  implementingBody: string;
  constituency: string;
  county: string;
  category: string;
  images: ProjectImage[];
  updates: ProjectUpdate[];
}

interface Colors {
  background: string;
  primary: string;
  white: string;
  text: string;
  textSecondary: string;
  success: string;
  warning: string;
  danger: string;
  card: string;
  border: string;
}

const ProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showProjectModal, setShowProjectModal] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const colors: Colors = {
    background: '#E3FEF7',
    primary: '#003C43',
    white: '#FFFFFF',
    text: '#1E293B',
    textSecondary: '#64748B',
    success: '#059669',
    warning: '#D97706',
    danger: '#DC2626',
    card: '#FFFFFF',
    border: '#E2E8F0',
  };

  // Sample project data
  const sampleProjects: Project[] = [
    {
      id: '1',
      title: 'Nairobi-Nakuru Highway Expansion',
      description: 'Expansion of the highway to reduce traffic congestion and improve transport efficiency',
      budgetAllocated: 15000000000,
      budgetUsed: 9750000000,
      timeline: {
        startDate: '2023-03-15',
        endDate: '2025-12-31',
        duration: '33 months'
      },
      progress: 65,
      status: 'ongoing',
      implementingBody: 'Kenya National Highways Authority (KeNHA)',
      constituency: 'Nairobi Central',
      county: 'Nairobi',
      category: 'Infrastructure',
      images: [
        {
          id: '1',
          url: 'https://images.unsplash.com/photo-1581092795442-8d3593496e0f?w=400',
          caption: 'Highway construction progress - Section A',
          date: '2024-08-15'
        },
        {
          id: '2',
          url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400',
          caption: 'Bridge construction underway',
          date: '2024-08-10'
        }
      ],
      updates: [
        {
          id: '1',
          title: 'Major Milestone Achieved',
          description: '65% of the project completed ahead of schedule',
          date: '2024-08-15',
          type: 'milestone'
        },
        {
          id: '2',
          title: 'Traffic Management Update',
          description: 'New traffic diversions in place for Section B construction',
          date: '2024-08-10',
          type: 'general'
        }
      ]
    },
    {
      id: '2',
      title: 'Kiambu Water Supply Project',
      description: 'Installation of new water treatment plant and distribution network',
      budgetAllocated: 2500000000,
      budgetUsed: 1875000000,
      timeline: {
        startDate: '2024-01-10',
        endDate: '2025-06-30',
        duration: '18 months'
      },
      progress: 75,
      status: 'ongoing',
      implementingBody: 'Kiambu Water and Sewerage Company',
      constituency: 'Kiambu',
      county: 'Kiambu',
      category: 'Water & Sanitation',
      images: [
        {
          id: '1',
          url: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400',
          caption: 'Water treatment plant construction',
          date: '2024-08-12'
        }
      ],
      updates: [
        {
          id: '1',
          title: 'Pipeline Installation Complete',
          description: 'Main distribution pipeline network 100% complete',
          date: '2024-08-12',
          type: 'completion'
        }
      ]
    },
    {
      id: '3',
      title: 'Mombasa Port Modernization',
      description: 'Upgrade of port facilities and installation of modern cargo handling equipment',
      budgetAllocated: 8500000000,
      budgetUsed: 4250000000,
      timeline: {
        startDate: '2023-06-01',
        endDate: '2026-05-31',
        duration: '36 months'
      },
      progress: 50,
      status: 'ongoing',
      implementingBody: 'Kenya Ports Authority',
      constituency: 'Mvita',
      county: 'Mombasa',
      category: 'Infrastructure',
      images: [
        {
          id: '1',
          url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
          caption: 'New cargo cranes installation',
          date: '2024-08-14'
        }
      ],
      updates: [
        {
          id: '1',
          title: 'Equipment Delivery Delayed',
          description: 'Some specialized equipment delivery delayed by 2 weeks',
          date: '2024-08-14',
          type: 'delay'
        }
      ]
    },
    {
      id: '4',
      title: 'Eldoret International Airport Expansion',
      description: 'Expansion of runway and terminal facilities to accommodate larger aircraft',
      budgetAllocated: 12000000000,
      budgetUsed: 12000000000,
      timeline: {
        startDate: '2022-01-15',
        endDate: '2024-03-31',
        duration: '27 months'
      },
      progress: 100,
      status: 'completed',
      implementingBody: 'Kenya Airports Authority',
      constituency: 'Eldoret East',
      county: 'Uasin Gishu',
      category: 'Aviation',
      images: [
        {
          id: '1',
          url: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=400',
          caption: 'Completed terminal building',
          date: '2024-03-25'
        }
      ],
      updates: [
        {
          id: '1',
          title: 'Project Successfully Completed',
          description: 'Airport expansion completed and officially opened',
          date: '2024-03-31',
          type: 'completion'
        }
      ]
    }
  ];

  useEffect(() => {
    setProjects(sampleProjects);
  }, []);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed': return colors.success;
      case 'ongoing': return colors.primary;
      case 'delayed': return colors.danger;
      case 'planning': return colors.warning;
      default: return colors.textSecondary;
    }
  };

  const getStatusIcon = (status: string): string => {
    switch (status) {
      case 'completed': return 'checkmark-circle';
      case 'ongoing': return 'play-circle';
      case 'delayed': return 'warning';
      case 'planning': return 'time';
      default: return 'ellipse';
    }
  };

  const getUpdateTypeColor = (type: string): string => {
    switch (type) {
      case 'milestone': return colors.success;
      case 'completion': return colors.primary;
      case 'delay': return colors.danger;
      default: return colors.textSecondary;
    }
  };

  const filteredProjects = filterStatus === 'all' 
    ? projects 
    : projects.filter(project => project.status === filterStatus);

  const onRefresh = async (): Promise<void> => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  };

  const renderProjectCard = (project: Project): any => (
    <TouchableOpacity
      key={project.id}
      style={[styles.projectCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => {
        setSelectedProject(project);
        setShowProjectModal(true);
      }}
    >
      {project.images.length > 0 && (
        <Image
          source={{ uri: project.images[0].url }}
          style={styles.projectImage}
          resizeMode="cover"
        />
      )}
      
      <View style={styles.projectContent}>
        <View style={styles.projectHeader}>
          <Text style={[styles.projectTitle, { color: colors.text }]} numberOfLines={2}>
            {project.title}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(project.status) + '20' }]}>
            <Ionicons 
              name={getStatusIcon(project.status) as any}
              size={12} 
              color={getStatusColor(project.status)} 
            />
            <Text style={[styles.statusText, { color: getStatusColor(project.status) }]}>
              {project.status.toUpperCase()}
            </Text>
          </View>
        </View>

        <Text style={[styles.projectDescription, { color: colors.textSecondary }]} numberOfLines={2}>
          {project.description}
        </Text>

        <View style={styles.projectDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="business" size={14} color={colors.textSecondary} />
            <Text style={[styles.detailText, { color: colors.textSecondary }]}>
              {project.implementingBody}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Ionicons name="location" size={14} color={colors.textSecondary} />
            <Text style={[styles.detailText, { color: colors.textSecondary }]}>
              {project.constituency}, {project.county}
            </Text>
          </View>
        </View>

        <View style={styles.budgetSection}>
          <Text style={[styles.budgetLabel, { color: colors.textSecondary }]}>Budget</Text>
          <Text style={[styles.budgetAmount, { color: colors.text }]}>
            {formatCurrency(project.budgetAllocated)}
          </Text>
          <Text style={[styles.budgetUsed, { color: colors.textSecondary }]}>
            Used: {formatCurrency(project.budgetUsed)} ({Math.round((project.budgetUsed / project.budgetAllocated) * 100)}%)
          </Text>
        </View>

        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>Progress</Text>
            <Text style={[styles.progressPercentage, { color: colors.text }]}>
              {project.progress}%
            </Text>
          </View>
          <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  backgroundColor: getStatusColor(project.status),
                  width: `${project.progress}%`
                }
              ]} 
            />
          </View>
          <Text style={[styles.timeline, { color: colors.textSecondary }]}>
            {formatDate(project.timeline.startDate)} - {formatDate(project.timeline.endDate)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderProjectModal = (): any => (
    <Modal
      visible={showProjectModal}
      animationType="slide"
      onRequestClose={() => setShowProjectModal(false)}
    >
      <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.modalHeader, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <TouchableOpacity 
            onPress={() => setShowProjectModal(false)}
            style={styles.closeButton}
          >
            <Ionicons name="arrow-back" size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={[styles.modalTitle, { color: colors.text }]}>Project Details</Text>
          <View style={{ width: 24 }} />
        </View>

        {selectedProject && (
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <Text style={[styles.modalProjectTitle, { color: colors.text }]}>
              {selectedProject.title}
            </Text>
            
            <Text style={[styles.modalProjectDescription, { color: colors.textSecondary }]}>
              {selectedProject.description}
            </Text>

            <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Project Information</Text>
              <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Category</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>{selectedProject.category}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Implementing Body</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>{selectedProject.implementingBody}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Location</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>
                    {selectedProject.constituency}, {selectedProject.county}
                  </Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Duration</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>{selectedProject.timeline.duration}</Text>
                </View>
              </View>
            </View>

            {selectedProject.images.length > 0 && (
              <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>Project Images</Text>
                <FlatList
                  horizontal
                  data={selectedProject.images}
                  showsHorizontalScrollIndicator={false}
                  renderItem={({ item }) => (
                    <View style={styles.imageContainer}>
                      <Image source={{ uri: item.url }} style={styles.modalImage} />
                      <Text style={[styles.imageCaption, { color: colors.textSecondary }]}>
                        {item.caption}
                      </Text>
                      <Text style={[styles.imageDate, { color: colors.textSecondary }]}>
                        {formatDate(item.date)}
                      </Text>
                    </View>
                  )}
                  keyExtractor={(item) => item.id}
                />
              </View>
            )}

            <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Recent Updates</Text>
              {selectedProject.updates.map((update) => (
                <View key={update.id} style={[styles.updateItem, { borderBottomColor: colors.border }]}>
                  <View style={styles.updateHeader}>
                    <View style={styles.updateTitleRow}>
                      <View style={[
                        styles.updateTypeIndicator,
                        { backgroundColor: getUpdateTypeColor(update.type) }
                      ]} />
                      <Text style={[styles.updateTitle, { color: colors.text }]}>
                        {update.title}
                      </Text>
                    </View>
                    <Text style={[styles.updateDate, { color: colors.textSecondary }]}>
                      {formatDate(update.date)}
                    </Text>
                  </View>
                  <Text style={[styles.updateDescription, { color: colors.textSecondary }]}>
                    {update.description}
                  </Text>
                </View>
              ))}
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );

  const renderFilterButtons = (): any => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.filterContainer}
      contentContainerStyle={styles.filterContent}
    >
      {['all', 'ongoing', 'completed', 'delayed', 'planning'].map((status) => (
        <TouchableOpacity
          key={status}
          style={[
            styles.filterButton,
            {
              backgroundColor: filterStatus === status ? colors.primary : colors.card,
              borderColor: colors.border
            }
          ]}
          onPress={() => setFilterStatus(status)}
        >
          <Text
            style={[
              styles.filterButtonText,
              { color: filterStatus === status ? colors.white : colors.text }
            ]}
          >
            {status === 'all' ? 'All Projects' : status.charAt(0).toUpperCase() + status.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.primary, colors.primary + 'DD']}
        style={styles.header}
      >
        <Text style={[styles.headerTitle, { color: colors.white }]}>Government Projects</Text>
        <Text style={[styles.headerSubtitle, { color: colors.white + 'CC' }]}>
          Track progress in your area
        </Text>
      </LinearGradient>

      {renderFilterButtons()}

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.projectsContainer}>
          {filteredProjects.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="folder-open-outline" size={64} color={colors.textSecondary} />
              <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                No projects found for the selected filter
              </Text>
            </View>
          ) : (
            filteredProjects.map(renderProjectCard)
          )}
        </View>
      </ScrollView>

      {renderProjectModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
  },
  filterContainer: {
    marginVertical: 16,
  },
  filterContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  projectsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  projectCard: {
    marginBottom: 20,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  projectImage: {
    width: '100%',
    height: 200,
  },
  projectContent: {
    padding: 20,
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  projectTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  projectDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  projectDetails: {
    marginBottom: 16,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 12,
    flex: 1,
  },
  budgetSection: {
    marginBottom: 16,
  },
  budgetLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  budgetAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  budgetUsed: {
    fontSize: 12,
  },
  progressSection: {
    marginTop: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  timeline: {
    fontSize: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  modalProjectTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 20,
  },
  modalProjectDescription: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
  },
  modalCard: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  infoGrid: {
    gap: 12,
  },
  infoItem: {
    gap: 4,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
  },
  imageContainer: {
    marginRight: 16,
    width: 200,
  },
  modalImage: {
    width: 200,
    height: 120,
    borderRadius: 8,
    marginBottom: 8,
  },
  imageCaption: {
    fontSize: 14,
    marginBottom: 4,
  },
  imageDate: {
    fontSize: 12,
  },
  updateItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  updateHeader: {
    marginBottom: 8,
  },
  updateTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  updateTypeIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  updateTitle: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  updateDate: {
    fontSize: 12,
  },
  updateDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
});

export default ProjectsPage;