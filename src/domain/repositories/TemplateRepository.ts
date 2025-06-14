import { PlateTemplate } from '../entities/PlateTemplate';

export interface TemplateRepository {
  findAll(): Promise<PlateTemplate[]>;
  findById(id: string): Promise<PlateTemplate | null>;
}
