import { Alert, Platform } from 'react-native';

type NotificationProps = {
  title: string;
  body: string;
};

export async function showNotification({ title, body}: NotificationProps) {
  
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

export async function notifyTask(tarefa: {
  responsavel: string;
  nomeDaTarefa: string;
}) {
  await showNotification({
    title: 'Nova Tarefa Atribuída!',
    body: `📌 ${tarefa.responsavel}, você foi designado para: "${tarefa.nomeDaTarefa}"`
  });
}