import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useCategoryStore } from '../stores/categoryStore';
import { useTransactionStore } from '../stores/transactionStore';
import { useTransactionModalStore } from '../stores/transactionModalStore';
import { colors, radius, shadow, spacing } from '../theme';
import {
  DESCRIPTION_MAX_LENGTH,
  NOTE_MAX_LENGTH,
  TRANSACTION_MAX_AMOUNT,
} from '../constants/config';

export default function TransactionModal() {
  const { open, editTarget, close } = useTransactionModalStore();
  const {
    categories,
    loading: catLoading,
    fetch: fetchCats,
  } = useCategoryStore();
  const { add, update } = useTransactionStore();

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [note, setNote] = useState('');
  const [category, setCategory] = useState('');
  const [adding, setAdding] = useState(false);

  const amountRef = useRef<TextInput>(null);

  const expenseCategories = categories.filter(c => !c.is_income);

  // Sync form fields when editTarget changes or modal opens
  useEffect(() => {
    if (open) {
      if (editTarget) {
        setAmount(String(editTarget.amount));
        setDescription(editTarget.description);
        setNote(editTarget.note ?? '');
        setCategory(editTarget.category);
      } else {
        setAmount('');
        setDescription('');
        setNote('');
        setCategory(expenseCategories[0]?.key ?? '');
      }
    }
  }, [open, editTarget]);

  // Ensure categories are loaded
  useEffect(() => {
    if (open && categories.length === 0) {
      fetchCats();
    }
  }, [open]);

  const resetForm = () => {
    setAmount('');
    setDescription('');
    setNote('');
    setCategory(expenseCategories[0]?.key ?? '');
  };

  const handleClose = () => {
    resetForm();
    close();
  };

  const validate = (): number | null => {
    const parsed = parseFloat(amount);
    if (!amount || isNaN(parsed) || parsed <= 0) {
      Alert.alert('Invalid amount', 'Enter a valid amount greater than 0');
      return null;
    }
    if (parsed > TRANSACTION_MAX_AMOUNT) {
      Alert.alert(
        'Amount too large',
        `Maximum allowed amount is ₹${TRANSACTION_MAX_AMOUNT.toLocaleString('en-IN')}`,
      );
      return null;
    }
    if (!description.trim()) {
      Alert.alert('Missing description', 'Please add a description');
      return null;
    }
    return parsed;
  };

  const handleAdd = async () => {
    const parsed = validate();
    if (parsed === null) return;
    setAdding(true);
    try {
      await add({
        amount: parsed,
        description: description.trim(),
        note: note.trim() || undefined,
        category,
        source: 'manual',
      });
      resetForm();
      useTransactionModalStore.getState().close();
    } catch {
      Alert.alert('Error', 'Failed to add transaction. Try again.');
    } finally {
      setAdding(false);
    }
  };

  const handleUpdate = async () => {
    if (!editTarget) return;
    const parsed = validate();
    if (parsed === null) return;
    setAdding(true);
    try {
      await update(editTarget._id, {
        amount: parsed,
        description: description.trim(),
        note: note.trim() || undefined,
        category,
      });
      resetForm();
      useTransactionModalStore.getState().close();
    } catch {
      Alert.alert('Error', 'Failed to update transaction. Try again.');
    } finally {
      setAdding(false);
    }
  };

  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
      onShow={() => setTimeout(() => amountRef.current?.focus(), 150)}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={handleClose}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={styles.dialog}
            onPress={() => {}}
          >
            {/* Header */}
            <View style={styles.dialogHeader}>
              <Text style={styles.dialogTitle}>
                {editTarget ? 'Edit Expense' : 'Add Expense'}
              </Text>
              <TouchableOpacity onPress={handleClose}>
                <Icon name="close" size={20} color={colors.ink2} />
              </TouchableOpacity>
            </View>

            {/* Amount */}
            <View style={styles.amountRow}>
              <Text style={styles.amountCurrency}>₹</Text>
              <TextInput
                ref={amountRef}
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={colors.line}
                style={styles.amountInput}
              />
            </View>

            {/* Description */}
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Description"
              placeholderTextColor={colors.ink3}
              style={styles.descInput}
              returnKeyType="next"
              maxLength={DESCRIPTION_MAX_LENGTH}
            />

            {/* Note */}
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Add a note (optional)"
              placeholderTextColor={colors.ink3}
              style={styles.descInput}
              returnKeyType="done"
              maxLength={NOTE_MAX_LENGTH}
            />

            {/* Categories */}
            {catLoading ? (
              <ActivityIndicator
                color={colors.accent}
                style={{ marginVertical: spacing.lg }}
              />
            ) : (
              <ScrollView
                style={styles.categoryScroll}
                contentContainerStyle={styles.categoryGrid}
                showsVerticalScrollIndicator={false}
              >
                {expenseCategories.map(cat => {
                  const selected = category === cat.key;
                  return (
                    <TouchableOpacity
                      key={cat.key}
                      onPress={() => setCategory(cat.key)}
                      style={[
                        styles.catChip,
                        selected && {
                          backgroundColor: cat.bg,
                          borderColor: cat.color,
                        },
                      ]}
                      activeOpacity={0.75}
                    >
                      <View
                        style={[
                          styles.catIconWrap,
                          {
                            backgroundColor: selected
                              ? cat.color
                              : colors.surface2,
                          },
                        ]}
                      >
                        <Icon
                          name={cat.icon}
                          size={13}
                          color={selected ? '#FFF' : cat.color}
                        />
                      </View>
                      <Text
                        style={[
                          styles.catLabel,
                          { color: selected ? cat.color : colors.ink2 },
                        ]}
                      >
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}

            {/* Submit */}
            <TouchableOpacity
              onPress={editTarget ? handleUpdate : handleAdd}
              disabled={adding || catLoading || !category}
              style={[
                styles.submitBtn,
                shadow.card,
                (catLoading || !category) && { opacity: 0.5 },
              ]}
              activeOpacity={0.85}
            >
              {adding ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Icon name="check" size={17} color="#FFF" />
                  <Text style={styles.submitText}>
                    {editTarget ? 'Save Changes' : 'Add Expense'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
  },
  dialog: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.md,
    width: '100%',
    maxHeight: '85%',
  },
  dialogHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dialogTitle: { fontSize: 18, fontWeight: '800', color: colors.ink },

  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface2,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    gap: 6,
  },
  amountCurrency: { fontSize: 28, fontWeight: '700', color: colors.expense },
  amountInput: {
    flex: 1,
    fontSize: 36,
    fontWeight: '800',
    color: colors.expense,
    padding: 0,
  },

  descInput: {
    backgroundColor: colors.surface2,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.base,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.ink,
  },

  categoryScroll: { maxHeight: 160 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  catIconWrap: {
    width: 22,
    height: 22,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catLabel: { fontSize: 12, fontWeight: '600' },

  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.accent,
    borderRadius: radius.lg,
    paddingVertical: 14,
    marginTop: spacing.xs,
  },
  submitText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
});
