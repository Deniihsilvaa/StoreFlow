import { supabaseClient } from "@/infra/supabase/client";
import { ApiError } from "@/core/errors/ApiError";
import { logger } from "@/config/logger";

export type EntityType = "stores" | "products" | "orders";
export type ImageCategory = "avatar" | "banner" | "primary" | "gallery" | "proof";

export type UploadImageOptions = {
  entityType: EntityType;
  entityId: string;
  category: ImageCategory;
  file: File;
  maxSizeMB?: number;
  allowedMimeTypes?: string[];
  maxWidth?: number;
  maxHeight?: number;
};

export type UploadImageResult = {
  url: string;
  path: string;
  size: number;
  mimeType: string;
};

const BUCKET_NAME = "store-assets";

// Configurações padrão por categoria
const CATEGORY_CONFIG: Record<ImageCategory, {
  maxSizeMB: number;
  allowedMimeTypes: string[];
  maxWidth?: number;
  maxHeight?: number;
}> = {
  avatar: {
    maxSizeMB: 2,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    maxWidth: 512,
    maxHeight: 512,
  },
  banner: {
    maxSizeMB: 5,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    maxWidth: 1920,
    maxHeight: 1080,
  },
  primary: {
    maxSizeMB: 5,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    maxWidth: 1920,
    maxHeight: 1920,
  },
  gallery: {
    maxSizeMB: 5,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    maxWidth: 1920,
    maxHeight: 1920,
  },
  proof: {
    maxSizeMB: 10,
    allowedMimeTypes: ["image/jpeg", "image/png", "application/pdf"],
    maxWidth: 2560,
    maxHeight: 2560,
  },
};

export class StorageService {
  /**
   * Sanitiza o nome do arquivo removendo caracteres especiais
   */
  private sanitizeFileName(fileName: string): string {
    // Remove extensão
    const nameWithoutExt = fileName.replace(/\.[^/.]+$/, "");
    // Converte para lowercase e substitui caracteres especiais por underscore
    return nameWithoutExt
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove acentos
      .replace(/[^a-z0-9]/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "");
  }

  /**
   * Gera o path completo do arquivo no storage
   */
  private generateFilePath(
    entityType: EntityType,
    entityId: string,
    category: ImageCategory,
    originalFileName: string,
  ): string {
    const timestamp = Date.now();
    const sanitizedName = this.sanitizeFileName(originalFileName);
    const extension = originalFileName.split(".").pop()?.toLowerCase() || "";
    
    const fileName = `${timestamp}_${sanitizedName}.${extension}`;
    
    // Estrutura: {entity_type}/{entity_id}/{category}/{filename}
    return `${entityType}/${entityId}/${category}/${fileName}`;
  }

  /**
   * Valida o arquivo antes do upload
   */
  private async validateFile(
    file: File,
    category: ImageCategory,
    options?: {
      maxSizeMB?: number;
      allowedMimeTypes?: string[];
      maxWidth?: number;
      maxHeight?: number;
    },
  ): Promise<void> {
    const config = CATEGORY_CONFIG[category];
    const maxSize = options?.maxSizeMB ?? config.maxSizeMB;
    const allowedTypes = options?.allowedMimeTypes ?? config.allowedMimeTypes;
    const maxWidth = options?.maxWidth ?? config.maxWidth;
    const maxHeight = options?.maxHeight ?? config.maxHeight;

    // Valida tamanho
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSize) {
      throw ApiError.validation(
        { fileSize: fileSizeMB, maxSize },
        `Arquivo muito grande. Tamanho máximo: ${maxSize}MB`,
      );
    }

    // Valida tipo MIME
    if (!allowedTypes.includes(file.type)) {
      throw ApiError.validation(
        { mimeType: file.type, allowedTypes },
        `Tipo de arquivo não permitido. Tipos aceitos: ${allowedTypes.join(", ")}`,
      );
    }

    // Valida dimensões (apenas para imagens)
    // Nota: Validação de dimensões pode ser implementada com biblioteca 'sharp'
    // Por enquanto, essa validação é opcional e pode ser feita no frontend
    if (maxWidth && maxHeight && file.type.startsWith("image/")) {
      const dimensions = await this.getImageDimensions(file);
      if (dimensions && (dimensions.width > maxWidth || dimensions.height > maxHeight)) {
        throw ApiError.validation(
          { 
            width: dimensions.width, 
            height: dimensions.height,
            maxWidth,
            maxHeight,
          },
          `Imagem muito grande. Dimensões máximas: ${maxWidth}x${maxHeight}px`,
        );
      }
    }
  }

  /**
   * Obtém as dimensões de uma imagem (validação opcional)
   * Nota: Validação de dimensões pode ser feita no frontend antes do upload
   * ou implementada no backend usando biblioteca como 'sharp'
   */
  private async getImageDimensions(file: File): Promise<{ width: number; height: number } | null> {
    // Validação de dimensões pode ser implementada aqui com 'sharp' se necessário
    // Por enquanto, retorna null para pular validação de dimensões
    // A validação de dimensões pode ser feita no frontend antes do upload
    return null;
  }

  /**
   * Remove um arquivo do storage
   */
  async deleteFile(path: string): Promise<void> {
    try {
      const { error } = await supabaseClient.storage
        .from(BUCKET_NAME)
        .remove([path]);

      if (error) {
        logger.error({ error, path }, "Erro ao deletar arquivo do storage");
        throw ApiError.validation(
          { path, error: error.message },
          "Erro ao remover arquivo do storage",
        );
      }
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error({ error, path }, "Erro inesperado ao deletar arquivo");
      throw ApiError.validation(
        { path },
        "Erro inesperado ao remover arquivo",
      );
    }
  }

  /**
   * Faz upload de uma imagem para o Supabase Storage
   */
  async uploadImage(options: UploadImageOptions): Promise<UploadImageResult> {
    const {
      entityType,
      entityId,
      category,
      file,
      maxSizeMB,
      allowedMimeTypes,
      maxWidth,
      maxHeight,
    } = options;

    try {
      // Valida entidade e categoria
      if (!entityId || !entityId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        throw ApiError.validation(
          { entityId },
          "ID da entidade inválido",
        );
      }

      // Valida arquivo
      await this.validateFile(file, category, {
        maxSizeMB,
        allowedMimeTypes,
        maxWidth,
        maxHeight,
      });

      // Gera path
      const filePath = this.generateFilePath(entityType, entityId, category, file.name);

      // Faz upload
      const { data, error } = await supabaseClient.storage
        .from(BUCKET_NAME)
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false, // Não sobrescreve arquivos existentes
        });

      if (error) {
        logger.error({ error, filePath }, "Erro ao fazer upload para Supabase Storage");
        throw ApiError.validation(
          { path: filePath, error: error.message },
          "Erro ao fazer upload do arquivo",
        );
      }

      if (!data) {
        throw ApiError.validation(
          { path: filePath },
          "Upload concluído mas nenhum dado retornado",
        );
      }

      // Obtém URL pública
      const { data: urlData } = supabaseClient.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath);

      if (!urlData?.publicUrl) {
        throw ApiError.validation(
          { path: filePath },
          "Erro ao obter URL pública do arquivo",
        );
      }

      logger.info({
        entityType,
        entityId,
        category,
        path: filePath,
        size: file.size,
      }, "Upload realizado com sucesso");

      return {
        url: urlData.publicUrl,
        path: filePath,
        size: file.size,
        mimeType: file.type,
      };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error({ error, options }, "Erro inesperado no upload");
      throw ApiError.validation(
        { entityType, entityId, category },
        "Erro inesperado ao fazer upload do arquivo",
      );
    }
  }

  /**
   * Remove arquivo antigo se existir (usado ao atualizar imagens)
   */
  async replaceImage(
    oldPath: string | null | undefined,
    newOptions: UploadImageOptions,
  ): Promise<UploadImageResult> {
    // Faz upload do novo arquivo
    const result = await this.uploadImage(newOptions);

    // Remove arquivo antigo se existir
    if (oldPath) {
      try {
        await this.deleteFile(oldPath);
      } catch (error) {
        // Log mas não falha o upload se não conseguir deletar o antigo
        logger.warn({ oldPath, error }, "Não foi possível remover arquivo antigo");
      }
    }

    return result;
  }

  /**
   * Obtém a URL da imagem de um produto do storage
   * Tenta buscar em diferentes caminhos possíveis:
   * 1. primary/{productId}/
   * 2. products/{productId}/primary/
   * @param productId - ID do produto
   * @returns URL pública da imagem ou null se não encontrar
   */
  async getProductImageUrl(productId: string): Promise<string | null> {
    try {
      // Tenta primeiro o caminho: primary/{productId}/
      let folderPath = `primary/${productId}`;
      let { data, error } = await supabaseClient.storage
        .from(BUCKET_NAME)
        .list(folderPath, {
          limit: 100,
        });

      // Se não encontrar arquivos diretamente, verifica se há uma subpasta "primary"
      if (!error && data && data.length > 0) {
        // Verifica se há uma pasta "primary" dentro
        const primaryFolder = data.find(item => item.name === 'primary' && !item.id); // pasta não tem id
        if (primaryFolder) {
          folderPath = `primary/${productId}/primary`;
          const result = await supabaseClient.storage
            .from(BUCKET_NAME)
            .list(folderPath, {
              limit: 100,
            });
          if (result.data && result.data.length > 0) {
            data = result.data;
            error = result.error;
          }
        }
      }

      // Se ainda não encontrou, tenta o caminho: products/{productId}/primary/
      if (error || !data || data.length === 0) {
        folderPath = `products/${productId}/primary`;
        const result = await supabaseClient.storage
          .from(BUCKET_NAME)
          .list(folderPath, {
            limit: 100,
          });
        data = result.data;
        error = result.error;
      }

      if (error) {
        logger.warn({ error, productId, folderPath, bucket: BUCKET_NAME }, "Erro ao listar arquivos do produto no storage");
        return null;
      }

      if (!data || data.length === 0) {
        logger.debug({ productId, folderPath }, "Nenhum arquivo encontrado no storage para o produto");
        return null;
      }
      
      // Filtra apenas arquivos (não pastas) - arquivos têm propriedade 'id', pastas não
      const files = data.filter(item => {
        // Arquivos têm 'id', pastas não
        // Também verifica extensões de imagem comuns
        const hasImageExtension = /\.(jpg|jpeg|png|webp|gif)$/i.test(item.name || '');
        return item.id && hasImageExtension;
      });
      
      if (files.length === 0) {
        logger.debug({ productId, folderPath, itemsCount: data.length }, "Nenhum arquivo de imagem encontrado");
        return null;
      }
      
      data = files;

      logger.debug({ productId, folderPath, filesCount: data.length }, "Arquivos encontrados no storage");

      // Ordena arquivos pelo nome (que contém timestamp) em ordem decrescente
      // Formato do nome: {timestamp}_{sanitized_name}.{ext}
      const sortedFiles = data.sort((a, b) => {
        // Extrai timestamp do nome do arquivo (primeiro número antes do underscore)
        const timestampA = parseInt(a.name.split('_')[0] || '0', 10);
        const timestampB = parseInt(b.name.split('_')[0] || '0', 10);
        return timestampB - timestampA; // Ordem decrescente (mais recente primeiro)
      });

      // Pega o arquivo mais recente
      const latestFile = sortedFiles[0];
      const filePath = `${folderPath}/${latestFile.name}`;
      
      // Obtém URL pública
      const { data: urlData } = supabaseClient.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath);

      return urlData?.publicUrl || null;
    } catch (error) {
      logger.error({ error, productId }, "Erro inesperado ao obter URL da imagem do produto");
      return null;
    }
  }
}

export const storageService = new StorageService();

