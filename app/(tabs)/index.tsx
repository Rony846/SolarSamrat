import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getFeed, getGroups, likePost } from '@/src/api/samrat';
import type { Post } from '@/src/api/types';
import { Card, Avatar, RankChip, Loading, Empty, timeAgo, ROLE_LABEL } from '@/src/ui';
import { spacing, radius, font, serif } from '@/src/theme';
import { useThemed, type ThemePalette } from '@/src/ThemeContext';

export default function Feed() {
  const { colors, styles } = useThemed(makeStyles);
  const router = useRouter();
  const qc = useQueryClient();
  const [group, setGroup] = useState<string | undefined>(undefined);

  const groupsQ = useQuery({ queryKey: ['groups'], queryFn: getGroups });
  const feedQ = useQuery({ queryKey: ['feed', group], queryFn: () => getFeed(group) });

  const onLike = async (p: Post) => {
    // optimistic
    qc.setQueryData<{ posts: Post[] }>(['feed', group], (old) =>
      old ? { posts: old.posts.map((x) => x.id === p.id
        ? { ...x, liked: !x.liked, like_count: x.like_count + (x.liked ? -1 : 1) } : x) } : old);
    try { await likePost(p.id); } catch { qc.invalidateQueries({ queryKey: ['feed', group] }); }
  };

  const groups = groupsQ.data?.groups || [];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.brand}>Solar Samrat</Text>
          <Text style={styles.brandSub}>The solar trade, together</Text>
        </View>
        <View style={styles.headerBtns}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/quote')}>
            <Ionicons name="sparkles" size={23} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/qa')}>
            <Ionicons name="help-circle-outline" size={24} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/directory')}>
            <Ionicons name="people-outline" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={feedQ.data?.posts || []}
        keyExtractor={(p) => p.id}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 120 }}
        refreshControl={
          <RefreshControl
            refreshing={feedQ.isFetching && !feedQ.isLoading}
            onRefresh={() => feedQ.refetch()}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={[{ key: '', name: 'All', icon: '✨', posts: 0 }, ...groups]}
            keyExtractor={(g) => g.key || 'all'}
            contentContainerStyle={{ paddingBottom: spacing.md, gap: spacing.sm }}
            renderItem={({ item }) => {
              const active = (group || '') === item.key;
              return (
                <TouchableOpacity
                  style={[styles.gChip, active && styles.gChipActive]}
                  onPress={() => setGroup(item.key || undefined)}
                >
                  <Text style={[styles.gChipText, active && styles.gChipTextActive]}>
                    {item.icon} {item.name}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        }
        renderItem={({ item }) => (
          <PostCard post={item} onLike={() => onLike(item)} onOpen={() => router.push(`/post/${item.id}`)} />
        )}
        ListEmptyComponent={
          feedQ.isLoading ? <Loading /> : <Empty icon="newspaper-outline" text="No posts yet. Be the first to share something." />
        }
      />

      <TouchableOpacity style={styles.fab} onPress={() => router.push('/new-post')} activeOpacity={0.9}>
        <Ionicons name="create" size={22} color={colors.onPrimary} />
        <Text style={styles.fabText}>Post</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

export function PostCard({ post, onLike, onOpen }: { post: Post; onLike: () => void; onOpen: () => void }) {
  const { colors, styles } = useThemed(makeStyles);
  return (
    <Card style={{ marginBottom: spacing.md }}>
      <TouchableOpacity activeOpacity={0.8} onPress={onOpen}>
        <View style={styles.row}>
          <Avatar name={post.author?.business_name} />
          <View style={{ flex: 1, marginLeft: spacing.md }}>
            <Text style={styles.author}>{post.author?.business_name || 'Member'}</Text>
            <View style={styles.metaRow}>
              <RankChip rank={post.author?.rank} />
              <Text style={styles.meta}>
                {' '}{post.author?.role ? ROLE_LABEL[post.author.role] : ''} · {timeAgo(post.created_at)}
              </Text>
            </View>
          </View>
        </View>
        <Text style={styles.body}>{post.body}</Text>
      </TouchableOpacity>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.action} onPress={onLike}>
          <Ionicons name={post.liked ? 'heart' : 'heart-outline'} size={20} color={post.liked ? colors.danger : colors.muted} />
          <Text style={styles.actionText}>{post.like_count || 0}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.action} onPress={onOpen}>
          <Ionicons name="chatbubble-outline" size={18} color={colors.muted} />
          <Text style={styles.actionText}>{post.comment_count || 0}</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );
}

const makeStyles = (colors: ThemePalette) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  brand: { fontSize: font.size.xl + 2, fontFamily: serif, color: colors.text, letterSpacing: 0.3 },
  brandSub: { fontSize: font.size.xs, color: colors.primary, fontWeight: font.weight.semibold },
  headerBtns: { flexDirection: 'row', gap: spacing.sm },
  iconBtn: { padding: spacing.xs },
  gChip: {
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.pill,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card,
  },
  gChipActive: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  gChipText: { color: colors.textDim, fontSize: font.size.sm, fontWeight: font.weight.semibold },
  gChipTextActive: { color: colors.primary },
  row: { flexDirection: 'row', alignItems: 'center' },
  author: { fontSize: font.size.md, fontWeight: font.weight.heavy, color: colors.text },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  meta: { fontSize: font.size.xs, color: colors.muted },
  body: { fontSize: font.size.md, color: colors.text, lineHeight: 22, marginTop: spacing.md },
  actions: { flexDirection: 'row', marginTop: spacing.md, gap: spacing.xl },
  action: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  actionText: { color: colors.muted, fontSize: font.size.sm, fontWeight: font.weight.semibold },
  fab: {
    position: 'absolute', right: spacing.xl, bottom: 100,
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    backgroundColor: colors.primary, paddingHorizontal: spacing.xl, paddingVertical: spacing.md,
    borderRadius: radius.pill, shadowColor: colors.primary, shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 6,
  },
  fabText: { color: colors.onPrimary, fontWeight: font.weight.black, fontSize: font.size.md },
});
