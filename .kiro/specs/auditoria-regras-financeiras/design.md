# Design Document: Sistema de Regras Financeiras Completo

## Overview

Este documento detalha o design técnico para implementação de todas as regras financeiras críticas identificadas na auditoria do sistema SuaGrana, garantindo integridade financeira, competitividade com grandes players e experiência de usuário superior.

## Architecture

### Camadas do Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                     PRESENTATION LAYER                       │
│  (React Components, Forms, Modals, Alerts)                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      BUSINESS LOGIC LAYER                    │
│  (Services, Validators, Calculators, Rules Engine)          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                       DATA ACCESS LAYER                      │
│  (Prisma ORM, Transactions, Queries)                        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                        DATABASE LAYER                        │
│  (SQLite/PostgreSQL, Indexes, Constraints)                  │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Credit Card Limit Management

#### Database Schema Updates

```prisma
model CreditCard {
  id              String   @id @default(cuid())
  userId          String
  name            String
  limit           Decimal  @default(0)      // Limite total
  usedLimit       Decimal  @default(0)      // Limite usado
  availableLimit  Decimal  @default(0)      // Limite disponível
  isOverLimit     Boolean  @default(false)  // Flag de limite excedido
  closingDay      Int                       // Dia de fechamento
  dueDay          Int                       // Dia de vencimento
  interestRate    Decimal? @default(0)      // Taxa de juros rotativo