# 🗄️ Como Executar as Migrations do Banco de Dados

## ⚠️ IMPORTANTE
Você precisa executar as migrations para criar as tabelas no banco de dados Neon.

---

## 📋 Passo a Passo

### **1. Abra o Terminal/PowerShell**

No Windows:
- Pressione `Win + R`
- Digite `powershell`
- Pressione Enter

### **2. Navegue até a pasta do projeto**

```powershell
cd "C:\Users\Wesley\Documents\FINANCA\Não apagar\SuaGrana-Clean"
```

### **3. Pegue a DATABASE_URL do Neon**

1. Acesse: https://console.neon.tech
2. Clique no seu projeto
3. Copie a **Pooled Connection String**
4. Será algo como:
   ```
   postgresql://neondb_owner:senha@ep-xxx-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

### **4. Execute as Migrations**

**No PowerShell, execute:**

```powershell
$env:DATABASE_URL="COLE_SUA_URL_AQUI"
npx prisma migrate deploy
```

**Substitua `COLE_SUA_URL_AQUI` pela URL que você copiou do Neon!**

### **5. Aguarde**

Você verá algo assim:
```
Prisma schema loaded from prisma\schema.prisma
Datasource "db": PostgreSQL database

✔ Applied migration(s):
  - 20231001_init
  - 20231002_add_users
  - ...

✅ All migrations have been successfully applied.
```

---

## ✅ Verificar se Funcionou

Após executar as migrations, teste novamente:

1. Acesse: https://lovely-kheer-a87838.netlify.app/auth/register
2. Tente criar um usuário
3. Deve funcionar agora! 🎉

---

## 🐛 Se Der Erro

### Erro: "Can't reach database server"
- Verifique se a DATABASE_URL está correta
- Certifique-se de usar a **Pooled Connection**
- Verifique se tem `?sslmode=require` no final

### Erro: "Authentication failed"
- A senha está incorreta
- Gere uma nova senha no Neon Console

### Erro: "Database does not exist"
- O nome do banco está errado
- Verifique no Neon Console

---

## 🆘 Precisa de Ajuda?

Se não conseguir executar, me avise e eu te ajudo de outra forma!
