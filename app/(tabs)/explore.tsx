// app/(tabs)/explore.tsx
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

export default function ExploreScreen() {
  const [searchQuery, setSearchQuery] = useState('');

  const topics = [
    { id: 1, title: 'Global Affairs', icon: 'globe', color: '#4CAF50' },
    { id: 2, title: 'Technology', icon: 'hardware-chip', color: '#2196F3' },
    { id: 3, title: 'Business', icon: 'trending-up', color: '#FF9800' },
    { id: 4, title: 'Health', icon: 'fitness', color: '#E91E63' },
    { id: 5, title: 'Sports', icon: 'football', color: '#3F51B5' },
    { id: 6, title: 'Entertainment', icon: 'film', color: '#9C27B0' },
    { id: 7, title: 'Science', icon: 'flask', color: '#009688' },
    { id: 8, title: 'Lifestyle', icon: 'cafe', color: '#795548' },
  ];

  const trendingHashtags = [
    '#Election2024',
    '#TechNews',
    '#ClimateAction',
    '#StockMarket',
    '#WorldCup',
    '#Oscars2024',
    '#SpaceNews',
    '#AIRevolution',
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Search Header */}
      <View style={styles.searchHeader}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search news, topics, or hashtags"
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        
        {/* Popular Topics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Popular Topics</Text>
          <Text style={styles.sectionSubtitle}>Discover news by category</Text>
          
          <View style={styles.topicsGrid}>
            {topics.map((topic) => (
              <TouchableOpacity key={topic.id} style={styles.topicCard}>
                <View style={[styles.topicIconContainer, { backgroundColor: `${topic.color}15` }]}>
                  <Ionicons name={topic.icon} size={28} color={topic.color} />
                </View>
                <Text style={styles.topicTitle}>{topic.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Trending Now */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Trending Now</Text>
              <Text style={styles.sectionSubtitle}>What's happening worldwide</Text>
            </View>
            <Ionicons name="trending-up" size={24} color="#1a237e" />
          </View>

          {[1, 2, 3].map((item) => (
            <TouchableOpacity key={item} style={styles.trendingItem}>
              <View style={styles.trendingNumber}>
                <Text style={styles.trendingNumberText}>#{item}</Text>
              </View>
              <View style={styles.trendingContent}>
                <Text style={styles.trendingTitle}>Breaking: Major Development in Tech Industry</Text>
                <View style={styles.trendingMeta}>
                  <Text style={styles.trendingSource}>TechCrunch</Text>
                  <Text style={styles.trendingTime}>2h ago</Text>
                  <Text style={styles.trendingStats}>5.2K reads</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Trending Hashtags */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trending Hashtags</Text>
          <View style={styles.hashtagsContainer}>
            {trendingHashtags.map((hashtag, index) => (
              <TouchableOpacity key={index} style={styles.hashtagChip}>
                <Text style={styles.hashtagText}>{hashtag}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Editors Pick */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Editor's Pick</Text>
              <Text style={styles.sectionSubtitle}>Curated by our editorial team</Text>
            </View>
            <Ionicons name="ribbon" size={24} color="#FF3B30" />
          </View>

          <TouchableOpacity style={styles.featuredCard}>
            <View style={styles.featuredContent}>
              <Text style={styles.featuredTag}>EXCLUSIVE</Text>
              <Text style={styles.featuredTitle}>The Future of AI: How Technology is Shaping Tomorrow</Text>
              <Text style={styles.featuredExcerpt}>
                An in-depth analysis of AI advancements and their impact on various industries...
              </Text>
              <View style={styles.featuredMeta}>
                <Text style={styles.featuredSource}>NewsWatch Editorial</Text>
                <Text style={styles.featuredTime}>1d ago • 12 min read</Text>
              </View>
            </View>
            <View style={styles.featuredImage}>
              <Ionicons name="image" size={40} color="#ccc" />
            </View>
          </TouchableOpacity>
        </View>
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
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 20,
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
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 20,
    backgroundColor: '#ffffff',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a237e',
    marginBottom: 5,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  topicsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
    marginTop: 10,
  },
  topicCard: {
    width: '47%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  topicIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  topicTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  trendingItem: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  trendingNumber: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#1a237e',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  trendingNumberText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  trendingContent: {
    flex: 1,
  },
  trendingTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    lineHeight: 20,
  },
  trendingMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  trendingSource: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  trendingTime: {
    fontSize: 12,
    color: '#999',
  },
  trendingStats: {
    fontSize: 12,
    color: '#1a237e',
    fontWeight: '600',
  },
  hashtagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10,
  },
  hashtagChip: {
    backgroundColor: 'rgba(26, 35, 126, 0.1)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  hashtagText: {
    fontSize: 14,
    color: '#1a237e',
    fontWeight: '600',
  },
  featuredCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  featuredContent: {
    flex: 1,
    marginRight: 15,
  },
  featuredTag: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FF3B30',
    marginBottom: 10,
    letterSpacing: 1,
  },
  featuredTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a237e',
    marginBottom: 10,
    lineHeight: 24,
  },
  featuredExcerpt: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 15,
  },
  featuredMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  featuredSource: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
  },
  featuredTime: {
    fontSize: 13,
    color: '#999',
  },
  featuredImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
});