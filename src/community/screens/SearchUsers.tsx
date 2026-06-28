import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { searchUsersByUsername } from '../services/firestoreCommunity';
import { CommunityUserProfile } from '../types';
import { useAppSelector } from '../../hooks/reduxHooks';
import { Spacing } from '../../theme/Theme';

export const SearchUsers: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors } = useTheme();
  const { user } = useAppSelector((state) => state.auth);
  
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CommunityUserProfile[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query.trim() && user?.uid) {
        performSearch(query);
      } else {
        setResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const performSearch = async (searchTerm: string) => {
    if (!user?.uid) return;
    setLoading(true);
    try {
      const users = await searchUsersByUsername(searchTerm, user.uid);
      setResults(users);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: CommunityUserProfile }) => (
    <TouchableOpacity 
      style={styles.userItem} 
      onPress={() => navigation.navigate('UserProfile', { userId: item.uid })}
    >
      {item.profileImage ? (
        <Image source={{ uri: item.profileImage }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatarPlaceholder, { backgroundColor: colors.glassHighlight }]}>
          <MaterialCommunityIcons name="account" size={24} color={colors.textSecondary} />
        </View>
      )}
      <View style={styles.userInfo}>
        <Text style={[styles.username, { color: colors.textPrimary }]}>{item.username}</Text>
        <Text style={[styles.displayName, { color: colors.textSecondary }]}>{item.displayName}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundDark }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.glassBorder }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={26} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={[styles.searchBar, { backgroundColor: colors.glassSurface }]}>
          <MaterialCommunityIcons name="magnify" size={20} color={colors.textTertiary} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder="Search users..."
            placeholderTextColor={colors.textTertiary}
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <MaterialCommunityIcons name="close-circle" size={20} color={colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Results */}
      {loading ? (
        <ActivityIndicator color={colors.primaryStart} style={styles.loader} />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.uid}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            query.trim() ? (
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No users found.</Text>
            ) : (
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Search for friends and trainers.</Text>
            )
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.m,
    paddingTop: 50,
    borderBottomWidth: 1,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: Spacing.m,
    paddingHorizontal: Spacing.m,
    height: 40,
    borderRadius: 20,
  },
  searchIcon: {
    marginRight: Spacing.s,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  loader: {
    marginTop: Spacing.xl,
  },
  listContent: {
    padding: Spacing.m,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.m,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    marginLeft: Spacing.m,
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: '700',
  },
  displayName: {
    fontSize: 14,
    marginTop: 2,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: Spacing.xl,
    fontSize: 16,
  },
});
