import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { useUser } from '../contexts/UserContext';

export default function OnboardingScreen() {
  const [name, setName] = useState('');
  const colorScheme = useColorScheme();
  const { updateUserName, completeOnboarding } = useUser();

  const handleContinue = async () => {
    if (name.trim()) {
      updateUserName(name.trim());
      await completeOnboarding();
      router.push('/account-creation' as any);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        <ThemedText type="title" style={styles.title}>
          Welcome to Full Frills Balance
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Let's get started by telling us your name
        </ThemedText>
        
        <TextInput
          style={[
            styles.input,
            { 
              borderColor: colorScheme === 'dark' ? '#444' : '#ddd',
              color: colorScheme === 'dark' ? '#fff' : '#000'
            }
          ]}
          placeholder="Enter your name"
          placeholderTextColor={colorScheme === 'dark' ? '#888' : '#999'}
          value={name}
          onChangeText={setName}
          autoFocus
        />
        
        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: name.trim() ? '#007AFF' : '#ccc' }
          ]}
          onPress={handleContinue}
          disabled={!name.trim()}
        >
          <ThemedText style={styles.buttonText}>Continue</ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  content: {
    maxWidth: 400,
    width: '100%',
    alignSelf: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 40,
    opacity: 0.7,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    marginBottom: 24,
  },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
