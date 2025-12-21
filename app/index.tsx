import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animation sequence
    Animated.sequence([
      // Fade in and slide up animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ]),
      // Subtle glow effect
      Animated.timing(glowAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      // Stay visible for 2 seconds
      Animated.delay(1800),
    ]).start(() => {
      // Navigate to login screen
      router.replace('/(auth)/login');
    });
  }, []);

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.3],
  });

  return (
    <LinearGradient
      colors={['#0d1b2a', '#1a237e', '#283593']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <StatusBar barStyle="light-content" backgroundColor="#707982ff" />
      
      {/* Animated glow effect */}
      <Animated.View 
        style={[
          styles.glowEffect,
          {
            opacity: glowOpacity,
            transform: [{ scale: glowAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.8, 1.2]
            })}]
          }
        ]}
      />
      
      <View style={styles.content}>
        {/* Logo/Brand Container */}
        <Animated.View 
          style={[
            styles.logoContainer,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim }
              ],
            }
          ]}
        >
          {/* News Icon/Logo with shine effect */}
          <Animated.View 
            style={[
              styles.logoCircle,
              {
                shadowOpacity: glowAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.3, 0.6]
                })
              }
            ]}
          >
            {/* Shine overlay */}
            <View style={styles.logoShine} />
            <Text style={styles.logoText}>NW</Text>
            
            {/* Subtle outer ring */}
            <View style={styles.logoRing} />
          </Animated.View>
          
          {/* App Title with gradient text */}
          <View style={styles.titleContainer}>
            <LinearGradient
              colors={['#ffffff', '#e3f2fd']}
              style={styles.titleGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.appTitle}>NewsWatch</Text>
            </LinearGradient>
            <View style={styles.titleUnderline} />
          </View>
        </Animated.View>

        {/* Tagline Container */}
        <Animated.View 
          style={[
            styles.taglineContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }
          ]}
        >
          <Text style={styles.tagline}>
            All type of news from all trusted sources{'\n'}
            <Text style={styles.taglineHighlight}>for all type of people</Text>
          </Text>
          
          {/* Divider line */}
          <Animated.View 
            style={[
              styles.divider,
              {
                opacity: fadeAnim,
                transform: [{ scaleX: fadeAnim }]
              }
            ]}
          />
        </Animated.View>

        {/* Loading Indicator with enhanced dots */}
        <Animated.View 
          style={[
            styles.loadingContainer,
            {
              opacity: fadeAnim,
            }
          ]}
        >
          <LoadingDotsEnhanced />
        </Animated.View>

        {/* Footer */}
        <Animated.View 
          style={[
            styles.footer,
            {
              opacity: fadeAnim,
            }
          ]}
        >
          <View style={styles.footerContent}>
            <View style={styles.footerDot} />
            <Text style={styles.footerText}>Stay Informed • Stay Connected</Text>
            <View style={styles.footerDot} />
          </View>
        </Animated.View>
      </View>
    </LinearGradient>
  );
}

// Enhanced Loading Dots Component
const LoadingDotsEnhanced = () => {
  const dot1Anim = useRef(new Animated.Value(0)).current;
  const dot2Anim = useRef(new Animated.Value(0)).current;
  const dot3Anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createAnimation = (anim: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.spring(anim, {
            toValue: 1,
            tension: 150,
            friction: 3,
            useNativeDriver: true,
          }),
          Animated.spring(anim, {
            toValue: 0,
            tension: 150,
            friction: 3,
            useNativeDriver: true,
          }),
        ])
      );
    };

    const anim1 = createAnimation(dot1Anim, 0);
    const anim2 = createAnimation(dot2Anim, 200);
    const anim3 = createAnimation(dot3Anim, 400);

    anim1.start();
    anim2.start();
    anim3.start();

    return () => {
      anim1.stop();
      anim2.stop();
      anim3.stop();
    };
  }, []);

  const getDotStyle = (anim: Animated.Value) => {
    const scale = anim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.7, 1.3],
    });

    const translateY = anim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -8],
    });

    return {
      transform: [{ scale }, { translateY }],
    };
  };

  return (
    <View style={styles.dotsContainerEnhanced}>
      <Animated.View 
        style={[
          styles.dotEnhanced,
          styles.dot1,
          getDotStyle(dot1Anim)
        ]} 
      />
      <Animated.View 
        style={[
          styles.dotEnhanced,
          styles.dot2,
          getDotStyle(dot2Anim)
        ]} 
      />
      <Animated.View 
        style={[
          styles.dotEnhanced,
          styles.dot3,
          getDotStyle(dot3Anim)
        ]} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  glowEffect: {
    position: 'absolute',
    top: '30%',
    left: '25%',
    right: '25%',
    height: 200,
    backgroundColor: '#4fc3f7',
    borderRadius: 100,
    filter: 'blur(60px)',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  logoCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#4fc3f7',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 15,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#4fc3f7',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
    }),
  },
  logoShine: {
    position: 'absolute',
    top: -20,
    left: -20,
    right: -20,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    transform: [{ rotate: '45deg' }],
  },
  logoRing: {
    position: 'absolute',
    width: 124,
    height: 124,
    borderRadius: 62,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  logoText: {
    fontSize: 40,
    fontWeight: '900',
    color: '#ffffff',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    letterSpacing: 2,
    textShadowColor: 'rgba(79, 195, 247, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  titleContainer: {
    alignItems: 'center',
  },
  titleGradient: {
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 8,
    marginBottom: 12,
  },
  appTitle: {
    fontSize: 46,
    fontWeight: '900',
    letterSpacing: 2.5,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  titleUnderline: {
    width: 120,
    height: 3,
    backgroundColor: 'rgba(79, 195, 247, 0.7)',
    borderRadius: 1.5,
  },
  taglineContainer: {
    marginBottom: 70,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  tagline: {
    fontSize: 19,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    lineHeight: 28,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontWeight: '300',
    letterSpacing: 0.8,
    marginBottom: 20,
  },
  taglineHighlight: {
    fontWeight: '500',
    color: '#e3f2fd',
  },
  divider: {
    width: 100,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 1,
  },
  loadingContainer: {
    marginBottom: 60,
  },
  dotsContainerEnhanced: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    gap: 16,
  },
  dotEnhanced: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  dot1: {
    backgroundColor: '#4fc3f7',
    shadowColor: '#4fc3f7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 5,
  },
  dot2: {
    backgroundColor: '#29b6f6',
    shadowColor: '#29b6f6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 5,
  },
  dot3: {
    backgroundColor: '#03a9f4',
    shadowColor: '#03a9f4',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 5,
  },
  footer: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
  },
  footerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  footerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  footerText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontWeight: '300',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
});