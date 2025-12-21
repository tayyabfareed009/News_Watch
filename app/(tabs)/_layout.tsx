// app/(tabs)/_layout.tsx - UPDATED WITH ALL SCREENS
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Tabs, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [userName, setUserName] = useState<string>('');
  const [userLocation, setUserLocation] = useState<string>('');
  const [userProfileImage, setUserProfileImage] = useState<string>('');

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      const location = await AsyncStorage.getItem('userLocation');
      
      if (userData) {
        const user = JSON.parse(userData);
        setUserName(user.name || '');
        setUserProfileImage(user.profileImage || '');
      }
      
      if (location && location !== 'Not Set') {
        setUserLocation(location);
      } else {
        // If no location is set, redirect to location screen
        const onboardingCompleted = await AsyncStorage.getItem('onboardingCompleted');
        if (!onboardingCompleted || onboardingCompleted !== 'true') {
          router.push('/locations');
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const navigateToProfile = () => {
    router.push('/(tabs)/profile');
  };

  const navigateToLocation = () => {
    router.push('/locations');
  };

  const renderHeader = () => (
    <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
      <View style={styles.headerLeft}>
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>NW</Text>
          </View>
          <View>
            <Text style={styles.appName}>NewsWatch</Text>
            <Text style={styles.appTagline}>Stay Informed</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.headerRight}>
        <TouchableOpacity 
          style={styles.locationButton}
          onPress={navigateToLocation}
          activeOpacity={0.7}
        >
          <Ionicons name="location" size={14} color="#1a237e" />
          <Text style={styles.locationText} numberOfLines={1}>
            {userLocation || 'Set Location'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.profileButton}
          onPress={navigateToProfile}
          activeOpacity={0.7}
        >
          {userProfileImage ? (
            <View style={styles.profileImageContainer}>
              <Ionicons name="person" size={16} color="#fff" />
            </View>
          ) : userName ? (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {userName.charAt(0).toUpperCase()}
              </Text>
            </View>
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person-outline" size={20} color="#1a237e" />
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {renderHeader()}
      
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: styles.tabBar,
          tabBarActiveTintColor: '#1a237e',
          tabBarInactiveTintColor: '#666',
          tabBarLabelStyle: styles.tabBarLabel,
          tabBarIconStyle: styles.tabBarIcon,
          tabBarShowLabel: true,
          tabBarHideOnKeyboard: true,
        }}>
        
        {/* HOME - First Tab */}
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons 
                name={focused ? 'home' : 'home-outline'} 
                size={size} 
                color={color} 
              />
            ),
          }}
        />
        
        {/* EXPLORE - Second Tab */}
        <Tabs.Screen
          name="explore"
          options={{
            title: 'Explore',
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons 
                name={focused ? 'compass' : 'compass-outline'} 
                size={size} 
                color={color} 
              />
            ),
          }}
        />
        
        {/* SEARCH - Third Tab */}
        <Tabs.Screen
          name="search"
          options={{
            title: 'Search',
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons 
                name={focused ? 'search' : 'search-outline'} 
                size={size} 
                color={color} 
              />
            ),
          }}
        />
        
        {/* SAVED - Fourth Tab */}
        <Tabs.Screen
          name="saved"
          options={{
            title: 'Saved',
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons 
                name={focused ? 'bookmark' : 'bookmark-outline'} 
                size={size} 
                color={color} 
              />
            ),
          }}
        />
        
        {/* PROFILE - Fifth Tab */}
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons 
                name={focused ? 'person' : 'person-outline'} 
                size={size} 
                color={color} 
              />
            ),
          }}
        />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 15,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    zIndex: 100,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#1a237e',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1a237e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  logoText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  appName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1a237e',
    letterSpacing: -0.5,
  },
  appTagline: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(26, 35, 126, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    gap: 6,
    maxWidth: 120,
  },
  locationText: {
    fontSize: 12,
    color: '#1a237e',
    fontWeight: '600',
    flexShrink: 1,
  },
  profileButton: {
    marginLeft: 5,
  },
  profileImageContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1a237e',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#f0f0f0',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1a237e',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#f0f0f0',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(26, 35, 126, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(26, 35, 126, 0.2)',
  },
  tabBar: {
    height: Platform.OS === 'ios' ? 85 : 65,
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
    paddingTop: 10,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 10,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  tabBarIcon: {
    marginBottom: 0,
  },
});