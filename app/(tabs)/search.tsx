// app/(tabs)/search.tsx
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState([
    'Election 2024',
    'AI Technology',
    'Stock Market',
    'Climate Change',
    'Sports News',
  ]);

  const searchSuggestions = [
    'Breaking news today',
    'Latest technology updates',
    'Business news',
    'Sports highlights',
    'Entertainment gossip',
    'Health tips',
    'Science discoveries',
    'Political analysis',
  ];

  const removeRecentSearch = (search: string) => {
    setRecentSearches(prev => prev.filter(s => s !== search));
  };

  const clearAllRecent = () => {
    setRecentSearches([]);
  };

  return (
    <View style={styles.container}>
      {/* Search Header */}
      <View style={styles.searchHeader}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={22} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="What are you looking for?"
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
        
        {searchQuery.length === 0 ? (
          <>
            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Recent Searches</Text>
                  <TouchableOpacity onPress={clearAllRecent}>
                    <Text style={styles.clearAllText}>Clear All</Text>
                  </TouchableOpacity>
                </View>
                
                {recentSearches.map((search, index) => (
                  <TouchableOpacity key={index} style={styles.recentItem}>
                    <Ionicons name="time-outline" size={20} color="#666" />
                    <Text style={styles.recentText}>{search}</Text>
                    <TouchableOpacity 
                      onPress={() => removeRecentSearch(search)}
                      style={styles.removeButton}
                    >
                      <Ionicons name="close" size={18} color="#999" />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Search Suggestions */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Try Searching For</Text>
              
              <View style={styles.suggestionsGrid}>
                {searchSuggestions.map((suggestion, index) => (
                  <TouchableOpacity 
                    key={index} 
                    style={styles.suggestionChip}
                    onPress={() => setSearchQuery(suggestion)}
                  >
                    <Text style={styles.suggestionText}>{suggestion}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Trending Topics */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Trending Topics</Text>
                <Ionicons name="trending-up" size={22} color="#1a237e" />
              </View>
              
              <View style={styles.trendingList}>
                {[
                  { topic: '#AIRevolution', posts: '45.2K' },
                  { topic: '#ClimateAction', posts: '38.7K' },
                  { topic: '#GlobalEconomy', posts: '32.1K' },
                  { topic: '#TechNews', posts: '28.9K' },
                  { topic: '#SportsUpdate', posts: '25.4K' },
                ].map((item, index) => (
                  <TouchableOpacity key={index} style={styles.trendingItem}>
                    <View style={styles.trendingRank}>
                      <Text style={styles.trendingRankText}>{index + 1}</Text>
                    </View>
                    <View style={styles.trendingContent}>
                      <Text style={styles.trendingTopic}>{item.topic}</Text>
                      <Text style={styles.trendingPosts}>{item.posts} posts</Text>
                    </View>
                    <Ionicons name="arrow-forward" size={18} color="#ccc" />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </>
        ) : (
          /* Search Results */
          <View style={styles.section}>
            <Text style={styles.resultsTitle}>
              Results for "{searchQuery}"
            </Text>
            
            {/* Placeholder for search results */}
            <View style={styles.noResults}>
              <Ionicons name="search-outline" size={60} color="#ccc" />
              <Text style={styles.noResultsText}>
                Start typing to see search results
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  searchHeader: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 50,
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
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#ffffff',
    padding: 20,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a237e',
  },
  clearAllText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  recentText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  removeButton: {
    padding: 4,
  },
  suggestionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  suggestionChip: {
    backgroundColor: 'rgba(26, 35, 126, 0.05)',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 8,
  },
  suggestionText: {
    fontSize: 14,
    color: '#1a237e',
    fontWeight: '500',
  },
  trendingList: {
    marginTop: 10,
  },
  trendingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  trendingRank: {
    width: 30,
    height: 30,
    borderRadius: 6,
    backgroundColor: '#1a237e',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  trendingRankText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  trendingContent: {
    flex: 1,
  },
  trendingTopic: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  trendingPosts: {
    fontSize: 12,
    color: '#666',
  },
  resultsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a237e',
    marginBottom: 20,
  },
  noResults: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  noResultsText: {
    fontSize: 16,
    color: '#999',
    marginTop: 15,
    textAlign: 'center',
  },
});