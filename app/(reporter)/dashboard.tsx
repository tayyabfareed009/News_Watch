import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

// Base URL for your backend server
const BASE_URL = 'http://localhost:5000'; // Change this to your actual server URL

// Web-compatible alert function
const showAlert = (title: string, message: string, buttons?: Array<{ text: string, onPress?: () => void, style?: 'cancel' | 'default' | 'destructive' }>) => {
  if (Platform.OS === 'web') {
    // Use browser's alert for web
    const result = window.confirm(`${title}\n\n${message}`);
    if (result && buttons && buttons[0]?.onPress) {
      buttons[0].onPress();
    }
  } else {
    // Use React Native's Alert for mobile
    Alert.alert(title, message, buttons);
  }
};

// Mock data fallback
const popularTags = [
  '#FridayMorning',
  '#CollegeCloraDoy',
  '#InstagramDown',
  '#FridayFeeling',
  '#ThursdayVibes',
  '#DigitalCurrency',
  '#Bitcoin',
  '#Cryptocurrency',
  '#kellerTalk',
];

const recommendationTopics = [
  { id: '1', title: 'Technology Trends', count: 24 },
  { id: '2', title: 'Health & Wellness', count: 18 },
  { id: '3', title: 'Business Insights', count: 15 },
  { id: '4', title: 'Sports Analysis', count: 12 },
];

interface NewsArticle {
  id: string;
  title: string;
  excerpt?: string;
  category: string;
  views: number;
  likesCount: number;
  commentsCount: number;
  createdAt: string;
  authorName?: string;
  images: Array<{ url: string }>;
}

interface ReporterStats {
  totalNews: number;
  totalViews: number;
  totalLikes: number;
  engagementRate: number;
}

export default function ReporterDashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [userName, setUserName] = useState('Reporter');
  const [userProfileImage, setUserProfileImage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<ReporterStats>({
    totalNews: 0,
    totalViews: 0,
    totalLikes: 0,
    engagementRate: 0
  });
  const [latestNews, setLatestNews] = useState<NewsArticle[]>([]);
  const [topNews, setTopNews] = useState<NewsArticle[]>([]);

  console.log('🔍 [ReporterDashboard] Component rendered with loading:', isLoading);

  useEffect(() => {
    console.log('🔍 [useEffect] Running initial load');
    loadUserData();
    fetchDashboardData();
  }, []);

  const loadUserData = async () => {
    console.log('🔍 [loadUserData] Starting...');
    try {
      console.log('🔍 [loadUserData] Reading userData from AsyncStorage');
      const userData = await AsyncStorage.getItem('userData');
      console.log('🔍 [loadUserData] Raw userData:', userData);
      
      if (userData) {
        const user = JSON.parse(userData);
        console.log('✅ [loadUserData] User found:', {
          name: user.name,
          role: user.role,
          email: user.email
        });
        setUserName(user.name || 'Reporter');
        setUserProfileImage(user.profileImage || '');
      } else {
        console.log('❌ [loadUserData] No userData found in AsyncStorage');
      }

      // Also check for token
      const token = await AsyncStorage.getItem('userToken');
      console.log('🔍 [loadUserData] Token exists:', !!token);
      console.log('🔍 [loadUserData] Token value:', token ? `${token.substring(0, 20)}...` : 'none');
      
    } catch (error) {
      console.error('❌ [loadUserData] Error loading user data:', error);
    }
  };

  const fetchDashboardData = async () => {
    console.log('🔍 [fetchDashboardData] Starting...');
    try {
      setIsLoading(true);
      console.log('🔍 [fetchDashboardData] Reading token...');
      
      // Check both possible token keys
      const token = await AsyncStorage.getItem('userToken') || await AsyncStorage.getItem('authToken');
      
      console.log('🔍 [fetchDashboardData] Token found:', !!token);
      console.log('🔍 [fetchDashboardData] Token length:', token?.length || 0);
      
      if (!token) {
        console.log('❌ [fetchDashboardData] No token found in AsyncStorage');
        console.log('🔍 [fetchDashboardData] Checking AsyncStorage keys...');
        const keys = await AsyncStorage.getAllKeys();
        console.log('🔍 [fetchDashboardData] All AsyncStorage keys:', keys);
        
        showAlert('Session Expired', 'Please login again to continue.');
        console.log('📍 [fetchDashboardData] Navigating to login screen');
        router.replace('/(auth)/login');
        return;
      }

      console.log('🔍 [fetchDashboardData] Making API requests...');
      
      // Fetch reporter stats
      const statsResponse = await fetch(`${BASE_URL}/api/reporter/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('📡 [fetchDashboardData] Stats response status:', statsResponse.status);
      
      if (!statsResponse.ok) {
        console.error('❌ [fetchDashboardData] Stats API error:', statsResponse.status);
        if (statsResponse.status === 401) {
          console.log('🔑 [fetchDashboardData] Token invalid or expired');
          await AsyncStorage.clear();
          showAlert('Session Expired', 'Your session has expired. Please login again.');
          router.replace('/(auth)/login');
          return;
        }
      }

      const statsData = await statsResponse.json();
      console.log('📡 [fetchDashboardData] Stats response data:', statsData);

      if (statsData.success) {
        console.log('✅ [fetchDashboardData] Stats loaded successfully');
        setStats(statsData.stats);
        setTopNews(statsData.topNews || []);
      } else {
        console.log('❌ [fetchDashboardData] Stats API returned success=false:', statsData.message);
      }

      // Fetch reporter's latest news
      const newsResponse = await fetch(`${BASE_URL}/api/reporter/news`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('📡 [fetchDashboardData] News response status:', newsResponse.status);
      
      if (!newsResponse.ok) {
        console.error('❌ [fetchDashboardData] News API error:', newsResponse.status);
      }

      const newsData = await newsResponse.json();
      console.log('📡 [fetchDashboardData] News response data:', newsData);

      if (newsData.success) {
        console.log('✅ [fetchDashboardData] News loaded successfully, count:', newsData.news?.length || 0);
        setLatestNews(newsData.news || []);
      } else {
        console.log('❌ [fetchDashboardData] News API returned success=false:', newsData.message);
      }

    } catch (error: any) {
      console.error('❌ [fetchDashboardData] Error fetching dashboard data:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      
      // Check if it's a network error
      if (error.message.includes('Network request failed') || error.message.includes('fetch')) {
        showAlert(
          'Connection Error', 
          'Unable to connect to the server. Please check:\n\n1. Your internet connection\n2. Server is running\n3. Server URL is correct'
        );
      } else {
        showAlert('Error', 'Failed to load dashboard data. Please try again.');
      }
    } finally {
      console.log('🏁 [fetchDashboardData] Finished loading');
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    console.log('🔄 [onRefresh] Manual refresh triggered');
    setRefreshing(true);
    await fetchDashboardData();
  };

  const handleLogout = async () => {
    console.log('🔐 [handleLogout] Logout initiated');
    if (Platform.OS === 'web') {
      const confirm = window.confirm('Are you sure you want to logout?');
      if (confirm) {
        console.log('📍 [handleLogout] User confirmed logout');
        await performLogout();
      } else {
        console.log('📍 [handleLogout] User cancelled logout');
      }
    } else {
      Alert.alert(
        'Logout',
        'Are you sure you want to logout?',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => console.log('📍 [handleLogout] User cancelled logout') },
          { 
            text: 'Logout', 
            style: 'destructive',
            onPress: async () => {
              console.log('📍 [handleLogout] User confirmed logout');
              await performLogout();
            }
          },
        ]
      );
    }
  };

  const performLogout = async () => {
    try {
      console.log('🔐 [performLogout] Clearing AsyncStorage...');
      await AsyncStorage.clear();
      console.log('✅ [performLogout] AsyncStorage cleared');
      console.log('📍 [performLogout] Navigating to login screen');
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('❌ [performLogout] Error during logout:', error);
    }
  };

  const renderTagItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={[
        styles.tagItem,
        selectedTag === item && styles.tagItemSelected,
      ]}
      onPress={() => {
        console.log('🏷️ Tag selected:', item);
        setSelectedTag(item === selectedTag ? null : item);
      }}
      activeOpacity={0.7}
      disabled={isLoading}
    >
      <Text
        style={[
          styles.tagText,
          selectedTag === item && styles.tagTextSelected,
        ]}
      >
        {item}
      </Text>
    </TouchableOpacity>
  );

  const renderNewsItem = ({ item }: { item: NewsArticle }) => (
    <TouchableOpacity
      style={styles.newsCard}
      onPress={() => {
        console.log('📰 News item clicked:', item.id);
        router.push(`/news/${item.id}`);
      }}
      activeOpacity={0.8}
      disabled={isLoading}
    >
      {item.images && item.images.length > 0 ? (
        <Image
          source={{ uri: item.images[0].url || 'https://via.placeholder.com/280x150' }}
          style={styles.newsImage}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.newsImage, styles.newsImagePlaceholder]}>
          <Ionicons name="newspaper-outline" size={40} color="#ccc" />
        </View>
      )}
      <View style={styles.newsContent}>
        <View style={styles.newsHeader}>
          <Text style={styles.newsSource}>{item.authorName || 'NewsWatch'}</Text>
          <Text style={styles.newsTime}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
        <Text style={styles.newsTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <View style={styles.newsFooter}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{item.category}</Text>
          </View>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Ionicons name="eye-outline" size={12} color="#666" />
              <Text style={styles.statText}>{item.views}</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="heart-outline" size={12} color="#666" />
              <Text style={styles.statText}>{item.likesCount}</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="chatbubble-outline" size={12} color="#666" />
              <Text style={styles.statText}>{item.commentsCount}</Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderTopNewsItem = ({ item }: { item: NewsArticle }) => (
    <TouchableOpacity
      style={styles.topNewsCard}
      onPress={() => {
        console.log('🔥 Top news clicked:', item.id);
        router.push(`/news/${item.id}`);
      }}
      activeOpacity={0.8}
      disabled={isLoading}
    >
      <Text style={styles.topNewsTitle} numberOfLines={2}>
        {item.title}
      </Text>
      <View style={styles.topNewsStats}>
        <View style={styles.topNewsStat}>
          <Ionicons name="eye-outline" size={12} color="#1a237e" />
          <Text style={styles.topNewsStatText}>{item.views}</Text>
        </View>
        <View style={styles.topNewsStat}>
          <Ionicons name="heart-outline" size={12} color="#1a237e" />
          <Text style={styles.topNewsStatText}>{item.likesCount}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (isLoading && !refreshing) {
    console.log('⏳ [ReporterDashboard] Showing loading state');
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1a237e" />
        <Text style={styles.loadingText}>Loading Dashboard...</Text>
        <Text style={styles.loadingSubtext}>Checking authentication...</Text>
      </View>
    );
  }

  console.log('✅ [ReporterDashboard] Rendering dashboard UI');
  
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <LinearGradient
        colors={['#1a237e', '#283593']}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.reporterName}>{userName}</Text>
            <Text style={styles.serverInfo}>Server: {BASE_URL.replace('http://', '')}</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={() => {
                console.log('🔔 Notifications clicked');
                router.push('/(reporter)/notifications');
              }}
              disabled={isLoading}
            >
              <Ionicons name="notifications-outline" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.profileButton}
              onPress={() => {
                console.log('👤 Profile clicked');
                router.push('/(reporter)/profile');
              }}
              disabled={isLoading}
            >
              {userProfileImage ? (
                <Image
                  source={{ uri: userProfileImage }}
                  style={styles.profileImage}
                />
              ) : (
                <View style={styles.profilePlaceholder}>
                  <Ionicons name="person" size={20} color="#fff" />
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search your articles..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={(text) => {
              console.log('🔍 Search query changed:', text);
              setSearchQuery(text);
            }}
            editable={!isLoading}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity 
              onPress={() => {
                console.log('❌ Clear search clicked');
                setSearchQuery('');
              }}
              disabled={isLoading}
            >
              <Ionicons name="close-circle" size={18} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#1a237e']}
            tintColor="#1a237e"
          />
        }
      >
        {/* Debug Info */}
        <View style={styles.debugContainer}>
          <Text style={styles.debugText}>Debug Info:</Text>
          <Text style={styles.debugText}>• User: {userName}</Text>
          <Text style={styles.debugText}>• Articles: {latestNews.length}</Text>
          <Text style={styles.debugText}>• Loading: {isLoading ? 'Yes' : 'No'}</Text>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Ionicons name="document-text" size={24} color="#1a237e" />
              <Text style={styles.statValue}>{stats.totalNews}</Text>
              <Text style={styles.statLabel}>Total Articles</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="eye" size={24} color="#1a237e" />
              <Text style={styles.statValue}>
                {stats.totalViews > 1000 ? `${(stats.totalViews / 1000).toFixed(1)}k` : stats.totalViews}
              </Text>
              <Text style={styles.statLabel}>Total Views</Text>
            </View>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Ionicons name="heart" size={24} color="#1a237e" />
              <Text style={styles.statValue}>
                {stats.totalLikes > 1000 ? `${(stats.totalLikes / 1000).toFixed(1)}k` : stats.totalLikes}
              </Text>
              <Text style={styles.statLabel}>Total Likes</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="trending-up" size={24} color="#1a237e" />
              <Text style={styles.statValue}>{stats.engagementRate}%</Text>
              <Text style={styles.statLabel}>Engagement</Text>
            </View>
          </View>
        </View>

        {/* Popular Tags */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Popular Tags</Text>
            <TouchableOpacity disabled={isLoading}>
              <Text style={styles.seeAll}>View All</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={popularTags}
            renderItem={renderTagItem}
            keyExtractor={(item) => item}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tagsList}
          />
        </View>

        {/* Latest News */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Latest Articles</Text>
            <TouchableOpacity 
              onPress={() => {
                console.log('📄 View All articles clicked');
                router.push('/(reporter)/articles');
              }}
              disabled={isLoading}
            >
              <Text style={styles.seeAll}>View All</Text>
            </TouchableOpacity>
          </View>
          {latestNews.length > 0 ? (
            <FlatList
              data={latestNews.slice(0, 5)}
              renderItem={renderNewsItem}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.newsList}
            />
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="newspaper-outline" size={50} color="#ccc" />
              <Text style={styles.emptyStateText}>No articles yet</Text>
              <TouchableOpacity 
                style={styles.createFirstButton}
                onPress={() => {
                  console.log('➕ Create article clicked');
                  router.push('/(reporter)/create');
                }}
                disabled={isLoading}
              >
                <Text style={styles.createFirstButtonText}>Create Your First Article</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Top Performing News */}
        {topNews.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Top Performing</Text>
              <TouchableOpacity disabled={isLoading}>
                <Text style={styles.seeAll}>View All</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={topNews.slice(0, 5)}
              renderItem={renderTopNewsItem}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.topNewsList}
            />
          </View>
        )}

        {/* Recommendation Topics */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Suggested Topics</Text>
            <TouchableOpacity disabled={isLoading}>
              <Text style={styles.seeAll}>View All</Text>
            </TouchableOpacity>
          </View>
          {recommendationTopics.map((item) => (
            <TouchableOpacity 
              key={item.id} 
              style={styles.topicItem} 
              activeOpacity={0.7}
              disabled={isLoading}
              onPress={() => console.log('📌 Topic clicked:', item.title)}
            >
              <View style={styles.topicContent}>
                <Text style={styles.topicTitle}>{item.title}</Text>
                <Text style={styles.topicCount}>{item.count} articles</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => {
                console.log('📝 Create News clicked');
                router.push('/(reporter)/create');
              }}
              disabled={isLoading}
            >
              <LinearGradient
                colors={['#1a237e', '#283593']}
                style={styles.actionButtonGradient}
              >
                <Ionicons name="add-circle" size={28} color="#fff" />
                <Text style={styles.actionButtonText}>Create News</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => {
                console.log('📊 Analytics clicked');
                router.push('/(reporter)/analytics');
              }}
              disabled={isLoading}
            >
              <View style={styles.actionButtonContent}>
                <Ionicons name="analytics" size={28} color="#1a237e" />
                <Text style={[styles.actionButtonText, styles.actionButtonTextAlt]}>
                  Analytics
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogout}
          disabled={isLoading}
        >
          <Ionicons name="log-out-outline" size={20} color="#666" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#1a237e',
    fontSize: 18,
    fontWeight: '600',
  },
  loadingSubtext: {
    marginTop: 5,
    color: '#666',
    fontSize: 14,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '400',
  },
  reporterName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
  },
  serverInfo: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  profilePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    height: '100%',
  },
  debugContainer: {
    backgroundColor: 'rgba(26, 35, 126, 0.05)',
    borderRadius: 10,
    padding: 10,
    marginHorizontal: 20,
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(26, 35, 126, 0.1)',
  },
  debugText: {
    fontSize: 11,
    color: '#1a237e',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    lineHeight: 14,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  statsContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 15,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a237e',
    marginTop: 10,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  section: {
    marginTop: 25,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a237e',
  },
  seeAll: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  tagsList: {
    gap: 10,
    paddingRight: 20,
  },
  tagItem: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  tagItemSelected: {
    backgroundColor: '#1a237e',
    borderColor: '#1a237e',
  },
  tagText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  tagTextSelected: {
    color: '#fff',
  },
  newsList: {
    gap: 15,
    paddingRight: 20,
  },
  newsCard: {
    width: 280,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  newsImage: {
    width: '100%',
    height: 150,
  },
  newsImagePlaceholder: {
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  newsContent: {
    padding: 15,
    gap: 8,
  },
  newsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  newsSource: {
    fontSize: 12,
    color: '#1a237e',
    fontWeight: '600',
  },
  newsTime: {
    fontSize: 12,
    color: '#999',
  },
  newsTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    lineHeight: 20,
  },
  newsFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 5,
  },
  categoryBadge: {
    backgroundColor: 'rgba(26, 35, 126, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    color: '#1a237e',
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  statText: {
    fontSize: 11,
    color: '#666',
  },
  topNewsList: {
    gap: 10,
    paddingRight: 20,
  },
  topNewsCard: {
    width: 200,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  topNewsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    lineHeight: 18,
    marginBottom: 10,
  },
  topNewsStats: {
    flexDirection: 'row',
    gap: 15,
  },
  topNewsStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  topNewsStatText: {
    fontSize: 12,
    color: '#1a237e',
    fontWeight: '500',
  },
  topicItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  topicContent: {
    flex: 1,
    marginRight: 10,
  },
  topicTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  topicCount: {
    fontSize: 12,
    color: '#666',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
    marginBottom: 20,
  },
  createFirstButton: {
    backgroundColor: '#1a237e',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createFirstButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 15,
    marginTop: 10,
  },
  actionButton: {
    flex: 1,
    borderRadius: 15,
    overflow: 'hidden',
    height: 100,
  },
  actionButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  actionButtonContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  actionButtonText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
    marginTop: 8,
  },
  actionButtonTextAlt: {
    color: '#1a237e',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 20,
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    gap: 10,
  },
  logoutText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
});