import { IConvite } from './IConvite';
import { ITarefa } from './ITarefa';

export interface IEquipe {
  id: string;
  nomeDaEquipe: string;
  descricao: string;
  dataHora: Date;
  membros?: string[];
  convites?: IConvite[];
  tarefas?: ITarefa[];
}