// app/news/[id].tsx - News Detail Screen
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Platform,
  RefreshControl,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { width } = Dimensions.get('window');

// Make sure this matches your Home Screen URL
const BACKEND_URL = "http://localhost:5000";

// Types (same as home screen or import from shared types)
interface NewsItem {
  id: string;
  title: string;
  excerpt?: string;
  content: string;
  category: string;
  images: { url: string; caption: string }[];
  videoLink?: string;
  author: string;
  authorName: string;
  authorProfileImage?: string;
  location?: string;
  views: number;
  likes: string[];
  likesCount: number;
  commentsCount: number;
  isBreaking: boolean;
  isFeatured: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export default function NewsDetailScreen() {
  const { id } = useLocalSearchParams();
  const [newsData, setNewsData] = useState<NewsItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    loadUser();
    fetchNewsData();
  }, [id]);

  useEffect(() => {
    if (newsData && user) {
      fetchInitialData();
    }
  }, [newsData, user]);

  const loadUser = async () => {
    try {
      const userJson = await AsyncStorage.getItem('user');
      if (userJson) {
        const userData = JSON.parse(userJson);
        setUser(userData);
      }
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const fetchNewsData = async () => {
    try {
      setLoading(true);
      
      console.log(`Fetching news with ID: ${id}`);
      console.log(`Backend URL: ${BACKEND_URL}/api/news/${id}`);
      
      const response = await fetch(`${BACKEND_URL}/api/news/${id}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log("News API response:", result);
      
      if (result.success) {
        const data = result.news;
        setNewsData(data);
        setLikeCount(data.likesCount || 0);
      } else {
        throw new Error(result.message || "Failed to fetch news");
      }
      
    } catch (error: any) {
      console.error("Error fetching news:", error);
      Alert.alert('Error', `Failed to load news: ${error.message}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchInitialData = async () => {
    if (!newsData || !user) return;
    
    try {
      // Check if user liked this news
      if (newsData.likes && user.id) {
        setIsLiked(newsData.likes.some(likeId => likeId.toString() === user.id));
      }
      
      // Check bookmarks
      await checkIfBookmarked(newsData.id);
    } catch (error) {
      console.error('Error fetching initial data:', error);
    }
  };

  const checkIfBookmarked = async (newsId: string) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      const response = await fetch(`${BACKEND_URL}/api/user/favorites`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          const isFavorited = result.favorites?.some((fav: any) => fav.id === newsId);
          setIsBookmarked(isFavorited);
        }
      }
    } catch (error) {
      console.error('Error checking bookmarks:', error);
    }
  };

  const handleLike = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Login Required', 'Please login to like news');
        router.push('/(auth)/login');
        return;
      }

      const response = await fetch(`${BACKEND_URL}/api/news/${id}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setIsLiked(result.hasLiked);
          setLikeCount(result.likesCount);
        }
      }
    } catch (error) {
      console.error('Error liking news:', error);
      Alert.alert('Error', 'Failed to like news');
    }
  };

  const handleBookmark = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Login Required', 'Please login to save news');
        router.push('/(auth)/login');
        return;
      }

      const response = await fetch(`${BACKEND_URL}/api/news/${id}/favorite`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setIsBookmarked(result.isFavorited);
          Alert.alert(
            'Success',
            result.isFavorited ? 'Added to favorites' : 'Removed from favorites'
          );
        }
      }
    } catch (error) {
      console.error('Error bookmarking news:', error);
      Alert.alert('Error', 'Failed to save news');
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this news: ${newsData?.title}`,
        url: `${BACKEND_URL}/news/${id}`,
        title: newsData?.title,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleCommentPress = () => {
    if (!user) {
      Alert.alert('Login Required', 'Please login to comment on news');
      router.push('/(auth)/login');
      return;
    }
    
    router.push(`/news/${id}/comments`);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchNewsData();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1a237e" />
        <Text style={styles.loadingText}>Loading News...</Text>
      </View>
    );
  }

  if (!newsData) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="newspaper-outline" size={64} color="#ccc" />
        <Text style={styles.errorText}>News not found</Text>
        <TouchableOpacity 
          style={styles.backButtonSolid}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header Image with Gradient Overlay */}
      <View style={styles.headerImageContainer}>
        {newsData.images && newsData.images.length > 0 ? (
          <Image
            source={{ uri: newsData.images[0].url }}
            style={styles.headerImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.headerImagePlaceholder}>
            <Ionicons name="image-outline" size={48} color="#ccc" />
          </View>
        )}
        <LinearGradient
          colors={['rgba(0,0,0,0.7)', 'transparent']}
          style={styles.headerGradient}
        />
        
        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        
        {/* Bookmark Button */}
        <TouchableOpacity
          style={styles.bookmarkButton}
          onPress={handleBookmark}
        >
          <Ionicons
            name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
            size={24}
            color="#fff"
          />
        </TouchableOpacity>
      </View>

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
        {/* Source and Category */}
        <View style={styles.sourceContainer}>
          <Text style={styles.sourceText}>{newsData.authorName || 'NEWSWATCH'}</Text>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{newsData.category}</Text>
          </View>
          {newsData.isBreaking && (
            <View style={styles.breakingBadge}>
              <Text style={styles.breakingText}>BREAKING</Text>
            </View>
          )}
        </View>

        {/* Title */}
        <Text style={styles.title}>{newsData.title}</Text>

        {/* Author and Time */}
        <View style={styles.metaContainer}>
          <View style={styles.authorContainer}>
            <Ionicons name="person-circle-outline" size={20} color="#666" />
            <Text style={styles.authorText}>By {newsData.authorName}</Text>
          </View>
          <Text style={styles.timeText}>• {formatTime(newsData.createdAt)}</Text>
          {newsData.location && (
            <Text style={styles.locationText}>• {newsData.location}</Text>
          )}
        </View>

        {/* Tags */}
        {newsData.tags && newsData.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {newsData.tags.slice(0, 3).map((tag, index) => (
              <View key={index} style={styles.tagBadge}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Stats Bar */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Ionicons name="eye-outline" size={18} color="#666" />
            <Text style={styles.statText}>{newsData.views || 0} views</Text>
          </View>

          <TouchableOpacity style={styles.statItem} onPress={handleLike}>
            <Ionicons
              name={isLiked ? 'heart' : 'heart-outline'}
              size={18}
              color={isLiked ? '#FF3B30' : '#666'}
            />
            <Text style={[styles.statText, isLiked && styles.likedText]}>
              {likeCount} likes
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.statItem} onPress={handleCommentPress}>
            <Ionicons name="chatbubble-outline" size={18} color="#666" />
            <Text style={styles.statText}>{newsData.commentsCount || 0} comments</Text>
          </TouchableOpacity>
        </View>

        {/* Share Button */}
        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <Ionicons name="share-social-outline" size={20} color="#1a237e" />
          <Text style={styles.shareButtonText}>Share this news</Text>
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Content */}
        <Text style={styles.contentText}>{newsData.content}</Text>

        {/* Additional Images */}
        {newsData.images && newsData.images.length > 1 && (
          <View style={styles.additionalImages}>
            {newsData.images.slice(1).map((image, index) => (
              <View key={index} style={styles.imageContainer}>
                <Image
                  source={{ uri: image.url }}
                  style={styles.additionalImage}
                  resizeMode="cover"
                />
                {image.caption && (
                  <Text style={styles.imageCaption}>{image.caption}</Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Video Link */}
        {newsData.videoLink && (
          <View style={styles.videoContainer}>
            <TouchableOpacity 
              style={styles.videoButton}
              onPress={() => router.push({
                pathname: '/video',
                params: { url: newsData.videoLink }
              })}
            >
              <Ionicons name="play-circle" size={48} color="#1a237e" />
              <Text style={styles.videoText}>Watch Video</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity 
          style={styles.commentButton} 
          onPress={handleCommentPress}
        >
          <Ionicons name="chatbubble-outline" size={22} color="#666" />
          <Text style={styles.commentButtonText}>Comment</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.saveButton} onPress={handleBookmark}>
          <Ionicons
            name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
            size={22}
            color="#fff"
          />
          <Text style={styles.saveButtonText}>
            {isBookmarked ? 'Saved' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginTop: 12,
    marginBottom: 24,
  },
  backButtonSolid: {
    backgroundColor: '#1a237e',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  headerImageContainer: {
    height: 300,
    position: 'relative',
  },
  headerImage: {
    width: '100%',
    height: '100%',
  },
  headerImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 150,
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookmarkButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  sourceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 20,
    marginHorizontal: 20,
    marginBottom: 15,
    gap: 8,
  },
  sourceText: {
    fontSize: 14,
    color: '#1a237e',
    fontWeight: '600',
  },
  categoryBadge: {
    backgroundColor: 'rgba(26, 35, 126, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  categoryText: {
    fontSize: 12,
    color: '#1a237e',
    fontWeight: '600',
  },
  breakingBadge: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  breakingText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '700',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a237e',
    lineHeight: 32,
    marginHorizontal: 20,
    marginBottom: 15,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginHorizontal: 20,
    marginBottom: 15,
    gap: 8,
  },
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  authorText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  timeText: {
    fontSize: 14,
    color: '#999',
  },
  locationText: {
    fontSize: 14,
    color: '#999',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: 20,
    marginBottom: 20,
    gap: 8,
  },
  tagBadge: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  tagText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 20,
    marginBottom: 15,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  likedText: {
    color: '#FF3B30',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 12,
    backgroundColor: 'rgba(26, 35, 126, 0.1)',
    borderRadius: 12,
  },
  shareButtonText: {
    fontSize: 16,
    color: '#1a237e',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 20,
    marginBottom: 25,
  },
  contentText: {
    fontSize: 16,
    lineHeight: 26,
    color: '#333',
    marginHorizontal: 20,
    marginBottom: 30,
  },
  additionalImages: {
    marginHorizontal: 20,
    marginBottom: 30,
    gap: 16,
  },
  imageContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f8f9fa',
  },
  additionalImage: {
    width: '100%',
    height: 200,
  },
  imageCaption: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    padding: 12,
    backgroundColor: '#f8f9fa',
  },
  videoContainer: {
    marginHorizontal: 20,
    marginBottom: 30,
  },
  videoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 20,
    backgroundColor: 'rgba(26, 35, 126, 0.1)',
    borderRadius: 12,
  },
  videoText: {
    fontSize: 16,
    color: '#1a237e',
    fontWeight: '600',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingBottom: Platform.OS === 'ios' ? 30 : 15,
  },
  commentButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 25,
    paddingVertical: 12,
    marginRight: 10,
  },
  commentButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1a237e',
    borderRadius: 25,
    paddingVertical: 12,
  },
  saveButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
});