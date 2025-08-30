// Services/team.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const EQUIPES_KEY = '@equipes';
const EQUIPE_ATUAL_KEY = '@equipeAtual';

export async function removerMembroDaEquipe(teamId: string, membroId: string) {
  const eqRaw = await AsyncStorage.getItem(EQUIPES_KEY);
  const equipes = eqRaw ? JSON.parse(eqRaw) : [];
  const equipe = equipes.find((e: any) => e.id === teamId);
  if (!equipe) throw new Error('Equipe não encontrada');

  const norm = (s: string) =>
    s?.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();

  // Descobre o nome do membro (pra comparação por nome caso o ID não bata)
  const atRaw = await AsyncStorage.getItem('@atarefados');
  const atarefados = atRaw ? JSON.parse(atRaw) : [];
  const convitesAceitos = (equipe?.convites || []).filter((c: any) => c.status === 'aceito');

  const nomeMembro =
    atarefados.find((a: any) => a.id === membroId)?.nome ||
    convitesAceitos.find((c: any) => c.usuarioId === membroId)?.usuarioNome ||
    '';

  // Verifica tarefas da equipe
  const tarefasKey = `@tarefas_${teamId}`;
  const tRaw = await AsyncStorage.getItem(tarefasKey);
  const tarefas = tRaw ? JSON.parse(tRaw) : [];

  const bloqueado = tarefas.some((t: any) => {
    const pend = /pendente/i.test(String(t?.status ?? ''));
    if (!pend) return false;
    const byId = t?.responsavelId === membroId;
    const byName = nomeMembro && norm(String(t?.responsavel ?? '')) === norm(nomeMembro);
    return byId || byName;
  });

  if (bloqueado) {
    return { bloqueado: true };
  }

  // Remove o membro (array pode ser string[] ou [{id,...}])
  equipe.membros = (equipe.membros || []).filter(
    (m: any) => (typeof m === 'string' ? m : m?.id) !== membroId
  );

  await AsyncStorage.setItem(EQUIPES_KEY, JSON.stringify(equipes));

  // Sincroniza @equipeAtual se necessário
  const atualRaw = await AsyncStorage.getItem(EQUIPE_ATUAL_KEY);
  if (atualRaw) {
    const atual = JSON.parse(atualRaw);
    if (atual?.id === teamId) {
      await AsyncStorage.setItem(EQUIPE_ATUAL_KEY, JSON.stringify(equipe));
    }
  }

  return { bloqueado: false };
}
