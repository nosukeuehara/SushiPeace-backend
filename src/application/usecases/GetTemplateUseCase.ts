import {TemplateRepository} from "@/domain/repositories/TemplateRepository";
import {GetTemplateResponseDto} from "@/application/dto/GetTemplateDto";

export class GetTemplateUseCase {
  constructor(private templateRepository: TemplateRepository) {}
  async execute(): Promise<GetTemplateResponseDto | null> {
    const templates = await this.templateRepository.findAll();
    return {templates};
  }
}
