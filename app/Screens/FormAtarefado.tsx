import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter, Link } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
  Button, ScrollView, StyleSheet, Text, TextInput, View,
  TouchableOpacity
} from 'react-native';
import { IAtarefado } from '../../interfaces/IAtarefado';
import DateTimePicker from '@react-native-community/datetimepicker';
import Toast from 'react-native-toast-message';

export default function FormularioAtarefado() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [nascimento, setNascimento] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);


  const hoje = new Date();
  const dataMinima = new Date(
    hoje.getFullYear() - 14,
    hoje.getMonth(),
    hoje.getDate()
  );

  const onChangeDate = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || nascimento;
    setShowDatePicker(false);
    setNascimento(currentDate);
  };

  const openDatePicker = () => {
    setShowDatePicker(true);
  };

  useEffect(() => {
    if (params.editarAtarefado) {
      const atarefado = JSON.parse(params.editarAtarefado as string);
      setNome(atarefado.nome);
      setEmail(atarefado.email);
      setCpf(atarefado.cpf);
      setNascimento(new Date(atarefado.nascimento));
    }
  }, [params.editarAtarefado]);

  const handleSalvar = async () => {
    if (!nome.trim() || !email.trim() || !cpf.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Atenção',
        text2: 'Preencha todos os campos corretamente!',
        text1Style: { fontSize: 13 },
        text2Style: { fontSize: 11 },
        visibilityTime: 2000,
      });
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      Toast.show({
        type: 'error',
        text1: 'Atenção',
        text2: 'Por favor, insira um email válido!',
        text1Style: { fontSize: 13 },
        text2Style: { fontSize: 11 },
        visibilityTime: 2000,
      });
      return;
    }

    if (cpf.replace(/\D/g, '').length !== 11) {
      Toast.show({
        type: 'error',
        text1: 'Atenção',
        text2: 'CPF deve conter 11 dígitos!',
        text1Style: { fontSize: 13 },
        text2Style: { fontSize: 11 },
        visibilityTime: 2000,
      });
      return;
    }


    if (nascimento > dataMinima) {
      Toast.show({
        type: 'error',
        text1: 'Atenção',
        text2: 'O usuário deve ter pelo menos 14 anos de idade!',
        text1Style: { fontSize: 13 },
        text2Style: { fontSize: 11 },
        visibilityTime: 2000,
      });
      return;
    }

    const id = params.id ? params.id.toString() : Date.now().toString();

    const novoAtarefado: IAtarefado = {
      id,
      nome: nome.trim(),
      email: email.trim(),
      cpf: cpf.trim(),
      nascimento,
    };

    try {
      const savedAtarefados = await AsyncStorage.getItem('@atarefados');
      const currentAtarefados = savedAtarefados ? JSON.parse(savedAtarefados) : [];

      const updatedAtarefados = params.id
        ? currentAtarefados.filter((a: IAtarefado) => a.id !== id)
        : currentAtarefados;

      const finalAtarefados = [novoAtarefado, ...updatedAtarefados];

      await AsyncStorage.setItem('@atarefados', JSON.stringify(finalAtarefados));

      setNome('');
      setEmail('');
      setCpf('');
      setNascimento(new Date());

      Toast.show({
        type: 'info',
        text1: 'Sucesso!',
        text2: params.id ? 'Atarefado atualizado com sucesso!' : 'Atarefado cadastrado com sucesso!',
        visibilityTime: 5000,
        autoHide: true,
        topOffset: 70,
      });

      setTimeout(() => {
        router.push('/Atarefados');
      }, 1500);
    } catch (error) {
      console.error('Erro ao salvar atarefado:', error);
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: 'Ocorreu um erro ao salvar o atarefado',
      });
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Link href="/Atarefados" asChild>
          <Text style={styles.backButton}>← Voltar</Text>
        </Link>

        <View style={styles.formContainer}>
          <Text style={styles.title}>
            {params.id ? 'Editar Atarefado' : 'Novo Atarefado'}
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nome Completo</Text>
            <TextInput
              style={styles.input}
              placeholder="Digite o nome completo"
              value={nome}
              onChangeText={setNome}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Digite o email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>CPF</Text>
            <TextInput
              style={styles.input}
              placeholder="Digite o CPF (apenas números)"
              value={cpf}
              onChangeText={setCpf}
              keyboardType="numeric"
              maxLength={11}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Data de Nascimento</Text>
            <TouchableOpacity
              style={styles.dateInput}
              onPress={openDatePicker}
            >
              <Text>{nascimento.toLocaleDateString('pt-BR')}</Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={nascimento}
                mode="date"
                display="default"
                onChange={onChangeDate}
                maximumDate={dataMinima}
              />
            )}
          </View>

          <View style={styles.buttonContainer}>
            <Button
              title={params.id ? 'Atualizar Atarefado' : 'Salvar Atarefado'}
              onPress={handleSalvar}
              color="#60A5FA"
            />
          </View>
        </View>
        <Toast />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
    minHeight: '100%',
  },
  backButton: {
    marginBottom: 20,
    color: '#60A5FA',
    fontSize: 16,
    padding: 8,
  },
  formContainer: {
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    padding: 24,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#333',
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 20,
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    color: '#444',
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 14,
    backgroundColor: '#f9f9f9',
    fontSize: 16,
  },
  dateInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 14,
    backgroundColor: '#f9f9f9',
    justifyContent: 'center',
  },
  buttonContainer: {
    width: '100%',
    marginTop: 16,
    marginBottom: 8,
  },
});
