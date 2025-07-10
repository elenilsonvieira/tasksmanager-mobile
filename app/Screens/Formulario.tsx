import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Button, ScrollView, StyleSheet, Text, TextInput, View
} from 'react-native';
import { ITarefa } from '../../interfaces/ITarefa';

export default function Formulario() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [nomeDaTarefa, setNomeDaTarefa] = useState('');
  const [descricao, setDescricao] = useState('');
  const [status, setStatus] = useState('');
  const [responsavel, setResponsavel] = useState('');

  const statusOptions = [
    { label: 'Selecione...', value: '' },
    { label: 'Pendente', value: 'Pendente' },
    { label: 'Em andamento', value: 'Em andamento' },
    { label: 'Concluída', value: 'Concluída' },
  ];
  
  React.useEffect(() => {
    if (params.editarTarefa) {
      const tarefa = JSON.parse(params.editarTarefa as string);
      setNomeDaTarefa(tarefa.nomeDaTarefa);
      setDescricao(tarefa.descricao);
      setStatus(tarefa.status);
      setResponsavel(tarefa.responsavel);
    }
  }, [params.editarTarefa]);

  const handleSalvar = async () => {
    if (!nomeDaTarefa || !descricao || !status || !responsavel) {
      alert('Preencha todos os campos!');
      return;
    }

    const id = params.id ? params.id.toString() : Date.now().toString();
    
    const novaTarefa: ITarefa = {
      id,
      nomeDaTarefa,       
      descricao,         
      status,
      dataHora: params.id ? new Date() : new Date(),
      responsavel,         
    };

    try {
      const savedTarefas = await AsyncStorage.getItem('@tarefas');
      const currentTarefas = savedTarefas ? JSON.parse(savedTarefas) : [];
      
     
      const updatedTarefas = params.id 
        ? currentTarefas.filter((t: ITarefa) => t.id !== id)
        : currentTarefas;
      
      const finalTarefas = [novaTarefa, ...updatedTarefas];
      
      await AsyncStorage.setItem('@tarefas', JSON.stringify(finalTarefas));
      
      
      setNomeDaTarefa('');
      setDescricao('');
      setStatus('');
      setResponsavel('');

      router.push('/(tabs)/Home');
    } catch (error) {
      console.error('Erro ao salvar tarefa:', error);
      alert('Ocorreu um erro ao salvar a tarefa');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Link href="/(tabs)/Home" asChild>
          <Text style={styles.backButton}>← Voltar</Text>
        </Link>

        <View style={styles.formContainer}>
          <Text style={styles.title}>
            {params.id ? 'Editar Tarefa' : 'Nova Tarefa'}
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nome da Tarefa</Text>
            <TextInput
              style={styles.input}
              placeholder="Digite o nome da tarefa"
              value={nomeDaTarefa}
              onChangeText={setNomeDaTarefa}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Descrição</Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              placeholder="Descreva a tarefa"
              value={descricao}
              onChangeText={setDescricao}
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Status</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={status}
                onValueChange={(itemValue) => setStatus(itemValue)}
                style={styles.picker}
                dropdownIconColor="#666"
              >
                {statusOptions.map((option) => (
                  <Picker.Item 
                    key={option.value} 
                    label={option.label} 
                    value={option.value} 
                  />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Responsável</Text>
            <TextInput
              style={styles.input}
              placeholder="Quem vai executar a tarefa?"
              value={responsavel}
              onChangeText={setResponsavel}
            />
          </View>

          <View style={styles.buttonContainer}>
            <Button 
              title={params.id ? "Atualizar Tarefa" : "Salvar Tarefa"} 
              onPress={handleSalvar} 
              color="#60A5FA" 
            />
          </View>
        </View>
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
  multilineInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    overflow: 'hidden',
  },
  picker: {
    width: '100%',
    color: '#333',
  },
  buttonContainer: {
    width: '100%',
    marginTop: 16,
    marginBottom: 8,
  },
});