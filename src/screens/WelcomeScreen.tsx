import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, Dimensions, StatusBar } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');
const HAS_VISITED_KEY = 'hasVisited';

interface WelcomeScreenProps {
  onGetStarted: () => void;
}

export default function WelcomeScreen({ onGetStarted }: WelcomeScreenProps) {
  // Animation values
  const floatAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // Fade in and scale up on mount
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Floating animation loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -15,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleGetStarted = async () => {
    try {
      await AsyncStorage.setItem(HAS_VISITED_KEY, 'true');
    } catch (e) {
      console.warn('Failed to save hasVisited', e);
    }
    onGetStarted();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1A1A2E" />
      
      {/* Decorative circles */}
      <View style={[styles.circle, styles.circle1]} />
      <View style={[styles.circle, styles.circle2]} />
      <View style={[styles.circle, styles.circle3]} />
      
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Floating Logo/Icon */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              transform: [{ translateY: floatAnim }],
            },
          ]}
        >
          <View style={styles.logoBackground}>
            <MaterialIcons name="music-note" size={64} color="#FFFFFF" />
          </View>
        </Animated.View>

        {/* App Name */}
        <Text style={styles.appName}>Soniq</Text>

        {/* Tagline with gradient text effect */}
        <View style={styles.taglineContainer}>
          <Text style={styles.taglineText}>
            Discover your{' '}
            <Text style={styles.taglineHighlight}>favorite</Text>
            {'\n'}tunes, anytime
          </Text>
        </View>

        {/* Description */}
        <Text style={styles.description}>
          Stream millions of songs, create playlists,{'\n'}and enjoy unlimited music
        </Text>

        {/* Features */}
        <View style={styles.featuresContainer}>
          <FeatureItem icon="queue-music" text="Unlimited streaming" />
          <FeatureItem icon="favorite" text="Save your favorites" />
          <FeatureItem icon="playlist-play" text="Create playlists" />
        </View>
      </Animated.View>

      {/* Get Started Button */}
      <Animated.View
        style={[
          styles.buttonContainer,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        <Button
          mode="contained"
          onPress={handleGetStarted}
          style={styles.button}
          contentStyle={styles.buttonContent}
          labelStyle={styles.buttonLabel}
          buttonColor="#6C63FF"
        >
          Get Started
        </Button>
        <Text style={styles.termsText}>
          By continuing, you agree to our Terms of Service
        </Text>
      </Animated.View>
    </View>
  );
}

function FeatureItem({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.featureItem}>
      <MaterialIcons name={icon as any} size={20} color="#6C63FF" />
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

// Static method to check if user has visited
export async function checkHasVisited(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(HAS_VISITED_KEY);
    return value === 'true';
  } catch (e) {
    return false;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A2E',
    position: 'relative',
  },
  circle: {
    position: 'absolute',
    borderRadius: 500,
    opacity: 0.1,
  },
  circle1: {
    width: 300,
    height: 300,
    backgroundColor: '#6C63FF',
    top: -100,
    right: -100,
  },
  circle2: {
    width: 200,
    height: 200,
    backgroundColor: '#4ECDC4',
    bottom: 200,
    left: -80,
  },
  circle3: {
    width: 150,
    height: 150,
    backgroundColor: '#6C63FF',
    bottom: -50,
    right: 50,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  logoContainer: {
    marginBottom: 24,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 16,
  },
  logoBackground: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#6C63FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 2,
    marginBottom: 12,
  },
  taglineContainer: {
    marginBottom: 16,
  },
  taglineText: {
    fontSize: 22,
    color: '#E0E0E0',
    textAlign: 'center',
    lineHeight: 30,
  },
  taglineHighlight: {
    color: '#4ECDC4',
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    color: '#9E9E9E',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  featuresContainer: {
    alignItems: 'flex-start',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 14,
    color: '#E0E0E0',
    marginLeft: 12,
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingBottom: 48,
    alignItems: 'center',
  },
  button: {
    borderRadius: 30,
    width: '100%',
  },
  buttonContent: {
    height: 56,
  },
  buttonLabel: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 1,
  },
  termsText: {
    fontSize: 12,
    color: '#666',
    marginTop: 16,
  },
});
