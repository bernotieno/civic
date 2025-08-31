// screens/home/HomeScreen.tsx
import React from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  Dimensions,
  StatusBar,
  SafeAreaView 
} from "react-native";
import { useRouter } from "expo-router";
import Logo from "../Logo"; // Import your custom logo component

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Define types for better TypeScript support
type BillStage = 
  | "First Reading"
  | "Second Reading"
  | "Committee Stage"
  | "Third Reading"
  | "Presidential Assent";

type User = {
  id: string;
  name: string;
  bill: string;
  description: string;
  progress: number; // Progress percentage (0-100)
  totalVotes: number; // Total number of votes
  daysLeft: number; // Days left for voting
  currentStage: BillStage;
  stageProgress: number; // Progress within current stage (0-100)
};

type HeaderItem = {
  isHeader: true;
};

type FeedItem = User | HeaderItem;

const HomeScreen = () => {
  // Sample data with more realistic content including progress data
  const users: User[] = [
    { 
      id: "1", 
      name: "Alice Wanjiku", 
      bill: "Healthcare Access Bill 2024",
      description: "Share your thoughts on universal healthcare coverage for all Kenyan citizens",
      progress: 75,
      totalVotes: 1250,
      daysLeft: 12,
      currentStage: "Committee Stage",
      stageProgress: 60
    },
    { 
      id: "2", 
      name: "Bob Kimani", 
      bill: "Education Reform Act 2024",
      description: "Your input matters on the proposed changes to Kenya's education system",
      progress: 42,
      totalVotes: 890,
      daysLeft: 8,
      currentStage: "Second Reading",
      stageProgress: 80
    },
    { 
      id: "3", 
      name: "Charlie Ochieng", 
      bill: "Environmental Protection Bill 2024",
      description: "Help shape Kenya's environmental policies for a sustainable future",
      progress: 88,
      totalVotes: 2100,
      daysLeft: 5,
      currentStage: "Third Reading",
      stageProgress: 45
    },
    { 
      id: "4", 
      name: "Diana Mutua", 
      bill: "Digital Economy Act 2024",
      description: "Voice your opinion on Kenya's digital transformation initiatives",
      progress: 23,
      totalVotes: 456,
      daysLeft: 18,
      currentStage: "First Reading",
      stageProgress: 90
    },
  ];

  const router = useRouter();

  // Bill stages component
  const BillStages = ({ currentStage, stageProgress }: { currentStage: BillStage; stageProgress: number }) => {
    const stages: BillStage[] = [
      "First Reading",
      "Second Reading", 
      "Committee Stage",
      "Third Reading",
      "Presidential Assent"
    ];

    const getStageIndex = (stage: BillStage) => stages.indexOf(stage);
    const currentStageIndex = getStageIndex(currentStage);

    const getStageStatus = (index: number) => {
      if (index < currentStageIndex) return "completed";
      if (index === currentStageIndex) return "current";
      return "upcoming";
    };

    const getStageColor = (status: string) => {
      switch (status) {
        case "completed": return "#6BCF7F";
        case "current": return "#135D66";
        case "upcoming": return "#E2E8F0";
        default: return "#E2E8F0";
      }
    };

    const getStageTextColor = (status: string) => {
      switch (status) {
        case "completed": return "#2F855A";
        case "current": return "#135D66";
        case "upcoming": return "#A0AEC0";
        default: return "#A0AEC0";
      }
    };

    return (
      <View style={styles.stagesContainer}>
        <Text style={styles.stagesTitle}>Legislative Progress</Text>
        
        <View style={styles.stagesFlow}>
          {stages.map((stage, index) => {
            const status = getStageStatus(index);
            const isLast = index === stages.length - 1;
            
            return (
              <View key={stage} style={styles.stageItem}>
                <View style={styles.stageIndicator}>
                  <View 
                    style={[
                      styles.stageDot, 
                      { backgroundColor: getStageColor(status) }
                    ]}
                  >
                    {status === "completed" && (
                      <Text style={styles.checkMark}>✓</Text>
                    )}
                    {status === "current" && (
                      <View style={styles.currentIndicator} />
                    )}
                  </View>
                  {!isLast && (
                    <View 
                      style={[
                        styles.stageLine, 
                        { backgroundColor: status === "completed" ? "#6BCF7F" : "#E2E8F0" }
                      ]} 
                    />
                  )}
                </View>
                
                <Text 
                  style={[
                    styles.stageText, 
                    { color: getStageTextColor(status) }
                  ]}
                >
                  {stage}
                </Text>
                
                {status === "current" && (
                  <View style={styles.currentStageProgress}>
                    <View style={styles.miniProgressBar}>
                      <View 
                        style={[
                          styles.miniProgressFill, 
                          { width: `${stageProgress}%` }
                        ]} 
                      />
                    </View>
                    <Text style={styles.stageProgressText}>{stageProgress}%</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  // Progress bar component
  const ProgressBar = ({ progress, totalVotes, daysLeft }: { progress: number; totalVotes: number; daysLeft: number }) => {
    const getProgressColor = (progress: number) => {
      if (progress < 30) return "#FF6B6B";
      if (progress < 70) return "#FFD93D";
      return "#6BCF7F";
    };

    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Public Engagement</Text>
          <Text style={styles.progressPercentage}>{progress}%</Text>
        </View>
        
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground}>
            <View 
              style={[
                styles.progressBarFill, 
                { 
                  width: `${progress}%`, 
                  backgroundColor: getProgressColor(progress) 
                }
              ]} 
            />
          </View>
        </View>
        
        <View style={styles.progressStats}>
          <Text style={styles.progressStat}>{totalVotes.toLocaleString()} votes</Text>
          <Text style={styles.progressStat}>{daysLeft} days left</Text>
        </View>
      </View>
    );
  };

  // Render header content as a separate item
  const renderHeader = () => (
    <View style={styles.headerCard}>
      {/* Replace this comment with your custom logo component */}
      <Logo  />
      
      <Text style={styles.title}>Home</Text>
      <Text style={styles.subtitle}>Your Voice in Civic Decisions</Text>
      <Text style={styles.description}>
        Engage with Kenya's Legislative process. Read bills, vote on clauses and submit feedback to shape the future of our nation
      </Text>
      
    </View>
  );

  // Render a single card
  const renderCard = ({ item }: { item: FeedItem }) => {
    // Check if this is the header item
    if ('isHeader' in item) {
      return renderHeader();
    }

    return (
      <TouchableOpacity onPress={() => router.push(`./BillDetailsScreen?id=${item.id}`)}>
       <View style={styles.card}>
        <View style={styles.cardContent}>
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.billTitle}>{item.bill}</Text>
            </View>
          </View>
          
          <Text style={styles.cardDescription}>{item.description}</Text>
          
          {/* Bill Stages Component */}
          <BillStages 
            currentStage={item.currentStage} 
            stageProgress={item.stageProgress} 
          />
          
          {/* Progress Bar Component */}
          <ProgressBar 
            progress={item.progress} 
            totalVotes={item.totalVotes} 
            daysLeft={item.daysLeft} 
          />
          
          <View style={styles.actionContainer}>
           
          </View>
        </View>
      </View>
      </TouchableOpacity>
    );
  };

  // Combine header and user data
  const data: FeedItem[] = [{ isHeader: true }, ...users];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <FlatList
        data={data}
        keyExtractor={(item, index) => ('isHeader' in item) ? 'header' : item.id}
        renderItem={renderCard}
        showsVerticalScrollIndicator={true}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#fff",
   
  },
  list: {
    paddingBottom: 20,
  },
  separator: {
    height: 1,
    backgroundColor: "#f0f0f0",
  },
  headerCard: {
    backgroundColor: "#E3FEF7",
    width: SCREEN_WIDTH,
    paddingHorizontal: 20,
    paddingVertical: 30,
    justifyContent: "center",
    alignItems: "center",
    minHeight: SCREEN_HEIGHT * 0.4,
  },
  // Add this style for your custom logo
  logo: {
    width: 80,
    height: 80,
    marginBottom: 20,
    // Add other styling properties as needed
  },
  title: { 
    fontSize: 32, 
    fontWeight: "700", 
    marginBottom: 10,
    color: "#135D66"
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#135D66",
    marginBottom: 15,
    textAlign: "center",
  },
  description: {
    fontSize: 16,
    color: "#2d3748",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 25,
    paddingHorizontal: 10,
  },
  exploreButton: {
    backgroundColor: "#135D66",
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
    shadowColor: "#135D66",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 5,
  },
  exploreButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  card: {
    backgroundColor: "#E3FEF7",
    width: SCREEN_WIDTH,
    marginTop: 10,
    
    minHeight: SCREEN_HEIGHT * 0.75,
    justifyContent: "center",
  },
  cardContent: {
    padding: 20,
    flex: 1,
    justifyContent: "space-between",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#135D66",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  avatarText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
  },
  userDetails: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: "700",
    color: "#135D66",
    marginBottom: 5,
  },
  billTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2d3748",
  },
  cardDescription: {
    fontSize: 16,
    color: "#4a5568",
    lineHeight: 24,
    marginBottom: 15,
    textAlign: "center",
  },
  // Bill Stages Styles
  stagesContainer: {
    marginBottom: 15,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 12,
    padding: 15,
  },
  stagesTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#135D66",
    marginBottom: 15,
    textAlign: "center",
  },
  stagesFlow: {
    alignItems: "flex-start",
  },
  stageItem: {
    marginBottom: 12,
    width: "100%",
  },
  stageIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  stageDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  checkMark: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  currentIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#fff",
  },
  stageLine: {
    width: 2,
    height: 20,
    marginLeft: -12,
    marginTop: 2,
  },
  stageText: {
    fontSize: 12,
    fontWeight: "500",
    marginLeft: 28,
    marginBottom: 4,
  },
  currentStageProgress: {
    marginLeft: 28,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  miniProgressBar: {
    flex: 1,
    height: 4,
    backgroundColor: "rgba(19, 93, 102, 0.3)",
    borderRadius: 2,
  },
  miniProgressFill: {
    height: "100%",
    backgroundColor: "#135D66",
    borderRadius: 2,
  },
  stageProgressText: {
    fontSize: 10,
    color: "#135D66",
    fontWeight: "600",
    minWidth: 35,
  },
  // Progress Bar Styles
  progressContainer: {
    marginBottom: 20,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderRadius: 12,
    padding: 15,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#135D66",
  },
  progressPercentage: {
    fontSize: 16,
    fontWeight: "700",
    color: "#135D66",
  },
  progressBarContainer: {
    marginBottom: 10,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: "rgba(19, 93, 102, 0.2)",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  progressStats: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  progressStat: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  actionContainer: {
    alignItems: "center",
  },
  feedbackButton: {
    backgroundColor: "#135D66",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginBottom: 20,
    minWidth: 200,
    alignItems: "center",
    shadowColor: "#135D66",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 5,
  },
  feedbackButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  engagement: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    paddingHorizontal: 20,
  },
  engagementButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    backgroundColor: "rgba(19, 93, 102, 0.1)",
  },
  engagementText: {
    color: "#135D66",
    fontSize: 14,
    fontWeight: "600",
  },
});

export default HomeScreen;