# 📚 Sistema de Gestão Escolar - Atribuição de Aulas e Gerador de Horários

Sistema completo para gerenciamento de atribuição de aulas e geração automática de horários escolares.

## 🚀 Funcionalidades

### 📊 Dashboard
- Visão geral com gráficos e estatísticas
- Resumo por docente, turma e disciplina

### 📤 Upload de Planilha
- Importa arquivos Excel (.xlsx, .xls) ou CSV
- Formato: Docente, Turma, Disciplina, Aulas

### 📅 Gerador de Horário Escolar
- **Algoritmo Inteligente** com 7 fases de resolução
- Geração automática respeitando bloqueios
- Alocação de ELETIVAS na sexta-feira (8ª e 9ª aulas)
- Suporte a múltiplos docentes por turma (trabalho em dupla)

### 🚫 Sistema de Bloqueios
- Bloqueios gerais (ATPC, reuniões)
- Bloqueios por docente
- Bloqueios por turma
- Bloqueios por Área de Conhecimento

### 📚 Áreas de Conhecimento
- Cadastro de áreas (Linguagens, Exatas, Humanas, etc.)
- Vinculação de docentes às áreas
- ATPC por área com dias específicos
- Sistema de exceções automáticas

### 🔧 Resolução de Conflitos
- Análise detalhada de conflitos
- Mapa de disponibilidade por docente
- Alocação manual
- Sugestão de trocas automáticas
- Negociação de bloqueios (FASE 7)

### 🖨️ Relatórios
- Relatório geral
- Relatório por docente
- Relatório por turma
- Relatório por disciplina
- Impressão otimizada

### 💾 Backup e Compartilhamento
- Exportar dados em JSON
- Importar dados de backup
- Compartilhar com colegas

---

## 🛠️ Tecnologias Utilizadas

- **React 18** - Biblioteca de UI
- **TypeScript** - Tipagem estática
- **Vite** - Build tool
- **Tailwind CSS** - Estilização
- **XLSX** - Leitura de arquivos Excel
- **Lucide React** - Ícones

---

## 📦 Instalação Local

### Pré-requisitos
- Node.js 18+ instalado
- npm ou yarn

### Passos

```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/seu-repositorio.git

# 2. Entre na pasta
cd seu-repositorio

# 3. Instale as dependências
npm install

# 4. Execute em modo desenvolvimento
npm run dev

# 5. Acesse no navegador
# http://localhost:5173
```

### Build para Produção

```bash
# Gera a pasta 'dist' com os arquivos otimizados
npm run build

# Visualiza o build localmente
npm run preview
```

---

## 🌐 Deploy

### Opção 1: Vercel (Recomendado)

1. Acesse [vercel.com](https://vercel.com)
2. Faça login com GitHub
3. Clique em "Add New Project"
4. Importe seu repositório
5. Clique em "Deploy"
6. Pronto! Seu app estará em `seu-projeto.vercel.app`

**Domínio personalizado:**
- Vá em Settings → Domains
- Adicione seu domínio
- Configure o DNS conforme instruções

### Opção 2: Netlify

1. Acesse [netlify.com](https://netlify.com)
2. Faça login com GitHub
3. Clique em "Add new site" → "Import an existing project"
4. Selecione seu repositório
5. Configure:
   - Build command: `npm run build`
   - Publish directory: `dist`
6. Clique em "Deploy site"

**Ou deploy manual:**
1. Execute `npm run build` localmente
2. Arraste a pasta `dist` para o Netlify

### Opção 3: Cloudflare Pages

1. Acesse [pages.cloudflare.com](https://pages.cloudflare.com)
2. Conecte seu GitHub
3. Selecione o repositório
4. Configure:
   - Build command: `npm run build`
   - Build output directory: `dist`
5. Clique em "Save and Deploy"

---

## 🔧 Configuração de Domínio Próprio

### Comprando um Domínio

| Registrador | Domínio .com.br | Domínio .com |
|-------------|-----------------|--------------|
| [Registro.br](https://registro.br) | ~R$ 40/ano | - |
| [GoDaddy](https://godaddy.com) | ~R$ 50/ano | ~R$ 60/ano |
| [Namecheap](https://namecheap.com) | - | ~R$ 50/ano |
| [Cloudflare](https://cloudflare.com) | - | ~R$ 45/ano |

### Configurando DNS

Após comprar o domínio, configure os registros DNS:

**Para Vercel:**
| Tipo | Nome | Valor |
|------|------|-------|
| A | @ | 76.76.19.19 |
| CNAME | www | cname.vercel-dns.com |

**Para Netlify:**
| Tipo | Nome | Valor |
|------|------|-------|
| A | @ | 75.2.60.5 |
| CNAME | www | seu-site.netlify.app |

**Para Cloudflare Pages:**
| Tipo | Nome | Valor |
|------|------|-------|
| CNAME | @ | seu-projeto.pages.dev |
| CNAME | www | seu-projeto.pages.dev |

---

## 📋 Formato da Planilha Excel

O sistema espera uma planilha com as seguintes colunas:

| Docente | Turma | Disciplina | Aulas |
|---------|-------|------------|-------|
| Maria Silva | 6º A | Matemática | 5 |
| João Santos | 6º A | Português | 5 |
| Maria Silva | 6º B | Matemática | 5 |
| Ana Lima | 6º A | ELETIVA | 2 |

**Observações:**
- A primeira linha deve conter os cabeçalhos
- Disciplinas com "ELETIVA" no nome são alocadas automaticamente na sexta-feira, 8ª e 9ª aulas
- Múltiplos docentes podem ter ELETIVA na mesma turma (trabalho em dupla/trio)

---

## 🎯 Configurações do Sistema

### Horário das Aulas (Padrão - Período Integral 9h)

| Aula | Início | Fim |
|------|--------|-----|
| 1ª | 07:00 | 07:50 |
| 2ª | 07:50 | 08:40 |
| 3ª | 08:40 | 09:30 |
| 4ª | 09:50 | 10:40 |
| 5ª | 10:40 | 11:30 |
| 6ª | 11:30 | 12:20 |
| 7ª | 13:20 | 14:10 |
| 8ª | 14:10 | 15:00 |
| 9ª | 15:00 | 15:50 |

### Bloqueios por Área de Conhecimento

Exemplo de configuração:

| Área | Dia ATPC | Aulas |
|------|----------|-------|
| Linguagens | Terça-feira | 1ª e 2ª |
| Ciências/Matemática | Quarta-feira | 1ª e 2ª |
| Ciências Humanas | Quinta-feira | 1ª e 2ª |

---

## 🧠 Algoritmo de Geração (7 Fases)

O sistema utiliza um algoritmo inteligente com 7 fases:

1. **FASE 0** - Aloca ELETIVAS na sexta-feira
2. **FASE 1** - Prioriza docentes mais difíceis
3. **FASE 2** - Aloca aulas avulsas
4. **FASE 3** - Resolução (100 rodadas de otimização)
5. **FASE 4** - Trocas simples
6. **FASE 5** - Trocas em cadeia (2-3 movimentos)
7. **FASE 6** - Relaxa regras em último caso
8. **FASE 7** - Negociação de bloqueios ATPC

---

## 📞 Suporte

Em caso de dúvidas ou problemas, abra uma issue no repositório.

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.
