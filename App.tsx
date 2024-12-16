/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, {useState, useEffect, PropsWithChildren} from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import axios from 'axios';

import {
  Colors,
  DebugInstructions,
  Header,
  LearnMoreLinks,
  ReloadInstructions,
} from 'react-native/Libraries/NewAppScreen';

type SectionProps = PropsWithChildren<{
  title: string;
}>;

interface Task {
  id: number;
  title: string;
  completed: boolean;
}

interface AppState {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  refreshing: boolean;
  filter: FILTER;
}

enum FILTER {
  ALL,
  COMPLETED,
  INCOMPLETE,
}

function Section({children, title}: SectionProps): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  return (
    <View style={styles.sectionContainer}>
      <Text
        style={[
          styles.sectionTitle,
          {
            color: isDarkMode ? Colors.white : Colors.black,
          },
        ]}>
        {title}
      </Text>
      <Text
        style={[
          styles.sectionDescription,
          {
            color: isDarkMode ? Colors.light : Colors.dark,
          },
        ]}>
        {children}
      </Text>
    </View>
  );
}

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };

  const [state, setState] = useState<AppState>({
    tasks: [],
    loading: true,
    error: null,
    refreshing: false,
    filter: FILTER.ALL,
  });

  // Fetch all tasks from the API
  const fetchTasks = async () => {
    setState(prevState => ({
      ...prevState,
      loading: true,
      error: null,
    }));

    try {
      const response = await axios.get<Task[]>(
        'https://jsonplaceholder.typicode.com/todos', //Seems fine to hard code this since it is only used once, it's already DRY
      );
      console.log('response', response);
      setState(prevState => ({
        ...prevState,
        tasks: response.data,
        loading: false,
      }));
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setState(prevState => ({
        ...prevState,
        loading: false,
        error: 'Failed to load tasks. Please try again later.',
      }));
    }
  };

  // Load tasks from AsyncStorage on initial load
  useEffect(() => {
    const loadTasks = async () => {
      try {
        setState(prevState => ({
          ...prevState,
          loading: false,
          refreshing: false,
        }));
        const tasks = await fetchTasks(); // Fetch from API if no data in storage
        console.log('tasks', tasks);
      } catch (err) {
        console.error('Failed to load tasks from storage', err);
        fetchTasks(); // Fallback to fetching from API
      }
    };
    loadTasks();
  }, []);

  return (
    <SafeAreaView style={backgroundStyle}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={backgroundStyle.backgroundColor}
      />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={backgroundStyle}>
        <Header />
        <View
          style={{
            backgroundColor: isDarkMode ? Colors.black : Colors.white,
          }}>
          <Section title="Step One">
            Edit <Text style={styles.highlight}>App.tsx</Text> to change this
            screen and then come back to see your edits.
          </Section>
          <Section title="See Your Changes">
            <ReloadInstructions />
          </Section>
          <Section title="Debug">
            <DebugInstructions />
          </Section>
          <Section title="Learn More">
            Read the docs to discover what to do next:
          </Section>
          <LearnMoreLinks />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
  },
  highlight: {
    fontWeight: '700',
  },
});

export default App;
