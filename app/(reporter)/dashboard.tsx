// app/(reporter)/dashboard.tsx - COMPATIBLE VERSION
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
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

const { width } = Dimensions.get('window');

// BACKEND CONFIGURATION
const BACKEND_URL = __DEV__ 
  ? Platform.select({
      ios: 'http://localhost:5000',
      android: 'http://10.0.2.2:5000',
      default: 'http://localhost:5000'
    })
  : 'https://your-production-backend.com';

console.log('📱 ReporterDashboard - Backend URL:', BACKEND_URL);

interface NewsItem {
  id: string;
  _id?: string;
  title: string;
  excerpt?: string;
  content: string;
  category: string;
  images: { url: string; caption?: string }[];
  authorName: string;
  location?: string;
  views: number;
  likesCount: number;
  commentsCount: number;
  isBreaking: boolean;
  isFeatured: boolean;
  tags?: string[];
  createdAt: string;
}

interface ReporterStats {
  totalNews: number;
  totalViews: number;
  totalLikes: number;
  engagementRate: number;
}

interface UserData {
  id: string;
  name: string;
  email: string;
  profileImage: string;
  role: string;
  isVerified: boolean;
}

// Utility function to normalize backend response
const normalizeNewsItem = (item: any): NewsItem => {
  if (item.id) return item;
  
  if (item._id) {
    return {
      ...item,
      id: item._id.toString()
    };
  }
  
  console.warn('⚠️ News item missing both id and _id:', item);
  return {
    ...item,
    id: `fallback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  };
};

export default function ReporterDashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<ReporterStats>({
    totalNews: 0,
    totalViews: 0,
    totalLikes: 0,
    engagementRate: 0
  });
  const [latestNews, setLatestNews] = useState<NewsItem[]>([]);
  const [popularTags, setPopularTags] = useState<string[]>([]);

  // Mock data for testing
  const mockTags = [
    '#BreakingNews',
    '#Politics',
    '#Technology',
    '#Sports',
    '#Business',
    '#Entertainment',
    '#Health',
    '#Science',
    '#WorldNews'
  ];

  useFocusEffect(
    useCallback(() => {
      loadUserData();
      fetchDashboardData();
    }, [])
  );

  const loadUserData = async () => {
    console.log('👤 Loading user data...');
    try {
      const token = await AsyncStorage.getItem('userToken');
      const userJson = await AsyncStorage.getItem('user');
      
      if (token && userJson) {
        const userData: UserData = JSON.parse(userJson);
        setUser(userData);
        
        // Verify user role
        if (userData.role !== 'reporter' && userData.role !== 'admin') {
          console.log('❌ User is not a reporter:', userData.role);
          Alert.alert(
            'Access Denied',
            'This dashboard is only for reporters. Please login with a reporter account.',
            [
              { 
                text: 'OK', 
                onPress: () => router.replace('/(tabs)') 
              }
            ]
          );
          return;
        }
      } else {
        console.log('❌ No user data found');
        Alert.alert(
          'Session Expired',
          'Please login again to continue.',
          [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
        );
      }
    } catch (error) {
      console.error('❌ Error loading user:', error);
    }
  };

  const fetchDashboardData = async () => {
    console.log('📡 Fetching dashboard data...');
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      
      if (!token) {
        console.log('❌ No token found');
        Alert.alert(
          'Session Expired',
          'Please login again to continue.',
          [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
        );
        return;
      }

      console.log('🔑 Token found, making requests...');

      // Fetch reporter stats
      console.log('📊 Fetching reporter stats...');
      const statsResponse = await fetch(`${BACKEND_URL}/api/reporter/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('📊 Stats response status:', statsResponse.status);
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        console.log('📊 Stats response:', statsData);
        
        if (statsData.success) {
          console.log('✅ Stats loaded successfully');
          setStats(statsData.stats);
        } else {
          console.log('❌ Stats API error:', statsData.message);
          // Use mock stats for testing
          setStats({
            totalNews: 12,
            totalViews: 2543,
            totalLikes: 156,
            engagementRate: 12.8
          });
        }
      } else {
        console.log('❌ Stats request failed:', statsResponse.status);
        // Use mock stats for testing
        setStats({
          totalNews: 12,
          totalViews: 2543,
          totalLikes: 156,
          engagementRate: 12.8
        });
      }

      // Fetch reporter's news
      console.log('📰 Fetching reporter news...');
      const newsResponse = await fetch(`${BACKEND_URL}/api/reporter/news`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('📰 News response status:', newsResponse.status);
      
      if (newsResponse.ok) {
        const newsData = await newsResponse.json();
        console.log('📰 News response:', newsData);
        
        if (newsData.success) {
          console.log('✅ News loaded successfully, count:', newsData.news?.length || 0);
          // Normalize the news items
          const normalizedNews = (newsData.news || []).map(normalizeNewsItem);
          setLatestNews(normalizedNews);
          
          // Extract popular tags from news
          const tags: string[] = [];
          normalizedNews.forEach(news => {
            if (news.tags && Array.isArray(news.tags)) {
              news.tags.forEach(tag => {
                if (!tags.includes(tag)) {
                  tags.push(tag);
                }
              });
            }
          });
          setPopularTags(tags.length > 0 ? tags.slice(0, 5) : mockTags);
        } else {
          console.log('❌ News API error:', newsData.message);
          setLatestNews([]);
          setPopularTags(mockTags);
        }
      } else {
        console.log('❌ News request failed:', newsResponse.status);
        setLatestNews([]);
        setPopularTags(mockTags);
      }

    } catch (error: any) {
      console.error('❌ Error fetching dashboard data:', error);
      
      if (error.message.includes('Network request failed')) {
        console.log('🌐 Network error detected, using mock data');
        // Fallback to mock data
        setStats({
          totalNews: 12,
          totalViews: 2543,
          totalLikes: 156,
          engagementRate: 12.8
        });
        setLatestNews([]);
        setPopularTags(mockTags);
        
        Alert.alert(
          'Network Error',
          'Unable to connect to server. Showing demo data.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', 'Failed to load dashboard data. Please try again.');
      }
    } finally {
      console.log('🏁 Finished loading dashboard data');
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(async () => {
    console.log('🔄 Refreshing dashboard...');
    setRefreshing(true);
    await fetchDashboardData();
  }, []);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              router.replace('/(auth)/login');
            } catch (error) {
              console.error('Error during logout:', error);
            }
          }
        },
      ]
    );
  };

  const renderTagItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={[
        styles.tagItem,
        selectedTag === item && styles.tagItemSelected,
      ]}
      onPress={() => setSelectedTag(item === selectedTag ? null : item)}
    >
      <Text style={[
        styles.tagText,
        selectedTag === item && styles.tagTextSelected,
      ]}>
        {item}
      </Text>
    </TouchableOpacity>
  );

  const renderNewsItem = ({ item }: { item: NewsItem }) => {
    // Get category color
    const getCategoryColor = (category: string): string => {
      const colorMap: Record<string, string> = {
        'Politics': '#FF3B30',
        'Technology': '#34C759',
        'Sports': '#FF9500',
        'Business': '#AF52DE',
        'Entertainment': '#FF2D55',
        'Health': '#32D74B',
      };
      return colorMap[category] || '#1a237e';
    };

    return (
      <TouchableOpacity
        style={styles.newsCard}
        onPress={() => router.push(`/news/${item.id}`)}
      >
        {item.images && item.images.length > 0 ? (
          <Image
            source={{ uri: item.images[0].url }}
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
            <View style={[
              styles.categoryBadge,
              { backgroundColor: getCategoryColor(item.category) + '20' }
            ]}>
              <Text style={[
                styles.categoryText,
                { color: getCategoryColor(item.category) }
              ]}>
                {item.category}
              </Text>
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
  };

  if (isLoading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1a237e" />
        <Text style={styles.loadingText}>Loading Dashboard...</Text>
        <Text style={styles.serverInfo}>
          Server: {BACKEND_URL.replace('http://', '')}
        </Text>
      </View>
    );
  }

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
            <Text style={styles.greeting}>
              {user ? `Welcome back, ${user.name}` : 'Welcome, Reporter'}
            </Text>
            <Text style={styles.reporterName}>Reporter Dashboard</Text>
            <Text style={styles.serverInfo}>
              Server: {BACKEND_URL.replace('http://', '')}
            </Text>
          </View>
          
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={() => router.push('/(reporter)/notifications')}
            >
              <Ionicons name="notifications-outline" size={24} color="#fff" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.profileButton}
              onPress={() => router.push('/(reporter)/profile')}
            >
              {user?.profileImage ? (
                <Image
                  source={{ uri: user.profileImage }}
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
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
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
        {/* Stats Cards */}
        <View style={styles.statsSection}>
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
              <Text style={styles.statLabel}>Engagement Rate</Text>
            </View>
          </View>
        </View>

        {/* Popular Tags */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Popular Tags</Text>
            <TouchableOpacity>
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
            <TouchableOpacity onPress={() => router.push('/(reporter)/articles')}>
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
                onPress={() => router.push('/(reporter)/create')}
              >
                <Text style={styles.createFirstButtonText}>Create Your First Article</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <View style={styles.actionsGrid}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/(reporter)/create')}
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
              onPress={() => router.push('/(reporter)/analytics')}
            >
              <View style={styles.actionButtonContent}>
                <Ionicons name="analytics" size={28} color="#1a237e" />
                <Text style={[styles.actionButtonText, styles.actionButtonTextAlt]}>
                  Analytics
                </Text>
              </View>
            </TouchableOpacity>
          </View>
          
          <View style={styles.actionsGrid}>
            <TouchableOpacity 
              style={styles.secondaryActionButton}
              onPress={() => router.push('/(reporter)/drafts')}
            >
              <Ionicons name="document-outline" size={22} color="#1a237e" />
              <Text style={styles.secondaryActionText}>Drafts</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.secondaryActionButton}
              onPress={() => router.push('/(reporter)/scheduled')}
            >
              <Ionicons name="time-outline" size={22} color="#1a237e" />
              <Text style={styles.secondaryActionText}>Scheduled</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.activityList}>
            <View style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <Ionicons name="checkmark-circle" size={16} color="#34C759" />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityText}>
                  Article "{latestNews[0]?.title || 'New Technology Trends'}" published
                </Text>
                <Text style={styles.activityTime}>2 hours ago</Text>
              </View>
            </View>
            
            <View style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <Ionicons name="heart" size={16} color="#FF3B30" />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityText}>
                  Your article received 42 likes
                </Text>
                <Text style={styles.activityTime}>5 hours ago</Text>
              </View>
            </View>
            
            <View style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <Ionicons name="chatbubble" size={16} color="#1a237e" />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityText}>
                  8 new comments on your latest article
                </Text>
                <Text style={styles.activityTime}>Yesterday</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color="#666" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
        
        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
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
  serverInfo: {
    fontSize: 10,
    color: '#666',
    marginTop: 5,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
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
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  statsSection: {
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
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
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
    marginBottom: 15,
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
  secondaryActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    gap: 10,
  },
  secondaryActionText: {
    fontSize: 14,
    color: '#1a237e',
    fontWeight: '600',
  },
  activityList: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  activityIcon: {
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
    color: '#999',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 25,
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
  bottomSpacing: {
    height: 20,
  },
});