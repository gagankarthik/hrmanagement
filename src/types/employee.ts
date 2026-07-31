/**
 * Compatibility shim — the employee domain now lives in the feature slice
 * (src/features/employees/domain), following ARCHITECTURE.md. Import from
 * there in new code; this path re-exports everything so existing imports
 * keep working unchanged.
 */
export * from '@/features/employees/domain/employee.types';
export * from '@/features/employees/domain/employee.fields';
export * from '@/features/employees/domain/employee.columns';
