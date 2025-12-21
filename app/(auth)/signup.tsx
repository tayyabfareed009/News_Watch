// app/(auth)/signup.tsx - COMPLETE WORKING VERSION
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

// ⚠️ IMPORTANT: Change this to your actual server IP address
// For development: Use your computer's IP address (not localhost)
// Example: 'http://192.168.1.100:5000'
const BASE_URL = 'http://localhost:5000'; 

type UserType = 'reporter' | 'visitor' | null;

export default function SignupScreen() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
  });
  const [userType, setUserType] = useState<UserType>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    // Check all fields are filled
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return false;
    }

    if (!formData.email.trim()) {
      Alert.alert('Error', 'Please enter your email');
      return false;
    }

    if (!formData.phone.trim()) {
      Alert.alert('Error', 'Please enter your phone number');
      return false;
    }

    if (!formData.password) {
      Alert.alert('Error', 'Please enter your password');
      return false;
    }

    if (!userType) {
      Alert.alert('Error', 'Please select your user type');
      return false;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }

    // Phone validation (basic)
    if (formData.phone.length < 10) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return false;
    }

    // Password validation
    if (formData.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return false;
    }

    return true;
  };
const handleSignup = async () => {
  console.log('🚀 [handleSignup] Starting registration process');
  
  // Validate form first
  if (!validateForm()) {
    console.log('❌ [handleSignup] Form validation failed');
    return;
  }

  setIsLoading(true);
  console.log('⏳ [handleSignup] Loading state set to true');

  try {
    const userData = {
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      password: formData.password,
      phone: formData.phone.trim(),
      role: userType === 'reporter' ? 'reporter' : 'visitor'
    };

    console.log('📦 [handleSignup] Sending registration request:', {
      ...userData,
      password: '***' // Hide password in logs
    });
    
    console.log('🔗 [handleSignup] Sending request to:', `${BASE_URL}/api/auth/register`);

    const response = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    console.log('📡 [handleSignup] Response status:', response.status);
    console.log('📡 [handleSignup] Response headers:', Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log('📡 [handleSignup] Response text (raw):', responseText);

    let data;
    try {
      data = JSON.parse(responseText);
      console.log('📡 [handleSignup] Response JSON:', JSON.stringify(data, null, 2));
    } catch (parseError) {
      console.error('❌ [handleSignup] Failed to parse JSON response:', parseError);
      throw new Error('Invalid server response format');
    }

    if (!response.ok) {
      console.error('❌ [handleSignup] Server returned error:', data);
      
      // Handle specific errors
      if (data.code === "EMAIL_EXISTS") {
        Alert.alert(
          'Email Already Registered',
          data.message || 'This email is already registered. Would you like to login instead?',
          [
            {
              text: 'Login',
              onPress: () => {
                console.log('📍 [handleSignup] Navigating to login screen');
                router.push('/(auth)/login');
              },
            },
            {
              text: 'Try Different Email',
              style: 'cancel',
            },
          ]
        );
      } else if (data.errors && data.errors.length > 0) {
        // Show validation errors
        const errorMessage = data.errors.map((err: any) => `${err.field}: ${err.message}`).join('\n');
        Alert.alert('Validation Error', errorMessage);
      } else {
        throw new Error(data.message || `Registration failed: ${response.status}`);
      }
      return;
    }

    if (data.success) {
      console.log('✅ [handleSignup] Registration successful:', data);
      
      // Save token to AsyncStorage
      if (data.token) {
        await AsyncStorage.setItem('userToken', data.token);
        console.log('💾 [handleSignup] Token saved to AsyncStorage');
      }

      // Save user data
      if (data.user) {
        await AsyncStorage.setItem('userData', JSON.stringify(data.user));
        console.log('💾 [handleSignup] User data saved:', data.user.email);
      }

      // Show success message
      Alert.alert(
        'Registration Successful!',
        `Welcome to NewsWatch, ${data.user.name}! Your account has been created successfully.`,
        [
          {
            text: 'Continue',
            onPress: () => {
              console.log('📍 [handleSignup] Navigating to home screen');
              // Navigate based on user role
              if (data.user.role === 'reporter') {
                router.replace('/(tabs)/reporter');
              } else {
                router.replace('/(tabs)/news');
              }
            }
          }
        ]
      );

    } else {
      throw new Error(data.message || 'Registration failed');
    }

  } catch (error: any) {
    console.error('❌ [handleSignup] Error occurred:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
    // Handle specific error cases
    if (error.message.includes('Network request failed') || 
        error.message.includes('fetch') || 
        error.message.includes('network')) {
      console.log('🌐 [handleSignup] Network connection error');
      Alert.alert(
        'Connection Error', 
        'Unable to connect to the server. Please check:\n\n1. Your internet connection\n2. Server IP address is correct\n3. Server is running on port 5000\n\nCurrent server URL: ' + BASE_URL,
        [{ 
          text: 'OK', 
          onPress: () => console.log('ℹ️ User acknowledged connection error') 
        }]
      );
    } else if (error.message.includes('Invalid server response format')) {
      console.log('🔄 [handleSignup] Invalid server response format');
      Alert.alert(
        'Server Error',
        'The server returned an invalid response. Please check if the server is running correctly.',
        [{ text: 'OK' }]
      );
    } else {
      console.log('⚠️ [handleSignup] Generic error');
      Alert.alert('Registration Failed', error.message || 'Failed to register. Please check your information and try again.');
    }
  } finally {
    console.log('🏁 [handleSignup] Process completed, setting loading to false');
    setIsLoading(false);
  }
};

  const handleSocialSignup = (provider: 'google' | 'facebook' | 'apple') => {
    Alert.alert('Coming Soon', `${provider.charAt(0).toUpperCase() + provider.slice(1)} signup will be available soon`);
  };

  return (
    <LinearGradient
      colors={['#ffffff', '#f5f7ff', '#e8ecff']}
      style={styles.container}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
              disabled={isLoading}
            >
              <Ionicons name="arrow-back" size={24} color="#1a237e" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Create Account</Text>
            <View style={styles.headerPlaceholder} />
          </View>

          {/* Logo */}
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoText}>NW</Text>
            </View>
            <Text style={styles.appTitle}>NewsWatch</Text>
            <Text style={styles.appSubtitle}>Your trusted news source</Text>
          </View>

          {/* Server Connection Note */}
          <View style={styles.serverNote}>
            <Ionicons name="information-circle-outline" size={16} color="#666" />
            <Text style={styles.serverNoteText}>
              Server: {BASE_URL.replace('http://', '')}
            </Text>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            {/* Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChangeText={(text) => handleInputChange('name', text)}
                  autoCapitalize="words"
                  editable={!isLoading}
                />
              </View>
            </View>

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  value={formData.email}
                  onChangeText={(text) => handleInputChange('email', text)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
              </View>
            </View>

            {/* Phone */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="call-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your phone number"
                  value={formData.phone}
                  onChangeText={(text) => handleInputChange('phone', text)}
                  keyboardType="phone-pad"
                  editable={!isLoading}
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password (min 6 characters)"
                  value={formData.password}
                  onChangeText={(text) => handleInputChange('password', text)}
                  secureTextEntry={!showPassword}
                  editable={!isLoading}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#666"
                  />
                </TouchableOpacity>
              </View>
              <Text style={styles.passwordHint}>Must be at least 6 characters</Text>
            </View>

            {/* User Type Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>I am a</Text>
              <View style={styles.userTypeContainer}>
                <TouchableOpacity
                  style={[
                    styles.userTypeButton,
                    userType === 'reporter' && styles.userTypeButtonActive,
                    isLoading && styles.userTypeButtonDisabled,
                  ]}
                  onPress={() => setUserType('reporter')}
                  disabled={isLoading}
                >
                  <View style={styles.userTypeContent}>
                    <Ionicons 
                      name="newspaper-outline" 
                      size={22} 
                      color={userType === 'reporter' ? '#1a237e' : '#666'} 
                    />
                    <Text
                      style={[
                        styles.userTypeText,
                        userType === 'reporter' && styles.userTypeTextActive,
                      ]}
                    >
                      Reporter
                    </Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.userTypeButton,
                    userType === 'visitor' && styles.userTypeButtonActive,
                    isLoading && styles.userTypeButtonDisabled,
                  ]}
                  onPress={() => setUserType('visitor')}
                  disabled={isLoading}
                >
                  <View style={styles.userTypeContent}>
                    <Ionicons 
                      name="person-outline" 
                      size={22} 
                      color={userType === 'visitor' ? '#1a237e' : '#666'} 
                    />
                    <Text
                      style={[
                        styles.userTypeText,
                        userType === 'visitor' && styles.userTypeTextActive,
                      ]}
                    >
                      Visitor
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            {/* Reporter Info Note */}
            {userType === 'reporter' && (
              <View style={styles.infoNote}>
                <Ionicons name="information-circle-outline" size={18} color="#1a237e" />
                <Text style={styles.infoText}>
                  As a reporter, you can publish news articles and manage your content
                </Text>
              </View>
            )}

            {/* Sign Up Button */}
            <TouchableOpacity
              style={[styles.signupButton, isLoading && styles.signupButtonDisabled]}
              onPress={handleSignup}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#1a237e', '#283593', '#3949ab']}
                style={styles.signupButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {isLoading ? (
                  <View style={styles.loadingContainer}>
                    <Ionicons name="sync" size={20} color="#fff" style={styles.spinner} />
                    <Text style={styles.signupButtonText}>Sending OTP...</Text>
                  </View>
                ) : (
                  <>
                    <Text style={styles.signupButtonText}>Continue with Email</Text>
                    <Text style={styles.signupButtonSubtext}>We'll send you a verification code</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>or continue with</Text>
              <View style={styles.divider} />
            </View>

            {/* Social Signup */}
            <View style={styles.socialContainer}>
              <TouchableOpacity
                style={[styles.socialButton, styles.googleButton]}
                onPress={() => handleSocialSignup('google')}
                disabled={isLoading}
              >
                <Image
                  source={{ uri: 'https://cdn-icons-png.flaticon.com/512/2991/2991148.png' }}
                  style={styles.socialIcon}
                />
                <Text style={[styles.socialText, styles.googleButtonText]}>Google</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.socialButton, styles.facebookButton]}
                onPress={() => handleSocialSignup('facebook')}
                disabled={isLoading}
              >
                <Image
                  source={{ uri: 'https://cdn-icons-png.flaticon.com/512/124/124010.png' }}
                  style={styles.socialIcon}
                />
                <Text style={styles.socialText}>Facebook</Text>
              </TouchableOpacity>
            </View>

            {/* Terms & Conditions */}
            <View style={styles.termsContainer}>
              <Text style={styles.termsText}>
                By continuing, you agree to our{'\n'}
                <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
                <Text style={styles.termsLink}>Privacy Policy</Text>
              </Text>
            </View>

            {/* Login Link */}
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity 
                onPress={() => router.push('/(auth)/login')}
                disabled={isLoading}
              >
                <Text style={styles.loginLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(26, 35, 126, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a237e',
  },
  headerPlaceholder: {
    width: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  logoCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#1a237e',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  logoText: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
  },
  appTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1a237e',
    marginBottom: 4,
  },
  appSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  serverNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(102, 102, 102, 0.05)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: 'center',
    marginBottom: 20,
    gap: 6,
  },
  serverNoteText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  formContainer: {
    paddingHorizontal: 25,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginLeft: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingHorizontal: 15,
    height: 55,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    height: '100%',
  },
  eyeIcon: {
    padding: 5,
  },
  passwordHint: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
    marginLeft: 5,
  },
  userTypeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  userTypeButton: {
    flex: 1,
    height: 70,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  userTypeButtonActive: {
    borderColor: '#1a237e',
    backgroundColor: 'rgba(26, 35, 126, 0.05)',
  },
  userTypeButtonDisabled: {
    opacity: 0.5,
  },
  userTypeContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  userTypeText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#666',
  },
  userTypeTextActive: {
    color: '#1a237e',
    fontWeight: '600',
  },
  infoNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(26, 35, 126, 0.05)',
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
    gap: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#1a237e',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#1a237e',
    lineHeight: 18,
  },
  signupButton: {
    marginTop: 10,
    borderRadius: 12,
    overflow: 'hidden',
    height: 60,
    elevation: 3,
    shadowColor: '#1a237e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  signupButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  spinner: {
    transform: [{ rotate: '0deg' }],
  },
  signupButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  signupButtonSubtext: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    fontWeight: '400',
  },
  signupButtonDisabled: {
    opacity: 0.7,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 25,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  dividerText: {
    marginHorizontal: 15,
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 15,
    marginBottom: 25,
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  googleButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  facebookButton: {
    backgroundColor: '#1877f2',
  },
  socialIcon: {
    width: 20,
    height: 20,
  },
  socialText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  googleButtonText: {
    color: '#333',
  },
  termsContainer: {
    alignItems: 'center',
    marginBottom: 25,
    paddingHorizontal: 10,
  },
  termsText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 12,
    lineHeight: 18,
  },
  termsLink: {
    color: '#1a237e',
    fontWeight: '600',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  loginText: {
    color: '#666',
    fontSize: 15,
  },
  loginLink: {
    color: '#1a237e',
    fontSize: 15,
    fontWeight: '600',
  },
});