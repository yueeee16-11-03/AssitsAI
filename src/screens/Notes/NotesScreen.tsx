import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { useNotesStore } from '../../store/notesStore';

type Props = NativeStackScreenProps<RootStackParamList, 'Notes'>;

export default function NotesScreen({ navigation }: Props) {
  const theme = useTheme();
  const { notes, isLoading, initialize, addNote, updateNote, deleteNote, clearAllNotes } = useNotesStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');

  useEffect(() => {
    initialize();
  }, [initialize]);

  const handleAddNote = async () => {
    if (newNoteContent.trim()) {
      await addNote(newNoteContent.trim());
      setNewNoteContent('');
    }
  };

  const handleStartEdit = (id: string, content: string) => {
    setEditingId(id);
    setEditContent(content);
  };

  const handleSaveEdit = async () => {
    if (editingId && editContent.trim()) {
      await updateNote(editingId, editContent.trim());
      setEditingId(null);
      setEditContent('');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditContent('');
  };

  const handleDeleteNote = (id: string) => {
    Alert.alert(
      'Xóa ghi chú',
      'Bạn có chắc muốn xóa ghi chú này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => deleteNote(id),
        },
      ]
    );
  };

  const handleClearAll = () => {
    if (notes.length === 0) return;
    Alert.alert(
      'Xóa tất cả',
      'Bạn có chắc muốn xóa tất cả ghi chú?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa tất cả',
          style: 'destructive',
          onPress: clearAllNotes,
        },
      ]
    );
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color={theme.colors.onSurface} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Icon name="notebook-outline" size={20} color="#FFB020" style={styles.headerIcon} />
            <Text style={[styles.headerTitle, { color: theme.colors.onSurface }]}>Sổ Ghi Chú</Text>
          </View>
          <TouchableOpacity onPress={handleClearAll} style={styles.clearButton}>
            <Icon name="delete-outline" size={22} color={notes.length > 0 ? '#EF4444' : theme.colors.onSurfaceVariant} />
          </TouchableOpacity>
        </View>

        {/* Add Note Section */}
        <View style={[styles.addNoteSection, { backgroundColor: theme.colors.surface, borderBottomColor: theme.dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }]}>
          <TextInput
            style={[styles.addNoteInput, { color: theme.colors.onSurface, backgroundColor: theme.dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}
            placeholder="Nhập ghi chú mới..."
            placeholderTextColor={theme.colors.onSurfaceVariant}
            value={newNoteContent}
            onChangeText={setNewNoteContent}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: newNoteContent.trim() ? '#10B981' : theme.dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}
            onPress={handleAddNote}
            disabled={!newNoteContent.trim()}
          >
            <Icon name="plus" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Notes List */}
        <ScrollView style={styles.notesList} contentContainerStyle={styles.notesListContent}>
          {isLoading ? (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>Đang tải...</Text>
            </View>
          ) : notes.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Icon name="note-text-outline" size={64} color={theme.colors.onSurfaceVariant} />
              <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>Chưa có ghi chú nào</Text>
              <Text style={[styles.emptySubtext, { color: theme.colors.onSurfaceVariant }]}>Nhập ghi chú của bạn ở trên</Text>
            </View>
          ) : (
            notes.map((note) => (
              <View
                key={note.id}
                style={[styles.noteCard, { backgroundColor: theme.colors.surface, borderColor: theme.dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }]}
              >
                {editingId === note.id ? (
                  <>
                    <TextInput
                      style={[styles.editInput, { color: theme.colors.onSurface, backgroundColor: theme.dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}
                      value={editContent}
                      onChangeText={setEditContent}
                      multiline
                      autoFocus
                      maxLength={500}
                    />
                    <View style={styles.editActions}>
                      <TouchableOpacity onPress={handleCancelEdit} style={styles.editActionButton}>
                        <Text style={[styles.cancelButtonText, { color: theme.colors.onSurfaceVariant }]}>Hủy</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={handleSaveEdit}
                        style={[styles.editActionButton, styles.saveButton, { backgroundColor: '#10B981' }]}
                        disabled={!editContent.trim()}
                      >
                        <Text style={styles.saveButtonText}>Lưu</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                ) : (
                  <>
                    <Text style={[styles.noteContent, { color: theme.colors.onSurface }]}>{note.content}</Text>
                    <View style={styles.noteFooter}>
                      <Text style={[styles.noteDate, { color: theme.colors.onSurfaceVariant }]}>
                        {formatDate(note.updatedAt)}
                      </Text>
                      <View style={styles.noteActions}>
                        <TouchableOpacity onPress={() => handleStartEdit(note.id, note.content)} style={styles.actionButton}>
                          <Icon name="pencil-outline" size={18} color="#06B6D4" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDeleteNote(note.id)} style={styles.actionButton}>
                          <Icon name="delete-outline" size={18} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </>
                )}
              </View>
            ))
          )}
        </ScrollView>

        {/* Info Footer */}
        <View style={[styles.infoFooter, { backgroundColor: theme.colors.surface, borderTopColor: theme.dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }]}>
          <Icon name="information-outline" size={16} color={theme.colors.onSurfaceVariant} />
          <Text style={[styles.infoText, { color: theme.colors.onSurfaceVariant }]}>
            Ghi chú chỉ lưu trên máy này • {notes.length} ghi chú
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  headerIcon: {
    marginRight: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  clearButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addNoteSection: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
  },
  addNoteInput: {
    flex: 1,
    minHeight: 48,
    maxHeight: 120,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    fontWeight: '600',
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notesList: {
    flex: 1,
  },
  notesListContent: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
  },
  noteCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  noteContent: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
    marginBottom: 12,
  },
  noteFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  noteDate: {
    fontSize: 12,
    fontWeight: '600',
  },
  noteActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editInput: {
    minHeight: 80,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 12,
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  editActionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButton: {
    backgroundColor: '#10B981',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  infoFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
    borderTopWidth: 1,
  },
  infoText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
