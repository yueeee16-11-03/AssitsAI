import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from 'react-native-paper';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
// @ts-ignore
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type Props = NativeStackScreenProps<RootStackParamList, 'FamilyOnboarding'>;

export default function FamilyOnboardingScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const TAB_BAR_HEIGHT = 70;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const bgColor = theme.dark ? '#1a1a1a' : '#ffffff';
  const textColor = theme.dark ? '#ffffff' : '#000000';
  const accentColor = theme.colors.primary;
  const secondaryColor = theme.colors.secondary;
  const iconBgDark = '#2d2d2d';
  const iconBgLight = '#f0f0f0';
  const benefitBgDark = '#2d2d2d';
  const benefitBgLight = '#f5f5f5';
  const joinBgDark = '#2d2d2d';
  const joinBgLight = '#f9f9f9';
  const subtitleColor = theme.dark ? '#b0b0b0' : '#666666';
  const benefitTitleColor = theme.dark ? '#ffffff' : '#000000';
  const childColor1 = '#10b981';
  const childColor2 = '#f59e0b';
  const borderColor = theme.dark ? '#333333' : '#e5e5e5';

  const handleCreateFamily = () => {
    navigation.navigate({ name: 'CreateFamily', params: undefined });
  };

  const handleJoinFamily = () => {
    navigation.navigate({ name: 'JoinFamily', params: {} });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + TAB_BAR_HEIGHT + 20 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Illustration */}
        <Animated.View
          style={[
            styles.illustrationContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Family Icon Group */}
          <View style={styles.iconGroup}>
            {/* Parent 1 */}
            <View
              style={[
                styles.iconWrapper,
                {
                  backgroundColor: theme.dark ? iconBgDark : iconBgLight,
                  borderColor: accentColor,
                },
              ]}
            >
              <Icon
                name="account"
                size={50}
                color={accentColor}
              />
            </View>

            {/* Parent 2 */}
            <View
              style={[
                styles.iconWrapper,
                {
                  backgroundColor: theme.dark ? iconBgDark : iconBgLight,
                  borderColor: secondaryColor,
                },
              ]}
            >
              <Icon
                name="account"
                size={50}
                color={secondaryColor}
              />
            </View>

            {/* Heart Center */}
            <View
              style={[
                styles.centerIcon,
                {
                  backgroundColor: accentColor,
                },
              ]}
            >
              <Icon
                name="heart"
                size={40}
                color="#ffffff"
              />
            </View>

            {/* Child 1 */}
            <View
              style={[
                styles.iconWrapper,
                {
                  backgroundColor: theme.dark ? iconBgDark : iconBgLight,
                  borderColor: childColor1,
                },
              ]}
            >
              <Icon
                name="human-child"
                size={50}
                color={childColor1}
              />
            </View>

            {/* Child 2 */}
            <View
              style={[
                styles.iconWrapper,
                {
                  backgroundColor: theme.dark ? iconBgDark : iconBgLight,
                  borderColor: childColor2,
                },
              ]}
            >
              <Icon
                name="human-child"
                size={50}
                color={childColor2}
              />
            </View>
          </View>
        </Animated.View>

        {/* Content Section */}
        <Animated.View
          style={[
            styles.contentSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Title */}
          <Text
            style={[
              styles.title,
              {
                color: textColor,
              },
            ]}
          >
            Cùng Gia Đình, Quản Lý Tài Chính Dễ Hơn
          </Text>

          {/* Subtitle */}
          <Text
            style={[
              styles.subtitle,
              {
                color: subtitleColor,
              },
            ]}
          >
            Theo dõi chi tiêu, đặt mục tiêu, và đạt được những điều lớn lao cùng những người thân yêu
          </Text>

          {/* Benefits Section */}
          <View style={styles.benefitsContainer}>
            <BenefitItem
              icon="chart-line"
              title="Theo dõi chi tiêu"
              description="Xem tổng chi tiêu của cả gia đình"
              accentColor={accentColor}
              theme={theme}
              benefitBgDark={benefitBgDark}
              benefitBgLight={benefitBgLight}
              subtitleColor={subtitleColor}
              benefitTitleColor={benefitTitleColor}
            />

            <BenefitItem
              icon="target"
              title="Đạt mục tiêu chung"
              description="Lập và theo dõi mục tiêu cùng nhau"
              accentColor={secondaryColor}
              theme={theme}
              benefitBgDark={benefitBgDark}
              benefitBgLight={benefitBgLight}
              subtitleColor={subtitleColor}
              benefitTitleColor={benefitTitleColor}
            />

            <BenefitItem
              icon="account-multiple"
              title="Quản lý thành viên"
              description="Mời gia đình tham gia và hợp tác"
              accentColor={childColor1}
              theme={theme}
              benefitBgDark={benefitBgDark}
              benefitBgLight={benefitBgLight}
              subtitleColor={subtitleColor}
              benefitTitleColor={benefitTitleColor}
            />

            <BenefitItem
              icon="sparkles"
              title="AI Insight"
              description="Nhận gợi ý thông minh từ AI"
              accentColor={childColor2}
              theme={theme}
              benefitBgDark={benefitBgDark}
              benefitBgLight={benefitBgLight}
              subtitleColor={subtitleColor}
              benefitTitleColor={benefitTitleColor}
            />
          </View>
        </Animated.View>

        {/* Spacer */}
        <View style={styles.spacer} />

        {/* Action Buttons - Inside ScrollView */}
        <Animated.View
          style={[
            styles.buttonContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
              borderTopColor: borderColor,
            },
          ]}
        >
          {/* Create Family Button */}
          <TouchableOpacity
            style={[
              styles.createButton,
              {
                backgroundColor: accentColor,
              },
            ]}
            onPress={handleCreateFamily}
            activeOpacity={0.8}
          >
            <Icon
              name="plus"
              size={24}
              color="#ffffff"
              style={styles.createButtonIcon}
            />
            <Text style={styles.createButtonText}>Tạo Gia Đình</Text>
          </TouchableOpacity>

          {/* Join Family Button */}
          <TouchableOpacity
            style={[
              styles.joinButton,
              {
                borderColor: accentColor,
                backgroundColor: theme.dark ? joinBgDark : joinBgLight,
              },
            ]}
            onPress={handleJoinFamily}
            activeOpacity={0.8}
          >
            <Icon
              name="link-variant"
              size={24}
              color={accentColor}
              style={styles.joinButtonIcon}
            />
            <Text
              style={[
                styles.joinButtonText,
                {
                  color: accentColor,
                },
              ]}
            >
              Tham Gia Gia Đình
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

interface BenefitItemProps {
  icon: string;
  title: string;
  description: string;
  accentColor: string;
  theme: any;
  benefitBgDark: string;
  benefitBgLight: string;
  subtitleColor: string;
  benefitTitleColor: string;
}

function BenefitItem({
  icon,
  title,
  description,
  accentColor,
  theme,
  benefitBgDark,
  benefitBgLight,
  subtitleColor,
  benefitTitleColor,
}: BenefitItemProps) {
  return (
    <View style={styles.benefitItem}>
      <View
        style={[
          styles.benefitIconContainer,
          {
            backgroundColor: theme.dark ? benefitBgDark : benefitBgLight,
          },
        ]}
      >
        <Icon
          name={icon}
          size={28}
          color={accentColor}
        />
      </View>
      <View style={styles.benefitTextContainer}>
        <Text
          style={[
            styles.benefitTitle,
            {
              color: benefitTitleColor,
            },
          ]}
        >
          {title}
        </Text>
        <Text
          style={[
            styles.benefitDescription,
            {
              color: subtitleColor,
            },
          ]}
        >
          {description}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  illustrationContainer: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 20,
  },
  iconGroup: {
    width: 200,
    height: 200,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapper: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  contentSection: {
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 32,
  },
  benefitsContainer: {
    width: '100%',
    gap: 16,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  benefitIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  benefitTextContainer: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  benefitDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  spacer: {
    height: 30,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 12,
    borderTopWidth: 1,
    marginHorizontal: -20,
    paddingLeft: 20,
    paddingRight: 20,
  },
  createButton: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButtonIcon: {
    marginRight: 8,
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  joinButton: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinButtonIcon: {
    marginRight: 8,
  },
  joinButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
