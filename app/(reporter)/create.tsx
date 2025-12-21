import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

const { width } = Dimensions.get('window');

// Backend URL - Update this to your actual backend
const BACKEND_URL = "http://localhost:5000";

// Cloudinary Configuration
const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/dkwxr9ege/image/upload";
const CLOUDINARY_UPLOAD_PRESET = "Upload_Preset";

// Categories as per your backend
const categories = [
  'Politics',
  'Sports', 
  'Business',
  'Technology',
  'Entertainment',
  'Health',
  'Environment',
  'Science',
];

// Tags for news articles
const tags = [
  'Trending',
  'Breaking',
  'Exclusive',
  'Analysis',
  'Opinion',
  'Feature',
  'Latest',
  'Viral',
];

export default function CreatePostScreen() {
  const [post, setPost] = useState({
    title: '',
    content: '',
    videoLink: '',
    category: '',
    tags: [] as string[],
    location: '',
    image_url: '', // Single image URL like in AddProduct
  });
  
  const [uploading, setUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageQuality, setImageQuality] = useState<'standard' | 'high'>('standard');

  // Upload single image to Cloudinary with quality optimization
  const uploadToCloudinary = async (imageUri: string): Promise<string> => {
    try {
      const formData = new FormData();
      
      // Add upload preset
      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
      
      // Handle different platforms
      if (Platform.OS === "web") {
        const response = await fetch(imageUri);
        const blob = await response.blob();
        formData.append("file", blob, "news_image.jpg");
      } else {
        const filename = imageUri.split('/').pop() || `news_${Date.now()}.jpg`;
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        
        formData.append("file", {
          uri: imageUri,
          name: filename,
          type,
        });
      }

      console.log('Uploading to Cloudinary...', {
        quality: imageQuality
      });

      const response = await fetch(CLOUDINARY_URL, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `Upload failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.secure_url) {
        let finalUrl = data.secure_url;
        
        // Apply quality transformation based on selection
        if (finalUrl.includes('/upload/')) {
          const parts = finalUrl.split('/upload/');
          // Apply quality transformation
          const quality = imageQuality === "high" ? "q_90,f_auto" : "q_70,f_auto";
          finalUrl = `${parts[0]}/upload/${quality}/${parts[1]}`;
        }
        
        console.log('✅ Image uploaded to Cloudinary:', finalUrl);
        return finalUrl;
      } else {
        throw new Error('No secure URL returned from Cloudinary');
      }
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw error;
    }
  };

  // Handle image picker and Cloudinary upload (single image like AddProduct)
  const pickAndUploadImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your photo library.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: imageQuality === 'high' ? 0.9 : 0.7,
        allowsMultipleSelection: false,
        aspect: [16, 9],
      });

      if (result.canceled || !result.assets[0]) return;

      setUploading(true);
      
      const asset = result.assets[0];
      
      try {
        const cloudinaryUrl = await uploadToCloudinary(asset.uri);
        
        setPost(prev => ({ ...prev, image_url: cloudinaryUrl }));
        
        Alert.alert(
          "Success", 
          `${imageQuality === "high" ? "High quality" : "Standard quality"} image uploaded successfully.`
        );
      } catch (uploadError) {
        console.error('Failed to upload image:', uploadError);
        Alert.alert('Upload Error', 'Failed to upload image. Please try again.');
      }
      
    } catch (err) {
      console.error("Image picker error:", err);
      Alert.alert("Error", "Failed to pick image. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  // Remove uploaded image
  const removeImage = () => {
    setPost(prev => ({ ...prev, image_url: '' }));
  };

  const toggleTag = (tag: string) => {
    setPost(prev => {
      if (prev.tags.includes(tag)) {
        return {
          ...prev,
          tags: prev.tags.filter(t => t !== tag)
        };
      } else {
        return {
          ...prev,
          tags: [...prev.tags, tag]
        };
      }
    });
  };
const handleSubmit = async () => {
  console.log('🔵 handleSubmit triggered');
  
  // Validation
  console.log('📋 Starting validation...');
  console.log('📝 Post data:', {
    title: post.title,
    titleLength: post.title.length,
    category: post.category,
    categoryLength: post.category.length,
    content: post.content.substring(0, 50) + '...',
    contentLength: post.content.length,
    tags: post.tags,
    image_url: post.image_url ? 'Present' : 'Missing',
    videoLink: post.videoLink,
    location: post.location
  });
  
  if (!post.title.trim()) {
    console.log('❌ Validation failed: Title is empty');
    Alert.alert('Required', 'Please enter a title for your post');
    return;
  }
  
  if (!post.category.trim()) {
    console.log('❌ Validation failed: Category is empty');
    Alert.alert('Required', 'Please select a category');
    return;
  }
  
  if (!post.content.trim()) {
    console.log('❌ Validation failed: Content is empty');
    Alert.alert('Required', 'Please write your article content');
    return;
  }

  console.log('✅ Validation passed');
  
  try {
    setIsSubmitting(true);
    console.log('🔄 Setting isSubmitting to true');
    
    // Get token
    console.log('🔐 Retrieving token from AsyncStorage...');
    const token = await AsyncStorage.getItem('userToken');
    
    if (!token) {
      console.log('❌ No token found in AsyncStorage');
      Alert.alert('Authentication Required', 'Please login again');
      router.replace('/(auth)/login');
      return;
    }
    
    console.log('✅ Token retrieved (first 20 chars):', token.substring(0, 20) + '...');
    console.log('🔍 Token length:', token.length);

    // Decode token to check expiration
    const parts = token.split('.');
    if (parts.length === 3) {
      try {
        console.log('🔐 Decoding JWT token...');
        const payload = JSON.parse(atob(parts[1]));
        console.log('📄 Token payload:', {
          id: payload.id || 'No ID',
          email: payload.email || 'No email',
          role: payload.role || 'No role',
          exp: payload.exp ? new Date(payload.exp * 1000).toISOString() : 'No expiration',
          iat: payload.iat ? new Date(payload.iat * 1000).toISOString() : 'No issued at'
        });
        
        // Check if token is expired
        const currentTime = Date.now() / 1000;
        const isExpired = currentTime > payload.exp;
        console.log('⏰ Token expiration check:', {
          currentTime,
          exp: payload.exp,
          isExpired,
          timeRemaining: payload.exp ? (payload.exp - currentTime).toFixed(0) + ' seconds' : 'Unknown'
        });
        
        if (isExpired) {
          console.log('❌ Token expired!');
          Alert.alert(
            'Session Expired',
            'Your session has expired. Please login again.',
            [
              {
                text: 'Login',
                onPress: async () => {
                  await AsyncStorage.clear();
                  router.replace('/(auth)/login');
                }
              }
            ]
          );
          setIsSubmitting(false);
          return;
        }
        
        // Check if role is reporter
        console.log('👤 User role:', payload.role);
        if (payload.role !== 'reporter') {
          console.log(`❌ Permission denied: User role is "${payload.role}", expected "reporter"`);
          Alert.alert(
            'Permission Denied',
            `Your role is "${payload.role}". Only reporters can create news posts.`,
            [
              {
                text: 'OK',
                onPress: () => router.push('/(reporter)/dashboard')
              }
            ]
          );
          setIsSubmitting(false);
          return;
        }
        
        console.log('✅ Token validation passed - User is reporter');
      } catch (e) {
        console.error('❌ Token decode error:', e);
      }
    } else {
      console.log('⚠️ Token format invalid - expected 3 parts, got', parts.length);
    }

    // Get user info from backend using token
    let user = null;
    try {
      console.log('👤 Fetching user profile from backend...');
      console.log('🌐 Backend URL:', BACKEND_URL);
      console.log('🔑 Using token (first 20 chars):', token.substring(0, 20) + '...');
      
      const verifyRes = await fetch(`${BACKEND_URL}/api/user/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      console.log('📡 Profile fetch response status:', verifyRes.status);
      console.log('📡 Profile fetch response headers:', Object.fromEntries(verifyRes.headers.entries()));
      
      if (verifyRes.ok) {
        const verifyData = await verifyRes.json();
        console.log('✅ User profile fetched successfully:', {
          name: verifyData.user?.name,
          email: verifyData.user?.email,
          role: verifyData.user?.role,
          location: verifyData.user?.location
        });
        user = verifyData.user;
      } else {
        console.log('⚠️ Profile fetch failed with status:', verifyRes.status);
        const errorText = await verifyRes.text();
        console.log('⚠️ Profile fetch error response:', errorText);
      }
    } catch (error) {
      console.error('❌ User verification failed:', error);
    }

    // Prepare payload
    const payload = {
      title: post.title.trim(),
      content: post.content.trim(),
      category: post.category.trim(),
      tags: post.tags,
      videoLink: post.videoLink.trim() || '',
      images: post.image_url ? [{
        url: post.image_url,
        caption: 'Featured Image'
      }] : [],
      location: post.location.trim() || user?.location || '',
      isBreaking: post.tags.includes('Breaking'),
      isFeatured: false,
    };

    console.log('📦 Preparing payload for API:', {
      ...payload,
      contentPreview: payload.content.substring(0, 100) + '...',
      imagesCount: payload.images.length,
      hasImage: post.image_url ? 'Yes' : 'No',
      hasVideoLink: payload.videoLink ? 'Yes' : 'No',
      isBreaking: payload.isBreaking,
      isFeatured: payload.isFeatured
    });

    console.log('🚀 Making API request to create news...');
    console.log('🌐 Endpoint:', `${BACKEND_URL}/api/news`);
    console.log('🔑 Token used (first 20 chars):', token.substring(0, 20) + '...');
    console.log('📤 Payload size:', JSON.stringify(payload).length, 'bytes');

    // Make API request
    const startTime = Date.now();
    const res = await fetch(`${BACKEND_URL}/api/news`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const endTime = Date.now();
    console.log('⏱️ Request took:', endTime - startTime, 'ms');
    console.log('📡 Response status:', res.status);
    console.log('📡 Response headers:', Object.fromEntries(res.headers.entries()));

    const data = await res.json();
    console.log('📥 Response data:', data);

    if (res.ok) {
      console.log('✅ POST SUCCESSFUL!');
      console.log('📰 News created with ID:', data.news?.id);
      console.log('📰 News details:', {
        title: data.news?.title,
        category: data.news?.category,
        createdAt: data.news?.createdAt,
        status: data.news?.status || 'unknown'
      });
      
      Alert.alert(
        'Success!', 
        'News post created successfully!',
        [
          {
            text: 'View Post',
            onPress: () => {
              console.log('👁️ Navigating to news post:', data.news?.id);
              if (data.news && data.news.id) {
                router.push(`/news/${data.news.id}`);
              } else {
                console.log('⚠️ No news ID in response, going to dashboard');
                router.push('/(reporter)/dashboard');
              }
            }
          },
          { 
            text: 'Create Another',
            onPress: () => {
              console.log('🔄 Resetting form for new post');
              resetForm();
            }
          }
        ]
      );
    } else {
      console.error('❌ API Error Response:', {
        status: res.status,
        statusText: res.statusText,
        data: data
      });
      
      if (res.status === 401) {
        console.log('❌ 401 Unauthorized - Token invalid or expired');
        Alert.alert(
          'Authentication Failed',
          data.message || 'Your session is invalid. Please login again.',
          [
            {
              text: 'Login',
              onPress: async () => {
                console.log('🔓 Clearing AsyncStorage and navigating to login');
                await AsyncStorage.clear();
                router.replace('/(auth)/login');
              }
            }
          ]
        );
      } else if (res.status === 403) {
        console.log('❌ 403 Forbidden - Insufficient permissions');
        Alert.alert(
          'Permission Denied',
          data.message || 'You do not have permission to create news posts.',
          [
            {
              text: 'OK',
              onPress: () => {
                console.log('📊 Navigating to dashboard');
                router.push('/(reporter)/dashboard');
              }
            }
          ]
        );
      } else if (res.status === 400) {
        console.log('❌ 400 Bad Request - Validation error');
        Alert.alert('Validation Error', data.message || 'Please check your input and try again.');
      } else if (res.status === 500) {
        console.log('❌ 500 Internal Server Error');
        Alert.alert('Server Error', data.message || 'Something went wrong on the server. Please try again later.');
      } else {
        console.log(`❌ Unhandled error status: ${res.status}`);
        Alert.alert('Error', data.message || `Failed to create post (Status: ${res.status})`);
      }
    }
  } catch (err) {
    console.error('❌ Submit error details:', {
      name: err.name,
      message: err.message,
      stack: err.stack
    });
    Alert.alert('Error', err.message || 'Failed to submit post. Please try again.');
  } finally {
    console.log('🏁 Setting isSubmitting to false');
    setIsSubmitting(false);
  }
};

  const resetForm = () => {
    setPost({
      title: '',
      content: '',
      videoLink: '',
      category: '',
      tags: [],
      location: '',
      image_url: '',
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Create News Post</Text>
            <Text style={styles.headerSubtitle}>Share breaking news with the world</Text>
          </View>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 1. Add Featured Image Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="image-outline" size={20} color="#1a237e" />
            <Text style={styles.sectionTitle}>Featured Image</Text>
          </View>
          
          <Text style={styles.sectionSubtitle}>
            Upload a high-quality featured image for your news article
          </Text>
          
          <TouchableOpacity 
            style={styles.imageUploadCard}
            onPress={pickAndUploadImage}
            disabled={uploading || isSubmitting}
          >
            {uploading ? (
              <View style={styles.uploadingContainer}>
                <ActivityIndicator size="large" color="#1a237e" />
                <Text style={styles.uploadingText}>Uploading to Cloudinary...</Text>
              </View>
            ) : post.image_url ? (
              <View style={styles.uploadedImageContainer}>
                <Image 
                  source={{ uri: post.image_url }} 
                  style={styles.uploadedImage}
                  resizeMode="cover"
                />
                <TouchableOpacity 
                  style={styles.removeImageButton}
                  onPress={removeImage}
                  disabled={uploading || isSubmitting}
                >
                  <Ionicons name="close-circle" size={24} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.imagePlaceholder}>
                <View style={styles.imagePlaceholderIcon}>
                  <Ionicons name="cloud-upload-outline" size={48} color="#9CA3AF" />
                </View>
                <Text style={styles.uploadTitle}>Upload Featured Image</Text>
                <Text style={styles.uploadSubtitle}>Tap to select from gallery</Text>
                <Text style={styles.uploadHint}>Images are uploaded to Cloudinary</Text>
                <Text style={styles.uploadHint}>16:9 aspect ratio recommended</Text>
              </View>
            )}
          </TouchableOpacity>
          
          {/* Image Quality Selector */}
          <View style={styles.qualitySelector}>
            <Text style={styles.qualityLabel}>Image Quality:</Text>
            <View style={styles.qualityButtons}>
              <TouchableOpacity
                style={[
                  styles.qualityButton,
                  imageQuality === 'standard' && styles.qualityButtonActive
                ]}
                onPress={() => setImageQuality('standard')}
                disabled={uploading || isSubmitting}
              >
                <Text style={[
                  styles.qualityButtonText,
                  imageQuality === 'standard' && styles.qualityButtonTextActive
                ]}>Standard (70%)</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.qualityButton,
                  imageQuality === 'high' && styles.qualityButtonActive
                ]}
                onPress={() => setImageQuality('high')}
                disabled={uploading || isSubmitting}
              >
                <Text style={[
                  styles.qualityButtonText,
                  imageQuality === 'high' && styles.qualityButtonTextActive
                ]}>High Quality (90%)</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Cloudinary Status */}
          {uploading && (
            <View style={styles.cloudinaryStatus}>
              <Ionicons name="cloud-upload-outline" size={16} color="#1a237e" />
              <Text style={styles.cloudinaryStatusText}>
                Uploading image to Cloudinary...
              </Text>
            </View>
          )}
        </View>

        {/* 2. Add Heading Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="text-outline" size={20} color="#1a237e" />
            <Text style={styles.sectionTitle}>Add Heading</Text>
          </View>
          
          <TextInput
            style={styles.titleInput}
            value={post.title}
            onChangeText={(text) => setPost({ ...post, title: text })}
            placeholder="Enter catchy title for your news"
            placeholderTextColor="#9CA3AF"
            editable={!uploading && !isSubmitting}
            multiline
            numberOfLines={2}
          />
        </View>

        {/* 3. Add Tag Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="pricetags-outline" size={20} color="#1a237e" />
            <Text style={styles.sectionTitle}>Add Tags</Text>
          </View>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.tagsScroll}
            contentContainerStyle={styles.tagsContainer}
          >
            {tags.map((tag) => (
              <TouchableOpacity
                key={tag}
                style={[
                  styles.tagButton,
                  post.tags.includes(tag) && styles.tagButtonActive
                ]}
                onPress={() => toggleTag(tag)}
                disabled={uploading || isSubmitting}
              >
                <Text style={[
                  styles.tagButtonText,
                  post.tags.includes(tag) && styles.tagButtonTextActive
                ]}>
                  {tag}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          <TextInput
            style={[styles.input, styles.marginTop]}
            value={post.tags.join(', ')}
            onChangeText={(text) => setPost({ ...post, tags: text.split(', ') })}
            placeholder="Or type custom tags (comma separated)"
            placeholderTextColor="#9CA3AF"
            editable={!uploading && !isSubmitting}
          />
        </View>

        {/* 4. Category Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="grid-outline" size={20} color="#1a237e" />
            <Text style={styles.sectionTitle}>Category</Text>
          </View>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.categoryScroll}
            contentContainerStyle={styles.categoryContainer}
          >
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryButton,
                  post.category === cat && styles.categoryButtonActive
                ]}
                onPress={() => setPost({ ...post, category: cat })}
                disabled={uploading || isSubmitting}
              >
                <Text style={[
                  styles.categoryButtonText,
                  post.category === cat && styles.categoryButtonTextActive
                ]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          <TextInput
            style={[styles.input, styles.marginTop]}
            value={post.category}
            onChangeText={(text) => setPost({ ...post, category: text })}
            placeholder="Or type custom category"
            placeholderTextColor="#9CA3AF"
            editable={!uploading && !isSubmitting}
          />
        </View>

        {/* 5. Add Video Link Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="videocam-outline" size={20} color="#1a237e" />
            <Text style={styles.sectionTitle}>Add Video Link</Text>
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.sectionSubtitle}>Optional - Add YouTube/Vimeo link</Text>
            <TextInput
              style={styles.input}
              value={post.videoLink}
              onChangeText={(text) => setPost({ ...post, videoLink: text })}
              placeholder="https://youtube.com/watch?v=..."
              placeholderTextColor="#9CA3AF"
              editable={!uploading && !isSubmitting}
            />
          </View>
        </View>

        {/* 6. Write Articles Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="document-text-outline" size={20} color="#1a237e" />
            <Text style={styles.sectionTitle}>Write Article</Text>
          </View>
          
          <Text style={styles.sectionSubtitle}>Write detailed news article</Text>
          <TextInput
            style={styles.textarea}
            value={post.content}
            onChangeText={(text) => setPost({ ...post, content: text })}
            placeholder="Write your news article here..."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={10}
            textAlignVertical="top"
            editable={!uploading && !isSubmitting}
          />
        </View>

        {/* 7. Location Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="location-outline" size={20} color="#1a237e" />
            <Text style={styles.sectionTitle}>Location</Text>
          </View>
          
          <TextInput
            style={styles.input}
            value={post.location}
            onChangeText={(text) => setPost({ ...post, location: text })}
            placeholder="Enter news location (e.g., Kolkata, Delhi)"
            placeholderTextColor="#9CA3AF"
            editable={!uploading && !isSubmitting}
          />
        </View>

        {/* Preview Section */}
        {post.title && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Preview</Text>
            
            <View style={styles.previewCard}>
              {post.image_url ? (
                <Image source={{ uri: post.image_url }} style={styles.previewImage} resizeMode="cover" />
              ) : (
                <View style={styles.previewImagePlaceholder}>
                  <Ionicons name="image-outline" size={40} color="#E5E7EB" />
                </View>
              )}
              
              <View style={styles.previewContent}>
                <Text style={styles.previewHeading} numberOfLines={2}>
                  {post.title || "News Title"}
                </Text>
                
                <View style={styles.previewMeta}>
                  {post.category && (
                    <View style={styles.previewCategory}>
                      <Ionicons name="pricetag-outline" size={12} color="#6B7280" />
                      <Text style={styles.previewCategoryText}>
                        {post.category}
                      </Text>
                    </View>
                  )}
                  
                  {post.tags.length > 0 && (
                    <View style={styles.previewTags}>
                      <Ionicons name="pricetags-outline" size={12} color="#6B7280" />
                      <Text style={styles.previewTagsText} numberOfLines={1}>
                        {post.tags.slice(0, 2).join(', ')}
                      </Text>
                    </View>
                  )}
                </View>
                
                <Text style={styles.previewArticle} numberOfLines={3}>
                  {post.content || "Article content will appear here..."}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* POST Button */}
        <View style={styles.postButtonContainer}>
          <TouchableOpacity
            style={[
              styles.postButton,
              (!post.title || !post.category || !post.content || uploading || isSubmitting) && 
              styles.postButtonDisabled
            ]}
            onPress={handleSubmit}
            disabled={!post.title || !post.category || !post.content || uploading || isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Ionicons name="cloud-upload" size={20} color="white" />
                <Text style={styles.postButtonText}>PUBLISH WITH CLOUDINARY</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Images are uploaded to Cloudinary for global access
          </Text>
          <Text style={styles.footerCopyright}>
            © {new Date().getFullYear()} NewsWatch Reporter Center
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    backgroundColor: '#F3F4F6',
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
    backgroundColor: 'white',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  headerCenter: {
    flex: 1,
    marginLeft: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a237e',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 32,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a237e',
    marginLeft: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 0,
  },
  imageUploadCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    height: 200,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  uploadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  uploadingText: {
    fontSize: 14,
    color: '#666',
    marginTop: 12,
    fontWeight: '500',
  },
  uploadedImageContainer: {
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  uploadedImage: {
    width: '100%',
    height: '100%',
  },
  removeImageButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  imagePlaceholderIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  uploadTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  uploadSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  uploadHint: {
    fontSize: 12,
    color: '#999',
  },
  qualitySelector: {
    marginTop: 16,
  },
  qualityLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  qualityButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  qualityButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  qualityButtonActive: {
    backgroundColor: 'rgba(26, 35, 126, 0.1)',
    borderColor: '#1a237e',
  },
  qualityButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  qualityButtonTextActive: {
    color: '#1a237e',
    fontWeight: '600',
  },
  cloudinaryStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 10,
    backgroundColor: 'rgba(26, 35, 126, 0.05)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(26, 35, 126, 0.1)',
  },
  cloudinaryStatusText: {
    fontSize: 12,
    color: '#1a237e',
    marginLeft: 8,
    flex: 1,
  },
  titleInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#1a237e',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 60,
    textAlignVertical: 'top',
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  textarea: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 16,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 200,
    textAlignVertical: 'top',
  },
  marginTop: {
    marginTop: 12,
  },
  tagsScroll: {
    marginHorizontal: -20,
    paddingLeft: 20,
  },
  tagsContainer: {
    paddingRight: 20,
    paddingBottom: 8,
  },
  tagButton: {
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 8,
    marginBottom: 8,
  },
  tagButtonActive: {
    backgroundColor: 'rgba(26, 35, 126, 0.1)',
    borderColor: '#1a237e',
  },
  tagButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  tagButtonTextActive: {
    color: '#1a237e',
    fontWeight: '600',
  },
  categoryScroll: {
    marginHorizontal: -20,
    paddingLeft: 20,
  },
  categoryContainer: {
    paddingRight: 20,
    paddingBottom: 8,
  },
  categoryButton: {
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 8,
    marginBottom: 8,
  },
  categoryButtonActive: {
    backgroundColor: 'rgba(26, 35, 126, 0.1)',
    borderColor: '#1a237e',
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  categoryButtonTextActive: {
    color: '#1a237e',
    fontWeight: '600',
  },
  previewCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  previewImage: {
    width: '100%',
    height: 160,
    backgroundColor: '#F3F4F6',
  },
  previewImagePlaceholder: {
    width: '100%',
    height: 160,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewContent: {
    padding: 16,
  },
  previewHeading: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a237e',
    marginBottom: 12,
    lineHeight: 24,
  },
  previewMeta: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 12,
    flexWrap: 'wrap',
  },
  previewCategory: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(26, 35, 126, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  previewCategoryText: {
    fontSize: 12,
    color: '#1a237e',
    fontWeight: '500',
  },
  previewTags: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  previewTagsText: {
    fontSize: 12,
    color: '#FF9900',
    fontWeight: '500',
  },
  previewArticle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  postButtonContainer: {
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 20,
  },
  postButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a237e',
    paddingVertical: 18,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#1a237e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  postButtonDisabled: {
    opacity: 0.5,
  },
  postButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
  footer: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  footerCopyright: {
    fontSize: 11,
    color: '#999',
  },
});