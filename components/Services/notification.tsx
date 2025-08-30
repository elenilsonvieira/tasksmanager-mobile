import { Alert, Platform } from 'react-native';
import Constants from 'expo-constants';

type NotificationProps = {
  title: string;
  body: string;
  data?: any;
};

export async function showNotification({ title, body, data }: NotificationProps) {
  if (Constants.appOwnership === 'expo' || __DEV__) {
    Alert.alert(title, body);
    return;
  }

  if (Platform.OS === 'web') {
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(title, { body });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification(title, { body });
          }
        });
      }
    }
  } else {
    Alert.alert(title, body);
  }
}

export async function notifyTaskAssignment(tarefa: {
  responsavel: string;
  nomeDaTarefa: string;
}) {
  await showNotification({
    title: 'Nova Tarefa Atribuída!',
    body: `📌 ${tarefa.responsavel}, você foi designado para: "${tarefa.nomeDaTarefa}"`,
    data: { tarefa }
  });
}

export async function notifyTaskStart(nome: string) {
  await showNotification({
    title: '⏳ Tarefa Iniciando',
    body: `A tarefa "${nome}" está começando agora.`,
  });
}

export async function notifyTaskEnd(nome: string) {
  await showNotification({
    title: '✅ Tarefa Finalizada',
    body: `A tarefa "${nome}" terminou agora.`,
  });
}
