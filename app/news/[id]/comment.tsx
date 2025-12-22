// app/news/[id]/comments.tsx - COMPLETE FIXED VERSION
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Platform,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// ⚠️ IMPORTANT: Change this to match your backend URL
const BACKEND_URL = Platform.select({
  ios: 'http://localhost:5000',
  android: 'http://10.0.2.2:5000',
  default: 'http://localhost:5000'
});

// Types
interface User {
  id: string;
  name: string;
  email: string;
  profileImage?: string;
  role: string;
  isVerified: boolean;
}

interface Comment {
  id: string;
  content: string;
  user: {
    id: string;
    name: string;
    profileImage: string;
    email?: string;
  };
  userName: string;
  userImage: string;
  createdAt: string;
  updatedAt?: string;
}

interface NewsData {
  id: string;
  title: string;
  commentsCount: number;
}

// Debug mode
const DEBUG = true;
const debugLog = (message: string, data?: any) => {
  if (DEBUG) {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    console.log(`🕐 ${timestamp} ${message}`, data || '');
  }
};

export default function CommentsScreen() {
  const { id } = useLocalSearchParams();
  const newsId = Array.isArray(id) ? id[0] : id || '';
  
  const [news, setNews] = useState<NewsData | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [inputHeight, setInputHeight] = useState(40);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  
  const flatListRef = useRef<FlatList>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      debugLog('💬 Comments screen focused');
      loadUser();
      fetchNewsData();
      fetchComments();
      
      // Fade in animation
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
      
      return () => {
        fadeAnim.setValue(0);
      };
    }, [newsId])
  );

  const loadUser = async () => {
    try {
      debugLog('👤 Loading user from AsyncStorage...');
      
      // Try to get user from all possible keys
      const userDataJson = await AsyncStorage.getItem('userData');
      
      if (userDataJson) {
        const userData = JSON.parse(userDataJson);
        debugLog('✅ User loaded:', {
          id: userData.id,
          name: userData.name,
          email: userData.email,
          role: userData.role
        });
        
        // Ensure user has proper id field
        if (userData._id && !userData.id) {
          userData.id = userData._id.toString();
        }
        
        setUser(userData);
      } else {
        debugLog('❌ No user data found in AsyncStorage');
        
        // Check for token
        const token = await AsyncStorage.getItem('userToken');
        debugLog('🔐 Token exists:', !!token);
        
        if (!token) {
          debugLog('⚠️ No token found - user not logged in');
        }
      }
    } catch (error) {
      debugLog('❌ Error loading user:', error);
    }
  };

  const fetchNewsData = async () => {
    try {
      debugLog(`📰 Fetching news data for ID: ${newsId}`);
      
      const response = await fetch(`${BACKEND_URL}/api/news/${newsId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch news: ${response.status}`);
      }
      
      const result = await response.json();
      debugLog('📰 News response:', result);
      
      if (result.success) {
        setNews({
          id: result.news.id,
          title: result.news.title,
          commentsCount: result.news.commentsCount || 0
        });
      }
    } catch (error) {
      debugLog('❌ Error fetching news:', error);
    }
  };

  const fetchComments = async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
        setPage(1);
      } else {
        setLoading(true);
      }
      
      debugLog(`💬 Fetching comments for news: ${newsId}`);
      
      const response = await fetch(`${BACKEND_URL}/api/news/${newsId}/comments`);
      
      debugLog('📡 Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        debugLog('❌ Response error text:', errorText);
        throw new Error(`Server returned ${response.status}`);
      }
      
      const result = await response.json();
      debugLog('💬 Comments response:', {
        success: result.success,
        count: result.comments?.length,
        hasComments: !!result.comments
      });
      
      if (result.success) {
        // Transform comments to ensure consistent data structure
        const transformedComments = result.comments.map((comment: any) => ({
          id: comment.id || comment._id,
          content: comment.content,
          user: {
            id: comment.user?.id || comment.user?._id,
            name: comment.user?.name || comment.userName,
            profileImage: comment.user?.profileImage || comment.userImage || 'https://via.placeholder.com/150',
            email: comment.user?.email
          },
          userName: comment.user?.name || comment.userName,
          userImage: comment.user?.profileImage || comment.userImage || 'https://via.placeholder.com/150',
          createdAt: comment.createdAt,
          updatedAt: comment.updatedAt
        }));
        
        setComments(transformedComments);
        setHasMore(transformedComments.length >= 20);
      } else {
        Alert.alert('Error', result.message || 'Failed to load comments');
        setComments([]);
      }
    } catch (error: any) {
      debugLog('❌ Error fetching comments:', {
        message: error.message,
        stack: error.stack
      });
      
      if (error.message.includes('Network request failed')) {
        Alert.alert(
          'Network Error',
          'Please check your internet connection and try again.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', `Failed to load comments: ${error.message}`);
      }
      
      setComments([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadMoreComments = async () => {
    if (!hasMore || loading || refreshing) return;
    
    try {
      const nextPage = page + 1;
      debugLog(`📖 Loading more comments, page: ${nextPage}`);
      
      const response = await fetch(
        `${BACKEND_URL}/api/news/${newsId}/comments?page=${nextPage}`
      );
      
      if (!response.ok) return;
      
      const result = await response.json();
      
      if (result.success && result.comments?.length > 0) {
        const newComments = result.comments.map((comment: any) => ({
          id: comment.id || comment._id,
          content: comment.content,
          user: {
            id: comment.user?.id || comment.user?._id,
            name: comment.user?.name || comment.userName,
            profileImage: comment.user?.profileImage || comment.userImage || 'https://via.placeholder.com/150',
            email: comment.user?.email
          },
          userName: comment.user?.name || comment.userName,
          userImage: comment.user?.profileImage || comment.userImage || 'https://via.placeholder.com/150',
          createdAt: comment.createdAt,
          updatedAt: comment.updatedAt
        }));
        
        setComments(prev => [...prev, ...newComments]);
        setPage(nextPage);
        setHasMore(newComments.length >= 20);
      }
    } catch (error) {
      debugLog('❌ Error loading more comments:', error);
    }
  };

  const onRefresh = () => {
    debugLog('🔄 Refreshing comments...');
    fetchComments(true);
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim()) {
      Alert.alert('Error', 'Please enter a comment');
      return;
    }

    debugLog('📝 Submitting comment:', {
      content: newComment,
      newsId: newsId,
      userLoggedIn: !!user
    });

    if (!user) {
      Alert.alert(
        'Login Required',
        'Please login to comment on news',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Login', 
            style: 'default',
            onPress: () => router.push('/(auth)/login')
          }
        ]
      );
      return;
    }

    await submitComment();
  };

  const submitComment = async () => {
    try {
      setSubmitting(true);
      
      const token = await AsyncStorage.getItem('userToken');
      debugLog('🔐 Token check:', token ? 'Token found' : 'No token');
      
      if (!token) {
        Alert.alert('Session Expired', 'Please login again', [
          { text: 'OK', onPress: () => router.push('/(auth)/login') }
        ]);
        return;
      }

      const requestBody = {
        content: newComment.trim()
      };

      debugLog('📤 Sending comment request:', {
        url: `${BACKEND_URL}/api/news/${newsId}/comments`,
        body: requestBody,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const response = await fetch(`${BACKEND_URL}/api/news/${newsId}/comments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      debugLog('📥 Response status:', response.status);
      
      // Get response text for debugging
      const responseText = await response.text();
      debugLog('📥 Raw response:', responseText);
      
      let result;
      try {
        result = JSON.parse(responseText);
        debugLog('📥 Parsed response:', result);
      } catch (parseError) {
        debugLog('❌ Failed to parse JSON:', parseError);
        throw new Error('Invalid server response');
      }

      if (!response.ok) {
        debugLog('❌ Server error:', result);
        
        if (response.status === 401) {
          Alert.alert('Session Expired', 'Your session has expired. Please login again.', [
            { text: 'OK', onPress: () => router.push('/(auth)/login') }
          ]);
          return;
        }
        
        Alert.alert('Error', result.message || 'Failed to post comment');
        return;
      }

      if (result.success) {
        debugLog('✅ Comment posted successfully:', result.comment);
        
        // Clear input
        setNewComment('');
        setInputHeight(40);
        
        // Refresh comments
        await fetchComments();
        
        // Scroll to top
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
        
        // Show success with haptic feedback
        if (Platform.OS === 'ios') {
          const { notificationAsync, NotificationFeedbackType } = require('expo-haptics');
          notificationAsync(NotificationFeedbackType.Success);
        }
        
        // Update news comments count
        if (news && result.news) {
          setNews(prev => prev ? { ...prev, commentsCount: result.news.commentsCount } : prev);
        }
        
        // Show success message
        Alert.alert('Success', 'Comment posted successfully!');
      } else {
        Alert.alert('Error', result.message || 'Failed to post comment');
      }
    } catch (error: any) {
      debugLog('❌ Error posting comment:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      
      if (error.message.includes('Network request failed')) {
        Alert.alert('Network Error', 'Please check your internet connection');
      } else {
        Alert.alert('Error', `Failed to post comment: ${error.message}`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
      
      if (diffInSeconds < 60) return 'Just now';
      if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
      if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
      if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
      
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    } catch (error) {
      return 'Recently';
    }
  };

  const handleInputSizeChange = (event: any) => {
    setInputHeight(Math.min(120, Math.max(40, event.nativeEvent.contentSize.height)));
  };

  const renderComment = ({ item, index }: { item: Comment; index: number }) => (
    <Animated.View 
      style={[
        styles.commentItem,
        { 
          opacity: fadeAnim,
          transform: [{
            translateY: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [50, 0]
            })
          }]
        }
      ]}
    >
      <Image
        source={{ 
          uri: item.user?.profileImage || item.userImage || 'https://via.placeholder.com/150' 
        }}
        style={styles.commentAvatar}
        defaultSource={{ uri: 'https://via.placeholder.com/150' }}
        onError={() => console.log('Failed to load avatar')}
      />
      <View style={styles.commentContent}>
        <View style={styles.commentHeader}>
          <Text style={styles.commentAuthor}>
            {item.user?.name || item.userName || 'Anonymous'}
          </Text>
          <Text style={styles.commentTime}>{formatTime(item.createdAt)}</Text>
        </View>
        <Text style={styles.commentText}>{item.content}</Text>
      </View>
    </Animated.View>
  );

  const renderEmptyComments = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="chatbubble-outline" size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>No comments yet</Text>
      <Text style={styles.emptyText}>
        {user 
          ? 'Be the first to share your thoughts!'
          : 'Login to be the first to comment'
        }
      </Text>
      {!user && (
        <TouchableOpacity 
          style={styles.loginButtonEmpty}
          onPress={() => router.push('/(auth)/login')}
        >
          <Text style={styles.loginButtonTextEmpty}>Login to Comment</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderFooter = () => {
    if (!hasMore || comments.length === 0) return null;
    
    return (
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {comments.length} {comments.length === 1 ? 'comment' : 'comments'} loaded
        </Text>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <ActivityIndicator size="large" color="#1a237e" />
        <Text style={styles.loadingText}>Loading comments...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
          disabled={submitting}
        >
          <Ionicons name="arrow-back" size={24} color="#1a237e" />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Comments</Text>
          {news && (
            <Text style={styles.newsTitle} numberOfLines={1}>
              {news.title}
            </Text>
          )}
        </View>
        
        <TouchableOpacity 
          style={[styles.refreshButton, refreshing && styles.refreshButtonDisabled]}
          onPress={onRefresh}
          disabled={refreshing || submitting}
        >
          <Ionicons 
            name="refresh" 
            size={22} 
            color={refreshing ? '#ccc' : '#1a237e'} 
          />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Comments List */}
        <FlatList
          ref={flatListRef}
          data={comments}
          renderItem={renderComment}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.commentsList,
            comments.length === 0 && styles.emptyList
          ]}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={onRefresh}
          onEndReached={loadMoreComments}
          onEndReachedThreshold={0.5}
          ListHeaderComponent={
            comments.length > 0 && (
              <View style={styles.commentsHeader}>
                <Text style={styles.commentsCount}>
                  {news?.commentsCount || comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}
                </Text>
                {user && (
                  <Text style={styles.currentUser}>
                    Commenting as: {user.name}
                  </Text>
                )}
              </View>
            )
          }
          ListEmptyComponent={!loading ? renderEmptyComments() : null}
          ListFooterComponent={renderFooter}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
        />

        {/* Comment Input */}
        <View style={styles.inputContainer}>
          {user ? (
            <Image
              source={{ 
                uri: user.profileImage || 'https://via.placeholder.com/150' 
              }}
              style={styles.inputAvatar}
              defaultSource={{ uri: 'https://via.placeholder.com/150' }}
            />
          ) : (
            <TouchableOpacity 
              style={styles.inputAvatarPlaceholder}
              onPress={() => router.push('/(auth)/login')}
            >
              <Ionicons name="person" size={20} color="#666" />
            </TouchableOpacity>
          )}
          
          <TextInput
            style={[styles.input, { height: inputHeight }]}
            placeholder={user ? `Add a comment as ${user.name}...` : "Login to comment"}
            placeholderTextColor="#999"
            value={newComment}
            onChangeText={setNewComment}
            onContentSizeChange={handleInputSizeChange}
            multiline
            maxLength={500}
            editable={!!user && !submitting}
            returnKeyType="send"
            onSubmitEditing={handleSubmitComment}
            blurOnSubmit={false}
          />
          
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!newComment.trim() || !user || submitting) && styles.sendButtonDisabled
            ]}
            onPress={handleSubmitComment}
            disabled={!newComment.trim() || !user || submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="send" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(26, 35, 126, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    marginHorizontal: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a237e',
    textAlign: 'center',
  },
  newsTitle: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 2,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(26, 35, 126, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshButtonDisabled: {
    opacity: 0.5,
  },
  keyboardView: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    minHeight: 300,
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: '80%',
  },
  loginButtonEmpty: {
    marginTop: 20,
    backgroundColor: '#1a237e',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  loginButtonTextEmpty: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  commentsList: {
    paddingBottom: 80,
  },
  commentsHeader: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#f8f9fa',
  },
  commentsCount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a237e',
    marginBottom: 4,
  },
  currentUser: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  commentItem: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  commentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: '#f0f0f0',
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  commentAuthor: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  commentTime: {
    fontSize: 12,
    color: '#999',
  },
  commentText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#fff',
    minHeight: 64,
  },
  inputAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: '#f0f0f0',
    alignSelf: 'flex-end',
    marginBottom: 12,
  },
  inputAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    alignSelf: 'flex-end',
    marginBottom: 12,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingTop: 10,
    fontSize: 15,
    color: '#333',
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1a237e',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
    alignSelf: 'flex-end',
    marginBottom: 12,
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  footer: {
    paddingVertical: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  footerText: {
    fontSize: 14,
    color: '#666',
  },
});