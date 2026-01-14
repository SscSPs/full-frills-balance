import { useRouter } from 'expo-router'
import React, { useState } from 'react'
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function OnboardingScreen() {
  const [userName, setUserName] = useState('')
  const router = useRouter()

  const handleContinue = () => {
    if (!userName.trim()) {
      Alert.alert('Name Required', 'Please enter your name to continue.')
      return
    }

    // Store user name (for now, we'll use simple storage)
    // In a future iteration, this would go through a preferences repository
    try {
      // Simple storage for now - will be replaced with proper preferences later
      localStorage.setItem('userName', userName.trim())
    } catch (error) {
      console.error('Failed to save user name:', error)
      Alert.alert('Error', 'Failed to save your name. Please try again.')
      return
    }

    // Navigate to account creation
    router.push('/account-creation')
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Welcome to Full Frills Balance</Text>
        <Text style={styles.subtitle}>Let's get your accounts set up</Text>
        
        <View style={styles.inputContainer}>
          <Text style={styles.label}>What should we call you?</Text>
          <TextInput
            style={styles.input}
            value={userName}
            onChangeText={setUserName}
            placeholder="Enter your name"
            autoFocus
            maxLength={50}
            returnKeyType="next"
            onSubmitEditing={handleContinue}
          />
        </View>

        <TouchableOpacity 
          style={[styles.button, !userName.trim() && styles.buttonDisabled]}
          onPress={handleContinue}
          disabled={!userName.trim()}
        >
          <Text style={styles.buttonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 32,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
})
