import {PlateTemplate} from "@/domain/entities/PlateTemplate";

export interface GetTemplateResponseDto {
  templates: PlateTemplate[] | null;
}
