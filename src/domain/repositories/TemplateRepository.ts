import {PlateTemplate} from "@/domain/entities/PlateTemplate";

export interface TemplateRepository {
  findAll(): Promise<PlateTemplate[]>;
}
