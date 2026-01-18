import { Model } from '@nozbe/watermelondb'
import { date, field } from '@nozbe/watermelondb/decorators'

export default class ExchangeRate extends Model {
    static table = 'exchange_rates'

    @field('from_currency') fromCurrency!: string
    @field('to_currency') toCurrency!: string
    @field('rate') rate!: number
    @field('effective_date') effectiveDate!: number
    @field('source') source!: string // API source (e.g., 'exchangerate-api.com')

    @date('created_at') createdAt!: Date
    @date('updated_at') updatedAt!: Date
}
