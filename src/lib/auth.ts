import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from './prisma';
import bcrypt from 'bcryptjs';
import { logSecurityEvent } from './security-logger';

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET, // ✅ Usar NEXTAUTH_SECRET explicitamente
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          // Registrar tentativa inválida
          await logSecurityEvent({
            type: 'LOGIN_FAILED',
            details: 'Credenciais incompletas',
            severity: 'LOW',
          });
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) {
          // Registrar tentativa com email inexistente
          await logSecurityEvent({
            type: 'LOGIN_FAILED',
            details: `Tentativa de login com email inexistente: ${credentials.email}`,
            severity: 'MEDIUM',
            metadata: { email: credentials.email },
          });
          return null;
        }

        if (!user.isActive) {
          // Registrar tentativa de login em conta inativa
          await logSecurityEvent({
            type: 'LOGIN_FAILED',
            userId: user.id,
            details: `Tentativa de login em conta inativa: ${user.email}`,
            severity: 'MEDIUM',
          });
          throw new Error('Usuário inativo');
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          // Registrar senha incorreta
          await logSecurityEvent({
            type: 'LOGIN_FAILED',
            userId: user.id,
            details: `Senha incorreta para: ${user.email}`,
            severity: 'MEDIUM',
            metadata: { email: user.email },
          });
          return null;
        }

        // Atualizar último login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLogin: new Date() },
        });

        // Registrar login bem-sucedido
        await logSecurityEvent({
          type: 'LOGIN_SUCCESS',
          userId: user.id,
          details: `Login bem-sucedido: ${user.email}`,
          severity: 'LOW',
          metadata: { email: user.email, role: user.role },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 dias
  },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Permitir logout
      if (url.includes('/api/auth/signout')) {
        return baseUrl + '/login';
      }

      // Se já está em uma URL específica, manter
      if (url.startsWith(baseUrl)) {
        return url;
      }

      return baseUrl;
    },
    async signIn({ user }) {
      // Redirecionar baseado no role após login
      return true;
    },
  },
};
