import React from 'react';
import { View, StyleSheet, Dimensions, Image, TouchableOpacity, FlatList, RefreshControl } from 'react-native';
import { CommunityPost } from '../types';
import { useTheme } from '../../hooks/useTheme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 3;
const SPACING = 1;
const ITEM_WIDTH = (width - (COLUMN_COUNT - 1) * SPACING) / COLUMN_COUNT;

interface ImageGridProps {
  posts: CommunityPost[];
  onPostPress: (post: CommunityPost) => void;
  ListHeaderComponent?: React.ReactElement;
  onScroll?: any;
  refreshing?: boolean;
  onRefresh?: () => void;
}

export const ImageGrid: React.FC<ImageGridProps> = ({ posts, onPostPress, ListHeaderComponent, onScroll, refreshing, onRefresh }) => {
  const { colors } = useTheme();

  const renderItem = ({ item }: { item: CommunityPost }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => onPostPress(item)}
      style={[styles.itemContainer, { backgroundColor: colors.glassSurface }]}
    >
      <Image source={{ uri: item.imageUrl }} style={styles.image} />
    </TouchableOpacity>
  );

  return (
    <FlatList
      data={posts}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      numColumns={COLUMN_COUNT}
      ListHeaderComponent={ListHeaderComponent}
      contentContainerStyle={styles.listContent}
      onScroll={onScroll}
      scrollEventThrottle={16}
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={!!refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primaryStart}
            colors={[colors.primaryStart]}
          />
        ) : undefined
      }
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="camera-outline" size={48} color={colors.textTertiary} />
        </View>
      }
    />
  );
};

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: 100, // For bottom nav bar
  },
  itemContainer: {
    width: ITEM_WIDTH,
    height: ITEM_WIDTH,
    marginRight: SPACING,
    marginBottom: SPACING,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  emptyContainer: {
    paddingTop: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
