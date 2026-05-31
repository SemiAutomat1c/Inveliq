export type CurrencyCode = 'USD' | 'EUR' | 'PHP'

export const defaultCurrency: CurrencyCode = 'USD'

export function formatMoney(amount: number, currency: string = defaultCurrency) {
  if (currency === 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  return `${currency} ${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}
