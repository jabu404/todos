import React, {useState, useEffect, useCallback} from 'react';
import {StyleSheet, View, FlatList, ListRenderItemInfo} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';

import {
  Button,
  Card,
  ActivityIndicator,
  Appbar,
  Text,
} from 'react-native-paper';

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

export default function App(): React.JSX.Element {
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
        'https://jsonplaceholder.typicode.com/todos',
      );
      setState(prevState => ({
        ...prevState,
        tasks: response.data,
        loading: false,
      }));
      await AsyncStorage.setItem('tasks', JSON.stringify(response.data)); // Store tasks in AsyncStorage
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
    const loadStoredTasks = async () => {
      try {
        const storedTasks = await AsyncStorage.getItem('tasks');

        setState(prevState => ({
          ...prevState,
          loading: false,
          refreshing: false,
        }));
        if (storedTasks) {
          setState(prevState => ({
            ...prevState,
            tasks: JSON.parse(storedTasks),
            loading: false,
          }));
        } else {
          fetchTasks(); // Fetch from API if no data in storage
        }
      } catch (err) {
        console.error('Failed to load tasks from storage', err);
        fetchTasks(); // Fallback to fetching from API
      }
    };
    loadStoredTasks();
  }, []);

  const toggleComplete = (taskId: number) => {
    setState(prevState => ({
      ...prevState,
      tasks: prevState.tasks.map(task =>
        task.id === taskId ? {...task, completed: !task.completed} : task,
      ),
    }));
  };

  const handleRefresh = useCallback(async () => {
    setState(prevState => ({...prevState, refreshing: true}));
    await fetchTasks(); // Refresh by fetching tasks again
    setState(prevState => ({...prevState, refreshing: false}));
  }, []);

  // Filter tasks based on completion status
  const filteredTasks = state.tasks.filter(task => {
    if (state.filter === FILTER.COMPLETED) return task.completed;
    if (state.filter === FILTER.INCOMPLETE) return !task.completed;
    return true;
  });

  // Loading spinner, skeleton loader, or error message
  if (state.loading && !state.refreshing) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" animating={true} />
        <Text style={styles.loadingText}>Loading tasks...</Text>
      </View>
    );
  }

  if (state.error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{state.error}</Text>
        <Button mode="contained" onPress={handleRefresh}>
          Retry
        </Button>
      </View>
    );
  }

  return (
    <SafeAreaProvider style={styles.top}>
      <View style={styles.container}>
        {/* Material UI-style AppBar */}
        <Appbar.Header style={styles.appBar}>
          <Appbar.Content title="Your tasks" />
        </Appbar.Header>
        {/* Filter Options */}
        <View style={styles.filterContainer}>
          <Button
            mode={state.filter === FILTER.ALL ? 'contained' : 'text'}
            onPress={() =>
              setState(prevState => ({...prevState, filter: FILTER.ALL}))
            }>
            All Tasks
          </Button>
          <Button
            mode={state.filter === FILTER.COMPLETED ? 'contained' : 'text'}
            onPress={() =>
              setState(prevState => ({...prevState, filter: FILTER.COMPLETED}))
            }>
            Completed
          </Button>
          <Button
            mode={state.filter === FILTER.INCOMPLETE ? 'contained' : 'text'}
            onPress={() =>
              setState(prevState => ({...prevState, filter: FILTER.INCOMPLETE}))
            }>
            Incomplete
          </Button>
        </View>

        {/* Render Skeleton Loader when tasks are being fetched and we already have some tasks loaded, right? The loading spinner only shows up once */}
        {state.loading && state.refreshing ? (
          <SkeletonPlaceholder
            backgroundColor="lightgray"
            highlightColor="#ffffff">
            <>
              <View style={styles.skeletonCard} />
              <View style={styles.skeletonCard} />
              <View style={styles.skeletonCard} />
            </>
          </SkeletonPlaceholder>
        ) : (
          <FlatList
            data={filteredTasks}
            renderItem={({item}: ListRenderItemInfo<Task>) => (
              <>
                <Card
                  style={[styles.card, item.completed && styles.completedCard]}>
                  <Card.Title
                    title={item.title}
                    titleStyle={[item.completed && styles.completedText]}
                    right={props => (
                      <Button
                        {...props}
                        mode="contained-tonal"
                        maxFontSizeMultiplier={0.5}
                        style={{marginRight: 16}}
                        contentStyle={styles.itemButton}
                        icon={
                          item.completed
                            ? 'checkbox-outline'
                            : 'checkbox-blank-outline'
                        }
                        onPress={() => toggleComplete(item.id)}
                        accessibilityLabel={
                          item.completed
                            ? 'Unmark as complete'
                            : 'Mark as complete'
                        }>
                        {item.completed
                          ? 'Unmark as complete'
                          : 'Mark as complete'}
                      </Button>
                    )}
                  />
                </Card>
              </>
            )}
            keyExtractor={item => item.id.toString()}
            refreshing={state.refreshing}
            onRefresh={handleRefresh}
          />
        )}
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  top: {
    padding: 16,
    backgroundColor: '#e8eaed',
  },
  container: {
    flex: 1,
    width: '100%',
    maxWidth: 800,
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  appBar: {
    backgroundColor: 'transparent',
  },
  card: {
    marginBottom: 15,
    borderRadius: 10,
    elevation: 3,
    marginHorizontal: 2,
  },
  completedCard: {
    backgroundColor: '#d0f8d0', // Light gren background for completed tasks
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: 'gray',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#555',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  errorText: {
    marginBottom: 20,
    fontSize: 18,
    color: 'red',
    fontWeight: 'bold',
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  skeletonCard: {
    marginBottom: 15,
    height: 60,
    borderRadius: 10,
  },
  itemButton: {
    flexDirection: 'row-reverse',
  },
});
