import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, View, Text, TouchableOpacity, Alert, ScrollView } from "react-native";
import { Calendar, LocaleConfig } from "react-native-calendars";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getAuth } from "firebase/auth";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/config/firebaseConfig";

import { ITarefa } from "../../interfaces/ITarefa";
import { IEquipe } from "../../interfaces/IEquipe";

// ---- Locale PT-BR ----
LocaleConfig.locales["pt-br"] = {
  monthNames: ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"],
  monthNamesShort: ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"],
  dayNames: ["Domingo","Segunda","Terça","Quarta","Quinta","Sexta","Sábado"],
  dayNamesShort: ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"],
  today: "Hoje",
};
LocaleConfig.defaultLocale = "pt-br";

interface CalendarioProps {
  tarefas?: ITarefa[];
  onClose: () => void;
  onDayPress: (day: string) => void;
}


const getTarefasStorageKey = (equipeId: string) => `@tarefas_${equipeId}`;
const toISO = (d: any) => {
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? null : dt.toISOString().split("T")[0];
};

async function resolveCurrentUser() {
  const auth = getAuth();
  const uid = auth.currentUser?.uid ?? null;
  const email = auth.currentUser?.email ?? null;
  if (uid || email) return { uid, email };

  const keys = ["@usuarioAtual", "@currentUser", "@user", "@auth_user"];
  for (const k of keys) {
    const raw = await AsyncStorage.getItem(k);
    if (raw) {
      try {
        const u = JSON.parse(raw);
        const _uid = u?.id ?? u?.uid ?? null;
        const _email = u?.email ?? null;
        if (_uid || _email) return { uid: _uid, email: _email };
      } catch {}
    }
  }
  return { uid: null, email: null };
}

function extractMemberIds(membros: any): string[] {
  if (!Array.isArray(membros)) return [];
  return membros
    .map((m) => {
      if (typeof m === "string") return m;
      if (m && typeof m === "object") return m.id || m.uid || m.email || null;
      return null;
    })
    .filter(Boolean) as string[];
}
function belongsToUser(team: IEquipe, uid?: string | null, email?: string | null) {
  const ids = extractMemberIds((team as any)?.membros);
  return (uid && ids.includes(uid)) || (email && ids.includes(email));
}


export default function Calendario({ tarefas = [], onClose, onDayPress }: CalendarioProps) {
  const [user, setUser] = useState<{ uid: string | null; email: string | null }>({ uid: null, email: null });
  const [equipesUsuario, setEquipesUsuario] = useState<IEquipe[]>([]);
  const [equipeSelecionada, setEquipeSelecionada] = useState<string | null>(null); // seleção única
  const [tarefasEquipe, setTarefasEquipe] = useState<ITarefa[]>([]);

  // 1) Usuário logado
  useEffect(() => {
    (async () => setUser(await resolveCurrentUser()))();
  }, []);

  // 2) Carregar SOMENTE equipes onde o usuário é membro (local + remoto)
  useEffect(() => {
    if (!user.uid && !user.email) return;

    (async () => {
      const { uid, email } = user;

      // Local
      const localRaw = await AsyncStorage.getItem("@equipes");
      const locais: IEquipe[] = localRaw ? JSON.parse(localRaw) : [];
      const minhasLocais = locais.filter((eq) => belongsToUser(eq, uid, email));

      // Remoto
      const remotas: IEquipe[] = [];
      try {
        if (uid) {
          const qUid = query(collection(db, "equipes"), where("membros", "array-contains", uid));
          const snap = await getDocs(qUid);
          remotas.push(...snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }) as IEquipe));
        }
      } catch {}
      try {
        if (email) {
          const qMail = query(collection(db, "equipes"), where("membros", "array-contains", email));
          const snap = await getDocs(qMail);
          remotas.push(...snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }) as IEquipe));
        }
      } catch {}

      // União filtrada + dedup
      const uniao = [...minhasLocais, ...remotas].filter((eq) => belongsToUser(eq, uid, email));
      const mapa = new Map<string, IEquipe>();
      uniao.forEach((e) => e?.id && mapa.set(e.id, e));
      const finais = Array.from(mapa.values());

      setEquipesUsuario(finais);
      setEquipeSelecionada((prev) => (prev && finais.some((f) => f.id === prev) ? prev : finais[0]?.id ?? null));
    })();
  }, [user.uid, user.email]);

  // 3) Carregar tarefas APENAS da equipe selecionada (Storage + props) — FORÇANDO filtro por equipe
  useEffect(() => {
    if (!equipeSelecionada) return setTarefasEquipe([]);

    (async () => {
      const acc: ITarefa[] = [];

      // Storage por equipe (e filtra por equipeId === equipeSelecionada mesmo se o storage tiver "misturado")
      try {
        const raw = await AsyncStorage.getItem(getTarefasStorageKey(equipeSelecionada));
        if (raw) {
          const lista: ITarefa[] = JSON.parse(raw);

          const normalizada = lista.map((t: any) => ({
            ...t,
            equipeId: t?.equipeId ?? equipeSelecionada, // garante equipeId
          }));

          const apenasDaEquipe = normalizada.filter((t: any) => t.equipeId === equipeSelecionada);
          acc.push(...apenasDaEquipe);
        }
      } catch (e) {
        console.error("Erro ao carregar tarefas da equipe:", equipeSelecionada, e);
      }

      // Props (somente se tiver equipeId da selecionada)
      const propsDaEquipe = (tarefas || []).filter((t: any) => t?.equipeId === equipeSelecionada);

      // dedup por id (dentro da equipe)
      const map = new Map<string, ITarefa>();
      [...acc, ...propsDaEquipe].forEach((t: any) => map.set(`${t.id}`, t));
      setTarefasEquipe(Array.from(map.values()));
    })();
  }, [equipeSelecionada, JSON.stringify(tarefas.map((t: any) => [t.id, t.equipeId]))]);

  // 4) Marcação do calendário com base SOMENTE nas tarefas da equipe selecionada
  const { markedDates, tarefasPorDia } = useMemo(() => {
    const datas: Record<string, any> = {};
    const porDia: Record<string, ITarefa[]> = {};

    tarefasEquipe.forEach((t: any) => {
      const ini = toISO(t.dataHora);
      const fim = toISO(t.dataEntrega);
      if (ini) {
        datas[ini] = { ...(datas[ini] || {}), marked: true, dotColor: "#FFD700" };
        porDia[ini] = [...(porDia[ini] || []), t];
      }
      if (fim) {
        datas[fim] = { ...(datas[fim] || {}), marked: true, dotColor: "#60A5FA" };
        porDia[fim] = [...(porDia[fim] || []), t];
      }
    });

    return { markedDates: datas, tarefasPorDia: porDia };
  }, [tarefasEquipe]);

  // 5) Clique no dia
  const handleDayPress = (day: string) => {
    const list = tarefasPorDia[day];
    if (list?.length > 0) {
      const nomeEquipe =
        equipesUsuario.find((e) => e.id === equipeSelecionada)?.nomeDaEquipe ??
        equipeSelecionada ??
        "Equipe";
      const msg = list.map((t: any) => `• ${t.nomeDaTarefa} (${t.status}) — ${nomeEquipe}`).join("\n");
      Alert.alert("Tarefas do dia", msg);
    }
    onDayPress(day);
  };

  const showChips = equipesUsuario.length > 1;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Calendário de Entregas</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>X</Text>
        </TouchableOpacity>
      </View>

      {/* SOMENTE equipes do usuário logado; chips mudam a equipe selecionada */}
      {equipesUsuario.length === 0 ? null : showChips ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
          {equipesUsuario.map((eq) => {
            const ativa = equipeSelecionada === eq.id;
            return (
              <TouchableOpacity
                key={`chip-${eq.id}`}
                style={[styles.chip, ativa && styles.chipActive]}
                onPress={() => setEquipeSelecionada(eq.id)} // seleção única
              >
                <Text style={[styles.chipText, ativa && styles.chipTextActive]}>
                  {eq.nomeDaEquipe ?? "Equipe"}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      ) : (
        <View style={styles.singleTeam}>
          <Text style={styles.singleTeamText}>
            Equipe: {equipesUsuario[0]?.nomeDaEquipe ?? "Equipe"}
          </Text>
        </View>
      )}

      <Calendar
        markedDates={markedDates}
        onDayPress={(day) => handleDayPress(day.dateString)}
        theme={{
          calendarBackground: "#fff",
          todayTextColor: "#60A5FA",
          dayTextColor: "#333",
          textDisabledColor: "#ddd",
          arrowColor: "#60A5FA",
          monthTextColor: "#333",
          textDayFontWeight: "500",
          textMonthFontWeight: "bold",
          textDayHeaderFontWeight: "500",
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 100,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: { fontSize: 18, fontWeight: "bold", color: "#333" },
  closeButton: {
    backgroundColor: "#f0f0f0",
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: { fontSize: 16, fontWeight: "bold", color: "#666" },
  chipsRow: { paddingVertical: 8, paddingHorizontal: 2 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#eaeaea",
    marginRight: 8,
  },
  chipActive: { backgroundColor: "#60A5FA" },
  chipText: { color: "#333", fontWeight: "600" },
  chipTextActive: { color: "#fff" },
  singleTeam: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 4,
  },
  singleTeamText: { fontWeight: "600", color: "#333" },
});
