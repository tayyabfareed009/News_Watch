// components/NewsCard.tsx
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface NewsCardProps {
  id?: number;
  title?: string;
  source?: string;
  time?: string;
  category?: string;
  excerpt?: string;
  isBookmarked?: boolean;
  onBookmarkPress?: () => void;
}

export default function NewsCard({
  id = 1,
  title = 'Global Climate Summit Reaches Historic Agreement on Emissions Reduction',
  source = 'World News Network',
  time = '3 hours ago',
  category = 'Environment',
  excerpt = 'World leaders have reached a groundbreaking agreement to reduce carbon emissions by 50% by 2030...',
  isBookmarked = false,
  onBookmarkPress,
}: NewsCardProps) {
  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.9}>
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <View style={styles.sourceContainer}>
            <View style={styles.sourceLogo}>
              <Text style={styles.sourceLogoText}>
                {source.charAt(0)}
              </Text>
            </View>
            <View>
              <Text style={styles.sourceName}>{source}</Text>
              <Text style={styles.time}>{time}</Text>
            </View>
          </View>
          
          <TouchableOpacity 
            onPress={onBookmarkPress}
            style={styles.bookmarkButton}
          >
            <Ionicons
              name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
              size={22}
              color={isBookmarked ? '#1a237e' : '#666'}
            />
          </TouchableOpacity>
        </View>
        
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        
        <Text style={styles.excerpt} numberOfLines={2}>
          {excerpt}
        </Text>
        
        <View style={styles.cardFooter}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{category}</Text>
          </View>
          
          <View style={styles.stats}>
            <View style={styles.stat}>
              <Ionicons name="eye-outline" size={14} color="#666" />
              <Text style={styles.statText}>2.5K</Text>
            </View>
            <View style={styles.stat}>
              <Ionicons name="chatbubble-outline" size={14} color="#666" />
              <Text style={styles.statText}>142</Text>
            </View>
            <View style={styles.stat}>
              <Ionicons name="heart-outline" size={14} color="#666" />
              <Text style={styles.statText}>89</Text>
            </View>
          </View>
        </View>
      </View>
      
      <View style={styles.imageContainer}>
        <View style={styles.imagePlaceholder}>
          <Ionicons name="image" size={40} color="#ccc" />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 15,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 2,
  },
  cardContent: {
    flex: 1,
    marginRight: 15,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  sourceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sourceLogo: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#1a237e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sourceLogoText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  sourceName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  time: {
    fontSize: 12,
    color: '#666',
  },
  bookmarkButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a237e',
    lineHeight: 24,
    marginBottom: 10,
  },
  excerpt: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 15,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryBadge: {
    backgroundColor: 'rgba(26, 35, 126, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1a237e',
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: '#666',
  },
  imageContainer: {
    justifyContent: 'center',
  },
  imagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
});