// components/BreakingNews.tsx - UPDATED WITH PROPER EXPORT
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const breakingNewsData = [
  {
    id: 1,
    title: 'Major Tech Conference Announces New AI Breakthrough',
    time: '10 min ago',
    category: 'Technology',
    isLive: true,
  },
  {
    id: 2,
    title: 'Stock Markets Reach All-Time High Amid Economic Recovery',
    time: '25 min ago',
    category: 'Business',
    isLive: true,
  },
  {
    id: 3,
    title: 'Historic Peace Agreement Signed Between Nations',
    time: '1 hour ago',
    category: 'Politics',
    isLive: false,
  },
  {
    id: 4,
    title: 'Record-Breaking Sports Event Draws Global Audience',
    time: '2 hours ago',
    category: 'Sports',
    isLive: true,
  },
];

const BreakingNews = () => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {breakingNewsData.map((item) => (
        <TouchableOpacity key={item.id} style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.categoryContainer}>
              <Text style={styles.category}>{item.category}</Text>
            </View>
            {item.isLive && (
              <View style={styles.liveBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
            )}
          </View>
          
          <Text style={styles.title} numberOfLines={2}>
            {item.title}
          </Text>
          
          <View style={styles.cardFooter}>
            <Ionicons name="time-outline" size={14} color="#666" />
            <Text style={styles.time}>{item.time}</Text>
          </View>
          
          <View style={styles.breakingLabel}>
            <Ionicons name="flame" size={12} color="#fff" />
            <Text style={styles.breakingText}>BREAKING</Text>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 5,
    gap: 15,
  },
  card: {
    width: 280,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    position: 'relative',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryContainer: {
    backgroundColor: 'rgba(26, 35, 126, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  category: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1a237e',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF3B30',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
  },
  liveText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    lineHeight: 22,
    marginBottom: 15,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  time: {
    fontSize: 12,
    color: '#666',
  },
  breakingLabel: {
    position: 'absolute',
    top: -10,
    right: 15,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF3B30',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 4,
  },
  breakingText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default BreakingNews; // Make sure this export is there