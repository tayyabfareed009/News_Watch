// app/(auth)/login.tsx - WEB COMPATIBLE VERSION
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
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
// Use same IP as signup and OTP screens
const BASE_URL = 'https://news-watch-6zyq.vercel.app'; // Use your computer's IP address

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
    import('react-native').then(({ Alert }) => {
      Alert.alert(title, message, buttons);
    });
  }
};

export default function LoginScreen() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isCheckingExisting, setIsCheckingExisting] = useState(true);

  // Load saved credentials on component mount
  useEffect(() => {
    loadSavedCredentials();
  }, []);

  const loadSavedCredentials = async () => {
    try {
      const shouldRemember = await AsyncStorage.getItem('shouldRemember');
      
      if (shouldRemember === 'true') {
        const savedEmail = await AsyncStorage.getItem('rememberedEmail');
        const savedPassword = await AsyncStorage.getItem('rememberedPassword');
        
        if (savedEmail) {
          setFormData(prev => ({ ...prev, email: savedEmail }));
        }
        if (savedPassword) {
          setFormData(prev => ({ ...prev, password: savedPassword }));
        }
        setRememberMe(true);
      }
    } catch (error) {
      console.error('Error loading saved credentials:', error);
    } finally {
      setIsCheckingExisting(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLogin = async () => {
    // Validation
    if (!formData.email.trim()) {
      showAlert('Error', 'Please enter your email');
      return;
    }

    if (!formData.password) {
      showAlert('Error', 'Please enter your password');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      showAlert('Error', 'Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      // Prepare login data
      const loginData = {
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      };

      console.log('🔐 [Login] Attempting login for:', loginData.email);
      console.log('🔐 [Login] Password length:', loginData.password.length);
      console.log('🔐 [Login] Sending request to:', `${BASE_URL}/api/auth/login`);
      
      // Make API call to your backend
      const response = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
      });

      console.log('📡 [Login] Response status:', response.status);
      
      // Get raw response text first
      const responseText = await response.text();
      console.log('📡 [Login] Response text (raw):', responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
        console.log('📡 [Login] Response JSON:', JSON.stringify(data, null, 2));
      } catch (parseError) {
        console.error('❌ [Login] Failed to parse JSON response:', parseError);
        console.log('📡 [Login] Raw response:', responseText);
        throw new Error('Invalid server response format');
      }

      if (!response.ok) {
        console.error('❌ [Login] Server returned error:', data);
        
        // Handle specific error cases
        if (response.status === 401 || data.message?.includes('Invalid credentials')) {
          console.log('🔑 [Login] Invalid credentials - check your email and password');
          showAlert(
            'Login Failed', 
            'Invalid email or password. Please check your credentials.',
            [{ text: 'OK' }]
          );
          return;
        } else if (data.message?.includes('verify') || data.message?.includes('verified')) {
          showAlert(
            'Email Verification Required',
            data.message || 'Please verify your email first. Check your inbox for verification link.',
            Platform.OS === 'web' ? [{ text: 'OK' }] : [
              {
                text: 'Verify Now',
                onPress: () => {
                  router.push({
                    pathname: '/(auth)/otp',
                    params: { 
                      email: formData.email.trim().toLowerCase(),
                      purpose: 'verify-email'
                    }
                  });
                },
              },
              {
                text: 'Cancel',
                style: 'cancel',
              },
            ]
          );
          return;
        } else {
          showAlert('Login Failed', data.message || 'Login failed. Please try again.');
          return;
        }
      }

      if (data.success) {
        console.log('✅ [Login] Login successful for:', data.user.email);
        console.log('✅ [Login] Received token:', data.token ? 'Yes' : 'No');
        console.log('✅ [Login] User data:', {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role,
          isVerified: data.user.isVerified
        });
        
        // Save token securely
        await AsyncStorage.setItem('userToken', data.token);
        console.log('💾 [Login] Token saved to AsyncStorage');
        
        // Save user data
        await AsyncStorage.setItem('userData', JSON.stringify(data.user));
        console.log('💾 [Login] User data saved');
        
        // Handle remember me
        if (rememberMe) {
          await AsyncStorage.setItem('rememberedEmail', formData.email);
          await AsyncStorage.setItem('rememberedPassword', formData.password);
          await AsyncStorage.setItem('shouldRemember', 'true');
          console.log('💾 [Login] Remember me data saved');
        } else {
          await AsyncStorage.removeItem('rememberedPassword');
          await AsyncStorage.setItem('shouldRemember', 'false');
          console.log('💾 [Login] Remember me cleared');
        }

        // Show success message and navigate
        if (Platform.OS === 'web') {
          const proceed = window.confirm(`Welcome Back!\n\nLogged in successfully as ${data.user.name}\n\nClick OK to continue.`);
          if (proceed) {
            console.log('📍 [Login] Navigating to appropriate screen');
            // Navigate based on user role
            if (data.user.role === 'reporter' || data.user.role === 'admin') {
              console.log('📍 [Login] Going to reporter dashboard');
              router.replace('/(reporter)/dashboard');
            } else {
              console.log('📍 [Login] Going to main tabs');
              router.replace('/location');
            }
          }
        } else {
          import('react-native').then(({ Alert }) => {
            Alert.alert(
              'Welcome Back!',
              `Logged in successfully as ${data.user.name}`,
              [
                {
                  text: 'Continue',
                  onPress: () => {
                    console.log('📍 [Login] Navigating to appropriate screen');
                    // Navigate based on user role
                    if (data.user.role === 'reporter' || data.user.role === 'admin') {
                      console.log('📍 [Login] Going to reporter dashboard');
                      router.replace('/(reporter)/dashboard');
                    } else {
                      console.log('📍 [Login] Going to main tabs');
                      router.replace('/location');
                    }
                  },
                },
              ]
            );
          });
        }
      } else {
        console.error('❌ [Login] Response success=false:', data);
        showAlert('Login Failed', data.message || 'Login failed');
      }
    } catch (error: any) {
      console.error('❌ [Login] Error occurred:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      
      // Handle specific error cases
      if (error.message.includes('verify')) {
        showAlert(
          'Email Verification Required',
          error.message,
          Platform.OS === 'web' ? [{ text: 'OK' }] : [
            {
              text: 'Verify Now',
              onPress: () => {
                router.push({
                  pathname: '/(auth)/otp',
                  params: { 
                    email: formData.email.trim().toLowerCase(),
                    purpose: 'verify-email'
                  }
                });
              },
            },
            {
              text: 'Cancel',
              style: 'cancel',
            },
          ]
        );
      } else if (error.message.includes('Network request failed') || error.message.includes('fetch')) {
        showAlert(
          'Connection Error', 
          `Unable to connect to the server. Please check:\n\n1. Your internet connection\n2. Server IP address is correct\n3. Server is running on port 5000\n\nCurrent URL: ${BASE_URL}`,
          [{ text: 'OK' }]
        );
      } else {
        showAlert('Login Failed', error.message || 'Invalid credentials. Please try again.');
      }
    } finally {
      console.log('🏁 [Login] Process completed');
      setIsLoading(false);
    }
  };

  const handleSocialLogin = (provider: 'google' | 'facebook' | 'apple') => {
    if (Platform.OS === 'web') {
      window.alert(`Coming Soon: ${provider.charAt(0).toUpperCase() + provider.slice(1)} login will be available soon`);
    } else {
      import('react-native').then(({ Alert }) => {
        Alert.alert('Coming Soon', `${provider.charAt(0).toUpperCase() + provider.slice(1)} login will be available soon`);
      });
    }
  };

  const handleForgotPassword = () => {
    router.push('/(auth)/forgot-password');
  };

  // Demo login for testing
  const handleDemoLogin = async (role: 'visitor' | 'reporter' | 'admin') => {
    setIsLoading(true);
    
    try {
      // Use different demo credentials based on role
      let demoEmail = '';
      let demoPassword = '';

      switch (role) {
        case 'visitor':
          demoEmail = 'visitor@demo.com';
          demoPassword = 'demo123';
          break;
        case 'reporter':
          demoEmail = 'reporter@demo.com';
          demoPassword = 'demo123';
          break;
        case 'admin':
          demoEmail = 'admin@demo.com';
          demoPassword = 'demo123';
          break;
      }

      // Fill form with demo credentials
      setFormData({
        email: demoEmail,
        password: demoPassword,
      });

      // Auto-login after filling
      setTimeout(() => {
        handleLogin();
      }, 500);
      
    } catch (error) {
      console.error('Demo login error:', error);
      showAlert('Error', 'Demo login failed');
      setIsLoading(false);
    }
  };

  const handleCreateTestAccount = async (role: 'visitor' | 'reporter') => {
    setIsLoading(true);
    
    try {
      const testEmail = `${role}${Date.now()}@test.com`;
      const testPassword = 'test123';
      const testName = `Test ${role.charAt(0).toUpperCase() + role.slice(1)}`;
      
      console.log('📝 Creating test account:', testEmail);
      
      // Step 1: Send OTP
      const otpResponse = await fetch(`${BASE_URL}/api/auth/send-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: testEmail }),
      });

      const otpData = await otpResponse.json();

      if (otpData.success && otpData.otp) {
        // Step 2: Verify OTP
        const verifyResponse = await fetch(`${BASE_URL}/api/auth/verify-otp`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: testEmail,
            otp: otpData.otp
          }),
        });

        const verifyData = await verifyResponse.json();

        if (verifyData.success && verifyData.requiresSignup) {
          // Step 3: Register
          const registerData = {
            name: testName,
            email: testEmail,
            password: testPassword,
            phone: '1234567890',
            role: role
          };

          const registerResponse = await fetch(`${BASE_URL}/api/auth/register`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(registerData),
          });

          const registerDataJson = await registerResponse.json();

          if (registerDataJson.success) {
            // Auto-login with new account
            setFormData({
              email: testEmail,
              password: testPassword,
            });
            
            if (Platform.OS === 'web') {
              const proceed = window.confirm(
                `Test Account Created!\n\nAccount created successfully!\n\nEmail: ${testEmail}\nPassword: ${testPassword}\n\nClick OK to login now.`
              );
              if (proceed) {
                setTimeout(() => {
                  handleLogin();
                }, 500);
              }
            } else {
              import('react-native').then(({ Alert }) => {
                Alert.alert(
                  'Test Account Created',
                  `Account created successfully!\n\nEmail: ${testEmail}\nPassword: ${testPassword}`,
                  [
                    {
                      text: 'Login Now',
                      onPress: () => {
                        setTimeout(() => {
                          handleLogin();
                        }, 500);
                      },
                    },
                  ]
                );
              });
            }
          } else {
            throw new Error(registerDataJson.message || 'Registration failed');
          }
        } else {
          throw new Error('OTP verification failed');
        }
      } else {
        throw new Error(otpData.message || 'Failed to send OTP');
      }
    } catch (error: any) {
      console.error('Test account creation error:', error);
      showAlert('Error', error.message || 'Failed to create test account');
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingExisting) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <Ionicons name="sync" size={40} color="#1a237e" style={styles.loadingSpinner} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

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
            <Text style={styles.headerTitle}>Welcome Back</Text>
            <View style={styles.headerPlaceholder} />
          </View>

          {/* Logo */}
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoText}>NW</Text>
            </View>
            <Text style={styles.appTitle}>NewsWatch</Text>
            <Text style={styles.appSubtitle}>Stay informed, stay connected</Text>
          </View>

          {/* Server Connection Note */}
          <View style={styles.serverNote}>
            <Ionicons name="information-circle-outline" size={14} color="#666" />
            <Text style={styles.serverNoteText}>
              Server: {BASE_URL.replace('http://', '')}
            </Text>
          </View>

          {/* Quick Test Buttons */}
          <View style={styles.testContainer}>
            <Text style={styles.testTitle}>Quick Test:</Text>
            <View style={styles.testButtons}>
              <TouchableOpacity
                style={[styles.testButton, styles.demoButton]}
                onPress={() => handleDemoLogin('visitor')}
                disabled={isLoading}
              >
                <Ionicons name="person-outline" size={14} color="#1a237e" />
                <Text style={styles.testButtonText}>Demo Visitor</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.testButton, styles.demoButton]}
                onPress={() => handleDemoLogin('reporter')}
                disabled={isLoading}
              >
                <Ionicons name="newspaper-outline" size={14} color="#1a237e" />
                <Text style={styles.testButtonText}>Demo Reporter</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.testButtons}>
              <TouchableOpacity
                style={[styles.testButton, styles.createButton]}
                onPress={() => handleCreateTestAccount('visitor')}
                disabled={isLoading}
              >
                <Ionicons name="add-circle-outline" size={14} color="#4CAF50" />
                <Text style={[styles.testButtonText, styles.createButtonText]}>Create Test Visitor</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.testButton, styles.createButton]}
                onPress={() => handleCreateTestAccount('reporter')}
                disabled={isLoading}
              >
                <Ionicons name="add-circle-outline" size={14} color="#4CAF50" />
                <Text style={[styles.testButtonText, styles.createButtonText]}>Create Test Reporter</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
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

            {/* Password */}
            <View style={styles.inputGroup}>
              <View style={styles.passwordHeader}>
                <Text style={styles.label}>Password</Text>
                <TouchableOpacity onPress={handleForgotPassword} disabled={isLoading}>
                  <Text style={styles.forgotPassword}>Forgot password?</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
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
            </View>

            {/* Remember Me */}
            <View style={styles.rememberContainer}>
              <TouchableOpacity 
                style={styles.checkboxContainer}
                onPress={() => setRememberMe(!rememberMe)}
                disabled={isLoading}
              >
                <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                  {rememberMe && <Ionicons name="checkmark" size={16} color="#fff" />}
                </View>
                <Text style={styles.rememberText}>Remember me</Text>
              </TouchableOpacity>
            </View>

            {/* Sign In Button */}
            <TouchableOpacity
              style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#1a237e', '#283593', '#3949ab']}
                style={styles.loginButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {isLoading ? (
                  <View style={styles.loadingContainer}>
                    <Ionicons name="sync" size={20} color="#fff" style={styles.spinner} />
                    <Text style={styles.loginButtonText}>Signing In...</Text>
                  </View>
                ) : (
                  <Text style={styles.loginButtonText}>Sign In</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or continue with</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Social Login */}
            <View style={styles.socialContainer}>
              <TouchableOpacity
                style={[styles.socialButton, styles.googleButton]}
                onPress={() => handleSocialLogin('google')}
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
                onPress={() => handleSocialLogin('facebook')}
                disabled={isLoading}
              >
                <Image
                  source={{ uri: 'https://cdn-icons-png.flaticon.com/512/124/124010.png' }}
                  style={styles.socialIcon}
                />
                <Text style={[styles.socialText, styles.facebookButtonText]}>Facebook</Text>
              </TouchableOpacity>
            </View>

            {/* Register Link */}
            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>Don't have an account? </Text>
              <TouchableOpacity 
                onPress={() => router.push('/(auth)/signup')} 
                disabled={isLoading}
              >
                <Text style={styles.registerLink}>Create Account</Text>
              </TouchableOpacity>
            </View>

            {/* Help Text */}
            <View style={styles.helpContainer}>
              <Text style={styles.helpText}>
                Having trouble?{'\n'}
                • Check your email and password{'\n'}
                • Verify your email if not done{'\n'}
                • Try "Forgot password" if needed
              </Text>
            </View>

            {/* App Version */}
            <View style={styles.versionContainer}>
              <Text style={styles.versionText}>NewsWatch v1.0.0</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  loadingSpinner: {
    transform: [{ rotate: '0deg' }],
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
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
    marginBottom: 15,
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
  testContainer: {
    marginBottom: 20,
    paddingHorizontal: 25,
  },
  testTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  testButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 10,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
  },
  demoButton: {
    backgroundColor: '#fff',
    borderColor: '#1a237e',
  },
  createButton: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderColor: '#4CAF50',
  },
  testButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1a237e',
  },
  createButtonText: {
    color: '#2E7D32',
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
  passwordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  forgotPassword: {
    fontSize: 14,
    color: '#1a237e',
    fontWeight: '500',
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
  rememberContainer: {
    marginBottom: 25,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#666',
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#1a237e',
    borderColor: '#1a237e',
  },
  rememberText: {
    fontSize: 14,
    color: '#666',
  },
  loginButton: {
    marginTop: 5,
    borderRadius: 12,
    overflow: 'hidden',
    height: 55,
    elevation: 3,
    shadowColor: '#1a237e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  loginButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  spinner: {
    transform: [{ rotate: '0deg' }],
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 25,
  },
  dividerLine: {
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
  },
  googleButtonText: {
    color: '#333',
  },
  facebookButtonText: {
    color: '#fff',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  registerText: {
    color: '#666',
    fontSize: 15,
  },
  registerLink: {
    color: '#1a237e',
    fontSize: 15,
    fontWeight: '600',
  },
  helpContainer: {
    backgroundColor: 'rgba(102, 102, 102, 0.05)',
    borderRadius: 10,
    padding: 15,
    marginTop: 20,
    marginBottom: 15,
  },
  helpText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
  versionContainer: {
    alignItems: 'center',
    opacity: 0.6,
  },
  versionText: {
    fontSize: 12,
    color: '#666',
  },
});