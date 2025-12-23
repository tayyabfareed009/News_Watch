import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  FlatList,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

// ⚠️ IMPORTANT: Change this to your actual server IP address
const BASE_URL = 'https://news-watch-6zyq.vercel.app'; // Use your computer's IP address

const cities = [
  'Kolkata',
  'Delhi',
  'Bangalore',
  'Kochi',
  'Noida',
  'Mumbai',
  'Chennai',
  'Hyderabad',
  'Pune',
  'Ahmedabad',
  'Jaipur',
  'Lucknow',
  'Chandigarh',
  'Bhubaneswar',
  'Guwahati',
];

export default function LocationScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userToken, setUserToken] = useState<string | null>(null);

  useEffect(() => {
    checkUserAuth();
  }, []);

  const checkUserAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      setUserToken(token);
    } catch (error) {
      console.error('Error checking auth:', error);
    }
  };

  const filteredCities = cities.filter(city =>
    city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCitySelect = (city: string) => {
    setSelectedCity(city);
  };

  const handleNext = async () => {
    if (!selectedCity) {
      alert('Please select a city');
      return;
    }

    setIsLoading(true);

    try {
      // Save location locally
      await AsyncStorage.setItem('userLocation', selectedCity);
      
      // If user is logged in, update location on server
      if (userToken) {
        await updateUserLocationOnServer(selectedCity);
      }
      
      // Navigate to home
      router.replace('/(tabs)');
      
    } catch (error) {
      console.error('Error saving location:', error);
      alert('Failed to save location. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserLocationOnServer = async (location: string) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      const response = await fetch(`${BASE_URL}/api/user/location`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ location }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update location');
      }

      console.log('✅ Location updated on server:', location);
      
      // Update local user data
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const user = JSON.parse(userData);
        user.location = location;
        await AsyncStorage.setItem('userData', JSON.stringify(user));
      }

    } catch (error) {
      console.error('Error updating location on server:', error);
      // Don't show error to user - location is saved locally anyway
    }
  };

  const handleSkip = async () => {
    try {
      // Set default location
      await AsyncStorage.setItem('userLocation', 'Not Set');
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Error skipping location:', error);
      router.replace('/(tabs)');
    }
  };

  const renderCityItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={[
        styles.cityItem,
        selectedCity === item && styles.cityItemSelected,
      ]}
      onPress={() => handleCitySelect(item)}
      activeOpacity={0.7}
      disabled={isLoading}
    >
      <Ionicons
        name="location-outline"
        size={22}
        color={selectedCity === item ? '#fff' : '#666'}
      />
      <Text
        style={[
          styles.cityName,
          selectedCity === item && styles.cityNameSelected,
        ]}
      >
        {item}
      </Text>
      {selectedCity === item && (
        <Ionicons name="checkmark-circle" size={22} color="#fff" />
      )}
    </TouchableOpacity>
  );

  return (
    <LinearGradient
      colors={['#ffffff', '#f5f7ff', '#e8ecff']}
      style={styles.container}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoText}>NW</Text>
            </View>
            <Text style={styles.appTitle}>NewsWatch</Text>
          </View>
          <Text style={styles.headerSubtitle}>
            Select your location for personalized news
          </Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={22} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search your city"
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="words"
            editable={!isLoading}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity 
              onPress={() => setSearchQuery('')}
              disabled={isLoading}
            >
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>

        {/* Selected City Display */}
        {selectedCity && (
          <View style={styles.selectedCityContainer}>
            <Text style={styles.selectedLabel}>Selected:</Text>
            <View style={styles.selectedCityBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              <Text style={styles.selectedCityText}>{selectedCity}</Text>
            </View>
          </View>
        )}

        {/* Cities List */}
        <View style={styles.citiesContainer}>
          <Text style={styles.citiesTitle}>Popular Cities</Text>
          <FlatList
            data={filteredCities}
            renderItem={renderCityItem}
            keyExtractor={(item) => item}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.citiesList}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="location-off-outline" size={50} color="#ccc" />
                <Text style={styles.emptyText}>No cities found</Text>
              </View>
            }
          />
        </View>

        {/* Next Button */}
        <TouchableOpacity
          style={[styles.nextButton, (!selectedCity || isLoading) && styles.nextButtonDisabled]}
          onPress={handleNext}
          disabled={!selectedCity || isLoading}
        >
          <LinearGradient
            colors={selectedCity ? ['#1a237e', '#283593', '#3949ab'] : ['#ccc', '#ddd']}
            style={styles.nextButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {isLoading ? (
              <>
                <Ionicons name="sync" size={20} color="#fff" style={styles.spinner} />
                <Text style={styles.nextButtonText}>Saving...</Text>
              </>
            ) : (
              <>
                <Text style={styles.nextButtonText}>Continue</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Skip for now */}
        <TouchableOpacity 
          style={styles.skipButton}
          onPress={handleSkip}
          disabled={isLoading}
        >
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>

        {/* Server Connection Note */}
        <View style={styles.serverNote}>
          <Ionicons name="information-circle-outline" size={14} color="#666" />
          <Text style={styles.serverNoteText}>
            {userToken ? 'Location will sync with your account' : 'Sign in to sync location across devices'}
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 30,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  logoCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#1a237e',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  appTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1a237e',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
    lineHeight: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingHorizontal: 15,
    height: 55,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    height: '100%',
  },
  selectedCityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  selectedLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 10,
  },
  selectedCityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  selectedCityText: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '600',
  },
  citiesContainer: {
    flex: 1,
    marginBottom: 20,
  },
  citiesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
    paddingLeft: 5,
  },
  citiesList: {
    paddingBottom: 10,
  },
  cityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 18,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    gap: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cityItemSelected: {
    backgroundColor: '#1a237e',
    borderColor: '#1a237e',
    shadowColor: '#1a237e',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  cityName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  cityNameSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 10,
  },
  nextButton: {
    borderRadius: 12,
    overflow: 'hidden',
    height: 55,
    marginBottom: 15,
  },
  nextButtonGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  nextButtonDisabled: {
    opacity: 0.7,
  },
  skipButton: {
    alignItems: 'center',
    marginBottom: 15,
  },
  skipText: {
    fontSize: 15,
    color: '#666',
    textDecorationLine: 'underline',
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
    gap: 6,
  },
  serverNoteText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    textAlign: 'center',
  },
  spinner: {
    transform: [{ rotate: '0deg' }],
  },
});