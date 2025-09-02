# 📱 SoftTech Tasks Manager

<img src="https://res.cloudinary.com/drb0irolz/image/upload/v1756353678/Logo_Gimp_2_e5qmpc.png" alt="SoftTech Logo" width="400"/>

## 📌 Descrição  
O **Task Manager** é um aplicativo mobile desenvolvido em **React Native com Expo** que tem como objetivo **gerenciar tarefas em equipes**.

Com ele, você pode organizar atividades, acompanhar prazos em um calendário, gerenciar equipes e melhorar a colaboração entre membros.

### ✨ Principais funcionalidades:
- ✅ Cadastro e login de usuários (Firebase Authentication)  
- 📂 Criação, edição e exclusão de tarefas  
- 👥 Gerenciamento de equipes  
- 📅 Visualização de tarefas em calendário  
- 📩 Envio de convites por e-mail para membros  
- 🔔 Notificações e feedback com **toast messages**  

---

## 🚀 Tecnologias Utilizadas
- [React Native](https://reactnative.dev/) + [Expo](https://expo.dev/)  
- [TypeScript](https://www.typescriptlang.org/)  
- [Firebase](https://firebase.google.com/) (Auth & Firestore)  
- [React Navigation](https://reactnavigation.org/)  
- [React Native Calendars](https://github.com/wix/react-native-calendars)  
- [React Native Toast Message](https://github.com/calintamas/react-native-toast-message)  

---

## ⚙️ Instalação e Uso

### 1️⃣ Pré-requisitos
- Node.js (>= 18)  
- Expo CLI  
- Conta no [Firebase](https://firebase.google.com/) configurada  

### 2️⃣ Clone o repositório
```bash
git clone https://github.com/elenilsonvieira/tasksmanager-mobile.git
cd tasksmanager-mobile
```

### 3️⃣ Instale as dependências
```bash
npm install
# ou
yarn install
```

### 4️⃣ Configure o ambiente
Crie um arquivo `.env` na raiz do projeto com suas credenciais Firebase:  

```env
EXPO_PUBLIC_API_KEY=SUACHAVE
EXPO_PUBLIC_AUTH_DOMAIN=SEUDOMINIO.firebaseapp.com
EXPO_PUBLIC_PROJECT_ID=SEUID
EXPO_PUBLIC_STORAGE_BUCKET=SEUID.appspot.com
EXPO_PUBLIC_MESSAGING_SENDER_ID=SENDERID
EXPO_PUBLIC_APP_ID=APPID
```

### 5️⃣ Rode o app
```bash
npm run start
# ou
yarn start
```

Abra o app no **Expo Go** no celular ou rode em um emulador Android/iOS.  

---

## 📂 Estrutura do Projeto

```
├── app/                 # Rotas e telas principais
│   ├── (auth)/          # Login e registro
│   ├── (tabs)/          # Abas: tarefas, calendário, equipe
│   └── Screens/         # Telas adicionais
├── components/          # Componentes reutilizáveis
├── config/              # Configurações globais
├── context/             # Context API (estado global)
├── hooks/               # Hooks customizados
├── imagens/             # Imagens e ícones
├── interfaces/          # Tipagens TS
├── scripts/             # Scripts utilitários
└── ...
```
---

## 🌐 Backend Relacionado
Este aplicativo consome o serviço de envio de e-mails que está disponível no repositório:  
👉 [SoftTech Email Service](https://github.com/elenilsonvieira/tasksmanager-back)

---

## 👨‍👩‍👦 Autores  
- **Equipe SoftTech**  

---

⚡ Desenvolvido com dedicação pela equipe **SoftTech** 🚀  
