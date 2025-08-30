export interface ITarefa {
  id: string;
  nomeDaTarefa: string;
  descricao: string;
  status: string;
  dataHora: Date;
  dataEntrega: Date;
  responsavel: string;
  responsavelId?: string;
  equipeId?: string;
}
