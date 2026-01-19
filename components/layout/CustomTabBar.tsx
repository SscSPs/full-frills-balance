import { AppText } from '@/components/core';
import { Shape, Spacing, withOpacity } from '@/constants';
import { useTheme } from '@/hooks/use-theme';
import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useState } from 'react';
import { Animated, Dimensions, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface CustomTabBarProps {
  activeTab: 'home' | 'accounts';
  onTabChange: (tab: 'home' | 'accounts') => void;
  onAddIncome?: () => void;
  onAddExpense?: () => void;
  onAddTransfer?: () => void;
  onAddAccount?: () => void;
}

const FAB_SIZE = 40; // Reduced from 56 to 40
const { width: screenWidth } = Dimensions.get('window');

export default function CustomTabBar({
  activeTab,
  onTabChange,
  onAddIncome,
  onAddExpense,
  onAddTransfer,
  onAddAccount
}: CustomTabBarProps) {
  const [expanded, setExpanded] = useState(false);
  const { theme } = useTheme();

  // Animation values
  const fabRotation = React.useRef(new Animated.Value(0)).current;
  const backgroundOpacity = React.useRef(new Animated.Value(0)).current;
  const buttonsOpacity = React.useRef(new Animated.Value(0)).current;

  const toggleExpanded = () => {
    if (activeTab === 'home') {
      const toValue = expanded ? 0 : 1;

      Animated.parallel([
        Animated.timing(fabRotation, {
          toValue: toValue * 45,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(backgroundOpacity, {
          toValue,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(buttonsOpacity, {
          toValue,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      setExpanded(!expanded);
    } else if (activeTab === 'accounts' && onAddAccount) {
      onAddAccount();
    }
  };

  const handleTransactionButtonPress = (type: 'income' | 'expense' | 'transfer') => {
    toggleExpanded();
    switch (type) {
      case 'income':
        onAddIncome?.();
        break;
      case 'expense':
        onAddExpense?.();
        break;
      case 'transfer':
        onAddTransfer?.();
        break;
    }
  };

  const tabs = [
    {
      id: 'home' as const,
      title: 'Home',
      icon: '🏠',
    },
    {
      id: 'accounts' as const,
      title: 'Accounts',
      icon: '💼',
    },
  ];

  const buttonsShown = buttonsOpacity;
  const fabX = screenWidth / 2 - FAB_SIZE / 2;
  const buttonLeftX = Spacing.lg;
  const buttonRightX = screenWidth - Spacing.lg - FAB_SIZE;
  const buttonY = -100; // Reduced from -120 to -100 for better positioning

  return (
    <View style={{ flex: 1 }}>
      {/* Main content */}
      <SafeAreaView
        style={[
          styles.container,
          {
            backgroundColor: theme.background,
            borderTopColor: theme.border,
          }
        ]}
        testID="custom-tab-bar"
      >
        <View style={styles.tabContainer}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tab,
                activeTab === tab.id && {
                  backgroundColor: withOpacity(theme.primary, 0.12),
                },
              ]}
              onPress={() => onTabChange(tab.id)}
            >
              <View style={styles.tabContent}>
                <AppText
                  variant="body"
                  style={[
                    styles.tabIcon,
                    {
                      color: activeTab === tab.id ? theme.primary : theme.textSecondary
                    }
                  ]}
                >
                  {tab.icon}
                </AppText>
                <AppText
                  variant="caption"
                  style={[
                    styles.tabTitle,
                    {
                      color: activeTab === tab.id ? theme.primary : theme.textSecondary
                    }
                  ]}
                >
                  {tab.title}
                </AppText>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </SafeAreaView>

      {/* Background overlay when expanded */}
      {expanded && (
        <Animated.View
          style={[
            styles.overlay,
            {
              backgroundColor: theme.background,
              opacity: backgroundOpacity,
            },
          ]}
          onTouchStart={toggleExpanded}
        />
      )}

      {/* Transaction buttons - only show when expanded */}
      {activeTab === 'home' && expanded && (
        <Animated.View style={[styles.transactionButtons, { opacity: buttonsOpacity }]} testID="transaction-buttons">
          {/* Income button */}
          <TouchableOpacity
            style={[
              styles.transactionButton,
              {
                backgroundColor: theme.success, // Green for income
                left: buttonLeftX,
                top: buttonY,
              },
            ]}
            onPress={() => handleTransactionButtonPress('income')}
            testID="transaction-button"
          >
            <Ionicons name="add" size={24} color={theme.pureInverse} />
          </TouchableOpacity>
          <AppText
            variant="caption"
            style={[
              styles.transactionLabel,
              {
                left: buttonLeftX - 8,
                top: buttonY + FAB_SIZE + 4,
                color: theme.background,
              }
            ]}
          >
            INCOME
          </AppText>

          {/* Expense button */}
          <TouchableOpacity
            style={[
              styles.transactionButton,
              {
                backgroundColor: theme.error, // Red for expense
                left: fabX,
                top: buttonY - 60,
              },
            ]}
            onPress={() => handleTransactionButtonPress('expense')}
            testID="transaction-button"
          >
            <Ionicons name="remove" size={24} color={theme.pureInverse} />
          </TouchableOpacity>
          <AppText
            variant="caption"
            style={[
              styles.transactionLabel,
              {
                left: fabX - 8,
                top: buttonY - 60 + FAB_SIZE + 4,
                color: theme.background,
              }
            ]}
          >
            EXPENSE
          </AppText>

          {/* Transfer button */}
          <TouchableOpacity
            style={[
              styles.transactionButton,
              {
                backgroundColor: theme.primary, // Primary color for transfer
                left: buttonRightX,
                top: buttonY,
              },
            ]}
            onPress={() => handleTransactionButtonPress('transfer')}
            testID="transaction-button"
          >
            <Ionicons name="swap-horizontal" size={24} color={theme.pureInverse} />
          </TouchableOpacity>
          <AppText
            variant="caption"
            style={[
              styles.transactionLabel,
              {
                left: buttonRightX - 8,
                top: buttonY + FAB_SIZE + 4,
                color: theme.background,
              }
            ]}
          >
            TRANSFER
          </AppText>
        </Animated.View>
      )}

      {/* Main FAB button */}
      <TouchableOpacity
        style={[
          styles.fab,
          {
            backgroundColor: activeTab === 'home'
              ? (expanded ? theme.surface : theme.primary)
              : theme.success, // Green for accounts tab
            left: fabX,
            bottom: 80, // Position above tab bar
          },
        ]}
        testID="fab-button"
        onPress={toggleExpanded}
      >
        <Animated.View
          style={[
            styles.fabIcon,
            {
              transform: [{
                rotate: fabRotation.interpolate({
                  inputRange: [0, 45],
                  outputRange: ['0deg', '45deg'],
                })
              }],
            },
          ]}
        >
          <Ionicons
            name={expanded ? 'close' : 'add'}
            size={24}
            color={theme.pureInverse}
          />
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingVertical: Spacing.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginHorizontal: Spacing.xs,
    borderRadius: 12,
    alignItems: 'center',
  },
  tabContent: {
    alignItems: 'center',
    gap: 2,
  },
  tabIcon: {
    fontSize: 20,
    textAlign: 'center',
  },
  tabTitle: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
  },
  transactionButtons: {
    position: 'absolute',
    bottom: 150,
    left: 0,
    right: 0,
    height: 200,
    zIndex: 200,
  },
  transactionButton: {
    position: 'absolute',
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shape.elevation.md,
  },
  transactionLabel: {
    position: 'absolute',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
    width: FAB_SIZE + 16,
  },
  fab: {
    position: 'absolute',
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shape.elevation.md,
    zIndex: 300,
  },
  fabIcon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
