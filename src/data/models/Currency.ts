import { Model } from '@nozbe/watermelondb'
import { date, field } from '@nozbe/watermelondb/decorators'

export default class Currency extends Model {
  static table = 'currencies'

  @field('code') code!: string
  @field('symbol') symbol!: string
  @field('name') name!: string
  @field('precision') precision!: number
  
  @date('created_at') createdAt!: Date
  @date('updated_at') updatedAt!: Date
  @date('deleted_at') deletedAt?: Date
}
