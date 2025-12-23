import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  BarChart,
  LineChart,
  PieChart,
} from 'react-native-chart-kit';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

// Use correct backend URL for your environment
const BACKEND_URL ='https://news-watch-6zyq.vercel.app';

// Types based on your backend structure
interface NewsStats {
  id: string;
  _id?: string;
  title: string;
  views: number;
  likesCount: number;
  commentsCount: number;
  authorName: string;
  category: string;
}

interface ReporterStats {
  totalNews: number;
  totalViews: number;
  totalLikes: number;
  engagementRate: number;
  averageViews: number;
  averageLikes: number;
}

interface CategoryDistribution {
  name: string;
  count: number;
  color: string;
}

interface DailyStat {
  date: string;
  views: number;
  likes: number;
  comments: number;
}

export default function AnalyticsScreen() {
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [stats, setStats] = useState<ReporterStats>({
    totalNews: 0,
    totalViews: 0,
    totalLikes: 0,
    engagementRate: 0,
    averageViews: 0,
    averageLikes: 0,
  });
  const [topNews, setTopNews] = useState<NewsStats[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStat[]>([]);
  const [categoryDistribution, setCategoryDistribution] = useState<CategoryDistribution[]>([]);

  // Generate colors for categories
  const categoryColors = ['#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#FF5252', '#00BCD4', '#8BC34A', '#E91E63'];

  useEffect(() => {
    fetchAnalyticsData();
  }, [selectedPeriod]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Try both possible token storage keys
      let token = await AsyncStorage.getItem('userToken');
      if (!token) {
        token = await AsyncStorage.getItem('token');
      }
      
      if (!token) {
        Alert.alert('Session Expired', 'Please login again to continue.');
        router.replace('/(auth)/login');
        return;
      }

      console.log('📊 Fetching analytics data...');

      // Fetch reporter stats from backend
      const statsResponse = await fetch(`${BACKEND_URL}/api/reporter/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('📊 Stats response status:', statsResponse.status);

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        console.log('📊 Stats data:', statsData);
        
        if (statsData.success) {
          setStats(statsData.stats || {
            totalNews: 0,
            totalViews: 0,
            totalLikes: 0,
            engagementRate: 0,
            averageViews: 0,
            averageLikes: 0,
          });
        } else {
          console.log('❌ Stats API error:', statsData.message);
        }
      } else {
        console.log('❌ Stats request failed:', statsResponse.status);
      }

      // Fetch reporter's news
      const newsResponse = await fetch(`${BACKEND_URL}/api/reporter/news?limit=50`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('📰 News response status:', newsResponse.status);

      if (newsResponse.ok) {
        const newsData = await newsResponse.json();
        console.log('📰 News data received, count:', newsData.news?.length || 0);
        
        if (newsData.success && newsData.news) {
          // Normalize the news items
          const normalizedNews = newsData.news.map((item: any) => ({
            id: item.id || item._id,
            title: item.title,
            views: item.views || 0,
            likesCount: item.likesCount || 0,
            commentsCount: item.commentsCount || 0,
            authorName: item.authorName || 'Unknown',
            category: item.category || 'Uncategorized',
          }));

          // Sort by views and take top 5
          const sortedNews = [...normalizedNews]
            .sort((a, b) => (b.views || 0) - (a.views || 0))
            .slice(0, 5);
          
          console.log('📊 Top 5 news:', sortedNews);
          setTopNews(sortedNews);

          // Calculate category distribution
          const categoryMap = new Map();
          normalizedNews.forEach((news: any) => {
            const category = news.category || 'Uncategorized';
            categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
          });

          const categories = Array.from(categoryMap.entries()).map(([name, count], index) => ({
            name,
            count,
            color: categoryColors[index % categoryColors.length]
          }));
          
          console.log('📊 Category distribution:', categories);
          setCategoryDistribution(categories);
        } else {
          console.log('❌ News API error or no news:', newsData.message);
          setTopNews([]);
          setCategoryDistribution([]);
        }
      } else {
        console.log('❌ News request failed with status:', newsResponse.status);
        setTopNews([]);
        setCategoryDistribution([]);
      }

      // Generate daily stats based on period
      generateDailyStats();

    } catch (error: any) {
      console.error('❌ Analytics fetch error:', error.message);
      console.error('❌ Error stack:', error.stack);
      
      Alert.alert(
        'Connection Error', 
        'Failed to load analytics data. Please check your connection.',
        [{ text: 'OK' }]
      );
      
      // Use mock data for testing
      setStats({
        totalNews: 12,
        totalViews: 2543,
        totalLikes: 156,
        engagementRate: 12.8,
        averageViews: 212,
        averageLikes: 13,
      });
      
      setTopNews([
        {
          id: '1',
          title: 'Breaking News: Technology Advancements',
          views: 1200,
          likesCount: 85,
          commentsCount: 42,
          authorName: 'You',
          category: 'Technology'
        },
        {
          id: '2',
          title: 'Sports Championship Results',
          views: 850,
          likesCount: 45,
          commentsCount: 23,
          authorName: 'You',
          category: 'Sports'
        }
      ]);
      
      setCategoryDistribution([
        { name: 'Technology', count: 5, color: '#2196F3' },
        { name: 'Sports', count: 3, color: '#4CAF50' },
        { name: 'Politics', count: 2, color: '#FF9800' },
        { name: 'Business', count: 2, color: '#9C27B0' }
      ]);
      
      generateDailyStats();

    } finally {
      setLoading(false);
    }
  };

  const generateDailyStats = () => {
    // Generate mock daily stats based on selected period
    const days = selectedPeriod === 'today' ? ['Today'] :
                selectedPeriod === 'week' ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] :
                selectedPeriod === 'month' ? ['Week 1', 'Week 2', 'Week 3', 'Week 4'] :
                ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    
    const mockStats: DailyStat[] = days.map(day => ({
      date: day,
      views: Math.floor(Math.random() * 500) + 100,
      likes: Math.floor(Math.random() * 50) + 10,
      comments: Math.floor(Math.random() * 25) + 5,
    }));
    
    console.log('📊 Generated daily stats:', mockStats);
    setDailyStats(mockStats);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const renderStatCard = (title: string, value: number | string, icon: string, color: string) => (
    <View style={styles.statCard}>
      <LinearGradient
        colors={[`${color}20`, `${color}10`]}
        style={styles.statCardGradient}
      >
        <View style={styles.statHeader}>
          <View style={[styles.statIcon, { backgroundColor: `${color}20` }]}>
            <Ionicons name={icon as any} size={24} color={color} />
          </View>
        </View>
        <Text style={styles.statValue}>
          {typeof value === 'number' ? formatNumber(value) : value}
        </Text>
        <Text style={styles.statTitle}>{title}</Text>
      </LinearGradient>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1a237e" />
        <Text style={styles.loadingText}>Loading Analytics...</Text>
        <Text style={styles.serverInfo}>
          Connecting to: {BACKEND_URL.replace('http://', '')}
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="#1a237e" />
            </TouchableOpacity>
            <View>
              <Text style={styles.headerTitle}>Analytics Dashboard</Text>
              <Text style={styles.headerSubtitle}>Performance insights for your news</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={fetchAnalyticsData}
            disabled={loading}
          >
            <Ionicons name="refresh-outline" size={22} color="#1a237e" />
          </TouchableOpacity>
        </View>

        {/* Time Period Selector */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.periodSelector}
          contentContainerStyle={styles.periodContainer}
        >
          {['Today', 'Week', 'Month', 'Year'].map((period) => (
            <TouchableOpacity
              key={period}
              style={[
                styles.periodButton,
                selectedPeriod === period.toLowerCase() && styles.periodButtonActive
              ]}
              onPress={() => setSelectedPeriod(period.toLowerCase())}
              disabled={loading}
            >
              <Text style={[
                styles.periodButtonText,
                selectedPeriod === period.toLowerCase() && styles.periodButtonTextActive
              ]}>
                {period}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Overview Stats */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Performance Overview</Text>
            <Text style={styles.sectionSubtitle}>Your news statistics</Text>
          </View>
          
          <View style={styles.statsGrid}>
            {renderStatCard('Total News', stats.totalNews, 'newspaper-outline', '#2196F3')}
            {renderStatCard('Total Views', stats.totalViews, 'eye-outline', '#4CAF50')}
            {renderStatCard('Total Likes', stats.totalLikes, 'heart-outline', '#FF5252')}
            {renderStatCard('Engagement', `${stats.engagementRate || 0}%`, 'trending-up-outline', '#FF9800')}
            {renderStatCard('Avg Views', stats.averageViews, 'analytics-outline', '#2196F3')}
            {renderStatCard('Avg Likes', stats.averageLikes, 'thumbs-up-outline', '#4CAF50')}
          </View>
        </View>

        {/* Views Trend Chart */}
        {dailyStats.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Daily Performance</Text>
              <Text style={styles.sectionSubtitle}>{selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1)} overview</Text>
            </View>
            
            <View style={styles.chartContainer}>
              <LineChart
                data={{
                  labels: dailyStats.map(day => day.date),
                  datasets: [{
                    data: dailyStats.map(day => day.views)
                  }]
                }}
                width={width - 48}
                height={220}
                chartConfig={{
                  backgroundColor: '#fff',
                  backgroundGradientFrom: '#fff',
                  backgroundGradientTo: '#fff',
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  style: {
                    borderRadius: 16
                  },
                  propsForDots: {
                    r: '6',
                    strokeWidth: '2',
                    stroke: '#2196F3'
                  }
                }}
                bezier
                style={styles.chart}
                withVerticalLines={false}
                withHorizontalLines={false}
              />
              <View style={styles.chartLegend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#2196F3' }]} />
                  <Text style={styles.legendText}>Views</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Category Distribution */}
        {categoryDistribution.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Category Distribution</Text>
              <Text style={styles.sectionSubtitle}>Your news by category</Text>
            </View>
            
            <View style={styles.pieChartContainer}>
              <PieChart
                data={categoryDistribution}
                width={width - 48}
                height={200}
                chartConfig={{
                  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                }}
                accessor="count"
                backgroundColor="transparent"
                paddingLeft="15"
                absolute
                hasLegend={false}
              />
              <View style={styles.pieLegend}>
                {categoryDistribution.map((item, index) => (
                  <View key={index} style={styles.pieLegendItem}>
                    <View style={[styles.pieLegendDot, { backgroundColor: item.color }]} />
                    <Text style={styles.pieLegendText}>{item.name}</Text>
                    <Text style={styles.pieLegendCount}>{item.count}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Top Performing News */}
        {topNews.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Top Performing News</Text>
              <TouchableOpacity onPress={() => router.push('/(reporter)/articles')}>
                <Text style={styles.seeAll}>View All</Text>
              </TouchableOpacity>
            </View>
            
            {topNews.map((news, index) => (
              <TouchableOpacity 
                key={news.id}
                style={styles.newsItem}
                onPress={() => router.push(`/news/${news.id}`)}
              >
                <View style={styles.newsRank}>
                  <Text style={styles.rankText}>{index + 1}</Text>
                </View>
                <View style={styles.newsContent}>
                  <Text style={styles.newsTitle} numberOfLines={2}>{news.title}</Text>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryText}>{news.category}</Text>
                  </View>
                  <View style={styles.newsStats}>
                    <View style={styles.statItem}>
                      <Ionicons name="eye-outline" size={14} color="#666" />
                      <Text style={styles.statItemText}>{formatNumber(news.views || 0)}</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Ionicons name="heart-outline" size={14} color="#666" />
                      <Text style={styles.statItemText}>{formatNumber(news.likesCount || 0)}</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Ionicons name="chatbubble-outline" size={14} color="#666" />
                      <Text style={styles.statItemText}>{formatNumber(news.commentsCount || 0)}</Text>
                    </View>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#999" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Engagement Metrics */}
        {dailyStats.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Engagement Metrics</Text>
              <Text style={styles.sectionSubtitle}>Likes vs Comments trend</Text>
            </View>
            
            <View style={styles.chartContainer}>
              <BarChart
                data={{
                  labels: dailyStats.map(day => day.date),
                  datasets: [
                    {
                      data: dailyStats.map(day => day.likes)
                    },
                    {
                      data: dailyStats.map(day => day.comments)
                    }
                  ]
                }}
                width={width - 48}
                height={220}
                yAxisLabel=""
                yAxisSuffix=""
                chartConfig={{
                  backgroundColor: '#fff',
                  backgroundGradientFrom: '#fff',
                  backgroundGradientTo: '#fff',
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  barPercentage: 0.5,
                  propsForBackgroundLines: {
                    strokeWidth: 0
                  },
                  propsForLabels: {
                    fontSize: 10
                  }
                }}
                style={styles.chart}
                showValuesOnTopOfBars={false}
                withHorizontalLabels={true}
                withVerticalLabels={true}
                fromZero={true}
              />
              <View style={styles.chartLegend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#FF5252' }]} />
                  <Text style={styles.legendText}>Likes</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#4CAF50' }]} />
                  <Text style={styles.legendText}>Comments</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Quick Insights */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Insights</Text>
          <View style={styles.insightsContainer}>
            {topNews.length > 0 && (
              <View style={styles.insightCard}>
                <Ionicons name="trophy-outline" size={24} color="#FF9800" />
                <Text style={styles.insightText}>
                  Top post: "{topNews[0]?.title?.substring(0, 30)}..." ({formatNumber(topNews[0]?.views || 0)} views)
                </Text>
              </View>
            )}
            <View style={styles.insightCard}>
              <Ionicons name="trending-up-outline" size={24} color="#4CAF50" />
              <Text style={styles.insightText}>
                Total views: {formatNumber(stats.totalViews || 0)} 
                {stats.totalNews > 0 && ` (${formatNumber(Math.round(stats.averageViews))} avg per post)`}
              </Text>
            </View>
            {categoryDistribution.length > 0 && (
              <View style={styles.insightCard}>
                <Ionicons name="podium-outline" size={24} color="#2196F3" />
                <Text style={styles.insightText}>
                  Top category: {categoryDistribution[0]?.name} ({categoryDistribution[0]?.count} posts)
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Data updates in real-time • Last updated: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
          <TouchableOpacity 
            style={[styles.refreshButton, styles.refreshButtonLarge]}
            onPress={fetchAnalyticsData}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#1a237e" />
            ) : (
              <>
                <Ionicons name="refresh" size={16} color="#1a237e" />
                <Text style={styles.refreshText}>Refresh Data</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
        
        {/* Debug info (remove in production) */}
        {__DEV__ && (
          <View style={styles.debugInfo}>
            <Text style={styles.debugText}>Debug Info:</Text>
            <Text style={styles.debugText}>Backend: {BACKEND_URL}</Text>
            <Text style={styles.debugText}>Stats: {JSON.stringify(stats, null, 2)}</Text>
            <Text style={styles.debugText}>Top News Count: {topNews.length}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  serverInfo: {
    fontSize: 10,
    color: '#666',
    marginTop: 5,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  header: {
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'ios' ? 10 : 30,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
    fontSize: 22,
    fontWeight: '700',
    color: '#1a237e',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(26, 35, 126, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  periodSelector: {
    marginBottom: 16,
  },
  periodContainer: {
    paddingHorizontal: 20,
    gap: 8,
  },
  periodButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  periodButtonActive: {
    backgroundColor: '#1a237e',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  periodButtonTextActive: {
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a237e',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  seeAll: {
    fontSize: 14,
    color: '#1a237e',
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  statCard: {
    width: '33.33%',
    padding: 6,
  },
  statCardGradient: {
    borderRadius: 12,
    padding: 16,
    height: 120,
    justifyContent: 'space-between',
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a237e',
  },
  statTitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  chartContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  chart: {
    borderRadius: 12,
    marginVertical: 8,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
  pieChartContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pieLegend: {
    flex: 1,
    marginLeft: 16,
  },
  pieLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingVertical: 4,
  },
  pieLegendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  pieLegendText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  pieLegendCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a237e',
    marginLeft: 8,
  },
  newsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  newsRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1a237e',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  rankText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  newsContent: {
    flex: 1,
  },
  newsTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    lineHeight: 20,
  },
  categoryBadge: {
    backgroundColor: 'rgba(26, 35, 126, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 12,
    color: '#1a237e',
    fontWeight: '500',
  },
  newsStats: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statItemText: {
    fontSize: 12,
    color: '#666',
  },
  insightsContainer: {
    gap: 12,
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  insightText: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    lineHeight: 20,
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
    paddingHorizontal: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginBottom: 12,
  },
  refreshButtonLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: 'auto',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  refreshText: {
    fontSize: 14,
    color: '#1a237e',
    fontWeight: '500',
  },
  debugInfo: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginHorizontal: 16,
  },
  debugText: {
    fontSize: 10,
    color: '#666',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
});