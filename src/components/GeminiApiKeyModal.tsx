import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getGeminiApiKey, saveGeminiApiKey } from '../services/receiptScanner';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export const GeminiApiKeyModal: React.FC<Props> = ({ visible, onClose, onSaved }) => {
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      getGeminiApiKey().then((k) => {
        if (k) setApiKey(k);
      });
    }
  }, [visible]);

  const handleSave = async () => {
    const clean = apiKey.trim();
    if (!clean) {
      Alert.alert('Clave requerida', 'Por favor ingresa tu API Key de Google Gemini.');
      return;
    }

    setLoading(true);
    const success = await saveGeminiApiKey(clean);
    setLoading(false);

    if (success) {
      Alert.alert('¡Configuración Guardada!', 'Tu API Key de Gemini ha sido guardada con éxito.');
      onClose();
      if (onSaved) onSaved();
    } else {
      Alert.alert('Error', 'No se pudo guardar la clave en el almacenamiento seguro.');
    }
  };

  const handleOpenAiStudio = () => {
    Linking.openURL('https://aistudio.google.com/app/apikey');
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Ionicons name="sparkles" size={24} color="#7C3AED" />
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#64748B" />
            </TouchableOpacity>
          </View>

          <Text style={styles.title}>Escáner Inteligente con IA</Text>
          <Text style={styles.description}>
            Para interpretar tickets, comandas y fotos de cuentas con Visión Artificial, ingresa tu clave gratuita de{' '}
            <Text style={{ fontWeight: '700', color: '#1E293B' }}>Google Gemini</Text>.
          </Text>

          {/* Input */}
          <View style={styles.inputContainer}>
            <Ionicons name="key-outline" size={18} color="#94A3B8" />
            <TextInput
              style={styles.input}
              placeholder="AIzaSy..."
              placeholderTextColor="#94A3B8"
              value={apiKey}
              onChangeText={setApiKey}
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry
            />
          </View>

          {/* Link para obtener clave gratis */}
          <TouchableOpacity style={styles.helpLink} onPress={handleOpenAiStudio}>
            <Ionicons name="open-outline" size={14} color="#2563EB" />
            <Text style={styles.helpLinkText}>Obtener API Key gratuita (Google AI Studio)</Text>
          </TouchableOpacity>

          <Text style={styles.disclaimer}>
            ℹ️ El nivel gratuito incluye hasta 1.500 escaneos por día. Tu clave se almacena de forma cifrada en tu teléfono.
          </Text>

          {/* Botones de acción */}
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveBtn, loading && { opacity: 0.7 }]}
              onPress={handleSave}
              disabled={loading}
            >
              <Text style={styles.saveBtnText}>Guardar Clave</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
  },
  helpLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
    alignSelf: 'flex-start',
  },
  helpLinkText: {
    fontSize: 13,
    color: '#2563EB',
    fontWeight: '600',
  },
  disclaimer: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
    backgroundColor: '#F1F5F9',
    padding: 10,
    borderRadius: 10,
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  saveBtn: {
    flex: 1,
    backgroundColor: '#7C3AED',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
