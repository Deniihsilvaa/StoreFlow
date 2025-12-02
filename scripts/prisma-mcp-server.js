#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * MCP Server para fornecer informações sobre o Schema Prisma
 * Permite que o Cursor acesse informações do banco de dados e schema
 */
class PrismaMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'prisma-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          resources: {},
          tools: {},
        },
      }
    );

    this.setupResourceHandlers();
    this.setupToolHandlers();
  }

  setupResourceHandlers() {
    // Lista recursos disponíveis
    this.server.setRequestHandler('resources/list', async () => ({
      resources: [
        {
          uri: 'prisma://schema',
          name: 'Prisma Schema',
          description: 'Schema completo do Prisma com todos os modelos e enums',
          mimeType: 'text/plain',
        },
        {
          uri: 'prisma://models',
          name: 'Prisma Models',
          description: 'Lista de todos os modelos definidos no Prisma',
          mimeType: 'application/json',
        },
        {
          uri: 'prisma://enums',
          name: 'Prisma Enums',
          description: 'Lista de todos os enums definidos no Prisma',
          mimeType: 'application/json',
        },
      ],
    }));

    // Lê recursos específicos
    this.server.setRequestHandler('resources/read', async (request) => {
      const { uri } = request.params;
      
      try {
        const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
        const schemaContent = await fs.readFile(schemaPath, 'utf-8');

        switch (uri) {
          case 'prisma://schema':
            return {
              contents: [
                {
                  uri,
                  mimeType: 'text/plain',
                  text: schemaContent,
                },
              ],
            };

          case 'prisma://models':
            const models = this.extractModels(schemaContent);
            return {
              contents: [
                {
                  uri,
                  mimeType: 'application/json',
                  text: JSON.stringify(models, null, 2),
                },
              ],
            };

          case 'prisma://enums':
            const enums = this.extractEnums(schemaContent);
            return {
              contents: [
                {
                  uri,
                  mimeType: 'application/json',
                  text: JSON.stringify(enums, null, 2),
                },
              ],
            };

          default:
            throw new Error(`Recurso não encontrado: ${uri}`);
        }
      } catch (error) {
        throw new Error(`Erro ao ler recurso ${uri}: ${error.message}`);
      }
    });
  }

  setupToolHandlers() {
    // Lista tools disponíveis
    this.server.setRequestHandler('tools/list', async () => ({
      tools: [
        {
          name: 'validate_schema',
          description: 'Valida se o schema Prisma está sintéticamente correto',
          inputSchema: {
            type: 'object',
            properties: {
              schemaPath: {
                type: 'string',
                description: 'Caminho para o arquivo schema.prisma (opcional)',
              },
            },
          },
        },
        {
          name: 'get_model_info',
          description: 'Obter informações detalhadas sobre um modelo específico',
          inputSchema: {
            type: 'object',
            properties: {
              modelName: {
                type: 'string',
                description: 'Nome do modelo para obter informações',
              },
            },
            required: ['modelName'],
          },
        },
      ],
    }));

    // Executa tools
    this.server.setRequestHandler('tools/call', async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'validate_schema':
            return await this.validateSchema(args.schemaPath);

          case 'get_model_info':
            return await this.getModelInfo(args.modelName);

          default:
            throw new Error(`Tool não encontrada: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Erro ao executar ${name}: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  async validateSchema(schemaPath) {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);

    try {
      await execAsync('npx prisma validate', { cwd: process.cwd() });
      return {
        content: [
          {
            type: 'text',
            text: '✅ Schema Prisma válido!',
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Erro na validação do schema:\n${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  async getModelInfo(modelName) {
    try {
      const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
      const schemaContent = await fs.readFile(schemaPath, 'utf-8');
      const models = this.extractModels(schemaContent);
      
      const model = models.find(m => m.name === modelName);
      if (!model) {
        throw new Error(`Modelo '${modelName}' não encontrado`);
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(model, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Erro ao obter informações do modelo: ${error.message}`);
    }
  }

  extractModels(schemaContent) {
    const modelRegex = /model\s+(\w+)\s*{([^}]*)}/g;
    const models = [];
    let match;

    while ((match = modelRegex.exec(schemaContent)) !== null) {
      const [, name, body] = match;
      const fields = this.extractFields(body);
      
      models.push({
        name,
        fields,
        schema: this.extractSchema(body),
        tableName: this.extractTableName(body),
      });
    }

    return models;
  }

  extractEnums(schemaContent) {
    const enumRegex = /enum\s+(\w+)\s*{([^}]*)}/g;
    const enums = [];
    let match;

    while ((match = enumRegex.exec(schemaContent)) !== null) {
      const [, name, body] = match;
      const values = body
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('//') && !line.startsWith('@@'))
        .map(line => line.split(/\s+/)[0]);

      enums.push({
        name,
        values,
        schema: this.extractSchema(body),
      });
    }

    return enums;
  }

  extractFields(modelBody) {
    const lines = modelBody.split('\n').map(line => line.trim());
    const fields = [];

    for (const line of lines) {
      if (!line || line.startsWith('//') || line.startsWith('@@')) continue;
      
      const fieldMatch = line.match(/(\w+)\s+(\w+\??)\s*(.*)?/);
      if (fieldMatch) {
        const [, name, type, attributes] = fieldMatch;
        fields.push({
          name,
          type,
          attributes: attributes ? attributes.trim() : '',
          isOptional: type.includes('?'),
        });
      }
    }

    return fields;
  }

  extractSchema(body) {
    const schemaMatch = body.match(/@@schema\("([^"]+)"\)/);
    return schemaMatch ? schemaMatch[1] : null;
  }

  extractTableName(body) {
    const mapMatch = body.match(/@@map\("([^"]+)"\)/);
    return mapMatch ? mapMatch[1] : null;
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Prisma MCP Server iniciado');
  }
}

// Inicia o servidor se executado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new PrismaMCPServer();
  server.run().catch(console.error);
}

export { PrismaMCPServer };
