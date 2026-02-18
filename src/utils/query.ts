export type ComparisonOperator = '=' | '!=' | '>' | '<' | '>=' | '<=' | 'LIKE' | 'IN' | 'NOT IN'
export type LogicalOperator = 'AND' | 'OR'
export type SortDirection = 'ASC' | 'DESC'

export interface WhereCondition {
  field: string
  operator: ComparisonOperator
  value: any
}
export interface WhereClause {
  conditions: WhereCondition[]
  logic?: LogicalOperator
}

export interface OrderByClause {
  field: string
  direction: SortDirection
}

export interface SearchCriteria {
  where?: WhereClause
  orderBy?: OrderByClause[]
  limit?: number
  offset?: number
}

// Fonction pour obtenir une valeur nested (ex: "variants.0.price")
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj)
}

// Évaluer une condition
function evaluateCondition(item: any, condition: WhereCondition): boolean {
  const fieldValue = getNestedValue(item, condition.field)
  const { operator, value } = condition

  switch (operator) {
    case '=':
      return fieldValue == value
    case '!=':
      return fieldValue != value
    case '>':
      return fieldValue > value
    case '<':
      return fieldValue < value
    case '>=':
      return fieldValue >= value
    case '<=':
      return fieldValue <= value
    case 'LIKE':
      if (typeof fieldValue === 'string' && typeof value === 'string') {
        // Convertir % en regex
        const pattern = value.replace(/%/g, '.*')
        return new RegExp(`^${pattern}$`, 'i').test(fieldValue)
      }
      return false
    case 'IN':
      return Array.isArray(value) && value.includes(fieldValue)
    case 'NOT IN':
      return Array.isArray(value) && !value.includes(fieldValue)
    default:
      return false
  }
}

// Filtrer les données selon les critères
export function applyCriteria<T>(data: T[], criteria: SearchCriteria): T[] {
  const filtered = filterAndSort(data, criteria)
  // LIMIT et OFFSET
  const offset = criteria.offset || 0
  const limit = criteria.limit
  if (limit !== undefined) {
    return filtered.slice(offset, offset + limit)
  }
  return filtered
}

// ✅ Version améliorée qui sépare filtrage et pagination
export function filterAndSort<T>(data: T[], criteria: Omit<SearchCriteria, 'limit' | 'offset'>): T[] {
  let result = [...data]
  // WHERE clause
  if (criteria.where && criteria.where.conditions.length > 0) {
    const logic = criteria.where.logic || 'AND'
    result = result.filter(item => {
      if (logic === 'AND') {
        return criteria.where!.conditions.every(condition => 
          evaluateCondition(item, condition)
        )
      } else {
        return criteria.where!.conditions.some(condition => 
          evaluateCondition(item, condition)
        )
      }
    })
  }
  // ORDER BY clause
  if (criteria.orderBy && criteria.orderBy.length > 0) {
    result.sort((a, b) => {
      for (const order of criteria.orderBy!) {
        const aValue = getNestedValue(a, order.field)
        const bValue = getNestedValue(b, order.field)
        let comparison = 0
        if (aValue < bValue) comparison = -1
        if (aValue > bValue) comparison = 1
        if (comparison !== 0) {
          return order.direction === 'ASC' ? comparison : -comparison
        }
      }
      return 0
    })
  }
  return result
}