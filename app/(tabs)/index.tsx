// app/(tabs)/index.tsx - PROFESSIONAL VERSION
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Image,
  Platform,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

const { width, height } = Dimensions.get('window');

// Replace with your actual backend URL - IMPORTANT: Use your local IP for development
// For Android emulator: 'http://10.0.2.2:5000'
// For iOS simulator: 'http://localhost:5000'
// For physical device: 'http://YOUR_LOCAL_IP:5000'
const BACKEND_URL = "http://localhost:5000"; // Change this to your actual backend URL

interface NewsItem {
  id: string;
  title: string;
  excerpt?: string;
  content: string;
  category: string;
  images: { url: string; caption: string }[];
  authorName: string;
  author?: { name: string; profileImage: string };
  location?: string;
  views: number;
  likesCount: number;
  commentsCount: number;
  isBreaking: boolean;
  isFeatured: boolean;
  createdAt: string;
}

interface Category {
  id: string;
  name: string;
  slug?: string;
  icon?: string;
  color?: string;
}

interface UserData {
  id: string;
  name: string;
  email: string;
  profileImage: string;
  location?: string;
  role: string;
  isVerified: boolean;
}

export default function HomeScreen() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [breakingNews, setBreakingNews] = useState<NewsItem[]>([]);
  const [featuredNews, setFeaturedNews] = useState<NewsItem[]>([]);
  const [latestNews, setLatestNews] = useState<NewsItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [user, setUser] = useState<UserData | null>(null);
  const [showSearchBar, setShowSearchBar] = useState(false);
  
  // Animation values
  const scrollY = useRef(new Animated.Value(0)).current;
  const searchBarOpacity = useRef(new Animated.Value(0)).current;

  const headerHeight = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [280, 120],
    extrapolate: 'clamp',
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [1, 0.9],
    extrapolate: 'clamp',
  });

  useEffect(() => {
    loadUserData();
    fetchInitialData();
  }, []);

  const loadUserData = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const userJson = await AsyncStorage.getItem('user');
      
      if (token && userJson) {
        const userData: UserData = JSON.parse(userJson);
        setUser(userData);
        
        // Fetch fresh user data
        const response = await fetch(`${BACKEND_URL}/api/user/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setUser(data.user);
            await AsyncStorage.setItem('user', JSON.stringify(data.user));
          }
        }
      }
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchBreakingNews(),
        fetchFeaturedNews(),
        fetchLatestNews(),
        fetchCategories(),
      ]);
    } catch (error) {
      console.error('Error fetching initial data:', error);
      showErrorAlert('Failed to load content. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const fetchBreakingNews = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/news/breaking`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setBreakingNews(data.news || []);
        }
      }
    } catch (error) {
      console.error('Error fetching breaking news:', error);
    }
  };

  const fetchFeaturedNews = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/news/featured`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setFeaturedNews(data.news || []);
        }
      }
    } catch (error) {
      console.error('Error fetching featured news:', error);
    }
  };

  const fetchLatestNews = async (category?: string) => {
    try {
      const url = category && category !== 'all' 
        ? `${BACKEND_URL}/api/categories/${category}/news?limit=10`
        : `${BACKEND_URL}/api/news?limit=10`;
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setLatestNews(data.news || []);
        }
      }
    } catch (error) {
      console.error('Error fetching latest news:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/categories`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const backendCategories = data.categories.map((cat: any) => ({
            id: cat.id,
            name: cat.name,
            slug: cat.slug,
            icon: getCategoryIcon(cat.name),
            color: getCategoryColor(cat.name),
          }));
          
          // Add "All" category
          setCategories([
            { id: 'all', name: 'All', icon: 'apps', color: '#1a237e' },
            ...backendCategories,
          ]);
        }
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      // Fallback categories
      setCategories([
        { id: 'all', name: 'All', icon: 'apps', color: '#1a237e' },
        { id: 'politics', name: 'Politics', icon: 'megaphone', color: '#FF3B30' },
        { id: 'technology', name: 'Technology', icon: 'hardware-chip', color: '#34C759' },
        { id: 'sports', name: 'Sports', icon: 'football', color: '#FF9500' },
        { id: 'business', name: 'Business', icon: 'business', color: '#AF52DE' },
        { id: 'entertainment', name: 'Entertainment', icon: 'film', color: '#FF2D55' },
        { id: 'health', name: 'Health', icon: 'medkit', color: '#32D74B' },
      ]);
    }
  };

  const getCategoryIcon = (categoryName: string): string => {
    const iconMap: Record<string, string> = {
      'Politics': 'megaphone',
      'Technology': 'hardware-chip',
      'Sports': 'football',
      'Business': 'business',
      'Entertainment': 'film',
      'Health': 'medkit',
      'Science': 'flask',
      'Environment': 'leaf',
      'Education': 'school',
      'World': 'globe',
      'Local': 'location',
    };
    return iconMap[categoryName] || 'newspaper';
  };

  const getCategoryColor = (categoryName: string): string => {
    const colorMap: Record<string, string> = {
      'Politics': '#FF3B30',
      'Technology': '#34C759',
      'Sports': '#FF9500',
      'Business': '#AF52DE',
      'Entertainment': '#FF2D55',
      'Health': '#32D74B',
      'Science': '#5AC8FA',
      'Environment': '#66D4CF',
      'Education': '#FFD60A',
      'World': '#1a237e',
      'Local': '#FF9F0A',
    };
    return colorMap[categoryName] || '#1a237e';
  };

  const searchNews = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      setLoading(true);
      const response = await fetch(
        `${BACKEND_URL}/api/search?q=${encodeURIComponent(searchQuery)}&limit=20`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setLatestNews(data.news || []);
        }
      }
    } catch (error) {
      console.error('Error searching news:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySelect = useCallback((categoryId: string) => {
    setSelectedCategory(categoryId);
    setLoading(true);
    fetchLatestNews(categoryId === 'all' ? undefined : categoryId);
    setTimeout(() => setLoading(false), 300);
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchInitialData();
    setRefreshing(false);
  }, []);

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const navigateToNewsDetail = (newsId: string) => {
    router.push(`/news/${newsId}`);
  };

  const navigateToProfile = () => {
    if (user) {
      router.push('/(tabs)/profile');
    } else {
      router.push('/(auth)/login');
    }
  };

  const toggleSearchBar = () => {
    Animated.timing(searchBarOpacity, {
      toValue: showSearchBar ? 0 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
    setShowSearchBar(!showSearchBar);
  };

  const showErrorAlert = (message: string) => {
    Alert.alert(
      'Error',
      message,
      [{ text: 'OK', style: 'default' }]
    );
  };

  const renderBreakingNewsItem = ({ item, index }: { item: NewsItem; index: number }) => (
    <TouchableOpacity
      style={styles.breakingNewsCard}
      onPress={() => navigateToNewsDetail(item.id)}
      activeOpacity={0.9}
    >
      <Image
        source={{ 
          uri: item.images?.[0]?.url || `https://picsum.photos/seed/${item.id}/400/300`
        }}
        style={styles.breakingNewsImage}
        resizeMode="cover"
      />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.8)']}
        style={styles.breakingNewsGradient}
      >
        <View style={styles.breakingNewsContent}>
          <View style={styles.breakingNewsBadge}>
            <Ionicons name="flash" size={12} color="#FFD700" />
            <Text style={styles.breakingNewsBadgeText}>BREAKING</Text>
          </View>
          <Text style={styles.breakingNewsTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <View style={styles.breakingNewsMeta}>
            <Text style={styles.breakingNewsSource}>{item.authorName}</Text>
            <Text style={styles.breakingNewsTime}>{formatTime(item.createdAt)}</Text>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderFeaturedNewsItem = ({ item }: { item: NewsItem }) => (
    <TouchableOpacity
      style={styles.featuredNewsCard}
      onPress={() => navigateToNewsDetail(item.id)}
      activeOpacity={0.9}
    >
      <Image
        source={{ uri: item.images?.[0]?.url || `https://picsum.photos/seed/${item.id}/300/200` }}
        style={styles.featuredNewsImage}
        resizeMode="cover"
      />
      <View style={styles.featuredNewsContent}>
        <View style={styles.featuredNewsHeader}>
          <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(item.category) }]}>
            <Text style={styles.categoryBadgeText}>{item.category}</Text>
          </View>
          <View style={styles.featuredBadge}>
            <Ionicons name="star" size={10} color="#FFD700" />
            <Text style={styles.featuredBadgeText}>Featured</Text>
          </View>
        </View>
        <Text style={styles.featuredNewsTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <View style={styles.featuredNewsMeta}>
          <Text style={styles.featuredNewsSource}>{item.authorName}</Text>
          <Text style={styles.featuredNewsTime}>{formatTime(item.createdAt)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderLatestNewsItem = ({ item }: { item: NewsItem }) => (
    <TouchableOpacity
      style={styles.latestNewsCard}
      onPress={() => navigateToNewsDetail(item.id)}
      activeOpacity={0.9}
    >
      <Image
        source={{ uri: item.images?.[0]?.url || `https://picsum.photos/seed/${item.id}/200/150` }}
        style={styles.latestNewsImage}
        resizeMode="cover"
      />
      <View style={styles.latestNewsContent}>
        <Text style={styles.latestNewsTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.latestNewsExcerpt} numberOfLines={2}>
          {item.excerpt || item.content.substring(0, 100) + '...'}
        </Text>
        <View style={styles.latestNewsMeta}>
          <View style={[styles.latestCategoryBadge, { backgroundColor: getCategoryColor(item.category) + '20' }]}>
            <Text style={[styles.latestCategoryText, { color: getCategoryColor(item.category) }]}>
              {item.category}
            </Text>
          </View>
          <View style={styles.latestNewsStats}>
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

  const renderCategoryItem = ({ item }: { item: Category }) => (
    <TouchableOpacity
      style={[
        styles.categoryItem,
        selectedCategory === item.id && [
          styles.categoryItemActive,
          { backgroundColor: item.color + '20', borderColor: item.color }
        ],
      ]}
      onPress={() => handleCategorySelect(item.id)}
    >
      <View style={[
        styles.categoryIcon,
        selectedCategory === item.id && { backgroundColor: item.color }
      ]}>
        <Ionicons
          name={item.icon as any}
          size={18}
          color={selectedCategory === item.id ? '#fff' : '#666'}
        />
      </View>
      <Text style={[
        styles.categoryName,
        selectedCategory === item.id && { color: item.color, fontWeight: '600' }
      ]}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1a237e" />
        <Text style={styles.loadingText}>Loading NewsWatch...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a237e" />
      
      {/* Animated Header */}
      <Animated.View style={[styles.header, { height: headerHeight, opacity: headerOpacity }]}>
        <LinearGradient
          colors={['#1a237e', '#283593', '#3949ab']}
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Top Bar */}
          <View style={styles.topBar}>
            <View>
              <Text style={styles.greeting}>
                {user ? `Welcome back, ${user.name.split(' ')[0]}` : 'Welcome to'}
              </Text>
              <Text style={styles.appName}>NewsWatch</Text>
            </View>
            
            <View style={styles.headerActions}>
              <TouchableOpacity 
                style={styles.searchButton}
                onPress={toggleSearchBar}
              >
                <Ionicons name="search" size={22} color="#fff" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.profileButton}
                onPress={navigateToProfile}
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

          {/* Animated Search Bar */}
          <Animated.View 
            style={[
              styles.animatedSearchBar,
              {
                opacity: searchBarOpacity,
                transform: [{
                  translateY: searchBarOpacity.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-20, 0],
                  }),
                }],
              },
            ]}
          >
            <BlurView intensity={90} tint="dark" style={styles.searchBarBlur}>
              <Ionicons name="search" size={20} color="#fff" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search news, topics, or sources..."
                placeholderTextColor="rgba(255,255,255,0.7)"
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={searchNews}
                returnKeyType="search"
                autoFocus={true}
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color="rgba(255,255,255,0.7)" />
                </TouchableOpacity>
              ) : null}
            </BlurView>
          </Animated.View>

          {/* Location */}
          <TouchableOpacity 
            style={styles.locationButton}
            onPress={() => router.push('/locations')}
          >
            <Ionicons name="location" size={16} color="#fff" />
            <Text style={styles.locationText}>
              {user?.location || 'Set your location'}
            </Text>
            <Ionicons name="chevron-forward" size={14} color="#fff" />
          </TouchableOpacity>
        </LinearGradient>
      </Animated.View>

      {/* Main Content */}
      <Animated.ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#1a237e']}
            tintColor="#1a237e"
            progressBackgroundColor="#fff"
          />
        }
      >
        <View style={styles.contentWrapper}>
          {/* Breaking News */}
          {breakingNews.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleContainer}>
                  <View style={styles.sectionIcon}>
                    <Ionicons name="flash" size={20} color="#FF3B30" />
                  </View>
                  <Text style={styles.sectionTitle}>Breaking News</Text>
                </View>
                <TouchableOpacity 
                  style={styles.seeAllButton}
                  onPress={() => router.push('/news/breaking')}
                >
                  <Text style={styles.seeAllText}>See All</Text>
                  <Ionicons name="arrow-forward" size={16} color="#1a237e" />
                </TouchableOpacity>
              </View>
              
              <FlatList
                data={breakingNews}
                renderItem={renderBreakingNewsItem}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.breakingNewsList}
                snapToInterval={width * 0.85 + 15}
                decelerationRate="fast"
              />
            </View>
          )}

          {/* Categories */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <View style={styles.sectionIcon}>
                  <Ionicons name="apps" size={20} color="#1a237e" />
                </View>
                <Text style={styles.sectionTitle}>Categories</Text>
              </View>
            </View>
            
            <FlatList
              data={categories}
              renderItem={renderCategoryItem}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesList}
              scrollEnabled={categories.length > 5}
            />
          </View>

          {/* Featured News */}
          {featuredNews.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleContainer}>
                  <View style={styles.sectionIcon}>
                    <Ionicons name="star" size={20} color="#FF9500" />
                  </View>
                  <Text style={styles.sectionTitle}>Featured Stories</Text>
                </View>
                <TouchableOpacity 
                  style={styles.seeAllButton}
                  onPress={() => router.push('/news/featured')}
                >
                  <Text style={styles.seeAllText}>See All</Text>
                  <Ionicons name="arrow-forward" size={16} color="#1a237e" />
                </TouchableOpacity>
              </View>
              
              <FlatList
                data={featuredNews.slice(0, 3)}
                renderItem={renderFeaturedNewsItem}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.featuredNewsList}
              />
            </View>
          )}

          {/* Latest News */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <View style={styles.sectionIcon}>
                  <Ionicons name="time" size={20} color="#1a237e" />
                </View>
                <Text style={styles.sectionTitle}>Latest News</Text>
              </View>
              <TouchableOpacity 
                style={styles.seeAllButton}
                onPress={() => router.push('/news')}
              >
                <Text style={styles.seeAllText}>See All</Text>
                <Ionicons name="arrow-forward" size={16} color="#1a237e" />
              </TouchableOpacity>
            </View>
            
            {latestNews.length > 0 ? (
              latestNews.map((item, index) => (
                <React.Fragment key={item.id}>
                  {renderLatestNewsItem({ item })}
                  {index < latestNews.length - 1 && <View style={styles.divider} />}
                </React.Fragment>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="newspaper-outline" size={60} color="#ddd" />
                <Text style={styles.emptyStateText}>
                  {searchQuery ? 'No news found for your search' : 'No news available'}
                </Text>
                {searchQuery && (
                  <TouchableOpacity 
                    style={styles.clearSearchButton}
                    onPress={() => {
                      setSearchQuery('');
                      fetchLatestNews();
                    }}
                  >
                    <Text style={styles.clearSearchText}>Clear Search</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          {/* Bottom Spacing */}
          <View style={styles.bottomSpacing} />
        </View>
      </Animated.ScrollView>
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
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    overflow: 'hidden',
  },
  headerGradient: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  topBar: {
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
  appName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  profilePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  animatedSearchBar: {
    marginBottom: 15,
  },
  searchBarBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 50,
    overflow: 'hidden',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
    height: '100%',
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignSelf: 'flex-start',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  locationText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    marginTop: Platform.OS === 'ios' ? 50 : 40,
  },
  contentWrapper: {
    paddingTop: 200, // Matches initial header height
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f2ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a237e',
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeAllText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  breakingNewsList: {
    gap: 15,
    paddingRight: 20,
  },
  breakingNewsCard: {
    width: width * 0.85,
    height: 220,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  breakingNewsImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#e0e0e0',
  },
  breakingNewsGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '70%',
    justifyContent: 'flex-end',
    padding: 20,
  },
  breakingNewsContent: {
    gap: 8,
  },
  breakingNewsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 59, 48, 0.9)',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  breakingNewsBadgeText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  breakingNewsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    lineHeight: 24,
  },
  breakingNewsMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breakingNewsSource: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  breakingNewsTime: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
  },
  categoriesList: {
    gap: 12,
    paddingRight: 20,
  },
  categoryItem: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#e8eaed',
    backgroundColor: '#fff',
    minWidth: 100,
    gap: 8,
  },
  categoryItemActive: {
    borderWidth: 1.5,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryName: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  featuredNewsList: {
    gap: 15,
    paddingRight: 20,
  },
  featuredNewsCard: {
    width: 280,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  featuredNewsImage: {
    width: '100%',
    height: 160,
    backgroundColor: '#e0e0e0',
  },
  featuredNewsContent: {
    padding: 15,
    gap: 10,
  },
  featuredNewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryBadgeText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  featuredBadgeText: {
    fontSize: 11,
    color: '#FF9500',
    fontWeight: '600',
  },
  featuredNewsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a237e',
    lineHeight: 22,
  },
  featuredNewsMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  featuredNewsSource: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  featuredNewsTime: {
    fontSize: 13,
    color: '#999',
  },
  latestNewsCard: {
    flexDirection: 'row',
    gap: 15,
  },
  latestNewsImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: '#e0e0e0',
  },
  latestNewsContent: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  latestNewsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a237e',
    lineHeight: 22,
    marginBottom: 4,
  },
  latestNewsExcerpt: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  latestNewsMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  latestCategoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  latestCategoryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  latestNewsStats: {
    flexDirection: 'row',
    gap: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: '#666',
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
    textAlign: 'center',
  },
  clearSearchButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#1a237e',
    borderRadius: 10,
  },
  clearSearchText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  bottomSpacing: {
    height: 80,
  },
});