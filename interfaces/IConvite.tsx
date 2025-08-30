export interface IConvite {
  id: string;
  usuarioId: string;
  usuarioNome: string;
  status: 'pendente' | 'aceito' | 'recusado';
  equipeId: string;
}