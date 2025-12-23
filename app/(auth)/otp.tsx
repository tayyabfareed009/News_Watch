// app/(auth)/otp.tsx - FIXED VERSION
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TextInputKeyPressEventData,
  TouchableOpacity,
  View,
} from 'react-native';

// ⚠️ IMPORTANT: Change this to your actual server IP address
const BASE_URL = 'https://news-watch-6zyq.vercel.app'; // Use same IP as signup screen

type OtpPurpose = 'signup' | 'forgot-password' | 'verify-email';

export default function OtpScreen() {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [email, setEmail] = useState('');
  const [purpose, setPurpose] = useState<OtpPurpose>('signup');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [timer, setTimer] = useState(600); // 10 minutes = 600 seconds
  const [canResend, setCanResend] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState<string>('');
  
  const inputs = useRef<Array<TextInput | null>>([]);
  const params = useLocalSearchParams();

  // Timer for resend OTP
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (timer > 0 && !canResend) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setCanResend(true);
    }
    
    return () => clearInterval(interval);
  }, [timer, canResend]);

  // Get email and purpose from params or stored data
  useEffect(() => {
    const loadData = async () => {
      try {
        // Get email from params
        if (params.email) {
          setEmail(params.email as string);
        }
        
        // Get purpose from params
        if (params.purpose) {
          setPurpose(params.purpose as OtpPurpose);
        }
        
        // Get saved signup data to complete registration after OTP verification
        const savedData = await AsyncStorage.getItem('signupData');
        if (savedData) {
          const data = JSON.parse(savedData);
          console.log('📝 Loaded signup data:', data.email);
        }
        
        // Get dev OTP if exists
        const devOtp = await AsyncStorage.getItem('devOtp');
        if (devOtp) {
          setGeneratedOtp(devOtp);
          console.log('🔐 Dev OTP loaded:', devOtp);
        }
        
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    loadData();
  }, [params.email, params.purpose]);

  const handleOtpChange = (text: string, index: number) => {
    // Only allow numbers
    const numericText = text.replace(/[^0-9]/g, '');
    
    if (numericText.length <= 1) {
      const newOtp = [...otp];
      newOtp[index] = numericText;
      setOtp(newOtp);

      // Auto focus next input
      if (numericText !== '' && index < 5) {
        setTimeout(() => {
          inputs.current[index + 1]?.focus();
        }, 10);
      }

      // Auto-verify when all digits are filled
      if (index === 5 && numericText !== '') {
        const finalOtp = newOtp.join('');
        if (finalOtp.length === 6) {
          handleVerify();
        }
      }
    }
  };

  const handleKeyPress = (e: NativeSyntheticEvent<TextInputKeyPressEventData>, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && otp[index] === '' && index > 0) {
      setTimeout(() => {
        inputs.current[index - 1]?.focus();
      }, 10);
    }
  };

  const handleVerify = async () => {
    const otpString = otp.join('');
    
    if (otpString.length !== 6) {
      Alert.alert('Error', 'Please enter all 6 digits of the OTP');
      return;
    }

    if (!/^\d{6}$/.test(otpString)) {
      Alert.alert('Error', 'OTP must be 6 digits');
      return;
    }

    if (!email) {
      Alert.alert('Error', 'Email not found. Please try again.');
      return;
    }

    setIsLoading(true);

    try {
      console.log('🔐 Verifying OTP for:', email);
      
      const verificationData = {
        email: email.toLowerCase(),
        otp: otpString,
      };

      // Step 1: Verify OTP with backend
      const response = await fetch(`${BASE_URL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(verificationData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'OTP verification failed');
      }

      if (data.success) {
        console.log('✅ OTP verified successfully');
        setIsVerified(true);
        
        // Check if we need to complete registration
        if (data.requiresSignup || purpose === 'signup') {
          await completeRegistration();
        } else {
          // OTP verified for existing user
          if (data.token && data.user) {
            await AsyncStorage.setItem('userToken', data.token);
            await AsyncStorage.setItem('userData', JSON.stringify(data.user));
            
            Alert.alert(
              'Success',
              'Email verified successfully!',
              [
                {
                  text: 'Continue',
                  onPress: () => {
                    navigateAfterVerification(data.user);
                  },
                },
              ]
            );
          }
        }
      } else {
        throw new Error(data.message || 'Verification failed');
      }
      
    } catch (error: any) {
      console.error('OTP verification error:', error);
      
      // Clear OTP on error
      setOtp(['', '', '', '', '', '']);
      inputs.current[0]?.focus();
      
      // Handle specific error cases
      if (error.message.includes('Invalid') || error.message.includes('expired')) {
        Alert.alert(
          'Invalid Code',
          'The verification code is invalid or has expired.',
          [
            {
              text: 'Resend Code',
              onPress: handleResendOtp,
            },
            {
              text: 'Try Again',
              style: 'cancel',
            },
          ]
        );
      } else if (error.message.includes('Network request failed')) {
        Alert.alert(
          'Connection Error', 
          'Unable to connect to the server. Please check your connection.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', error.message || 'Failed to verify. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const completeRegistration = async () => {
    try {
      console.log('📝 Completing registration...');
      
      // Get saved signup data
      const savedData = await AsyncStorage.getItem('signupData');
      if (!savedData) {
        throw new Error('Registration data not found. Please start over.');
      }

      const formData = JSON.parse(savedData);

      const registrationData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        role: formData.role
      };

      console.log('📤 Sending registration data:', registrationData.email);

      // Step 2: Complete registration
      const response = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      if (data.success) {
        console.log('✅ Registration completed successfully');
        
        // Save token and user data
        await AsyncStorage.setItem('userToken', data.token);
        await AsyncStorage.setItem('userData', JSON.stringify(data.user));
        
        // Clear temporary data
        await AsyncStorage.removeItem('signupData');
        await AsyncStorage.removeItem('devOtp');
        
        Alert.alert(
          'Success!',
          'Your account has been created successfully!',
          [
            {
              text: 'Get Started',
              onPress: () => {
                navigateAfterVerification(data.user);
              },
            },
          ]
        );
      } else {
        throw new Error(data.message || 'Registration failed');
      }
      
    } catch (error: any) {
      console.error('Registration completion error:', error);
      
      // Clear OTP on error
      setOtp(['', '', '', '', '', '']);
      inputs.current[0]?.focus();
      
      if (error.message.includes('already registered') || error.message.includes('already exists')) {
        Alert.alert(
          'Account Exists',
          'This email is already registered. Would you like to login instead?',
          [
            {
              text: 'Login',
              onPress: () => router.replace('/(auth)/login'),
            },
            {
              text: 'Try Again',
              style: 'cancel',
            },
          ]
        );
      } else {
        Alert.alert('Error', error.message || 'Failed to complete registration.');
      }
    }
  };

  const navigateAfterVerification = (user: any) => {
    // Navigate based on user role
    if (user?.role === 'reporter' || user?.role === 'admin') {
      router.replace('/(reporter)/dashboard');
    } else {
      router.replace('/(tabs)');
    }
  };

  const handleResendOtp = async () => {
    if (!email) {
      Alert.alert('Error', 'Email not found. Please try again.');
      return;
    }

    if (canResend) {
      setIsResending(true);

      try {
        console.log('📧 Resending OTP to:', email);
        
        const resendData = {
          email: email.toLowerCase(),
          type: 'verification'
        };

        const response = await fetch(`${BASE_URL}/api/auth/resend-otp`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(resendData),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to resend OTP');
        }

        if (data.success) {
          // Reset timer and OTP
          setTimer(600);
          setCanResend(false);
          setOtp(['', '', '', '', '', '']);
          inputs.current[0]?.focus();
          
          // Store dev OTP if provided
          if (data.otp) {
            setGeneratedOtp(data.otp);
            await AsyncStorage.setItem('devOtp', data.otp);
            console.log('🔐 New dev OTP:', data.otp);
          }
          
          Alert.alert('Success', 'A new verification code has been sent.');
        } else {
          throw new Error(data.message || 'Failed to resend OTP');
        }
        
      } catch (error: any) {
        console.error('Resend OTP error:', error);
        Alert.alert('Error', error.message || 'Failed to resend code. Please try again.');
      } finally {
        setIsResending(false);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleBack = () => {
    if (purpose === 'signup') {
      router.back();
    } else {
      router.replace('/(auth)/login');
    }
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
              onPress={handleBack}
              disabled={isLoading}
            >
              <Ionicons name="arrow-back" size={24} color="#1a237e" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {purpose === 'signup' ? 'Verify Email' : 'Verify Account'}
            </Text>
            <View style={styles.headerPlaceholder} />
          </View>

          {/* Logo */}
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              {isVerified ? (
                <Ionicons name="checkmark-circle" size={36} color="#4CAF50" />
              ) : (
                <Ionicons name="shield-checkmark" size={36} color="#1a237e" />
              )}
            </View>
            <Text style={styles.appTitle}>NewsWatch</Text>
            <Text style={styles.appSubtitle}>
              {isVerified ? 'Verified Successfully!' : 'Secure Verification'}
            </Text>
          </View>

          {/* Main Content */}
          <View style={styles.contentContainer}>
            {/* Email Display */}
            <View style={styles.emailSection}>
              <Text style={styles.sectionTitle}>Verifying email:</Text>
              <View style={styles.emailContainer}>
                <Ionicons 
                  name="mail-outline" 
                  size={20} 
                  color={isVerified ? '#4CAF50' : '#1a237e'} 
                />
                <Text style={[
                  styles.emailText,
                  isVerified && styles.emailTextVerified
                ]}>
                  {email || 'Loading...'}
                </Text>
              </View>
            </View>

            {/* For development: Show OTP */}
            {generatedOtp && !isVerified && (
              <View style={styles.devOtpContainer}>
                <Text style={styles.devOtpLabel}>DEV MODE - Your OTP:</Text>
                <Text style={styles.devOtpCode}>{generatedOtp}</Text>
                <Text style={styles.devOtpNote}>This is shown only in development mode</Text>
              </View>
            )}

            {/* Status Message */}
            <View style={[
              styles.statusContainer,
              isVerified && styles.statusContainerVerified
            ]}>
              <Ionicons 
                name={isVerified ? "checkmark-circle" : "information-circle"} 
                size={24} 
                color={isVerified ? '#4CAF50' : '#1a237e'} 
              />
              <Text style={[
                styles.statusText,
                isVerified && styles.statusTextVerified
              ]}>
                {isVerified 
                  ? 'Your email has been verified successfully!'
                  : purpose === 'signup'
                    ? 'Enter the 6-digit code sent to your email to create your account'
                    : 'Enter the 6-digit code sent to your email'
                }
              </Text>
            </View>

            {/* OTP Inputs - Only show if not verified */}
            {!isVerified && (
              <>
                <View style={styles.otpSection}>
                  <Text style={styles.otpTitle}>Enter Verification Code</Text>
                  
                  <View style={styles.otpContainer}>
                    {otp.map((digit, index) => (
                      <View key={index} style={styles.otpInputWrapper}>
                        <TextInput
                          ref={(ref) => (inputs.current[index] = ref)}
                          style={[
                            styles.otpInput,
                            digit !== '' && styles.otpInputFilled,
                            (isLoading || isResending) && styles.otpInputDisabled,
                          ]}
                          value={digit}
                          onChangeText={(text) => handleOtpChange(text, index)}
                          onKeyPress={(e) => handleKeyPress(e, index)}
                          keyboardType="number-pad"
                          maxLength={1}
                          textAlign="center"
                          editable={!isLoading && !isResending}
                          selectTextOnFocus
                          placeholder="-"
                          placeholderTextColor="#ccc"
                        />
                      </View>
                    ))}
                  </View>

                  {/* Timer/Resend */}
                  <View style={styles.resendContainer}>
                    {!canResend ? (
                      <Text style={styles.timerText}>
                        Resend code in {formatTime(timer)}
                      </Text>
                    ) : (
                      <TouchableOpacity 
                        onPress={handleResendOtp} 
                        disabled={isResending}
                        style={styles.resendButton}
                      >
                        {isResending ? (
                          <View style={styles.resendLoading}>
                            <Ionicons name="sync" size={16} color="#1a237e" style={styles.resendSpinner} />
                            <Text style={styles.resendText}>Sending...</Text>
                          </View>
                        ) : (
                          <Text style={styles.resendText}>Resend Verification Code</Text>
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {/* Verify Button */}
                <TouchableOpacity
                  style={[
                    styles.verifyButton,
                    (isLoading || otp.join('').length !== 6) && styles.verifyButtonDisabled,
                  ]}
                  onPress={handleVerify}
                  disabled={isLoading || otp.join('').length !== 6}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#1a237e', '#283593', '#3949ab']}
                    style={styles.verifyButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    {isLoading ? (
                      <View style={styles.loadingContainer}>
                        <Ionicons name="sync" size={20} color="#fff" style={styles.spinner} />
                        <Text style={styles.verifyButtonText}>Verifying...</Text>
                      </View>
                    ) : (
                      <Text style={styles.verifyButtonText}>
                        {purpose === 'signup' ? 'Verify & Create Account' : 'Verify'}
                      </Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}

            {/* Continue Button for verified users */}
            {isVerified && (
              <TouchableOpacity
                style={styles.continueButton}
                onPress={() => {
                  const navigate = async () => {
                    try {
                      const userData = await AsyncStorage.getItem('userData');
                      if (userData) {
                        const user = JSON.parse(userData);
                        navigateAfterVerification(user);
                      } else {
                        router.replace('/(tabs)');
                      }
                    } catch (error) {
                      router.replace('/(tabs)');
                    }
                  };
                  navigate();
                }}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#4CAF50', '#2E7D32']}
                  style={styles.continueButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="checkmark-circle" size={20} color="#fff" />
                  <Text style={styles.continueButtonText}>Continue to NewsWatch</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}

            {/* Help Text */}
            <View style={styles.helpContainer}>
              <Text style={styles.helpText}>
                If you don't receive the code within a few minutes:{'\n'}
                • Check your spam folder{'\n'}
                • Ensure you entered the correct email
              </Text>
            </View>

            {/* Security Note */}
            <View style={styles.securityNote}>
              <Ionicons name="shield-checkmark" size={14} color="#666" />
              <Text style={styles.securityNoteText}>
                Your security is important. Never share verification codes.
              </Text>
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
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(26, 35, 126, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'rgba(26, 35, 126, 0.2)',
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
  contentContainer: {
    paddingHorizontal: 25,
  },
  emailSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    marginLeft: 5,
  },
  emailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingHorizontal: 15,
    paddingVertical: 14,
    gap: 12,
  },
  emailText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  emailTextVerified: {
    color: '#2E7D32',
  },
  devOtpContainer: {
    backgroundColor: 'rgba(26, 35, 126, 0.08)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#1a237e',
  },
  devOtpLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1a237e',
    marginBottom: 4,
  },
  devOtpCode: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a237e',
    letterSpacing: 4,
    textAlign: 'center',
    marginVertical: 8,
  },
  devOtpNote: {
    fontSize: 10,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(26, 35, 126, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 25,
    gap: 12,
  },
  statusContainerVerified: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  statusText: {
    flex: 1,
    fontSize: 14,
    color: '#1a237e',
    lineHeight: 20,
  },
  statusTextVerified: {
    color: '#2E7D32',
  },
  otpSection: {
    marginBottom: 25,
  },
  otpTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a237e',
    marginBottom: 20,
    textAlign: 'center',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 10,
  },
  otpInputWrapper: {
    position: 'relative',
  },
  otpInput: {
    width: 55,
    height: 65,
    fontSize: 28,
    fontWeight: '600',
    color: '#1a237e',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    textAlign: 'center',
  },
  otpInputFilled: {
    borderColor: '#1a237e',
    backgroundColor: 'rgba(26, 35, 126, 0.05)',
  },
  otpInputDisabled: {
    opacity: 0.6,
  },
  resendContainer: {
    alignItems: 'center',
    marginBottom: 25,
  },
  timerText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  resendButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  resendLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  resendSpinner: {
    transform: [{ rotate: '0deg' }],
  },
  resendText: {
    fontSize: 14,
    color: '#1a237e',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  verifyButton: {
    borderRadius: 12,
    overflow: 'hidden',
    height: 55,
    marginBottom: 25,
    elevation: 3,
    shadowColor: '#1a237e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  verifyButtonGradient: {
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
  verifyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  verifyButtonDisabled: {
    opacity: 0.7,
  },
  continueButton: {
    borderRadius: 12,
    overflow: 'hidden',
    height: 55,
    marginBottom: 25,
    elevation: 3,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  continueButtonGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  helpContainer: {
    backgroundColor: 'rgba(102, 102, 102, 0.05)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  helpText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  securityNoteText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
});