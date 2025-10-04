import {PlateTemplate} from "@/domain/entities/PlateTemplate";

export interface TemplateRepository {
  findAll(): Promise<PlateTemplate[]>;
  findById(id: string): Promise<PlateTemplate | null>;
}
