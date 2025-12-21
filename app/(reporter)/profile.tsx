import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

const BACKEND_URL = "http://localhost:5000";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  profileImage: string;
  location?: string;
  role: string;
  bio?: string;
  socialLinks?: {
    twitter?: string;
    facebook?: string;
    instagram?: string;
    linkedin?: string;
  };
}

export default function ProfileScreen() {
  const [profile, setProfile] = useState<UserProfile>({
    id: '',
    name: '',
    email: '',
    profileImage: 'https://via.placeholder.com/150',
    role: 'reporter',
    bio: '',
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // Form fields
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    location: '',
    bio: '',
    twitter: '',
    facebook: '',
    instagram: '',
    linkedin: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      const userJson = await AsyncStorage.getItem('user');
      
      if (!token || !userJson) {
        Alert.alert('Error', 'Please login again');
        router.replace('/(auth)/login');
        return;
      }

      const response = await fetch(`${BACKEND_URL}/api/user/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        const user = data.user;
        setProfile(user);
        
        // Split name into first and last
        const nameParts = user.name.split(' ');
        setFormData({
          firstName: nameParts[0] || '',
          lastName: nameParts.slice(1).join(' ') || '',
          email: user.email || '',
          phone: user.phone || '',
          location: user.location || '',
          bio: user.bio || '',
          twitter: user.socialLinks?.twitter || '',
          facebook: user.socialLinks?.facebook || '',
          instagram: user.socialLinks?.instagram || '',
          linkedin: user.socialLinks?.linkedin || '',
        });
      } else {
        Alert.alert('Error', data.message || 'Failed to load profile');
      }
    } catch (error) {
      console.error('Fetch profile error:', error);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your photo library.');
        return;
      }

      const result = await ImagePicker.launchImagePickerAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setUploadingImage(true);
        // In production, upload to your backend/Cloudinary
        // For now, we'll use the local URI
        const newProfile = {
          ...profile,
          profileImage: result.assets[0].uri,
        };
        setProfile(newProfile);
        setUploadingImage(false);
      }
    } catch (error) {
      console.error('Image pick error:', error);
      setUploadingImage(false);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleUpdateProfile = async () => {
    try {
      setSaving(true);
      const token = await AsyncStorage.getItem('token');
      
      if (!token) {
        Alert.alert('Error', 'Please login again');
        router.replace('/(auth)/login');
        return;
      }

      const fullName = `${formData.firstName} ${formData.lastName}`.trim();
      
      const updateData = {
        name: fullName,
        phone: formData.phone,
        location: formData.location,
        bio: formData.bio,
        socialLinks: {
          twitter: formData.twitter,
          facebook: formData.facebook,
          instagram: formData.instagram,
          linkedin: formData.linkedin,
        },
      };

      const response = await fetch(`${BACKEND_URL}/api/user/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (data.success) {
        // Update local storage
        const userJson = await AsyncStorage.getItem('user');
        if (userJson) {
          const user = JSON.parse(userJson);
          const updatedUser = { ...user, ...data.user };
          await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
        }
        
        setProfile(data.user);
        setIsEditing(false);
        Alert.alert('Success', 'Profile updated successfully');
      } else {
        Alert.alert('Error', data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Update profile error:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = () => {
    Alert.alert('Change Password', 'This feature will be available soon');
  };

  const uploadMediaDocument = () => {
    Alert.alert('Upload Document', 'This feature will be available soon');
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1a237e" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Profile</Text>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => setIsEditing(!isEditing)}
          >
            <Text style={styles.editButtonText}>
              {isEditing ? 'Cancel' : 'Edit'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Profile Image Section */}
        <View style={styles.profileImageSection}>
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: profile.profileImage }}
              style={styles.profileImage}
            />
            {uploadingImage && (
              <View style={styles.imageUploadingOverlay}>
                <ActivityIndicator size="small" color="#FFFFFF" />
              </View>
            )}
            {isEditing && (
              <TouchableOpacity
                style={styles.changeImageButton}
                onPress={pickImage}
                disabled={uploadingImage}
              >
                <Ionicons name="camera" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.changeImageText}>Change Profile Photo</Text>
        </View>

        {/* Personal Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Username</Text>
            <Text style={styles.readOnlyText}>{profile.email.split('@')[0]}</Text>
          </View>

          <View style={styles.row}>
            <View style={[styles.formGroup, styles.flex1]}>
              <Text style={styles.label}>First Name *</Text>
              {isEditing ? (
                <TextInput
                  style={styles.input}
                  value={formData.firstName}
                  onChangeText={(value) => handleInputChange('firstName', value)}
                  placeholder="Enter first name"
                  editable={isEditing}
                />
              ) : (
                <Text style={styles.readOnlyText}>
                  {formData.firstName || 'Not set'}
                </Text>
              )}
            </View>
            
            <View style={[styles.formGroup, styles.flex1, styles.marginLeft]}>
              <Text style={styles.label}>Last Name</Text>
              {isEditing ? (
                <TextInput
                  style={styles.input}
                  value={formData.lastName}
                  onChangeText={(value) => handleInputChange('lastName', value)}
                  placeholder="Enter last name"
                  editable={isEditing}
                />
              ) : (
                <Text style={styles.readOnlyText}>
                  {formData.lastName || 'Not set'}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Email Id</Text>
            <Text style={styles.readOnlyText}>{profile.email}</Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Phone Number</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={formData.phone}
                onChangeText={(value) => handleInputChange('phone', value)}
                placeholder="Enter phone number"
                keyboardType="phone-pad"
                editable={isEditing}
              />
            ) : (
              <Text style={styles.readOnlyText}>
                {formData.phone || 'Not set'}
              </Text>
            )}
          </View>
        </View>

        {/* Change Password */}
        <TouchableOpacity style={styles.section} onPress={handleChangePassword}>
          <View style={styles.passwordHeader}>
            <Ionicons name="lock-closed-outline" size={20} color="#1a237e" />
            <Text style={styles.sectionTitle}>Change Password</Text>
          </View>
          <Text style={styles.sectionSubtitle}>Update your account password</Text>
        </TouchableOpacity>

        {/* Reporter Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reporter Information</Text>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>I am a</Text>
            <View style={styles.roleContainer}>
              <TouchableOpacity style={[styles.roleButton, styles.roleButtonActive]}>
                <Ionicons name="megaphone-outline" size={16} color="#1a237e" />
                <Text style={styles.roleButtonTextActive}>Media Reporter</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.roleButton}>
                <Ionicons name="person-outline" size={16} color="#666" />
                <Text style={styles.roleButtonText}>Visitor</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Location</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={formData.location}
                onChangeText={(value) => handleInputChange('location', value)}
                placeholder="Enter your location"
                editable={isEditing}
              />
            ) : (
              <Text style={styles.readOnlyText}>
                {formData.location || 'Not set'}
              </Text>
            )}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Bio</Text>
            {isEditing ? (
              <TextInput
                style={[styles.input, styles.textarea]}
                value={formData.bio}
                onChangeText={(value) => handleInputChange('bio', value)}
                placeholder="Tell us about yourself"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                editable={isEditing}
              />
            ) : (
              <Text style={styles.readOnlyText}>
                {formData.bio || 'No bio added'}
              </Text>
            )}
          </View>
        </View>

        {/* Media Document Upload */}
        <TouchableOpacity style={styles.section} onPress={uploadMediaDocument}>
          <View style={styles.uploadHeader}>
            <Ionicons name="document-attach-outline" size={20} color="#1a237e" />
            <Text style={styles.sectionTitle}>Upload Media Document</Text>
          </View>
          <Text style={styles.sectionSubtitle}>Upload verification document</Text>
          <TouchableOpacity style={styles.browseButton}>
            <Ionicons name="cloud-upload-outline" size={20} color="#1a237e" />
            <Text style={styles.browseButtonText}>Browse File</Text>
          </TouchableOpacity>
        </TouchableOpacity>

        {/* Social Links */}
        {isEditing && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Social Links</Text>
            
            <View style={styles.formGroup}>
              <View style={styles.socialInputContainer}>
                <Ionicons name="logo-twitter" size={20} color="#1DA1F2" />
                <TextInput
                  style={[styles.input, styles.socialInput]}
                  value={formData.twitter}
                  onChangeText={(value) => handleInputChange('twitter', value)}
                  placeholder="Twitter username"
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <View style={styles.socialInputContainer}>
                <Ionicons name="logo-facebook" size={20} color="#1877F2" />
                <TextInput
                  style={[styles.input, styles.socialInput]}
                  value={formData.facebook}
                  onChangeText={(value) => handleInputChange('facebook', value)}
                  placeholder="Facebook profile"
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <View style={styles.socialInputContainer}>
                <Ionicons name="logo-instagram" size={20} color="#E4405F" />
                <TextInput
                  style={[styles.input, styles.socialInput]}
                  value={formData.instagram}
                  onChangeText={(value) => handleInputChange('instagram', value)}
                  placeholder="Instagram username"
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <View style={styles.socialInputContainer}>
                <Ionicons name="logo-linkedin" size={20} color="#0A66C2" />
                <TextInput
                  style={[styles.input, styles.socialInput]}
                  value={formData.linkedin}
                  onChangeText={(value) => handleInputChange('linkedin', value)}
                  placeholder="LinkedIn profile"
                />
              </View>
            </View>
          </View>
        )}

        {/* Save Button */}
        {isEditing && (
          <View style={styles.saveButtonContainer}>
            <TouchableOpacity
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={handleUpdateProfile}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="save-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Account created on {new Date().toLocaleDateString()}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a237e',
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(26, 35, 126, 0.1)',
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a237e',
  },
  profileImageSection: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    backgroundColor: '#F3F4F6',
  },
  imageUploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  changeImageButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#1a237e',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  changeImageText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a237e',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
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
  readOnlyText: {
    fontSize: 16,
    color: '#666',
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  row: {
    flexDirection: 'row',
  },
  flex1: {
    flex: 1,
  },
  marginLeft: {
    marginLeft: 12,
  },
  textarea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  passwordHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  roleContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  roleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    gap: 8,
  },
  roleButtonActive: {
    backgroundColor: 'rgba(26, 35, 126, 0.1)',
    borderColor: '#1a237e',
  },
  roleButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  roleButtonTextActive: {
    color: '#1a237e',
    fontWeight: '600',
  },
  uploadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  browseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    backgroundColor: '#F9FAFB',
    gap: 8,
  },
  browseButtonText: {
    fontSize: 16,
    color: '#1a237e',
    fontWeight: '600',
  },
  socialInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
  },
  socialInput: {
    flex: 1,
    borderWidth: 0,
    paddingLeft: 12,
    marginLeft: 4,
  },
  saveButtonContainer: {
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 24,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a237e',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#1a237e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
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
    color: '#999',
    textAlign: 'center',
  },
});