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
  StyleSheet,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTransactionStore } from '../stores/transactionStore';
import {
  EXPENSE_CATEGORIES,
  CATEGORY_META,
  type TCategory,
} from '../constants/categories';
import { colors, spacing, radius, shadow } from '../theme';

export default function AddTransactionScreen() {
  const { add } = useTransactionStore();

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TCategory>('food');
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
        source: 'manual',
      });
      setAmount('');
      setDescription('');
      setCategory('food');
    } catch {
      Alert.alert('Error', 'Failed to add transaction. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

      <ScrollView
        style={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Add Expense</Text>
        </View>

        <View style={styles.body}>
          {/* Amount */}
          <View style={styles.amountSection}>
            <Text style={styles.amountCurrency}>₹</Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={colors.border}
              style={styles.amountInput}
              autoFocus
            />
          </View>

          {/* Description */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Description</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="What was this for?"
              placeholderTextColor={colors.textLight}
              style={styles.input}
              returnKeyType="done"
            />
          </View>

          {/* Category */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Category</Text>
            <View style={styles.categoryGrid}>
              {EXPENSE_CATEGORIES.map(cat => {
                const meta = CATEGORY_META[cat];
                const selected = category === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setCategory(cat)}
                    style={[
                      styles.categoryBtn,
                      selected && {
                        backgroundColor: meta.bg,
                        borderColor: meta.color,
                      },
                    ]}
                    activeOpacity={0.75}
                  >
                    <View
                      style={[
                        styles.catIconWrap,
                        {
                          backgroundColor: selected
                            ? meta.color
                            : colors.inputBg,
                        },
                      ]}
                    >
                      <Icon
                        name={meta.icon}
                        size={16}
                        color={selected ? '#FFFFFF' : meta.color}
                      />
                    </View>
                    <Text
                      style={[
                        styles.catLabel,
                        { color: selected ? meta.color : colors.textSub },
                      ]}
                    >
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Submit */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={loading}
            style={[styles.submitBtn, shadow.card]}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Icon name="check" size={18} color="#FFFFFF" />
                <Text style={styles.submitText}>Add Expense</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    flex: 1,
  },
  header: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingTop: 56,
    paddingBottom: spacing.base,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
  },
  body: {
    padding: spacing.base,
    gap: spacing.base,
  },
  amountSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: 8,
    ...{
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
    },
  },
  amountCurrency: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.expense,
  },
  amountInput: {
    flex: 1,
    fontSize: 44,
    fontWeight: '800',
    letterSpacing: -1,
    padding: 0,
    color: colors.expense,
  },
  field: {
    gap: spacing.sm,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSub,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingLeft: 4,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.base,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.text,
    ...{
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
    },
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  categoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  catIconWrap: {
    width: 26,
    height: 26,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.xl,
    paddingVertical: 16,
    marginTop: spacing.sm,
    backgroundColor: colors.expense,
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
