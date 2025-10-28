/**
 * Services Index
 * Exporta todos os services para facilitar importação
 */

// Core Services
export { validationService, ValidationError, ErrorCodes } from './validation-service';
export type {
    ValidationResult,
    TransactionInput,
    InstallmentInput,
    SharedExpenseInput,
    TransferInput,
    IntegrityReport,
    IntegrityIssue,
} from './validation-service';

export { transactionService } from './transaction-service';
export type {
    CreateTransactionResult,
    DeleteOptions,
    UpdateTransactionData,
} from './transaction-service';

export { accountService } from './account-service';
export type {
    BalanceInfo,
    DeletionValidation,
    DeleteAccountOptions,
    ReconciliationResult,
} from './account-service';

export { creditCardService } from './credit-card-service';

export { budgetService } from './budget-service';
export type { BudgetUsage, BudgetAlert } from './budget-service';

export { recurringService } from './recurring-service';

// Audit & Notifications
export { auditService } from './audit-service';
export { notificationService } from './notification-service';
export { exportService } from './export-service';

// Advanced Services
export { categoryService } from './category-service';
export { analyticsService } from './analytics-service';
export { fraudDetectionService } from './fraud-detection-service';
export { currencyService } from './currency-service';
export { investmentService } from './investment-service';
