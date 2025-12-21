// app/(tabs)/saved.tsx
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function SavedScreen() {
  const [activeTab, setActiveTab] = useState('articles');
  const [savedArticles, setSavedArticles] = useState([
    {
      id: 1,
      title: 'The Future of AI in Healthcare',
      source: 'Tech Review',
      time: '2h ago',
      category: 'Technology',
      image: null,
    },
    {
      id: 2,
      title: 'Global Climate Summit Reaches Historic Agreement',
      source: 'World News',
      time: '1d ago',
      category: 'Environment',
      image: null,
    },
    {
      id: 3,
      title: 'Stock Market Hits Record High',
      source: 'Business Daily',
      time: '3h ago',
      category: 'Business',
      image: null,
    },
  ]);

  const tabs = [
    { id: 'articles', label: 'Articles', icon: 'newspaper' },
    { id: 'videos', label: 'Videos', icon: 'play-circle' },
    { id: 'categories', label: 'Categories', icon: 'folder' },
  ];

  const removeArticle = (id: number) => {
    setSavedArticles(prev => prev.filter(article => article.id !== id));
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Saved</Text>
          <Text style={styles.headerSubtitle}>
            {savedArticles.length} articles saved
          </Text>
        </View>
        <TouchableOpacity style={styles.headerButton}>
          <Ionicons name="bookmark" size={28} color="#1a237e" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tab,
              activeTab === tab.id && styles.tabActive,
            ]}
            onPress={() => setActiveTab(tab.id)}>
            <Ionicons
              name={tab.icon}
              size={20}
              color={activeTab === tab.id ? '#1a237e' : '#666'}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === tab.id && styles.tabTextActive,
              ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
        
        {activeTab === 'articles' && (
          <View style={styles.section}>
            {savedArticles.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="bookmark-outline" size={70} color="#ccc" />
                <Text style={styles.emptyTitle}>No Saved Articles</Text>
                <Text style={styles.emptyText}>
                  Articles you save will appear here
                </Text>
                <TouchableOpacity style={styles.exploreButton}>
                  <Text style={styles.exploreButtonText}>Explore Articles</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {savedArticles.map((article) => (
                  <View key={article.id} style={styles.articleCard}>
                    <View style={styles.articleContent}>
                      <View style={styles.articleHeader}>
                        <View style={styles.categoryBadge}>
                          <Text style={styles.categoryText}>{article.category}</Text>
                        </View>
                        <TouchableOpacity 
                          onPress={() => removeArticle(article.id)}
                          style={styles.removeButton}
                        >
                          <Ionicons name="close" size={20} color="#999" />
                        </TouchableOpacity>
                      </View>
                      
                      <Text style={styles.articleTitle}>{article.title}</Text>
                      
                      <View style={styles.articleFooter}>
                        <Text style={styles.articleSource}>{article.source}</Text>
                        <Text style={styles.articleTime}>{article.time}</Text>
                      </View>
                    </View>
                    
                    {article.image ? (
                      <Image source={article.image} style={styles.articleImage} />
                    ) : (
                      <View style={styles.articleImagePlaceholder}>
                        <Ionicons name="image" size={30} color="#ccc" />
                      </View>
                    )}
                  </View>
                ))}
              </>
            )}
          </View>
        )}

        {activeTab === 'videos' && (
          <View style={styles.emptyState}>
            <Ionicons name="play-circle-outline" size={70} color="#ccc" />
            <Text style={styles.emptyTitle}>No Saved Videos</Text>
            <Text style={styles.emptyText}>
              Videos you save will appear here
            </Text>
          </View>
        )}

        {activeTab === 'categories' && (
          <View style={styles.categoriesSection}>
            {[
              { name: 'Technology', count: 12, icon: 'hardware-chip' },
              { name: 'Business', count: 8, icon: 'trending-up' },
              { name: 'Sports', count: 15, icon: 'football' },
              { name: 'Health', count: 6, icon: 'fitness' },
              { name: 'Politics', count: 9, icon: 'megaphone' },
              { name: 'Entertainment', count: 11, icon: 'film' },
            ].map((category, index) => (
              <TouchableOpacity key={index} style={styles.categoryCard}>
                <View style={styles.categoryIconContainer}>
                  <Ionicons name={category.icon} size={24} color="#1a237e" />
                </View>
                <View style={styles.categoryContent}>
                  <Text style={styles.categoryName}>{category.name}</Text>
                  <Text style={styles.categoryCount}>{category.count} articles</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#ccc" />
              </TouchableOpacity>
            ))}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1a237e',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  headerButton: {
    padding: 8,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  tabActive: {
    backgroundColor: 'rgba(26, 35, 126, 0.1)',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  tabTextActive: {
    color: '#1a237e',
  },
  content: {
    flex: 1,
  },
  section: {
    flex: 1,
    padding: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  exploreButton: {
    backgroundColor: '#1a237e',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
  },
  exploreButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  articleCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  articleContent: {
    flex: 1,
    marginRight: 15,
  },
  articleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryBadge: {
    backgroundColor: 'rgba(26, 35, 126, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1a237e',
  },
  removeButton: {
    padding: 4,
  },
  articleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
    lineHeight: 22,
  },
  articleFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  articleSource: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  articleTime: {
    fontSize: 13,
    color: '#999',
  },
  articleImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  articleImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  categoriesSection: {
    padding: 20,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  categoryIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: 'rgba(26, 35, 126, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  categoryContent: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  categoryCount: {
    fontSize: 13,
    color: '#666',
  },
});