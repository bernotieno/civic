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

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Define types for better TypeScript support
type User = {
  id: string;
  name: string;
  bill: string;
  description: string;
};

type HeaderItem = {
  isHeader: true;
};

type FeedItem = User | HeaderItem;

const HomeScreen = () => {
  // Sample data with more realistic content
  const users: User[] = [
    { 
      id: "1", 
      name: "Alice Wanjiku", 
      bill: "Healthcare Access Bill 2024",
      description: "Share your thoughts on universal healthcare coverage for all Kenyan citizens"
    },
    { 
      id: "2", 
      name: "Bob Kimani", 
      bill: "Education Reform Act 2024",
      description: "Your input matters on the proposed changes to Kenya's education system"
    },
    { 
      id: "3", 
      name: "Charlie Ochieng", 
      bill: "Environmental Protection Bill 2024",
      description: "Help shape Kenya's environmental policies for a sustainable future"
    },
    { 
      id: "4", 
      name: "Diana Mutua", 
      bill: "Digital Economy Act 2024",
      description: "Voice your opinion on Kenya's digital transformation initiatives"
    },
  ];

  const router = useRouter();

  // Render header content as a separate item
  const renderHeader = () => (
    <View style={styles.headerCard}>
      <Text style={styles.title}>🏠 Home</Text>
      <Text style={styles.subtitle}>Your Voice in Civic Decisions</Text>
      <Text style={styles.description}>
        Engage with Kenya's Legislative process. Read bills, vote on clauses and submit feedback to shape the future of our nation
      </Text>
      {/* <TouchableOpacity 
        style={styles.exploreButton}
        onPress={() => router.push("/FeedBackScreen")}
      >
        <Text style={styles.exploreButtonText}>Explore Bills</Text>
      </TouchableOpacity> */}
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
          
          <View style={styles.actionContainer}>
            {/* <TouchableOpacity
              style={styles.feedbackButton}
              onPress={() => router.push(`./FeedBackScreen?billId=${item.id}`)}
            >
              <Text style={styles.feedbackButtonText}>Submit Feedback</Text>
            </TouchableOpacity> */}
            {/** Removed this section */}
            {/* <View style={styles.engagement}>
              <TouchableOpacity style={styles.engagementButton}>
                <Text style={styles.engagementText}>👍 Like</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.engagementButton}>
                <Text style={styles.engagementText}>💬 Comment</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.engagementButton}>
                <Text style={styles.engagementText}>📤 Share</Text>
              </TouchableOpacity>
            </View> */}
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
    
    minHeight: SCREEN_HEIGHT * 0.6,
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
    marginBottom: 30,
    textAlign: "center",
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