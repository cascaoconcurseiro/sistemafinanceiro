# 🤝 Guia de Contribuição

## 📋 Antes de Começar

1. Leia a documentação em `docs/`
2. Configure o ambiente de desenvolvimento
3. Familiarize-se com o código

## 🔧 Configuração do Ambiente

```bash
# Clone o repositório
git clone <repo-url>

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env.local

# Execute as migrations
npm run db:migrate

# Inicie o servidor de desenvolvimento
npm run dev
```

## 📝 Padrões de Código

### TypeScript
- Use tipos explícitos sempre que possível
- Evite `any` - use `unknown` se necessário
- Documente interfaces e tipos complexos

### React
- Use componentes funcionais
- Implemente hooks customizados para lógica reutilizável
- Memoize componentes pesados com `React.memo`

### Commits
Siga o padrão Conventional Commits:

```
feat: adiciona nova funcionalidade
fix: corrige bug
docs: atualiza documentação
style: formatação de código
refactor: refatoração sem mudança de funcionalidade
test: adiciona ou corrige testes
chore: tarefas de manutenção
```

## 🧪 Testes

```bash
# Executar todos os testes
npm test

# Executar testes em watch mode
npm run test:watch

# Gerar coverage
npm run test:coverage
```

## 🔍 Checklist de PR

- [ ] Código segue os padrões do projeto
- [ ] Testes adicionados/atualizados
- [ ] Documentação atualizada
- [ ] `npm run lint` passa sem erros
- [ ] `npm run type-check` passa sem erros
- [ ] Commit messages seguem o padrão

## 🚀 Processo de Review

1. Crie uma branch a partir de `main`
2. Faça suas alterações
3. Abra um Pull Request
4. Aguarde review
5. Faça ajustes se necessário
6. Merge após aprovação

## 📞 Dúvidas?

Abra uma issue ou entre em contato com a equipe.
