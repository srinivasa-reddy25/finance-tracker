import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTransactionStore } from '../stores/transactionStore';
import {
  CATEGORIES,
  CATEGORY_META,
  type TCategory,
} from '../constants/categories';

export default function AddTransactionScreen() {
  const { add } = useTransactionStore();

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TCategory>('others');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const parsedAmount = parseFloat(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Invalid amount', 'Enter a valid amount greater than 0');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Missing description', 'Please add a description');
      return;
    }

    setLoading(true);
    try {
      await add({
        amount: parsedAmount,
        description: description.trim(),
        category,
        note: note.trim() || undefined,
        source: 'manual',
      });
      setAmount('');
      setDescription('');
      setCategory('others');
      setNote('');
      Alert.alert('Done', 'Transaction added');
    } catch {
      Alert.alert('Error', 'Failed to add transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        className="flex-1 bg-surface"
        keyboardShouldPersistTaps="handled"
      >
        <View className="bg-white px-5 pt-14 pb-5">
          <Text className="text-gray-900 font-bold text-xl">
            Add Transaction
          </Text>
        </View>

        <View className="bg-white mt-3 px-5 py-5 gap-5">
          {/* Amount */}
          <View>
            <Text className="text-gray-500 text-xs font-medium mb-2">
              AMOUNT (₹)
            </Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor="#9CA3AF"
              className="text-gray-900 text-3xl font-bold border-b border-border pb-2"
            />
          </View>

          {/* Description */}
          <View>
            <Text className="text-gray-500 text-xs font-medium mb-2">
              DESCRIPTION
            </Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="What was this for?"
              placeholderTextColor="#9CA3AF"
              className="text-gray-900 text-sm border border-border rounded-xl px-4 py-3"
            />
          </View>

          {/* Category picker */}
          <View>
            <Text className="text-gray-500 text-xs font-medium mb-2">
              CATEGORY
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {CATEGORIES.map(cat => {
                const meta = CATEGORY_META[cat];
                const selected = category === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setCategory(cat)}
                    className={`flex-row items-center gap-1.5 px-3 py-2 rounded-xl border ${
                      selected
                        ? 'border-primary bg-primary'
                        : 'border-border bg-surface'
                    }`}
                  >
                    <Text>{meta.icon}</Text>
                    <Text
                      className={`text-xs font-medium capitalize ${
                        selected ? 'text-white' : 'text-gray-600'
                      }`}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Note (optional) */}
          <View>
            <Text className="text-gray-500 text-xs font-medium mb-2">
              NOTE (OPTIONAL)
            </Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Any extra details..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              className="text-gray-900 text-sm border border-border rounded-xl px-4 py-3"
            />
          </View>

          {/* Submit */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={loading}
            className="bg-primary py-4 rounded-2xl items-center mt-2"
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-semibold text-base">
                Add Transaction
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
