import { create } from 'zustand';
import {
  createCustomList,
  getAllCustomLists,
  updateCustomList,
  deleteCustomList as dbDeleteList,
} from '@/lib/database';

interface CustomList {
  id: number;
  name: string;
  description: string;
  created_at: number;
  kanji_ids: string;
  vocab_ids: string;
}

interface ListsState {
  lists: CustomList[];
  isLoading: boolean;

  loadLists: () => Promise<void>;
  addList: (name: string, description: string) => Promise<number>;
  removeList: (id: number) => Promise<void>;
  addKanjiToList: (listId: number, kanjiId: number) => Promise<void>;
  removeKanjiFromList: (listId: number, kanjiId: number) => Promise<void>;
  addVocabToList: (listId: number, vocabId: number) => Promise<void>;
  removeVocabFromList: (listId: number, vocabId: number) => Promise<void>;
}

export const useListsStore = create<ListsState>((set, get) => ({
  lists: [],
  isLoading: false,

  loadLists: async () => {
    set({ isLoading: true });
    const lists = (await getAllCustomLists()) as CustomList[];
    set({ lists, isLoading: false });
  },

  addList: async (name, description) => {
    const id = await createCustomList(name, description, [], []);
    await get().loadLists();
    return id;
  },

  removeList: async (id) => {
    await dbDeleteList(id);
    await get().loadLists();
  },

  addKanjiToList: async (listId, kanjiId) => {
    const list = get().lists.find((l) => l.id === listId);
    if (!list) return;
    const kanjiIds: number[] = JSON.parse(list.kanji_ids || '[]');
    if (!kanjiIds.includes(kanjiId)) {
      kanjiIds.push(kanjiId);
      const vocabIds: number[] = JSON.parse(list.vocab_ids || '[]');
      await updateCustomList(listId, kanjiIds, vocabIds);
      await get().loadLists();
    }
  },

  removeKanjiFromList: async (listId, kanjiId) => {
    const list = get().lists.find((l) => l.id === listId);
    if (!list) return;
    const kanjiIds: number[] = JSON.parse(list.kanji_ids || '[]').filter(
      (id: number) => id !== kanjiId
    );
    const vocabIds: number[] = JSON.parse(list.vocab_ids || '[]');
    await updateCustomList(listId, kanjiIds, vocabIds);
    await get().loadLists();
  },

  addVocabToList: async (listId, vocabId) => {
    const list = get().lists.find((l) => l.id === listId);
    if (!list) return;
    const vocabIds: number[] = JSON.parse(list.vocab_ids || '[]');
    if (!vocabIds.includes(vocabId)) {
      vocabIds.push(vocabId);
      const kanjiIds: number[] = JSON.parse(list.kanji_ids || '[]');
      await updateCustomList(listId, kanjiIds, vocabIds);
      await get().loadLists();
    }
  },

  removeVocabFromList: async (listId, vocabId) => {
    const list = get().lists.find((l) => l.id === listId);
    if (!list) return;
    const vocabIds: number[] = JSON.parse(list.vocab_ids || '[]').filter(
      (id: number) => id !== vocabId
    );
    const kanjiIds: number[] = JSON.parse(list.kanji_ids || '[]');
    await updateCustomList(listId, kanjiIds, vocabIds);
    await get().loadLists();
  },
}));
