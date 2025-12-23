// app/(auth)/forgot-password.tsx - COMPATIBLE VERSION
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
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
// Use same IP as other screens
const BASE_URL = 'https://news-watch-6zyq.vercel.app'; // Use your computer's IP address

type Step = 'email' | 'otp' | 'newPassword';

export default function ForgotPasswordScreen() {
  const [currentStep, setCurrentStep] = useState<Step>('email');
  const [formData, setFormData] = useState({
    email: '',
    otp: ['', '', '', '', '', ''],
    newPassword: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [timer, setTimer] = useState(600); // 10 minutes = 600 seconds
  const [canResend, setCanResend] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState<string>('');
  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
  });
  
  const otpInputs = useRef<Array<TextInput | null>>([]);

  // Timer for resend OTP
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0 && !canResend && currentStep === 'otp') {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [timer, canResend, currentStep]);

  // Check password requirements
  useEffect(() => {
    if (currentStep === 'newPassword') {
      const password = formData.newPassword;
      setPasswordRequirements({
        length: password.length >= 6,
      });
    }
  }, [formData.newPassword, currentStep]);

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    if (field === 'otp') {
      // Handle OTP as array
      return;
    }
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleOtpChange = (text: string, index: number) => {
    // Only allow numbers
    const numericText = text.replace(/[^0-9]/g, '');
    
    if (numericText.length <= 1) {
      const newOtp = [...formData.otp];
      newOtp[index] = numericText;
      setFormData(prev => ({ ...prev, otp: newOtp }));

      // Auto focus next input
      if (numericText !== '' && index < 5) {
        setTimeout(() => {
          otpInputs.current[index + 1]?.focus();
        }, 10);
      }

      // Auto-verify when all digits are filled
      if (index === 5 && numericText !== '') {
        const finalOtp = [...newOtp];
        if (finalOtp.every(digit => digit !== '')) {
          handleVerifyOtp();
        }
      }
    }
  };

  const handleKeyPress = (e: NativeSyntheticEvent<TextInputKeyPressEventData>, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && formData.otp[index] === '' && index > 0) {
      setTimeout(() => {
        otpInputs.current[index - 1]?.focus();
      }, 10);
    }
  };

  const handleSendOtp = async () => {
    if (!formData.email.trim()) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      // Prepare forgot password request
      const forgotData = {
        email: formData.email.trim().toLowerCase(),
      };

      console.log('📧 Sending forgot password OTP to:', forgotData.email);

      // Make API call to request password reset
      const response = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(forgotData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send OTP');
      }

      if (data.success) {
        console.log('✅ OTP sent successfully');
        
        // Save email for later use
        await AsyncStorage.setItem('resetPasswordEmail', formData.email);
        
        // Store dev OTP if provided
        if (data.otp) {
          setGeneratedOtp(data.otp);
          console.log('🔐 Dev OTP for forgot password:', data.otp);
        }
        
        // Move to OTP step
        setCurrentStep('otp');
        setTimer(600); // 10 minutes
        setCanResend(false);
        
        Alert.alert('OTP Sent', `Verification code has been sent to ${formData.email}`);
      } else {
        Alert.alert('Error', data.message || 'Something went wrong');
      }
    } catch (error: any) {
      console.error('Forgot password error:', error);
      
      // For security, we show same message whether user exists or not
      if (error.message.includes('Network request failed')) {
        Alert.alert('Connection Error', 'Unable to connect to the server. Please check your internet connection and try again.');
      } else {
        Alert.alert('Information', 'If an account exists with this email, a reset code will be sent.');
        // Still move to OTP step for user experience
        setCurrentStep('otp');
        setTimer(600);
        setCanResend(false);
        await AsyncStorage.setItem('resetPasswordEmail', formData.email);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const otpString = formData.otp.join('');
    
    if (otpString.length !== 6) {
      Alert.alert('Error', 'Please enter all 6 digits of the OTP');
      return;
    }

    if (!/^\d{6}$/.test(otpString)) {
      Alert.alert('Error', 'OTP must be 6 digits');
      return;
    }

    setIsLoading(true);

    try {
      // Get email from storage
      const email = await AsyncStorage.getItem('resetPasswordEmail');
      if (!email) {
        throw new Error('Email not found. Please start the process again.');
      }

      console.log('🔐 Verifying reset OTP for:', email);

      // Prepare verification data
      const verifyData = {
        email: email.toLowerCase(),
        otp: otpString,
      };

      // Make API call to verify OTP (using same endpoint as signup)
      const response = await fetch(`${BASE_URL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(verifyData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'OTP verification failed');
      }

      if (data.success) {
        console.log('✅ OTP verified successfully');
        
        // Move to password reset step
        setCurrentStep('newPassword');
        Alert.alert('Verified', 'OTP verified successfully. Now set your new password.');
      } else {
        Alert.alert('Error', data.message || 'Verification failed');
      }
    } catch (error: any) {
      console.error('OTP verification error:', error);
      
      if (error.message.includes('Invalid OTP') || error.message.includes('expired')) {
        Alert.alert(
          'Invalid OTP',
          'The code is invalid or has expired.',
          [
            {
              text: 'Resend OTP',
              onPress: handleResendOtp,
            },
            {
              text: 'Try Again',
              style: 'cancel',
            },
          ]
        );
      } else if (error.message.includes('Network request failed')) {
        Alert.alert('Connection Error', 'Unable to connect to the server. Please check your internet connection and try again.');
      } else {
        Alert.alert('Error', error.message || 'Failed to verify OTP. Please try again.');
      }
      
      // Clear OTP on error
      setFormData(prev => ({ ...prev, otp: ['', '', '', '', '', ''] }));
      otpInputs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    // Validation
    if (!formData.newPassword) {
      Alert.alert('Error', 'Please enter new password');
      return;
    }

    if (!formData.confirmPassword) {
      Alert.alert('Error', 'Please confirm your password');
      return;
    }

    if (formData.newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      // Get email and OTP from storage
      const email = await AsyncStorage.getItem('resetPasswordEmail');
      const otpString = formData.otp.join('');
      
      if (!email || !otpString) {
        throw new Error('Session expired. Please start the process again.');
      }

      // Prepare reset data
      const resetData = {
        email: email.toLowerCase(),
        otp: otpString,
        newPassword: formData.newPassword,
      };

      console.log('🔄 Resetting password for:', email);

      // Make API call to reset password
      const response = await fetch(`${BASE_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(resetData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Password reset failed');
      }

      if (data.success) {
        console.log('✅ Password reset successful');
        
        // Clear stored data
        await AsyncStorage.removeItem('resetPasswordEmail');
        
        Alert.alert(
          'Success',
          'Password reset successfully!',
          [
            {
              text: 'Sign In',
              onPress: () => router.replace('/(auth)/login'),
            },
          ]
        );
      } else {
        Alert.alert('Error', data.message || 'Something went wrong');
      }
    } catch (error: any) {
      console.error('Reset password error:', error);
      
      if (error.message.includes('Invalid OTP') || error.message.includes('expired')) {
        Alert.alert(
          'Session Expired',
          'Your OTP has expired. Please start the password reset process again.',
          [
            {
              text: 'Start Over',
              onPress: () => {
                setCurrentStep('email');
                setFormData({
                  email: '',
                  otp: ['', '', '', '', '', ''],
                  newPassword: '',
                  confirmPassword: '',
                });
              },
            },
          ]
        );
      } else if (error.message.includes('Network request failed')) {
        Alert.alert('Connection Error', 'Unable to connect to the server. Please check your internet connection and try again.');
      } else {
        Alert.alert('Error', error.message || 'Failed to reset password. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend) return;

    setIsResending(true);

    try {
      const email = await AsyncStorage.getItem('resetPasswordEmail');
      if (!email) {
        Alert.alert('Error', 'Email not found. Please start the process again.');
        return;
      }

      console.log('📧 Resending OTP to:', email);

      // Prepare resend data
      const resendData = {
        email: email.toLowerCase(),
        type: 'reset_password'
      };

      // Make API call to resend OTP
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
        setFormData(prev => ({ ...prev, otp: ['', '', '', '', '', ''] }));
        otpInputs.current[0]?.focus();
        
        // Store dev OTP if provided
        if (data.otp) {
          setGeneratedOtp(data.otp);
          console.log('🔐 New dev OTP for reset:', data.otp);
        }
        
        Alert.alert('OTP Sent', 'A new verification code has been sent to your email.');
      } else {
        Alert.alert('Error', data.message || 'Failed to resend OTP');
      }
    } catch (error: any) {
      console.error('Resend OTP error:', error);
      Alert.alert('Error', error.message || 'Failed to resend OTP. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const handleBack = () => {
    if (currentStep === 'otp') {
      setCurrentStep('email');
    } else if (currentStep === 'newPassword') {
      setCurrentStep('otp');
    } else {
      router.back();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const renderStepIndicator = () => {
    const steps = ['Email', 'Verify', 'Reset'];
    const currentIndex = steps.findIndex(step => 
      step.toLowerCase() === currentStep.replace(/(email|otp|newPassword)/, (match) => {
        if (match === 'email') return 'email';
        if (match === 'otp') return 'verify';
        return 'reset';
      })
    );

    return (
      <View style={styles.stepIndicatorContainer}>
        {steps.map((step, index) => (
          <React.Fragment key={step}>
            <View style={styles.stepItem}>
              <View style={[
                styles.stepCircle,
                index <= currentIndex && styles.stepCircleActive,
              ]}>
                <Text style={[
                  styles.stepNumber,
                  index <= currentIndex && styles.stepNumberActive,
                ]}>
                  {index + 1}
                </Text>
              </View>
              <Text style={[
                styles.stepLabel,
                index <= currentIndex && styles.stepLabelActive,
              ]}>
                {step}
              </Text>
            </View>
            {index < steps.length - 1 && (
              <View style={[
                styles.stepLine,
                index < currentIndex && styles.stepLineActive,
              ]} />
            )}
          </React.Fragment>
        ))}
      </View>
    );
  };

  const renderPasswordRequirements = () => {
    return (
      <View style={styles.passwordRequirements}>
        <Text style={styles.requirementsTitle}>Password Requirements:</Text>
        <View style={styles.requirementItem}>
          <Ionicons 
            name={passwordRequirements.length ? "checkmark-circle" : "ellipse-outline"} 
            size={16} 
            color={passwordRequirements.length ? "#4CAF50" : "#666"} 
          />
          <Text style={[
            styles.requirementText,
            passwordRequirements.length && styles.requirementTextMet
          ]}>
            At least 6 characters
          </Text>
        </View>
        <View style={styles.requirementItem}>
          <Ionicons 
            name="information-circle-outline" 
            size={16} 
            color="#666" 
          />
          <Text style={styles.requirementText}>
            For better security, include letters and numbers
          </Text>
        </View>
      </View>
    );
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
            <Text style={styles.headerTitle}>Reset Password</Text>
            <View style={styles.headerPlaceholder} />
          </View>

          {/* Logo */}
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Ionicons name="lock-closed" size={32} color="#fff" />
            </View>
            <Text style={styles.appTitle}>NewsWatch</Text>
            <Text style={styles.subtitle}>Secure Password Recovery</Text>
          </View>

          {/* Server Connection Note */}
          <View style={styles.serverNote}>
            <Ionicons name="information-circle-outline" size={14} color="#666" />
            <Text style={styles.serverNoteText}>
              Server: {BASE_URL.replace('http://', '')}
            </Text>
          </View>

          {/* For development: Show OTP */}
          {generatedOtp && currentStep === 'otp' && (
            <View style={styles.devOtpContainer}>
              <Text style={styles.devOtpLabel}>DEV MODE - Your Code:</Text>
              <Text style={styles.devOtpCode}>{generatedOtp}</Text>
              <Text style={styles.devOtpNote}>This is shown only in development mode</Text>
            </View>
          )}

          {/* Step Indicator */}
          {renderStepIndicator()}

          {/* Content */}
          <View style={styles.contentContainer}>
            {currentStep === 'email' && (
              <View style={styles.stepContent}>
                <Text style={styles.sectionTitle}>Enter your Email</Text>
                <Text style={styles.sectionSubtitle}>
                  Enter your registered email to receive a password reset code
                </Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your registered email"
                    value={formData.email}
                    onChangeText={(text) => handleInputChange('email', text)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isLoading}
                  />
                </View>
                
                <TouchableOpacity
                  style={[styles.actionButton, isLoading && styles.actionButtonDisabled]}
                  onPress={handleSendOtp}
                  disabled={isLoading}
                >
                  <LinearGradient
                    colors={['#1a237e', '#283593', '#3949ab']}
                    style={styles.actionButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    {isLoading ? (
                      <View style={styles.loadingContainer}>
                        <Ionicons name="sync" size={20} color="#fff" style={styles.spinner} />
                        <Text style={styles.actionButtonText}>Sending OTP...</Text>
                      </View>
                    ) : (
                      <Text style={styles.actionButtonText}>Send Verification Code</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}

            {currentStep === 'otp' && (
              <View style={styles.stepContent}>
                <Text style={styles.sectionTitle}>Verification Code</Text>
                <Text style={styles.sectionSubtitle}>
                  Enter the 6-digit code sent to your email
                </Text>
                
                {/* OTP Inputs */}
                <View style={styles.otpContainer}>
                  {formData.otp.map((digit, index) => (
                    <View key={index} style={styles.otpInputWrapper}>
                      <TextInput
                        ref={(ref) => (otpInputs.current[index] = ref)}
                        style={[
                          styles.otpInput,
                          digit !== '' && styles.otpInputFilled,
                          (isLoading || isResending) && styles.otpInputDisabled,
                        ]}
                        value={digit}
                        onChangeText={(text) => handleOtpChange(text, index)}
                        onKeyPress={(e) => handleKeyPress(e, index)}
                        keyboardType="numeric"
                        maxLength={1}
                        textAlign="center"
                        editable={!isLoading && !isResending}
                        selectTextOnFocus
                        placeholder="-"
                        placeholderTextColor="#ccc"
                      />
                      {index < 5 && <View style={styles.otpSeparator} />}
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
                    <TouchableOpacity onPress={handleResendOtp} disabled={isLoading || isResending}>
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
                
                <TouchableOpacity
                  style={[
                    styles.actionButton, 
                    (isLoading || formData.otp.join('').length !== 6) && styles.actionButtonDisabled
                  ]}
                  onPress={handleVerifyOtp}
                  disabled={isLoading || formData.otp.join('').length !== 6}
                >
                  <LinearGradient
                    colors={['#1a237e', '#283593', '#3949ab']}
                    style={styles.actionButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    {isLoading ? (
                      <View style={styles.loadingContainer}>
                        <Ionicons name="sync" size={20} color="#fff" style={styles.spinner} />
                        <Text style={styles.actionButtonText}>Verifying...</Text>
                      </View>
                    ) : (
                      <Text style={styles.actionButtonText}>Verify Code</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}

            {currentStep === 'newPassword' && (
              <View style={styles.stepContent}>
                {/* Password Requirements */}
                {renderPasswordRequirements()}

                {/* New Password */}
                <View style={styles.inputGroup}>
                  <Text style={styles.sectionTitle}>Enter New Password</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter new password"
                      value={formData.newPassword}
                      onChangeText={(text) => handleInputChange('newPassword', text)}
                      secureTextEntry={!showNewPassword}
                      editable={!isLoading}
                    />
                    <TouchableOpacity
                      style={styles.eyeIcon}
                      onPress={() => setShowNewPassword(!showNewPassword)}
                      disabled={isLoading}
                    >
                      <Ionicons
                        name={showNewPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={20}
                        color="#666"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Confirm Password */}
                <View style={styles.inputGroup}>
                  <Text style={styles.sectionTitle}>Re Enter your Password</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Confirm new password"
                      value={formData.confirmPassword}
                      onChangeText={(text) => handleInputChange('confirmPassword', text)}
                      secureTextEntry={!showConfirmPassword}
                      editable={!isLoading}
                    />
                    <TouchableOpacity
                      style={styles.eyeIcon}
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                      disabled={isLoading}
                    >
                      <Ionicons
                        name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={20}
                        color="#666"
                      />
                    </TouchableOpacity>
                  </View>
                </View>
                
                <TouchableOpacity
                  style={[
                    styles.actionButton, 
                    isLoading && styles.actionButtonDisabled
                  ]}
                  onPress={handleResetPassword}
                  disabled={isLoading || 
                    formData.newPassword !== formData.confirmPassword ||
                    formData.newPassword.length < 6
                  }
                >
                  <LinearGradient
                    colors={['#1a237e', '#283593', '#3949ab']}
                    style={styles.actionButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    {isLoading ? (
                      <View style={styles.loadingContainer}>
                        <Ionicons name="sync" size={20} color="#fff" style={styles.spinner} />
                        <Text style={styles.actionButtonText}>Resetting...</Text>
                      </View>
                    ) : (
                      <Text style={styles.actionButtonText}>Reset Password</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}

            {/* Security Note */}
            <View style={styles.securityNote}>
              <Ionicons name="shield-checkmark-outline" size={14} color="#666" />
              <Text style={styles.securityNoteText}>
                This process is secure. Your password will be encrypted and never shared.
              </Text>
            </View>

            {/* Sign In Link */}
            <TouchableOpacity 
              style={styles.signInContainer}
              onPress={() => router.replace('/(auth)/login')}
              disabled={isLoading}
            >
              <Text style={styles.signInText}>Remember password? </Text>
              <Text style={styles.signInLink}>Sign In</Text>
            </TouchableOpacity>
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
    paddingBottom: 20,
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
    marginBottom: 30,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1a237e',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1a237e',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
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
  devOtpContainer: {
    backgroundColor: 'rgba(26, 35, 126, 0.08)',
    borderRadius: 12,
    padding: 15,
    marginHorizontal: 25,
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
  stepIndicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  stepItem: {
    alignItems: 'center',
  },
  stepCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepCircleActive: {
    borderColor: '#1a237e',
    backgroundColor: '#1a237e',
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ccc',
  },
  stepNumberActive: {
    color: '#fff',
  },
  stepLabel: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },
  stepLabelActive: {
    color: '#1a237e',
  },
  stepLine: {
    width: 50,
    height: 2,
    backgroundColor: '#ccc',
    marginHorizontal: 5,
    marginTop: -20,
  },
  stepLineActive: {
    backgroundColor: '#1a237e',
  },
  contentContainer: {
    paddingHorizontal: 25,
  },
  stepContent: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
    marginLeft: 5,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 25,
    textAlign: 'center',
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 25,
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
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 25,
  },
  otpInputWrapper: {
    position: 'relative',
    marginHorizontal: 4,
  },
  otpInput: {
    width: 45,
    height: 55,
    fontSize: 22,
    fontWeight: '600',
    color: '#333',
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    textAlign: 'center',
  },
  otpInputFilled: {
    borderColor: '#1a237e',
    backgroundColor: 'rgba(26, 35, 126, 0.05)',
  },
  otpInputDisabled: {
    opacity: 0.7,
  },
  otpSeparator: {
    position: 'absolute',
    right: -4,
    top: '50%',
    width: 8,
    height: 2,
    backgroundColor: '#ccc',
  },
  resendContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  timerText: {
    fontSize: 14,
    color: '#666',
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
  actionButton: {
    borderRadius: 12,
    overflow: 'hidden',
    height: 55,
  },
  actionButtonGradient: {
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
    animation: 'spin 1s linear infinite',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  actionButtonDisabled: {
    opacity: 0.7,
  },
  passwordRequirements: {
    backgroundColor: 'rgba(26, 35, 126, 0.05)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 25,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a237e',
    marginBottom: 10,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  requirementText: {
    fontSize: 13,
    color: '#666',
  },
  requirementTextMet: {
    color: '#2E7D32',
    fontWeight: '500',
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    backgroundColor: 'rgba(102, 102, 102, 0.05)',
    borderRadius: 8,
    marginBottom: 20,
  },
  securityNoteText: {
    flex: 1,
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
    fontStyle: 'italic',
  },
  signInContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  signInText: {
    color: '#666',
    fontSize: 15,
  },
  signInLink: {
    color: '#1a237e',
    fontSize: 15,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});